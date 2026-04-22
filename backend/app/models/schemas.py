from pydantic import BaseModel
from typing import Optional


class ChapterInfo(BaseModel):
    """章节信息"""
    id: str
    title: str
    file: str


class ChapterDetail(BaseModel):
    """章节详情"""
    id: str
    title: str
    content: str


class ChapterListResponse(BaseModel):
    """章节列表响应"""
    chapters: list[ChapterInfo]
    total: int


class HealthCheck(BaseModel):
    """健康检查"""
    status: str
    version: str
    app_name: str


class EditRequest(BaseModel):
    """编辑请求"""
    content: str


class EditResponse(BaseModel):
    """编辑响应"""
    success: bool
    message: str


class SaveRequest(BaseModel):
    """保存请求"""
    content: str


class SaveResponse(BaseModel):
    """保存响应"""
    success: bool
    message: str
