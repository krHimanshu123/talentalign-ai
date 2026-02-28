from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import RoleProfile, User
from ..services.resume_parser import clean_text, extract_text_from_upload, is_supported_upload

router = APIRouter(prefix="/roles", tags=["roles"])


class RoleProfileOut(BaseModel):
    id: int
    title: str
    level: Optional[str]
    department: Optional[str]
    location: Optional[str]
    employment_type: Optional[str]
    jd_text: str
    jd_source_filename: Optional[str]
    created_at: datetime
    updated_at: datetime


class RoleProfileUpdate(BaseModel):
    title: Optional[str] = None
    level: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    jd_text: Optional[str] = Field(default=None, min_length=20)


@router.post("", response_model=RoleProfileOut)
async def create_role(
    title: str = Form(...),
    level: Optional[str] = Form(default=None),
    department: Optional[str] = Form(default=None),
    location: Optional[str] = Form(default=None),
    employment_type: Optional[str] = Form(default=None),
    jd_text: Optional[str] = Form(default=None),
    jd_file: Optional[UploadFile] = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="title is required")

    parsed_jd = clean_text(jd_text or "")
    source_filename = None

    if jd_file is not None:
        if not is_supported_upload(jd_file):
            raise HTTPException(status_code=400, detail="JD file must be PDF or DOCX")
        parsed_jd = await extract_text_from_upload(jd_file)
        source_filename = jd_file.filename

    if not parsed_jd:
        raise HTTPException(status_code=400, detail="Provide jd_text or jd_file")

    now = datetime.utcnow()
    role = RoleProfile(
        owner_user_id=current_user.id,
        title=title,
        level=(level or None),
        department=(department or None),
        location=(location or None),
        employment_type=(employment_type or None),
        jd_text=parsed_jd,
        jd_source_filename=source_filename,
        created_at=now,
        updated_at=now,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return RoleProfileOut(**role.__dict__)


@router.get("", response_model=list[RoleProfileOut])
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = (
        db.query(RoleProfile)
        .filter(RoleProfile.owner_user_id == current_user.id)
        .order_by(RoleProfile.updated_at.desc())
        .all()
    )
    return [RoleProfileOut(**r.__dict__) for r in roles]


@router.get("/{role_id}", response_model=RoleProfileOut)
def get_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = db.query(RoleProfile).filter(RoleProfile.id == role_id, RoleProfile.owner_user_id == current_user.id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role profile not found")
    return RoleProfileOut(**role.__dict__)


@router.put("/{role_id}", response_model=RoleProfileOut)
def update_role(
    role_id: int,
    payload: RoleProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = db.query(RoleProfile).filter(RoleProfile.id == role_id, RoleProfile.owner_user_id == current_user.id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role profile not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "title" and value is not None:
            value = value.strip()
            if not value:
                raise HTTPException(status_code=400, detail="title cannot be empty")
        if key == "jd_text" and value is not None:
            value = clean_text(value)
            if len(value) < 20:
                raise HTTPException(status_code=400, detail="jd_text too short")
        setattr(role, key, value)

    role.updated_at = datetime.utcnow()
    db.add(role)
    db.commit()
    db.refresh(role)
    return RoleProfileOut(**role.__dict__)


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = db.query(RoleProfile).filter(RoleProfile.id == role_id, RoleProfile.owner_user_id == current_user.id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role profile not found")
    db.delete(role)
    db.commit()
    return {"ok": True}