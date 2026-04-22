import os
import re
from pathlib import Path
from typing import Optional

from app.core.config import get_settings
from app.models.schemas import ChapterInfo, ChapterDetail

settings = get_settings()


class ChapterService:
    """章节服务"""

    # 内置章节元数据
    CHAPTERS_META = [
        {"id": "01", "title": "ES6概述与let/const", "file": "es6_chapter_01.md"},
        {"id": "02", "title": "箭头函数与函数增强", "file": "es6_chapter_02.md"},
        {"id": "03", "title": "模板字符串与解构赋值", "file": "es6_chapter_03.md"},
        {"id": "04", "title": "数组与对象的扩展", "file": "es6_chapter_04.md"},
        {"id": "05", "title": "Promise与异步编程", "file": "es6_chapter_05.md"},
        {"id": "06", "title": "Class类与模块化", "file": "es6_chapter_06.md"},
        {"id": "07", "title": "其他常用特性", "file": "es6_chapter_07.md"},
    ]

    def __init__(self):
        self.chapters_dir = Path(settings.CHAPTERS_DIR)

    def get_chapter_list(self) -> list[ChapterInfo]:
        """获取章节列表"""
        return [ChapterInfo(**meta) for meta in self.CHAPTERS_META]

    def get_chapter_detail(self, chapter_id: str) -> Optional[ChapterDetail]:
        """获取章节详情"""
        meta = next((m for m in self.CHAPTERS_META if m["id"] == chapter_id), None)
        if not meta:
            return None

        file_path = self.chapters_dir / meta["file"]
        if not file_path.exists():
            return None

        content = file_path.read_text(encoding="utf-8")
        # Fix image paths for web
        content = content.replace("./images/", "/images/")

        return ChapterDetail(
            id=meta["id"],
            title=meta["title"],
            content=content
        )

    def save_chapter(self, chapter_id: str, content: str) -> bool:
        """保存章节内容到文件"""
        meta = next((m for m in self.CHAPTERS_META if m["id"] == chapter_id), None)
        if not meta:
            return False
        
        file_path = self.chapters_dir / meta["file"]
        try:
            # 将 /images/ 路径还原为 ./images/ 以便本地文件兼容
            save_content = content.replace("/images/", "./images/")
            file_path.write_text(save_content, encoding="utf-8")
            return True
        except Exception:
            return False

    def search_chapters(self, keyword: str) -> list[ChapterInfo]:
        """搜索章节"""
        results = []
        keyword_lower = keyword.lower()

        for meta in self.CHAPTERS_META:
            # Search in title
            if keyword_lower in meta["title"].lower():
                results.append(ChapterInfo(**meta))
                continue

            # Search in content
            file_path = self.chapters_dir / meta["file"]
            if file_path.exists():
                content = file_path.read_text(encoding="utf-8")
                if keyword_lower in content.lower():
                    results.append(ChapterInfo(**meta))

        return results


# Singleton
_chapter_service: Optional[ChapterService] = None


def get_chapter_service() -> ChapterService:
    global _chapter_service
    if _chapter_service is None:
        _chapter_service = ChapterService()
    return _chapter_service
