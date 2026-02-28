from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AnalysisRecord, RoleProfile, SharedReport, User

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/metrics")
def metrics(db: Session = Depends(get_db)):
    return {
        "total_analyses": db.query(AnalysisRecord).count(),
        "total_users": db.query(User).count(),
        "total_roles": db.query(RoleProfile).count(),
        "total_shared_reports": db.query(SharedReport).count(),
    }