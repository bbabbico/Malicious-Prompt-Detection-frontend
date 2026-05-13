from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import UserRepository, APIKeyRepository, LogRepository
from app.models.domain import User, APIKey, DetectionLog
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.rate_limit import RateLimiter
from app.core.ai_core import model_manager
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

        # 2. Rate Limiting (Need User for limits)
        # Ideally, APIKey should have relationship or we fetch user
        from sqlalchemy.future import select
        from app.models.domain import User
        user_result = await self.key_repo.db.execute(select(User).where(User.user_id == api_key.user_id))
        user = user_result.scalars().first()
        
        if not await RateLimiter.check_limits(user.user_id, user.tps_limit, user.daily_quota):
            return {"error": "Rate limit exceeded", "status": 429}

        # 3. Content Analysis (To be replaced by the AI developer)
        risk_score = model_manager.predict_risk(prompt)
        action = "blocked" if risk_score > 80 else "allowed"
        process_time = int((time.time() - start_time) * 1000)

        # 4. Asynchronous Logging
        log = DetectionLog(
            key_id=api_key.key_id,
            raw_prompt=prompt,
            used_track="default-analyzer",
            risk_score_pct=risk_score,
            action_taken=action,
            process_time_ms=process_time
        )
        
        return {
            "risk_score": risk_score,
            "action": action,
            "process_time_ms": process_time,
            "log_data": log
        }
