#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오늘 날짜로 게시글 10개 추가 생성
"""
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv('1_Frontend/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

print("=== Creating 10 Posts with TODAY's Date ===\n")

# Get real user_id
existing_posts = supabase.table('posts').select('user_id').limit(1).execute()
user_id = existing_posts.data[0]['user_id'] if existing_posts.data else '7f61567b-bbdf-427a-90a9-0ee060ef4595'
print(f"Using user_id: {user_id}\n")

# Get actual politicians
politicians_result = supabase.table('politicians').select('id, name, party').limit(10).execute()
politicians = politicians_result.data[:5]
print(f"Found {len(politicians)} politicians\n")

# Get today's datetime
now = datetime.now()

# Create 5 politician posts with TODAY's date
print("Creating 5 politician posts (TODAY)...\n")
politician_posts = [
    {
        "title": f"{politicians[0]['name']}: 오늘 청년 일자리 대책 발표",
        "content": f"오늘 아침 기자회견을 통해 청년 일자리 대책을 발표했습니다. {politicians[0]['party']} {politicians[0]['name']}입니다. 청년 실업률 해소를 위한 구체적인 로드맵을 제시했습니다. 중소기업 청년 채용 시 세액 공제 확대, 청년 창업 자금 지원 규모 2배 확대 등이 핵심입니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[0]['id'],
        "upvotes": random.randint(5, 30),
        "downvotes": random.randint(0, 5),
        "view_count": random.randint(50, 200),
        "is_hot": True,
        "is_best": False,
        "created_at": (now - timedelta(hours=2)).isoformat()
    },
    {
        "title": f"[속보] {politicians[1]['name']}, 교육부 장관과 긴급 회동",
        "content": f"오늘 오후 {politicians[1]['name']} 의원이 교육부 장관과 긴급 회동을 가졌습니다. 사교육비 경감 대책과 공교육 정상화 방안에 대해 심도 있는 논의를 진행했다고 합니다. 구체적인 합의 내용은 내일 발표될 예정입니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[1]['id'],
        "upvotes": random.randint(10, 40),
        "downvotes": random.randint(1, 8),
        "view_count": random.randint(100, 300),
        "is_hot": True,
        "is_best": True,
        "created_at": (now - timedelta(hours=4)).isoformat()
    },
    {
        "title": f"{politicians[2]['name']}, 부동산 정책 개편안 공개",
        "content": f"오늘 {politicians[2]['name']} 의원이 부동산 정책 개편안을 공개했습니다. 청년 주택 공급 확대와 전월세 상한제 보완이 핵심입니다. 특히 신혼부부와 청년층을 위한 특별 공급 물량을 대폭 늘리겠다고 밝혔습니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[2]['id'],
        "upvotes": random.randint(15, 50),
        "downvotes": random.randint(3, 10),
        "view_count": random.randint(150, 400),
        "is_hot": True,
        "is_best": False,
        "created_at": (now - timedelta(hours=6)).isoformat()
    },
    {
        "title": f"{politicians[3]['name']}, 탄소중립 실천 현장 방문",
        "content": f"오늘 {politicians[3]['name']} 의원이 탄소중립 우수 기업을 방문했습니다. 친환경 산업 육성과 일자리 창출이 양립할 수 있음을 확인했다며, 정부의 적극적인 지원을 요청했습니다. 녹색 전환을 위한 구체적인 정책도 곧 발표할 예정입니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[3]['id'],
        "upvotes": random.randint(8, 35),
        "downvotes": random.randint(2, 7),
        "view_count": random.randint(80, 250),
        "is_hot": False,
        "is_best": False,
        "created_at": (now - timedelta(hours=8)).isoformat()
    },
    {
        "title": f"[현장] {politicians[4]['name']}, 지역 주민과의 대화",
        "content": f"오늘 오전 {politicians[4]['name']} 의원이 지역 주민과의 대화 시간을 가졌습니다. 지역 균형 발전과 일자리 창출 방안에 대한 주민들의 다양한 의견을 청취했습니다. 현장의 목소리를 정책에 적극 반영하겠다고 약속했습니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[4]['id'],
        "upvotes": random.randint(5, 25),
        "downvotes": random.randint(1, 5),
        "view_count": random.randint(60, 180),
        "is_hot": False,
        "is_best": False,
        "created_at": (now - timedelta(hours=10)).isoformat()
    }
]

for i, post in enumerate(politician_posts, 1):
    try:
        result = supabase.table('posts').insert(post).execute()
        print(f"✅ [{i}/5] Politician post (TODAY):")
        print(f"    Title: {post['title']}")
        print(f"    Politician: {politicians[i-1]['name']}")
        print(f"    Created: {post['created_at'][:19]}")
        print()
    except Exception as e:
        print(f"❌ [{i}/5] Failed: {str(e)}\n")

# Create 5 general member posts with TODAY's date
print("\nCreating 5 general member posts (TODAY)...\n")
general_posts = [
    {
        "title": "오늘 청년 일자리 대책 발표 어떻게 보시나요?",
        "content": "오늘 아침 발표된 청년 일자리 대책, 여러분은 어떻게 생각하시나요? 실질적인 도움이 될까요? 구체적인 실행 방안이 중요할 것 같은데 의견 나눠봐요!",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(8, 35),
        "downvotes": random.randint(1, 8),
        "view_count": random.randint(70, 250),
        "is_hot": True,
        "is_best": False,
        "created_at": (now - timedelta(hours=3)).isoformat()
    },
    {
        "title": "교육부 장관 회동 소식 들으셨나요?",
        "content": "오늘 교육부 장관과 긴급 회동했다는 소식이 있던데, 사교육비 문제가 정말 해결될 수 있을까요? 학부모로서 기대 반 걱정 반입니다. 여러분 생각은?",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(12, 45),
        "downvotes": random.randint(2, 10),
        "view_count": random.randint(100, 300),
        "is_hot": True,
        "is_best": True,
        "created_at": (now - timedelta(hours=5)).isoformat()
    },
    {
        "title": "부동산 개편안, 이번엔 달라질까요?",
        "content": "오늘 발표된 부동산 정책 개편안을 봤는데요. 청년 특별 공급 확대는 좋은데 실제로 당첨될 수 있을지 의문이네요. 전월세 상한제도 실효성이 있을까요?",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(10, 40),
        "downvotes": random.randint(3, 12),
        "view_count": random.randint(90, 280),
        "is_hot": False,
        "is_best": False,
        "created_at": (now - timedelta(hours=7)).isoformat()
    },
    {
        "title": "탄소중립 기업 방문 소식 보셨어요?",
        "content": "오늘 탄소중립 우수 기업 방문 소식이 나왔는데, 친환경 산업이 정말 일자리를 만들 수 있을까요? 환경도 중요하지만 현실적인 경제 효과도 궁금합니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(6, 30),
        "downvotes": random.randint(1, 6),
        "view_count": random.randint(50, 200),
        "is_hot": False,
        "is_best": False,
        "created_at": (now - timedelta(hours=9)).isoformat()
    },
    {
        "title": "지역 주민과의 대화, 진정성 있을까요?",
        "content": "오늘 우리 지역 의원이 주민과의 대화 시간을 가졌다고 하는데, 과연 우리 목소리가 정말 반영될까요? 선거 때만 하는 쇼는 아니길 바랍니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(7, 32),
        "downvotes": random.randint(2, 8),
        "view_count": random.randint(65, 220),
        "is_hot": False,
        "is_best": False,
        "created_at": (now - timedelta(hours=11)).isoformat()
    }
]

for i, post in enumerate(general_posts, 1):
    try:
        result = supabase.table('posts').insert(post).execute()
        print(f"✅ [{i}/5] General member post (TODAY):")
        print(f"    Title: {post['title']}")
        print(f"    Created: {post['created_at'][:19]}")
        print()
    except Exception as e:
        print(f"❌ [{i}/5] Failed: {str(e)}\n")

print("=" * 60)
print("✅ Completed!")
print("Politician posts (TODAY): 5")
print("General member posts (TODAY): 5")
print("Total: 10 posts created with TODAY's date")
print(f"\n📅 Date: {now.strftime('%Y-%m-%d')}")
print("🌐 View them at: http://localhost:3003/community")
print("=" * 60)
