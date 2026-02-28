import re
from collections import Counter
from typing import Dict, List, Set

SKILL_KEYWORDS: Set[str] = {
    "python", "java", "javascript", "typescript", "react", "vue", "angular", "node", "fastapi",
    "django", "flask", "sql", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
    "aws", "azure", "gcp", "tensorflow", "pytorch", "machine learning", "deep learning", "nlp",
    "pandas", "numpy", "scikit-learn", "git", "ci/cd", "graphql", "rest", "microservices", "linux",
    "spark", "hadoop", "airflow", "tableau", "power bi", "communication", "leadership", "agile",
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def extract_skills(text: str) -> List[str]:
    normalized = _normalize(text)
    found = []
    for skill in SKILL_KEYWORDS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, normalized):
            found.append(skill)
    return sorted(set(found))


def tokenize_words(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z0-9+\-/#.]*", text.lower())


def keyword_density(text: str, keywords: List[str]) -> Dict[str, float]:
    words = tokenize_words(text)
    total = len(words) or 1
    counts = Counter(words)

    density: Dict[str, float] = {}
    for keyword in keywords:
        key_words = keyword.lower().split()
        if len(key_words) == 1:
            density[keyword] = round((counts[key_words[0]] / total) * 100, 3)
        else:
            pattern = re.escape(keyword.lower())
            occurrences = len(re.findall(pattern, text.lower()))
            density[keyword] = round((occurrences / total) * 100, 3)
    return density
