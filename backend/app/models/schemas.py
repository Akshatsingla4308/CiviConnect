from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ==============================================================================
# AUTH & USER SCHEMAS
# ==============================================================================

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    preferred_language: Optional[str] = "en"


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str
    role: str
    preferred_language: str


class UserProfileUpdate(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    education_level: Optional[str] = None
    course: Optional[str] = None
    occupation: Optional[str] = None
    annual_household_income: Optional[int] = None
    social_category: Optional[str] = None
    owns_cultivable_land: Optional[bool] = None
    is_taxpayer: Optional[bool] = None
    is_bpl: Optional[bool] = None
    disability_status: Optional[str] = None
    marital_status: Optional[str] = None
    preferred_language: Optional[str] = "en"


class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    preferred_language: str
    is_profile_complete: bool
    profile: Optional[Dict[str, Any]] = None


# ==============================================================================
# SCHEMES & RULES SCHEMAS
# ==============================================================================

class RuleItem(BaseModel):
    criterion_type: str
    field_name: str
    operator: str
    expected_value: Any
    is_mandatory: bool = True
    description: str
    source_reference: Optional[str] = None


class DocumentItem(BaseModel):
    doc_id: str
    name: str
    category: Optional[str] = "general"
    requirement_type: str = "mandatory"
    instructions: Optional[str] = None
    accepted_format: Optional[str] = None


class SourceItem(BaseModel):
    title: str
    url: str
    publisher: Optional[str] = None
    source_type: Optional[str] = "official_portal"
    last_verified: Optional[str] = None


class SchemeResponse(BaseModel):
    id: str
    name: str
    name_hi: Optional[str] = None
    name_pa: Optional[str] = None
    short_description: str
    detailed_description: Optional[str] = None
    level: str
    department: Optional[str] = None
    applicable_states: List[str]
    category: str
    subcategories: List[str] = []
    target_beneficiaries: List[str] = []
    benefits_summary: str
    benefits: List[str] = []
    eligibility_summary: str
    exclusions: List[str] = []
    application_process: Optional[str] = None
    official_portal_url: Optional[str] = None
    official_source_url: Optional[str] = None
    helpline_number: Optional[str] = None
    status: str
    verification_status: str
    last_verified_date: Optional[str] = None
    rules: List[Dict[str, Any]] = []
    documents: List[Dict[str, Any]] = []
    sources: List[Dict[str, Any]] = []


class SchemeCreateRequest(BaseModel):
    id: str
    name: str
    name_hi: Optional[str] = None
    name_pa: Optional[str] = None
    short_description: str
    detailed_description: Optional[str] = None
    level: str = "central"
    department: Optional[str] = None
    applicable_states: List[str] = ["ALL"]
    category: str
    subcategories: List[str] = []
    target_beneficiaries: List[str] = []
    benefits_summary: str
    benefits: List[str] = []
    eligibility_summary: str
    exclusions: List[str] = []
    application_process: Optional[str] = None
    official_portal_url: Optional[str] = None
    official_source_url: Optional[str] = None
    helpline_number: Optional[str] = None
    verification_status: str = "verified"
    rules: List[RuleItem] = []
    documents: List[Dict[str, Any]] = []
    sources: List[Dict[str, Any]] = []


# ==============================================================================
# ELIGIBILITY SCHEMAS
# ==============================================================================

class CriterionCheck(BaseModel):
    field: str
    status: str  # "pass", "fail", "unknown"
    description: str
    expected_value: Any
    actual_value: Any
    reason: str


class EligibilityAssessmentResult(BaseModel):
    scheme_id: str
    scheme_name: str
    verdict: str  # "likely_eligible", "possibly_eligible", "not_eligible_based_on_known_rules", "insufficient_information"
    summary: str
    total_rules: int
    passed_rules: int
    failed_rules: int
    unknown_rules: int
    checks: List[CriterionCheck]
    missing_fields: List[str] = []
    official_portal_url: Optional[str] = None
    official_verification_required: bool = True
    sources: List[Dict[str, Any]] = []


class EligibilityCheckRequest(BaseModel):
    scheme_id: Optional[str] = None
    profile: Dict[str, Any]


# ==============================================================================
# DOCUMENTS & CHECKLISTS SCHEMAS
# ==============================================================================

class DocumentResponse(BaseModel):
    id: str
    name: str
    name_hi: Optional[str] = None
    name_pa: Optional[str] = None
    description: Optional[str] = None
    category: str
    issuing_authority: Optional[str] = None
    general_guidance: Optional[str] = None
    official_portal_url: Optional[str] = None
    associated_schemes_count: int = 0


class ChecklistItem(BaseModel):
    doc_id: str
    name: str
    category: str = "general"
    requirement_type: str = "mandatory"  # mandatory, conditional, optional
    instructions: Optional[str] = None
    is_ready: bool = False
    notes: Optional[str] = None


class ChecklistUpdateRequest(BaseModel):
    items: List[ChecklistItem]
    status: Optional[str] = None


class ChecklistResponse(BaseModel):
    id: str
    user_id: str
    scheme_id: str
    scheme_name: str
    status: str
    items: List[ChecklistItem]
    completion_percentage: int
    updated_at: str


# ==============================================================================
# AI ASSISTANT SCHEMAS
# ==============================================================================

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    language: Optional[str] = "en"
    user_profile: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    reply: str
    session_id: str
    language: str
    grounded_schemes: List[Dict[str, Any]] = []
    provider_status: str  # "live", "database_fallback", "configuration_required", "error"
    diagnostic_message: Optional[str] = None
    suggested_followups: List[str] = []


# ==============================================================================
# SYSTEM & ADMIN SCHEMAS
# ==============================================================================

class SystemHealthResponse(BaseModel):
    status: str
    database: Dict[str, Any]
    ai_provider: Dict[str, Any]
    verified_schemes_count: int
    documents_count: int
    environment: str
