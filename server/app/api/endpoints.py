from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.logic import AuthService, AnalyzeService
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()

class UserAuth(BaseModel):
    email: EmailStr
    password: str

class PromptAnalysisRequest(BaseModel):
    prompt: str

@router.post("/users/signup")
async def signup(user_data: UserAuth, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.signup(user_data.email, user_data.password)
    return {"message": "User created", "user_id": user.user_id}

@router.post("/users/login")
async def login(user_data: UserAuth, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    token = await service.login(user_data.email, user_data.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": token, "token_type": "bearer"}

@router.post("/v1/analyze")
async def analyze(
    request: PromptAnalysisRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    service = AnalyzeService(db)
    result = await service.analyze_prompt(x_api_key, request.prompt)
    
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])
    
    # Background log save
    log_data = result.pop("log_data")
    background_tasks.add_task(service.log_repo.create, log_data)
    
    return result
