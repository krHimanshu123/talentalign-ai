from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class RoleProfile(Base):
    __tablename__ = "role_profiles"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False, index=True)
    level = Column(String, nullable=True)
    department = Column(String, nullable=True)
    location = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    jd_text = Column(Text, nullable=False)
    jd_source_filename = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mode = Column(String, nullable=False, default="standard")
    score = Column(String, nullable=False)
    result_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class InterviewKit(Base):
    __tablename__ = "interview_kits"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_records.id"), nullable=True, index=True)
    content_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SharedReport(Base):
    __tablename__ = "shared_reports"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_records.id"), nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)