from fastapi import APIRouter, HTTPException, Depends

from app.models.schemas import (
    ChapterInfo,
    ChapterDetail,
    ChapterListResponse,
    SaveRequest,
    SaveResponse,
)
from app.services.chapter_service import ChapterService, get_chapter_service

router = APIRouter(prefix="/api/chapters", tags=["chapters"])


@router.get("", response_model=ChapterListResponse)
async def list_chapters(
    service: ChapterService = Depends(get_chapter_service)
):
    """获取所有章节列表"""
    chapters = service.get_chapter_list()
    return ChapterListResponse(chapters=chapters, total=len(chapters))


@router.get("/{chapter_id}", response_model=ChapterDetail)
async def get_chapter(
    chapter_id: str,
    service: ChapterService = Depends(get_chapter_service)
):
    """获取指定章节的详细内容"""
    chapter = service.get_chapter_detail(chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail=f"章节 {chapter_id} 不存在")
    return chapter


@router.put("/{chapter_id}", response_model=SaveResponse)
async def save_chapter(
    chapter_id: str,
    request: SaveRequest,
    service: ChapterService = Depends(get_chapter_service)
):
    """保存编辑后的章节内容"""
    success = service.save_chapter(chapter_id, request.content)
    if not success:
        raise HTTPException(status_code=404, detail=f"章节 {chapter_id} 不存在或保存失败")
    return SaveResponse(success=True, message="保存成功")


@router.get("/search/{keyword}", response_model=ChapterListResponse)
async def search_chapters(
    keyword: str,
    service: ChapterService = Depends(get_chapter_service)
):
    """搜索章节"""
    chapters = service.search_chapters(keyword)
    return ChapterListResponse(chapters=chapters, total=len(chapters))
