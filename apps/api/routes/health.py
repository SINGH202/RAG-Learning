from fastapi import APIRouter

from schemas.models import HealthResponse

router = APIRouter(prefix="/api/v1")


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")
