from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.domain import User, APIKey, DetectionLog

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str):
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(self, user: User):
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

class APIKeyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_hash(self, key_hash: str):
        result = await self.db.execute(select(APIKey).where(APIKey.key_hash == key_hash))
        return result.scalars().first()

    async def create(self, api_key: APIKey):
        self.db.add(api_key)
        await self.db.commit()
        await self.db.refresh(api_key)
        return api_key

class LogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log: DetectionLog):
        self.db.add(log)
        await self.db.commit()
        return log
