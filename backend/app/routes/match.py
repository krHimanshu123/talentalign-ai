import hashlib
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import AnalysisRecord, RoleProfile, User
from ..services.analysis_engine import run_analysis
from ..services.resume_parser import clean_text, extract_text_from_upload, is_supported_upload

router = APIRouter(prefix="/match", tags=["matching"])

RATE_LIMIT_STATE: Dict[int, List[float]] = {}
RATE_LIMIT_MAX_REQUESTS = 30
RATE_LIMIT_WINDOW_SECONDS = 60

COMPARE_CACHE: Dict[str, Dict] = {}
COMPARE_CACHE_TTL_SECONDS = 300


class AnalyzeResponse(BaseModel):
    score: float
    analysis_mode: str
    score_explanation: str
    confidence: float
    reliability_notes: List[str]
    overlapping_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    suggestions: List[str]
    keyword_density: List[dict]
    heatmap_data: List[dict]
    top_matching_sections: List[dict]
    input_metadata: dict
    analysis_id: Optional[int] = None


class CompareRoleItem(BaseModel):
    role_id: Optional[int] = None
    role_title: str
    score: float
    confidence: float
    strengths: List[str]
    missing_skills_top5: List[str]
    summary: str
    analysis_payload: Optional[dict] = None


class CompareRolesResponse(BaseModel):
    ranked: List[CompareRoleItem]


def _enforce_rate_limit(user_id: int):
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    timestamps = RATE_LIMIT_STATE.get(user_id, [])
    timestamps = [t for t in timestamps if t >= window_start]
    if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded for match endpoints")
    timestamps.append(now)
    RATE_LIMIT_STATE[user_id] = timestamps


def _validate_inputs(resume_text: str, jd_text: str):
    if not jd_text:
        raise HTTPException(status_code=400, detail="Provide jd_text or jd_file")
    if len(resume_text) < 120:
        raise HTTPException(status_code=400, detail="Resume text is too short after parsing. Upload a clearer PDF/DOCX.")
    if len(jd_text) < 120:
        raise HTTPException(status_code=400, detail="Job description text is too short. Provide fuller JD content.")


def _parse_mode(analysis_mode: str) -> str:
    mode = analysis_mode.strip().lower()
    if mode not in {"standard", "strict"}:
        raise HTTPException(status_code=400, detail="analysis_mode must be 'standard' or 'strict'")
    return mode


def _extract_resume_text(resume_file: UploadFile) -> str:
    if not is_supported_upload(resume_file):
        raise HTTPException(status_code=400, detail="Resume must be PDF or DOCX")
    return ""


def _persist_analysis(db: Session, user_id: int, mode: str, result: dict) -> int:
    record = AnalysisRecord(
        owner_user_id=user_id,
        mode=mode,
        score=str(result["score"]),
        result_json=result,
        created_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record.id


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: Request,
    resume_file: UploadFile = File(...),
    jd_text: Optional[str] = Form(default=None),
    jd_file: Optional[UploadFile] = File(default=None),
    analysis_mode: str = Form(default="standard"),
    candidate_name: Optional[str] = Form(default=None),
    role_title: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _enforce_rate_limit(current_user.id)

    if not is_supported_upload(resume_file):
        raise HTTPException(status_code=400, detail="Resume must be PDF or DOCX")
    try:
        resume_text = await extract_text_from_upload(resume_file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    job_description = clean_text(jd_text or "")
    if jd_file is not None:
        if not is_supported_upload(jd_file):
            raise HTTPException(status_code=400, detail="JD file must be PDF or DOCX")
        try:
            job_description = await extract_text_from_upload(jd_file)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    _validate_inputs(resume_text, job_description)
    mode = _parse_mode(analysis_mode)

    result = run_analysis(resume_text, job_description, mode=mode)
    result["input_metadata"] = {
        "candidate_name": (candidate_name or "").strip() or None,
        "role_title": (role_title or "").strip() or None,
        "resume_filename": resume_file.filename,
        "resume_chars": len(resume_text),
        "jd_filename": jd_file.filename if jd_file else None,
        "jd_chars": len(job_description),
        "has_jd_text": bool((jd_text or "").strip()),
        **result.pop("metrics"),
    }

    analysis_id = _persist_analysis(db, current_user.id, mode, result)
    result["analysis_id"] = analysis_id
    return AnalyzeResponse(**result)


@router.post("/compare-roles", response_model=CompareRolesResponse)
async def compare_roles(
    resume_file: UploadFile = File(...),
    role_profile_ids_json: Optional[str] = Form(default=None),
    adhoc_jds_json: Optional[str] = Form(default=None),
    analysis_mode: str = Form(default="standard"),
    candidate_name: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _enforce_rate_limit(current_user.id)

    if not is_supported_upload(resume_file):
        raise HTTPException(status_code=400, detail="Resume must be PDF or DOCX")
    resume_text = await extract_text_from_upload(resume_file)

    mode = _parse_mode(analysis_mode)

    role_ids: List[int] = []
    if role_profile_ids_json:
        try:
            parsed = json.loads(role_profile_ids_json)
            role_ids = [int(x) for x in parsed if str(x).isdigit()]
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid role_profile_ids_json") from exc

    adhoc_items: List[dict] = []
    if adhoc_jds_json:
        try:
            parsed = json.loads(adhoc_jds_json)
            if isinstance(parsed, list):
                adhoc_items = [x for x in parsed if isinstance(x, dict)]
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid adhoc_jds_json") from exc

    if not role_ids and not adhoc_items:
        raise HTTPException(status_code=400, detail="Provide role_profile_ids_json or adhoc_jds_json")

    comparisons: List[CompareRoleItem] = []
    resume_hash = hashlib.sha256(resume_text.encode("utf-8", errors="ignore")).hexdigest()

    if role_ids:
        roles = (
            db.query(RoleProfile)
            .filter(RoleProfile.owner_user_id == current_user.id, RoleProfile.id.in_(role_ids))
            .all()
        )
        for role in roles:
            cache_key = f"{resume_hash}:{role.id}:{mode}:profile"
            cached = COMPARE_CACHE.get(cache_key)
            if cached and (time.time() - cached["ts"] <= COMPARE_CACHE_TTL_SECONDS):
                analysis = cached["analysis"]
            else:
                analysis = run_analysis(resume_text, role.jd_text, mode=mode)
                COMPARE_CACHE[cache_key] = {"ts": time.time(), "analysis": analysis}

            comparisons.append(
                CompareRoleItem(
                    role_id=role.id,
                    role_title=role.title,
                    score=analysis["score"],
                    confidence=analysis["confidence"],
                    strengths=analysis["strengths"],
                    missing_skills_top5=analysis["missing_skills"][:5],
                    summary=f"{candidate_name or 'Candidate'} vs {role.title}: {analysis['score']}% ({mode})",
                    analysis_payload=analysis,
                )
            )

    for idx, adhoc in enumerate(adhoc_items):
        title = str(adhoc.get("title") or f"Adhoc Role {idx + 1}")
        jd_text = clean_text(str(adhoc.get("jd_text") or ""))
        if not jd_text:
            continue
        cache_key = f"{resume_hash}:adhoc:{title}:{mode}"
        cached = COMPARE_CACHE.get(cache_key)
        if cached and (time.time() - cached["ts"] <= COMPARE_CACHE_TTL_SECONDS):
            analysis = cached["analysis"]
        else:
            analysis = run_analysis(resume_text, jd_text, mode=mode)
            COMPARE_CACHE[cache_key] = {"ts": time.time(), "analysis": analysis}

        comparisons.append(
            CompareRoleItem(
                role_id=None,
                role_title=title,
                score=analysis["score"],
                confidence=analysis["confidence"],
                strengths=analysis["strengths"],
                missing_skills_top5=analysis["missing_skills"][:5],
                summary=f"{candidate_name or 'Candidate'} vs {title}: {analysis['score']}% ({mode})",
                analysis_payload=analysis,
            )
        )

    comparisons = sorted(comparisons, key=lambda x: x.score, reverse=True)
    return CompareRolesResponse(ranked=comparisons)
