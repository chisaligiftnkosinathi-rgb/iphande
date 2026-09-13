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
