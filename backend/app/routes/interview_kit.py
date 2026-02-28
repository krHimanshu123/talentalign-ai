from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import AnalysisRecord, InterviewKit, User

router = APIRouter(prefix="/interview-kit", tags=["interview-kit"])


class InterviewKitRequest(BaseModel):
    analysis_result_id: Optional[int] = None
    raw_analysis: Optional[Dict[str, Any]] = None


class InterviewKitResponse(BaseModel):
    id: int
    content: Dict[str, Any]


def _category_questions(category: str, strengths: List[str], missing: List[str]) -> List[Dict[str, Any]]:
    templates = {
        "skills": [
            "Walk me through your hands-on experience with {topic}.",
            "Describe a project where {topic} was critical to delivery.",
        ],
        "system_design": [
            "Design a scalable system for candidate-role matching with {topic} constraints.",
            "How would you optimize latency and reliability in a hiring intelligence pipeline?",
        ],
        "projects": [
            "Which project best demonstrates {topic}, and what measurable outcome did it achieve?",
            "What trade-offs did you make in your most relevant project?",
        ],
        "behavioral": [
            "Tell me about a time you resolved a stakeholder conflict during delivery.",
            "How do you prioritize tasks when deadlines change unexpectedly?",
        ],
    }

    topics = (missing + strengths)[:4] or ["relevant technologies"]
    qs: List[Dict[str, Any]] = []
    base = templates.get(category, [])
    for idx, t in enumerate(base):
        topic = topics[idx % len(topics)]
        question = t.format(topic=topic)
        qs.append(
            {
                "question": question,
                "probes": [
                    "What was your specific contribution?",
                    "How did you measure success?",
                ],
            }
        )
    return qs


def _generate_content(analysis: Dict[str, Any]) -> Dict[str, Any]:
    strengths = list(analysis.get("overlapping_skills") or [])
    missing = list(analysis.get("missing_skills") or [])

    rubric = [
        {"category": "skills", "weight": 30, "guide": "Depth of role-relevant technical capability"},
        {"category": "system_design", "weight": 30, "guide": "Architecture quality, scalability, trade-offs"},
        {"category": "projects", "weight": 25, "guide": "Impact evidence and implementation ownership"},
        {"category": "behavioral", "weight": 15, "guide": "Communication, collaboration, adaptability"},
    ]

    questions = {
        "skills": _category_questions("skills", strengths, missing),
        "system_design": _category_questions("system_design", strengths, missing),
        "projects": _category_questions("projects", strengths, missing),
        "behavioral": _category_questions("behavioral", strengths, missing),
    }

    red_flags = [
        "Cannot explain technical decisions in projects listed on resume",
        "No measurable outcomes for claimed achievements",
        "Weak understanding of claimed primary skills",
    ]
    if missing:
        red_flags.append(f"No convincing examples for missing skills: {', '.join(missing[:5])}")

    return {
        "rubric": rubric,
        "questions": questions,
        "red_flags": red_flags,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/generate", response_model=InterviewKitResponse)
def generate_interview_kit(
    payload: InterviewKitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis_json: Optional[Dict[str, Any]] = None
    analysis_id: Optional[int] = None

    if payload.analysis_result_id is not None:
        analysis = (
            db.query(AnalysisRecord)
            .filter(AnalysisRecord.id == payload.analysis_result_id, AnalysisRecord.owner_user_id == current_user.id)
            .first()
        )
        if not analysis:
            raise HTTPException(status_code=404, detail="analysis_result_id not found")
        analysis_json = dict(analysis.result_json or {})
        analysis_id = analysis.id
    elif payload.raw_analysis is not None:
        analysis_json = payload.raw_analysis
    else:
        raise HTTPException(status_code=400, detail="Provide analysis_result_id or raw_analysis")

    content = _generate_content(analysis_json)
    kit = InterviewKit(
        owner_user_id=current_user.id,
        analysis_id=analysis_id,
        content_json=content,
        created_at=datetime.utcnow(),
    )
    db.add(kit)
    db.commit()
    db.refresh(kit)
    return InterviewKitResponse(id=kit.id, content=content)