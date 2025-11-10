#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
created_at을 명시하지 않고 DB가 자동으로 현재 시간을 입력하도록 게시글 생성
"""
from supabase import create_client
import os
from dotenv import load_dotenv
import random
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv('1_Frontend/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

print("=== Creating Posts with Auto Timestamp ===\n")

# Get real user_id
existing_posts = supabase.table('posts').select('user_id').limit(1).execute()
user_id = existing_posts.data[0]['user_id'] if existing_posts.data else '7f61567b-bbdf-427a-90a9-0ee060ef4595'

# Get politicians
politicians_result = supabase.table('politicians').select('id, name, party').limit(10).execute()
politicians = politicians_result.data[:5]

print(f"Using user_id: {user_id}")
print(f"Found {len(politicians)} politicians\n")

# Create 5 politician posts (NO created_at - let DB auto-generate)
print("Creating 5 politician posts...\n")
politician_posts = [
    {
        "title": f"{politicians[0]['name']}, 청년 고용 활성화 법안 발의",
        "content": f"{politicians[0]['party']} {politicians[0]['name']} 의원이 청년 고용 활성화를 위한 특별법을 국회에 발의했습니다. 중소기업 청년 채용 시 세액 공제를 현행 두 배로 늘리고, 청년 창업 자금 지원을 대폭 확대하는 내용을 담고 있습니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[0]['id'],
        "upvotes": random.randint(15, 60),
        "downvotes": random.randint(1, 10),
        "view_count": random.randint(150, 500),
        "is_hot": True,
        "is_best": True
    },
    {
        "title": f"{politicians[1]['name']}, 교육개혁 토론회 개최",
        "content": f"{politicians[1]['name']} 의원 주최로 '공교육 정상화를 위한 교육개혁 토론회'가 국회에서 열립니다. 교육 전문가, 학부모, 교사 대표가 참석해 사교육비 경감과 공교육 강화 방안을 논의할 예정입니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[1]['id'],
        "upvotes": random.randint(20, 70),
        "downvotes": random.randint(2, 12),
        "view_count": random.randint(200, 600),
        "is_hot": True,
        "is_best": False
    },
    {
        "title": f"{politicians[2]['name']}, 부동산 특위 위원장 선임",
        "content": f"국회 부동산 특별위원회 위원장에 {politicians[2]['name']} 의원이 선임되었습니다. 전월세 상한제 개선과 청년 주택 공급 확대를 최우선 과제로 삼겠다고 밝혔습니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[2]['id'],
        "upvotes": random.randint(25, 80),
        "downvotes": random.randint(3, 15),
        "view_count": random.randint(250, 700),
        "is_hot": True,
        "is_best": True
    },
    {
        "title": f"{politicians[3]['name']}, 탄소중립 로드맵 발표",
        "content": f"{politicians[3]['name']} 의원이 기자회견을 열고 2030 탄소중립 달성을 위한 구체적인 로드맵을 공개했습니다. 친환경 산업 육성과 일자리 창출을 동시에 이루는 방안을 제시했습니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[3]['id'],
        "upvotes": random.randint(10, 45),
        "downvotes": random.randint(2, 10),
        "view_count": random.randint(120, 400),
        "is_hot": False,
        "is_best": False
    },
    {
        "title": f"{politicians[4]['name']}, 지역 청년 간담회 진행",
        "content": f"{politicians[4]['name']} 의원이 지역 청년들과의 간담회를 진행했습니다. 지역 일자리 창출과 청년 정착 지원 방안에 대한 청년들의 생생한 목소리를 듣는 시간을 가졌습니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": politicians[4]['id'],
        "upvotes": random.randint(8, 35),
        "downvotes": random.randint(1, 8),
        "view_count": random.randint(90, 300),
        "is_hot": False,
        "is_best": False
    }
]

for i, post in enumerate(politician_posts, 1):
    try:
        result = supabase.table('posts').insert(post).execute()
        created_time = result.data[0]['created_at'] if result.data else 'Unknown'
        print(f"[{i}/5] Politician post created:")
        print(f"    Title: {post['title'][:50]}...")
        print(f"    Auto-generated time: {created_time}")
        print()
    except Exception as e:
        print(f"[{i}/5] Failed: {str(e)}\n")

# Create 5 general member posts (NO created_at)
print("Creating 5 general member posts...\n")
general_posts = [
    {
        "title": "청년 고용법 발의 소식! 어떻게 생각하세요?",
        "content": "청년 고용 활성화 법안이 발의됐다는 소식 들으셨나요? 중소기업 세액공제 2배 확대라는데 실제로 효과가 있을까요? 청년으로서 기대 반 걱정 반입니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(12, 50),
        "downvotes": random.randint(2, 10),
        "view_count": random.randint(120, 450),
        "is_hot": True,
        "is_best": False
    },
    {
        "title": "교육개혁 토론회 후기",
        "content": "국회에서 열린 교육개혁 토론회 정말 유익했습니다. 사교육비 문제 해결책으로 나온 의견들이 꽤 현실적인 것 같은데, 과연 실행될 수 있을지가 관건이네요.",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(18, 65),
        "downvotes": random.randint(3, 12),
        "view_count": random.randint(180, 550),
        "is_hot": True,
        "is_best": True
    },
    {
        "title": "부동산 특위 위원장 선임, 변화 있을까요?",
        "content": "새로 선임된 부동산 특위 위원장이 청년 주택 공급 확대를 최우선 과제로 삼는다는데요. 매번 듣는 얘기지만 이번엔 다를까요? 실거주자로서 정말 절실합니다.",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(22, 75),
        "downvotes": random.randint(4, 15),
        "view_count": random.randint(220, 650),
        "is_hot": True,
        "is_best": False
    },
    {
        "title": "탄소중립 로드맵, 실현 가능할까요?",
        "content": "탄소중립 로드맵이 발표됐는데 환경도 중요하지만 일자리 창출도 같이 된다면 정말 좋을 것 같아요. 과연 실현 가능한 계획일까요?",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(10, 40),
        "downvotes": random.randint(2, 8),
        "view_count": random.randint(100, 350),
        "is_hot": False,
        "is_best": False
    },
    {
        "title": "지역 청년 간담회 현장 분위기",
        "content": "지역에서 청년 간담회가 열렸는데 청년 정착 지원에 대한 구체적인 방안들이 나왔습니다. 현장 분위기가 꽤 진지했고, 실질적인 대안들이 논의되어서 좋았어요!",
        "category": "general",
        "user_id": user_id,
        "politician_id": None,
        "upvotes": random.randint(9, 38),
        "downvotes": random.randint(1, 7),
        "view_count": random.randint(85, 320),
        "is_hot": False,
        "is_best": False
    }
]

for i, post in enumerate(general_posts, 1):
    try:
        result = supabase.table('posts').insert(post).execute()
        created_time = result.data[0]['created_at'] if result.data else 'Unknown'
        print(f"[{i}/5] General member post created:")
        print(f"    Title: {post['title'][:50]}...")
        print(f"    Auto-generated time: {created_time}")
        print()
    except Exception as e:
        print(f"[{i}/5] Failed: {str(e)}\n")

print("=" * 60)
print("Completed!")
print("Politician posts: 5 (with auto timestamp)")
print("General member posts: 5 (with auto timestamp)")
print("Total: 10 posts with DB auto-generated timestamps")
print("\nView at: http://localhost:3003/community")
print("=" * 60)
