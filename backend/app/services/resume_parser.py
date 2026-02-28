import re
from io import BytesIO
from pathlib import Path
from typing import Iterable

import fitz
from docx import Document
from fastapi import UploadFile

SUPPORTED_EXTENSIONS = {".pdf", ".docx"}
SUPPORTED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
}


async def extract_text_from_pdf(file: UploadFile) -> str:
    contents = await file.read()
    with fitz.open(stream=contents, filetype="pdf") as doc:
        text = "\n".join(page.get_text("text") for page in doc)
    return clean_text(text)


def extract_text_from_pdf_bytes(contents: bytes) -> str:
    with fitz.open(stream=contents, filetype="pdf") as doc:
        text = "\n".join(page.get_text("text") for page in doc)
    return clean_text(text)


def extract_text_from_docx_bytes(contents: bytes) -> str:
    doc = Document(BytesIO(contents))
    text = "\n".join(p.text for p in doc.paragraphs if p.text)
    return clean_text(text)


def is_supported_upload(file: UploadFile) -> bool:
    suffix = Path(file.filename or "").suffix.lower()
    return suffix in SUPPORTED_EXTENSIONS or (file.content_type or "") in SUPPORTED_CONTENT_TYPES


def detect_upload_kind(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix == ".pdf" or file.content_type == "application/pdf":
        return "pdf"
    if suffix == ".docx" or file.content_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    ):
        return "docx"
    return "unknown"


async def extract_text_from_upload(file: UploadFile) -> str:
    contents = await file.read()
    kind = detect_upload_kind(file)
    if kind == "pdf":
        with fitz.open(stream=contents, filetype="pdf") as doc:
            text = "\n".join(page.get_text("text") for page in doc)
        return clean_text(text)
    if kind == "docx":
        return extract_text_from_docx_bytes(contents)
    raise ValueError("Unsupported file type. Use PDF or DOCX.")


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_sentences(text: str) -> Iterable[str]:
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]