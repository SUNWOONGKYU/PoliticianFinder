#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
실제 posts 테이블 스키마에 맞춰 게시글 10개 작성
"""
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random
import sys
import io
import uuid

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv('1_Frontend/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

print("=== Creating 10 Test Posts ===\n")

# Get actual politicians
print("Step 1: Fetching politicians...")
politicians_result = supabase.table('politicians').select('id, name, party').limit(10).execute()
politicians = politicians_result.data[:5]
print(f"Found {len(politicians)} politicians\n")

# Generate fake user IDs (UUID format)
fake_user_ids = [str(uuid.uuid4()) for _ in range(10)]

# Create 5 politician posts
print("Step 2: Creating 5 politician posts...\n")
politician_posts = [
    {
        "title": f"청년 일자리 정책에 대한 {politicians[0]['name']}의 생각",
        "content": f"안녕하세요, {politicians[0]['party']} {politicians[0]['name']}입니다. 청년 일자리 문제는 우리나라의 가장 중요한 현안 중 하나입니다. 저는 청년 고용 확대를 위해 중소기업 세제 혜택 확대와 청년 창업 지원 강화를 추진하고자 합니다. 여러분의 의견을 듣고 싶습니다.",
        "category": "general",
        "user_id": fake_user_ids[0],
        "politician_id": politicians[0]['id'],
        "upvotes": random.randint(10, 50),
        "downvotes": random.randint(1, 10),
        "view_count": random.randint(100, 500),
        "is_hot": True,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=2)).isoformat()
    },
    {
        "title": f"{politicians[1]['name']}, 교육 개혁안 공약 설명",
        "content": f"교육은 국가의 미래입니다. {politicians[1]['party']} {politicians[1]['name']}입니다. 공교육 정상화를 위해 교사 처우 개선, 학급당 학생 수 감축, 그리고 미래 교육 인프라 확충에 힘쓰겠습니다. 학부모님들과 학생들의 목소리에 귀 기울이겠습니다.",
        "category": "general",
        "user_id": fake_user_ids[1],
        "politician_id": politicians[1]['id'],
        "upvotes": random.randint(15, 60),
        "downvotes": random.randint(2, 8),
        "view_count": random.randint(150, 600),
        "is_hot": True,
        "is_best": True,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=3)).isoformat()
    },
    {
        "title": f"부동산 정책 방향 - {politicians[2]['name']}",
        "content": f"주거 안정은 국민의 기본권입니다. {politicians[2]['name']}입니다. 청년 주택 공급 확대, 전월세 상한제 보완, 그리고 실수요자 보호를 위한 정책을 추진하겠습니다. 현장의 목소리를 정책에 반영하겠습니다.",
        "category": "general",
        "user_id": fake_user_ids[2],
        "politician_id": politicians[2]['id'],
        "upvotes": random.randint(20, 70),
        "downvotes": random.randint(5, 15),
        "view_count": random.randint(200, 700),
        "is_hot": True,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=1)).isoformat()
    },
    {
        "title": f"{politicians[3]['name']}: 환경 보호와 경제 성장의 균형",
        "content": f"환경과 경제는 대립하는 것이 아닙니다. {politicians[3]['party']} {politicians[3]['name']}입니다. 친환경 산업 육성으로 일자리를 창출하고, 탄소중립 달성과 경제 성장을 동시에 이루겠습니다. 녹색 전환이 새로운 기회가 되도록 하겠습니다.",
        "category": "general",
        "user_id": fake_user_ids[3],
        "politician_id": politicians[3]['id'],
        "upvotes": random.randint(12, 45),
        "downvotes": random.randint(3, 12),
        "view_count": random.randint(120, 450),
        "is_hot": False,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=4)).isoformat()
    },
    {
        "title": f"{politicians[4]['name']}, 지역 균형 발전 정책 발표",
        "content": f"수도권 집중을 완화하고 지역이 골고루 발전하는 대한민국을 만들겠습니다. {politicians[4]['name']}입니다. 지역 특화 산업 육성, 교통 인프라 확충, 그리고 지역 인재 양성에 투자하겠습니다.",
        "category": "general",
        "user_id": fake_user_ids[4],
        "politician_id": politicians[4]['id'],
        "upvotes": random.randint(8, 40),
        "downvotes": random.randint(2, 8),
        "view_count": random.randint(90, 400),
        "is_hot": False,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=5)).isoformat()
    }
]

for i, post in enumerate(politician_posts, 1):
    try:
        result = supabase.table('posts').insert(post).execute()
        print(f"[{i}/5] Politician post created:")
        print(f"     Title: {post['title'][:60]}...")
        print(f"     Politician: {politicians[i-1]['name']} (ID: {post['politician_id']})")
        print()
    except Exception as e:
        print(f"[{i}/5] Failed: {str(e)}\n")

# Create 5 general member posts
print("\nStep 3: Creating 5 general member posts...\n")
general_posts = [
    {
        "title": "청년 일자리 공약, 실현 가능성은?",
        "content": "최근 여러 정치인들이 청년 일자리 창출을 공약으로 내세우고 있습니다. 과연 실현 가능할까요? 구체적인 실행 계획이 궁금합니다. 여러분의 생각은 어떤가요?",
        "category": "general",
        "user_id": fake_user_ids[5],
        "politician_id": None,
        "upvotes": random.randint(10, 50),
        "downvotes": random.randint(2, 10),
        "view_count": random.randint(100, 500),
        "is_hot": True,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=1, hours=12)).isoformat()
    },
    {
        "title": "교육 정책 토론 - 사교육 문제 해결 방안",
        "content": "사교육비 부담이 너무 큽니다. 공교육 정상화가 답일까요? 아니면 다른 해결책이 있을까요? 학부모로서 정말 고민이 많습니다. 여러분의 의견을 듣고 싶습니다.",
        "category": "general",
        "user_id": fake_user_ids[6],
        "politician_id": None,
        "upvotes": random.randint(15, 60),
        "downvotes": random.randint(3, 12),
        "view_count": random.randint(150, 600),
        "is_hot": True,
        "is_best": True,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=2, hours=8)).isoformat()
    },
    {
        "title": "지역 발전을 위한 제안",
        "content": "우리 지역이 점점 쇠퇴하고 있는 것 같습니다. 청년들은 떠나고 일자리는 줄어들고... 지역 경제 활성화를 위해 어떤 정책이 필요할까요? 실질적인 아이디어를 공유해봅시다.",
        "category": "general",
        "user_id": fake_user_ids[7],
        "politician_id": None,
        "upvotes": random.randint(12, 45),
        "downvotes": random.randint(4, 10),
        "view_count": random.randint(120, 450),
        "is_hot": False,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=3, hours=15)).isoformat()
    },
    {
        "title": "부동산 정책 개선이 시급합니다",
        "content": "전월세 상한제가 시행되었지만 여전히 집값은 오르고 전세난은 계속되고 있습니다. 실수요자 보호를 위한 더 강력한 정책이 필요하지 않을까요? 현장의 목소리를 정치인들이 들어주길 바랍니다.",
        "category": "general",
        "user_id": fake_user_ids[8],
        "politician_id": None,
        "upvotes": random.randint(20, 70),
        "downvotes": random.randint(6, 15),
        "view_count": random.randint(200, 700),
        "is_hot": True,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=1, hours=6)).isoformat()
    },
    {
        "title": "환경 보호 vs 경제 발전, 양립 가능할까요?",
        "content": "환경을 지키는 것도 중요하지만 경제도 살려야 하는데... 두 마리 토끼를 다 잡을 수 있을까요? 친환경 산업이 정말 답이 될 수 있을지 여러분의 생각이 궁금합니다.",
        "category": "general",
        "user_id": fake_user_ids[9],
        "politician_id": None,
        "upvotes": random.randint(8, 40),
        "downvotes": random.randint(2, 8),
        "view_count": random.randint(90, 400),
        "is_hot": False,
        "is_best": False,
        "is_concept": False,
        "created_at": (datetime.now() - timedelta(days=4, hours=10)).isoformat()
    }
]

for i, post in enumerate(general_posts, 1):
    try:
        result = supabase.table('posts').insert(post).execute()
        print(f"[{i}/5] General member post created:")
        print(f"     Title: {post['title']}")
        print()
    except Exception as e:
        print(f"[{i}/5] Failed: {str(e)}\n")

print("=== Completed ===")
print("Politician posts: 5 (with real politician IDs)")
print("General member posts: 5")
print("Total: 10 posts created")
print("\nYou can view them at: http://localhost:3003/community")
