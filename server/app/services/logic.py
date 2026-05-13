from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import UserRepository, APIKeyRepository, LogRepository
from app.models.domain import User, APIKey, DetectionLog
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.rate_limit import RateLimiter
from app.core.ai_core import analyze_prompt_threat
import time
import hashlib
import uuid

class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def signup(self, email, password):
        hashed = get_password_hash(password)
        user = User(email=email, password_hash=hashed)
        return await self.repo.create(user)

    async def login(self, email, password):
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            return None
        return create_access_token({"sub": user.email, "user_id": user.user_id})

class AnalyzeService:
    def __init__(self, db: AsyncSession):
        self.key_repo = APIKeyRepository(db)
        self.log_repo = LogRepository(db)

    async def analyze_prompt(self, api_key_str: str, prompt: str):
        start_time = time.time()
        
        # 1. API Key Validation
        key_hash = hashlib.sha256(api_key_str.encode()).hexdigest()
        api_key = await self.key_repo.get_by_hash(key_hash)
        if not api_key:
            return {"error": "Invalid API Key", "status": 401}

        # 2. Rate Limiting
        from sqlalchemy.future import select
        from app.models.domain import User
        user_result = await self.key_repo.db.execute(select(User).where(User.user_id == api_key.user_id))
        user = user_result.scalars().first()
        
        if not await RateLimiter.check_limits(user.user_id, user.tps_limit, user.daily_quota):
            return {"error": "Rate limit exceeded", "status": 429}

        # 3. Content Analysis (Integrated with AI Developer's function)
        is_malicious, risk_score = analyze_prompt_threat(prompt)
        
        # Determine action based on boolean result from AI
        action = "blocked" if is_malicious else "allowed"
        process_time = int((time.time() - start_time) * 1000)

        # 4. Asynchronous Logging (Converting 1,000,000 scale to percentage for DB if needed, 
        # but here we'll store as is or normalize to 0-100 for existing schema)
        risk_percentage = round((risk_score / 1000000) * 100, 2)

        log = DetectionLog(
            key_id=api_key.key_id,
            raw_prompt=prompt,
            used_track="ai-model-v1",
            risk_score_pct=risk_percentage,
            action_taken=action,
            process_time_ms=process_time
        )
        
        return {
            "is_malicious": is_malicious,
            "risk_score": risk_score,
            "risk_percentage": risk_percentage,
            "action": action,
            "process_time_ms": process_time,
            "log_data": log
        }
