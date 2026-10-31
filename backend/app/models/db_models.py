import datetime
import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


# ==============================================================================
# 1. CORE USER & AUTHENTICATION MODELS
# ==============================================================================

class DBUser(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), default="citizen", nullable=False)  # "citizen", "admin"
    preferred_language = Column(String(16), default="en", nullable=False)  # "en", "hi", "pa"
    account_status = Column(String(32), default="active", nullable=False)
    is_profile_complete = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    profile = relationship("DBUserProfileRecord", back_populates="user", uselist=False, cascade="all, delete-orphan")
    saved_schemes = relationship("DBSavedScheme", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("DBUserAssessment", back_populates="user", cascade="all, delete-orphan")
    checklists = relationship("DBUserChecklist", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("DBUserApplication", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("DBConversation", back_populates="user", cascade="all, delete-orphan")


class DBUserProfileRecord(Base):
    __tablename__ = "user_profile_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    state = Column(String(64), nullable=True)
    district = Column(String(64), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(32), nullable=True)
    education_level = Column(String(64), nullable=True)
    course = Column(String(120), nullable=True)
    occupation = Column(String(64), nullable=True)
    annual_household_income = Column(Integer, nullable=True)
    social_category = Column(String(32), nullable=True)  # "General", "SC", "ST", "OBC", "EWS"
    owns_cultivable_land = Column(Boolean, nullable=True)
    is_taxpayer = Column(Boolean, nullable=True)
    is_bpl = Column(Boolean, nullable=True)
    disability_status = Column(String(32), nullable=True)
    marital_status = Column(String(32), nullable=True)
    preferred_language = Column(String(16), default="en", nullable=False)
    extra_attributes_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("DBUser", back_populates="profile")


# ==============================================================================
# 2. STATES & DISTRICTS TAXONOMY
# ==============================================================================

class DBState(Base):
    __tablename__ = "states"

    code = Column(String(8), primary_key=True, index=True)  # "PB", "DL", "HR", "ALL"
    name = Column(String(64), nullable=False, unique=True)
    name_hi = Column(String(64), nullable=True)
    name_pa = Column(String(64), nullable=True)
    is_ut = Column(Boolean, default=False, nullable=False)
    districts_json = Column(Text, default="[]", nullable=False)


# ==============================================================================
# 3. GOVERNMENT SCHEMES & RULES
# ==============================================================================

class DBScheme(Base):
    __tablename__ = "schemes"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    name_pa = Column(String(255), nullable=True)
    short_description = Column(Text, nullable=False)
    detailed_description = Column(Text, nullable=True)
    level = Column(String(32), default="central", nullable=False)  # "central", "state"
    department = Column(String(255), nullable=True)
    applicable_states = Column(Text, default='["ALL"]', nullable=False)
    category = Column(String(64), nullable=False, index=True)
    subcategories_json = Column(Text, default="[]", nullable=False)
    target_beneficiaries_json = Column(Text, default="[]", nullable=False)
    benefits_summary = Column(Text, nullable=False)
    benefits_json = Column(Text, default="[]", nullable=False)
    eligibility_summary = Column(Text, nullable=False)
    exclusions_json = Column(Text, default="[]", nullable=False)
    application_process = Column(Text, nullable=True)
    official_portal_url = Column(String(512), nullable=True)
    official_source_url = Column(String(512), nullable=True)
    helpline_number = Column(String(120), nullable=True)
    status = Column(String(32), default="active", nullable=False)  # "active", "inactive", "archived"
    verification_status = Column(String(32), default="verified", nullable=False)  # "verified", "partially_verified", "unverified"
    last_verified_date = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    rules = relationship("DBSchemeRule", back_populates="scheme", cascade="all, delete-orphan")
    documents = relationship("DBSchemeDocument", back_populates="scheme", cascade="all, delete-orphan")
    sources = relationship("DBSchemeSource", back_populates="scheme", cascade="all, delete-orphan")
    saved_by_users = relationship("DBSavedScheme", back_populates="scheme", cascade="all, delete-orphan")


class DBSchemeRule(Base):
    __tablename__ = "scheme_rules"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    scheme_id = Column(String(64), ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    criterion_type = Column(String(64), nullable=False)
    field_name = Column(String(64), nullable=False)
    operator = Column(String(32), nullable=False)  # eq, neq, gte, gt, lte, lt, in, not_in, is_true
    expected_value_json = Column(Text, nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=False)
    source_reference = Column(String(255), nullable=True)
    verification_status = Column(String(32), default="verified", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    scheme = relationship("DBScheme", back_populates="rules")


# ==============================================================================
# 4. REQUIRED DOCUMENTS & SCHEME MAPPING
# ==============================================================================

class DBDocument(Base):
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    name_pa = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(64), default="general", nullable=False)
    issuing_authority = Column(String(255), nullable=True)
    general_guidance = Column(Text, nullable=True)
    official_portal_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    schemes = relationship("DBSchemeDocument", back_populates="document", cascade="all, delete-orphan")


class DBSchemeDocument(Base):
    __tablename__ = "scheme_documents"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    scheme_id = Column(String(64), ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    document_id = Column(String(64), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    requirement_type = Column(String(32), default="mandatory", nullable=False)  # mandatory, conditional, optional, unknown
    condition_description = Column(Text, nullable=True)
    preparation_instructions = Column(Text, nullable=True)
    accepted_format = Column(String(120), nullable=True)
    source_reference = Column(String(255), nullable=True)
    last_verified_date = Column(String(32), nullable=True)

    scheme = relationship("DBScheme", back_populates="documents")
    document = relationship("DBDocument", back_populates="schemes")


# ==============================================================================
# 5. USER SAVED SCHEMES & ASSESSMENTS
# ==============================================================================

class DBSavedScheme(Base):
    __tablename__ = "saved_schemes"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    scheme_id = Column(String(64), ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    notes = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "scheme_id", name="uq_user_saved_scheme"),
    )

    user = relationship("DBUser", back_populates="saved_schemes")
    scheme = relationship("DBScheme", back_populates="saved_by_users")


class DBUserAssessment(Base):
    __tablename__ = "user_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    scheme_id = Column(String(64), ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    verdict = Column(String(64), nullable=False)
    criteria_evaluated_json = Column(Text, default="[]", nullable=False)
    passed_criteria_json = Column(Text, default="[]", nullable=False)
    failed_criteria_json = Column(Text, default="[]", nullable=False)
    unknown_criteria_json = Column(Text, default="[]", nullable=False)
    recommended_steps_json = Column(Text, default="[]", nullable=False)
    assessed_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("DBUser", back_populates="assessments")


# ==============================================================================
# 6. DOCUMENT CHECKLISTS & APPLICATION TRACKER
# ==============================================================================

class DBUserChecklist(Base):
    __tablename__ = "user_checklists"

    id = Column(String(64), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    scheme_id = Column(String(64), ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    status = Column(String(32), default="in_progress", nullable=False)  # not_started, in_progress, completed
    items_json = Column(Text, default="[]", nullable=False)
    completion_percentage = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("DBUser", back_populates="checklists")


class DBUserApplication(Base):
    __tablename__ = "user_applications"

    id = Column(String(64), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    scheme_id = Column(String(64), nullable=False)
    scheme_name = Column(String(255), nullable=False)
    application_number = Column(String(128), nullable=True)
    status = Column(String(64), default="documents_pending", nullable=False)
    submission_date = Column(String(64), nullable=True)
    department = Column(String(255), nullable=True)
    portal_url = Column(String(512), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("DBUser", back_populates="applications")


# ==============================================================================
# 7. CONVERSATIONS & CHAT HISTORY
# ==============================================================================

class DBConversation(Base):
    __tablename__ = "conversations"

    id = Column(String(64), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)
    title = Column(String(255), default="Scheme Consultation", nullable=False)
    language = Column(String(16), default="en", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("DBUser", back_populates="conversations")
    messages = relationship("DBConversationMessage", back_populates="conversation", cascade="all, delete-orphan")


class DBConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    conversation_id = Column(String(64), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    role = Column(String(16), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    grounded_schemes_json = Column(Text, default="[]", nullable=False)
    provider_status = Column(String(32), default="live", nullable=False)  # "live", "database_fallback", "error"
    created_at = Column(DateTime, default=utcnow, nullable=False)

    conversation = relationship("DBConversation", back_populates="messages")


# ==============================================================================
# 8. SCHEME SOURCES & AUDIT LOGS
# ==============================================================================

class DBSchemeSource(Base):
    __tablename__ = "scheme_sources"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    scheme_id = Column(String(64), ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    source_title = Column(String(255), nullable=False)
    source_url = Column(String(512), nullable=False)
    publisher = Column(String(255), nullable=True)
    source_type = Column(String(64), default="official_portal", nullable=False)
    last_verified = Column(String(32), nullable=True)
    verification_status = Column(String(32), default="verified", nullable=False)

    scheme = relationship("DBScheme", back_populates="sources")


class DBAdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    admin_id = Column(String(36), nullable=False, index=True)
    admin_email = Column(String(255), nullable=False)
    action = Column(String(64), nullable=False)
    target_type = Column(String(64), nullable=False)
    target_id = Column(String(64), nullable=False)
    change_summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
