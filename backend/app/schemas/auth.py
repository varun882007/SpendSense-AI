from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    preferred_currency: str = "INR"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
