"""
User model and schemas
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserProfile(BaseModel):
    """User profile fields"""
    displayName: Optional[str] = None
    gender: Optional[str] = None  # 'male', 'female', 'other'
    age: Optional[int] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    photoURL: Optional[str] = None
    additionalInfo: Optional[dict] = None

class UserInDB(BaseModel):
    """User model in database"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    username: str
    hashed_password: str
    profile: UserProfile = Field(default_factory=UserProfile)
    role: str = "user"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    username: str
    password: str
    profile: Optional[UserProfile] = None
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    """Schema for user login"""
    email_or_username: str
    password: str

class UserResponse(BaseModel):
    """User response (without password)"""
    id: str = Field(alias="_id")
    email: EmailStr
    username: str
    profile: UserProfile
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        populate_by_name = True

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    """Token payload data"""
    email: Optional[str] = None
    user_id: Optional[str] = None
