from typing import Dict, List

from .embedding_engine import compute_similarity
from .insights_generator import (
    build_keyword_breakdown,
    build_strengths,
    build_suggestions,
    generate_heatmap_data,
    top_matching_sections,
)
from .skill_extractor import extract_skills, keyword_density


def ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return numerator / denominator


def keyword_alignment(resume_density: Dict[str, float], jd_density: Dict[str, float]) -> float:
    if not jd_density:
        return 0.0
    total_gap = 0.0
    keys = list(jd_density.keys())
    for key in keys:
        jd_v = float(jd_density.get(key, 0.0))
        rs_v = float(resume_density.get(key, 0.0))
        if jd_v <= 0:
            continue
        total_gap += min(1.0, abs(jd_v - rs_v) / jd_v)
    avg_gap = total_gap / max(1, len(keys))
    return max(0.0, 1.0 - avg_gap)


def run_analysis(resume_text: str, job_description: str, mode: str = "standard") -> Dict:
    semantic_similarity = compute_similarity(resume_text, job_description)

    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(job_description))

    overlapping_skills = sorted(resume_skills & jd_skills)
    missing_skills = sorted(jd_skills - resume_skills)

    tracked_keywords = sorted(jd_skills | resume_skills)
    resume_density = keyword_density(resume_text, tracked_keywords)
    jd_density = keyword_density(job_description, tracked_keywords)

    alignment = keyword_alignment(resume_density, jd_density)
    skill_coverage = ratio(len(overlapping_skills), max(1, len(jd_skills)))

    base_score = (
        (semantic_similarity * 100 * 0.60)
        + (skill_coverage * 100 * 0.25)
        + (alignment * 100 * 0.15)
    )

    if mode == "strict" and jd_skills:
        strict_penalty = (1.0 - skill_coverage) * 15.0
        base_score = max(0.0, base_score - strict_penalty)

    score = round(max(0.0, min(100.0, base_score)), 2)

    score_explanation = (
        "Hybrid score = 60% semantic + 25% skill coverage + 15% keyword alignment, with strict penalty for missing JD skills."
        if mode == "strict"
        else "Hybrid score = 60% semantic + 25% skill coverage + 15% keyword alignment."
    )

    reliability_notes: List[str] = []
    if len(jd_skills) < 3:
        reliability_notes.append("Low JD skill signal: include more explicit skills in job description.")
    if len(resume_skills) < 3:
        reliability_notes.append("Low resume skill signal: parser extracted few recognized skills.")
    if len(job_description) < 400:
        reliability_notes.append("Short JD text can reduce reliability; use full role description.")
    if len(resume_text) < 400:
        reliability_notes.append("Short resume text can reduce reliability; upload complete resume.")

    confidence = 0.95
    confidence -= min(0.35, len(reliability_notes) * 0.12)
    confidence = round(max(0.55, confidence), 2)

    heatmap_data = generate_heatmap_data(resume_text, job_description)

    return {
        "score": score,
        "analysis_mode": mode,
        "score_explanation": score_explanation,
        "confidence": confidence,
        "reliability_notes": reliability_notes,
        "overlapping_skills": overlapping_skills,
        "missing_skills": missing_skills,
        "strengths": build_strengths(overlapping_skills, score),
        "suggestions": build_suggestions(missing_skills, score),
        "keyword_density": build_keyword_breakdown(resume_density, jd_density),
        "heatmap_data": heatmap_data,
        "top_matching_sections": top_matching_sections(heatmap_data),
        "metrics": {
            "semantic_similarity": round(semantic_similarity * 100, 2),
            "skill_coverage": round(skill_coverage * 100, 2),
            "keyword_alignment": round(alignment * 100, 2),
        },
    }