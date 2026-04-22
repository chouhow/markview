from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.core.config import get_settings
from app.models.schemas import HealthCheck
from app.api import chapters

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="MarkView - Markdown 教程展示平台后端 API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(chapters.router)

# Health check
@app.get("/api/health", response_model=HealthCheck)
async def health_check():
    """健康检查接口"""
    return HealthCheck(
        status="ok",
        version=settings.APP_VERSION,
        app_name=settings.APP_NAME
    )


# Static files for images
@app.get("/images/{filename}")
async def get_image(filename: str):
    """获取图片资源"""
    image_path = Path(settings.CHAPTERS_DIR) / "images" / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="图片不存在")
    return FileResponse(image_path)


# Root
@app.get("/")
async def root():
    return {
        "message": "MarkView API",
        "docs": "/api/docs",
        "chapters": "/api/chapters"
    }
