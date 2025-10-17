from fastapi import APIRouter

api_router = APIRouter()

# Health check for API v1
@api_router.get("/health")
async def api_health():
    return {"status": "API v1 healthy"}

# Import and include endpoint routers
from app.api.v1.evaluation import router as evaluation_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(evaluation_router, prefix="/evaluations", tags=["evaluations"])