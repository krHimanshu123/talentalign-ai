from typing import Dict, List

from .embedding_engine import embed_texts
from .resume_parser import split_sentences
from sklearn.metrics.pairwise import cosine_similarity


def generate_heatmap_data(resume_text: str, jd_text: str, max_points: int = 12) -> List[Dict]:
    resume_sections = list(split_sentences(resume_text))[:max_points]
    jd_sections = list(split_sentences(jd_text))[:max_points]

    if not resume_sections or not jd_sections:
        return []

    # Embed both lists in one pass so fallback vectorizers share the same feature space.
    combined_sections = resume_sections + jd_sections
    combined_embeddings = embed_texts(combined_sections)
    split_index = len(resume_sections)
    resume_embeddings = combined_embeddings[:split_index]
    jd_embeddings = combined_embeddings[split_index:]

    similarity_matrix = cosine_similarity(resume_embeddings, jd_embeddings)

    heatmap = []
    for i, resume_chunk in enumerate(resume_sections):
        for j, jd_chunk in enumerate(jd_sections):
            heatmap.append(
                {
                    "resume_index": i,
                    "jd_index": j,
                    "value": round(float(similarity_matrix[i][j]) * 100, 2),
                    "resume_chunk": resume_chunk[:140],
                    "jd_chunk": jd_chunk[:140],
                }
            )

    return heatmap


def top_matching_sections(heatmap_data: List[Dict], top_k: int = 5) -> List[Dict]:
    ranked = sorted(heatmap_data, key=lambda x: x["value"], reverse=True)
    return ranked[:top_k]


def build_strengths(overlap: List[str], score: float) -> List[str]:
    strengths = []
    if score >= 80:
        strengths.append("Strong overall semantic alignment with the job description.")
    elif score >= 60:
        strengths.append("Good baseline alignment with room to improve target keywords.")
    else:
        strengths.append("Core alignment is limited; targeted resume tailoring is recommended.")

    if overlap:
        strengths.append(f"Matched skills: {', '.join(overlap[:8])}")

    return strengths


def build_suggestions(missing: List[str], score: float) -> List[str]:
    suggestions = []
    if missing:
        suggestions.append(f"Add project bullets proving: {', '.join(missing[:6])}.")
    suggestions.append("Mirror role-specific verbs and responsibilities from the JD.")
    suggestions.append("Quantify impact with metrics (speed, revenue, accuracy, cost, scale).")
    if score < 70:
        suggestions.append("Reorder resume so the most relevant achievements appear in the top third.")
    return suggestions


def build_keyword_breakdown(resume_density: Dict[str, float], jd_density: Dict[str, float]) -> List[Dict]:
    keys = sorted(set(resume_density) | set(jd_density))
    return [
        {
            "keyword": key,
            "resume_density": resume_density.get(key, 0.0),
            "jd_density": jd_density.get(key, 0.0),
            "gap": round(jd_density.get(key, 0.0) - resume_density.get(key, 0.0), 3),
        }
        for key in keys
    ]
