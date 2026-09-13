from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "buyer"  # "buyer" or "merchant"
    business_name: Optional[str] = None
    business_type: Optional[str] = "service"  # retail, service, wholesale, digital
    city: Optional[str] = None
    province: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str = "buyer"
    profile_id: Optional[str] = None

class MerchantUpgradeRequest(BaseModel):
    business_name: str
    business_type: str = "service"  # retail, service, wholesale, digital
    city: Optional[str] = None
    province: Optional[str] = None

class RolePromoteRequest(BaseModel):
    user_id: str
    new_role: str  # merchant, admin, supaadmin

class KYCSubmissionRequest(BaseModel):
    id_document_url: str
    proof_of_address_url: str
    business_registration_number: Optional[str] = None
    tax_number: Optional[str] = None

