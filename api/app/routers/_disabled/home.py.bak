"""
Home API Router
메인 페이지를 위한 통합 API 엔드포인트
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

from ..database import get_db
from ..auth import get_current_user_optional

router = APIRouter(prefix="/api/home", tags=["home"])


# Response Models
class PoliticianRanking(BaseModel):
    id: int
    name: str
    party: str
    region: str
    position: str
    status: str
    profile_image_url: Optional[str]
    claude_score: Optional[Decimal]
    gpt_score: Optional[Decimal]
    gemini_score: Optional[Decimal]
    grok_score: Optional[Decimal]
    perplexity_score: Optional[Decimal]
    composite_score: Optional[Decimal]
    member_rating: Decimal
    member_rating_count: int

    class Config:
        from_attributes = True


class HotPost(BaseModel):
    id: int
    title: str
    content: str
    category: str
    view_count: int
    upvotes: int
    downvotes: int
    comment_count: int
    hot_score: Decimal
    is_hot: bool
    created_at: datetime
    author_username: str
    author_avatar: Optional[str]

    class Config:
        from_attributes = True


class PoliticianPost(BaseModel):
    id: int
    politician_id: int
    politician_name: str
    politician_party: str
    politician_position: str
    politician_status: str
    politician_avatar: Optional[str]
    category: str
    title: Optional[str]
    content: str
    view_count: int
    upvotes: int
    comment_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class SidebarStats(BaseModel):
    total_count: int
    active_count: int
    candidate_count: int
    new_this_week: int


class TrendingPolitician(BaseModel):
    id: int
    name: str
    party: str
    position: str
    status: str
    profile_image_url: Optional[str]
    current_score: Decimal
    score_change: Decimal


class ConnectedService(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]
    icon: Optional[str]


class HomeData(BaseModel):
    ai_ranking: List[PoliticianRanking]
    hot_posts: List[HotPost]
    politician_posts: List[PoliticianPost]
    sidebar: dict


@router.get("", response_model=HomeData)
async def get_home_data(
    db = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    메인 페이지 전체 데이터 조회
    - AI 평점 랭킹 TOP 10
    - 실시간 인기글 15개
    - 정치인 최근 글 9개
    - 사이드바 위젯 데이터
    """
    try:
        # 1. AI 평점 랭킹 TOP 10
        ai_ranking_query = """
            SELECT * FROM v_ai_ranking_top10
        """
        ai_ranking_result = await db.fetch_all(ai_ranking_query)
        ai_ranking = [PoliticianRanking(**row) for row in ai_ranking_result]

        # 2. 실시간 인기글 TOP 15
        hot_posts_query = """
            SELECT * FROM v_hot_posts_top15
        """
        hot_posts_result = await db.fetch_all(hot_posts_query)
        hot_posts = [HotPost(**row) for row in hot_posts_result]

        # 3. 정치인 최근 글 9개
        politician_posts_query = """
            SELECT * FROM v_politician_posts_recent9
        """
        politician_posts_result = await db.fetch_all(politician_posts_query)
        politician_posts = [PoliticianPost(**row) for row in politician_posts_result]

        # 4. 사이드바 데이터
        user_id = current_user.get("id") if current_user else None
        sidebar_query = """
            SELECT get_sidebar_data($1) as data
        """
        sidebar_result = await db.fetch_one(sidebar_query, user_id)
        sidebar = sidebar_result["data"] if sidebar_result else {}

        return HomeData(
            ai_ranking=ai_ranking,
            hot_posts=hot_posts,
            politician_posts=politician_posts,
            sidebar=sidebar
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch home data: {str(e)}")


@router.get("/ai-ranking", response_model=List[PoliticianRanking])
async def get_ai_ranking(
    limit: int = 10,
    offset: int = 0,
    filter_type: Optional[str] = None,
    filter_value: Optional[str] = None,
    db = Depends(get_db)
):
    """
    AI 평점 랭킹 조회 (필터링 가능)
    - filter_type: 'region', 'party', 'position'
    - filter_value: 필터 값
    """
    try:
        base_query = """
            SELECT
                p.id, p.name, p.party, p.region, p.position, p.status, p.profile_image_url,
                a.claude_score, a.gpt_score, a.gemini_score, a.grok_score, a.perplexity_score,
                a.composite_score,
                COALESCE(r.avg_rating, 0) as member_rating,
                COALESCE(r.rating_count, 0) as member_rating_count
            FROM politicians p
            LEFT JOIN ai_scores a ON p.id = a.politician_id
            LEFT JOIN (
                SELECT politician_id, AVG(score) as avg_rating, COUNT(*) as rating_count
                FROM ratings
                GROUP BY politician_id
            ) r ON p.id = r.politician_id
            WHERE a.composite_score IS NOT NULL
        """

        # 필터 적용
        params = []
        if filter_type and filter_value:
            if filter_type == "region":
                base_query += " AND p.region = $1"
                params.append(filter_value)
            elif filter_type == "party":
                base_query += " AND p.party = $1"
                params.append(filter_value)
            elif filter_type == "position":
                base_query += " AND p.position = $1"
                params.append(filter_value)

        base_query += f" ORDER BY a.composite_score DESC LIMIT ${len(params)+1} OFFSET ${len(params)+2}"
        params.extend([limit, offset])

        result = await db.fetch_all(base_query, *params)
        return [PoliticianRanking(**row) for row in result]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch AI ranking: {str(e)}")


@router.get("/hot-posts", response_model=List[HotPost])
async def get_hot_posts(
    limit: int = 15,
    db = Depends(get_db)
):
    """
    실시간 인기글 조회
    """
    try:
        query = f"""
            SELECT * FROM v_hot_posts_top15
            LIMIT ${1}
        """
        result = await db.fetch_all(query, limit)
        return [HotPost(**row) for row in result]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch hot posts: {str(e)}")


@router.get("/politician-posts", response_model=List[PoliticianPost])
async def get_politician_posts(
    limit: int = 9,
    db = Depends(get_db)
):
    """
    정치인 최근 글 조회
    """
    try:
        query = f"""
            SELECT * FROM v_politician_posts_recent9
            LIMIT $1
        """
        result = await db.fetch_all(query, limit)
        return [PoliticianPost(**row) for row in result]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch politician posts: {str(e)}")


@router.get("/sidebar")
async def get_sidebar_data(
    db = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    사이드바 위젯 데이터 조회
    """
    try:
        user_id = current_user.get("id") if current_user else None
        query = """
            SELECT get_sidebar_data($1) as data
        """
        result = await db.fetch_one(query, user_id)
        return result["data"] if result else {}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sidebar data: {str(e)}")
