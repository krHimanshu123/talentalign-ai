from functools import lru_cache
import os
from typing import List, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize


@lru_cache(maxsize=1)
def get_model() -> Optional[object]:
    """
    Try loading SentenceTransformer lazily.
    If unavailable in local runtime, return None and use TF-IDF fallback.
    """
    if os.getenv("TALENTALIGN_ENABLE_ST", "0") != "1":
        return None

    try:
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer("all-MiniLM-L6-v2")
    except Exception:
        return None


def embed_texts(texts: List[str]) -> np.ndarray:
    model = get_model()
    if model is not None:
        vectors = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return vectors

    # Fallback path: lexical embeddings if transformer stack is unavailable.
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
    matrix = vectorizer.fit_transform(texts).astype(np.float32)
    return normalize(matrix, norm="l2", axis=1)


def compute_similarity(text_a: str, text_b: str) -> float:
    vectors = embed_texts([text_a, text_b])
    score = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    return float(max(0.0, min(1.0, score)))
