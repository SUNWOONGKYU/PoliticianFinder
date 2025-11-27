#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
테스트 데이터 정리 스크립트

작업 내용:
1. 실제 정치인 30명은 유지 (글 작성 안 함)
2. 가상 정치인 중 점수가 있는 3명만 남기기
3. 나머지 가상 정치인 삭제
4. 기존 정치인 게시글 작성자를 가상 정치인 3명으로 변경
5. 정치인 댓글도 가상 정치인 3명으로 변경
6. 테스트용 일반 회원 3명만 남기기
7. 일반 회원 게시글/댓글 작성자를 그 3명으로 변경
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# UTF-8 인코딩 설정
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# .env.local 파일 로드 (1_Frontend 폴더의 .env.local 사용)
env_path = os.path.join(os.path.dirname(__file__), '1_Frontend', '.env.local')
load_dotenv(env_path)

# Supabase 클라이언트 생성
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError(f"Environment variables not found. URL: {url}, Key: {'***' if key else None}")

supabase: Client = create_client(url, key)

# 실제 정치인 30명 ID (30명_정치인_명단.md 기준)
REAL_POLITICIANS = [
    # 서울특별시 10명
    '62e7b453',  # 오세훈
    'f9e00370',  # 김민석
    '1005',      # 나경원
    '1006',      # 박주민
    '17270f25',  # 정원오
    '7f1c3606',  # 전현희
    '7abadf92',  # 한동훈
    '567e2c27',  # 이준석
    'e3c75ad7',  # 신동욱
    'd0a5d6e1',  # 조은희
    # 경기도 10명
    '0756ec15',  # 김동연
    'd8fe79e9',  # 추미애
    'be4f6b92',  # 한준호
    '8dc6cea5',  # 김병주
    '266c6671',  # 염태영
    '643d6bec',  # 유승민
    '8639bbf9',  # 원유철
    'af3a0f29',  # 김선교
    '023139c6',  # 송석준
    'aa2cd708',  # 김성원
    # 부산광역시 10명
    '81fafa15',  # 전재수
    'd756cb91',  # 박형준
    '60e55d2a',  # 김도읍
    'b99c4d6e',  # 조경태
    'ab673715',  # 박수영
    'b6ec6ee4',  # 최인호
    '3ee57024',  # 이재성
    'ea36290f',  # 차정인
    'adaaadc3',  # 홍순헌
    '935ea93a',  # 이진복
]

# 유지할 가상 정치인 3명 (점수가 있는 가상 정치인 중 선택)
# 이 값은 스크립트 실행 시 자동으로 결정됨
KEEP_FAKE_POLITICIANS = []

print("=" * 60)
print("테스트 데이터 정리 시작")
print("=" * 60)

# 1. 현재 정치인 수 확인
print("\n[1단계] 현재 데이터 확인")
all_politicians = supabase.table('politicians').select('id, name, party, position').execute()
print(f"✓ 전체 정치인 수: {len(all_politicians.data)}명")

# 실제 정치인과 가상 정치인 분리
real_pols = [p for p in all_politicians.data if p['id'] in REAL_POLITICIANS]
fake_pols = [p for p in all_politicians.data if p['id'] not in REAL_POLITICIANS]

print(f"\n실제 정치인: {len(real_pols)}명")
print(f"가상 정치인: {len(fake_pols)}명")

# 2. 가상 정치인 중 3명 선택 (점수 우선, 없으면 임의 선택)
print("\n[2단계] 가상 정치인 3명 선택")
fake_ids = [p['id'] for p in fake_pols]

if len(fake_ids) > 0:
    # ai_final_scores 테이블에서 점수 조회
    scores_response = supabase.table('ai_final_scores').select('politician_id, total_score').in_('politician_id', fake_ids).execute()

    # politician_id별로 점수 집계
    scores_map = {}
    for score in scores_response.data:
        pid = score['politician_id']
        if pid not in scores_map:
            scores_map[pid] = []
        scores_map[pid].append(score['total_score'])

    # 점수 있는 정치인과 없는 정치인 분리
    fake_with_scores = []
    fake_without_scores = []

    for p in fake_pols:
        if p['id'] in scores_map:
            avg_score = sum(scores_map[p['id']]) / len(scores_map[p['id']])
            fake_with_scores.append({
                'id': p['id'],
                'name': p['name'],
                'position': p.get('position', ''),
                'party': p.get('party', ''),
                'avg_score': avg_score
            })
        else:
            fake_without_scores.append({
                'id': p['id'],
                'name': p['name'],
                'position': p.get('position', ''),
                'party': p.get('party', ''),
                'avg_score': 0
            })

    # 점수 높은 순으로 정렬
    fake_with_scores.sort(key=lambda x: x['avg_score'], reverse=True)

    print(f"✓ 점수 있는 가상 정치인: {len(fake_with_scores)}명")
    print(f"✓ 점수 없는 가상 정치인: {len(fake_without_scores)}명")

    # 3명 선택 (점수 있는 것 우선, 부족하면 없는 것도 포함)
    selected = fake_with_scores[:3]
    if len(selected) < 3:
        selected += fake_without_scores[:3 - len(selected)]

    KEEP_FAKE_POLITICIANS = [p['id'] for p in selected]

    print(f"\n유지할 가상 정치인 {len(KEEP_FAKE_POLITICIANS)}명:")
    for i, p in enumerate(selected, 1):
        score_text = f"평균 {p['avg_score']:.1f}점" if p['avg_score'] > 0 else "점수 없음"
        print(f"  {i}. {p['name']} ({p['id']}) - {p.get('position', 'N/A')} - {p.get('party', 'N/A')} - {score_text}")
else:
    print("⚠️ 가상 정치인이 없습니다")
    KEEP_FAKE_POLITICIANS = []

print(f"\n최종 유지 대상:")
print(f"  - 실제 정치인: {len(REAL_POLITICIANS)}명")
print(f"  - 가상 정치인: {len(KEEP_FAKE_POLITICIANS)}명")

# 3. 정치인 게시글 작성자 변경 (가상 정치인 3명으로 분산)
print("\n[3단계] 정치인 게시글 작성자 변경")
if len(KEEP_FAKE_POLITICIANS) > 0:
    politician_posts = supabase.table('posts').select('id').not_.is_('politician_id', 'null').execute()
    print(f"✓ 정치인 게시글 수: {len(politician_posts.data)}개")

    if len(politician_posts.data) > 0:
        for i, post in enumerate(politician_posts.data):
            # 가상 정치인 3명에게 균등하게 분배
            politician_id = KEEP_FAKE_POLITICIANS[i % len(KEEP_FAKE_POLITICIANS)]
            supabase.table('posts').update({
                'politician_id': politician_id
            }).eq('id', post['id']).execute()
        print(f"✓ 모든 정치인 게시글 작성자를 가상 정치인 {len(KEEP_FAKE_POLITICIANS)}명으로 변경 완료")
else:
    print("⚠️ 가상 정치인이 없어 게시글 재할당을 건너뜁니다")

# 4. 정치인 댓글은 없음 (comments 테이블에 politician_id 컬럼 없음)
print("\n[4단계] 정치인 댓글 작성자 변경")
print("✓ comments 테이블에는 politician_id 컬럼이 없어 건너뜁니다 (일반 회원만 댓글 작성)")

# 5. 테스트용 일반 회원 3명 선택
print("\n[5단계] 테스트용 일반 회원 선정")
# profiles 테이블에서 사용자 조회 (id 컬럼 사용)
profiles_response = supabase.table('profiles').select('id, username, email').limit(100).execute()
print(f"✓ 현재 회원 수: {len(profiles_response.data)}명")

# 처음 3명 선택
if len(profiles_response.data) >= 3:
    keep_users = profiles_response.data[:3]
    KEEP_USER_IDS = [u['id'] for u in keep_users]

    print(f"\n유지할 일반 회원 3명:")
    for u in keep_users:
        print(f"  - {u.get('username', '익명')} ({u['id'][:8]}...) - {u.get('email', 'N/A')}")

    # 6. 일반 회원 게시글 작성자 변경
    print("\n[6단계] 일반 회원 게시글 작성자 변경")
    user_posts = supabase.table('posts').select('id').is_('politician_id', 'null').execute()
    print(f"✓ 일반 회원 게시글 수: {len(user_posts.data)}개")

    if len(user_posts.data) > 0:
        for i, post in enumerate(user_posts.data):
            user_id = KEEP_USER_IDS[i % 3]
            supabase.table('posts').update({
                'user_id': user_id
            }).eq('id', post['id']).execute()
        print(f"✓ 모든 일반 회원 게시글 작성자를 3명으로 변경 완료")

    # 7. 일반 회원 댓글 작성자 변경 (모든 댓글이 일반 회원 것)
    print("\n[7단계] 일반 회원 댓글 작성자 변경")
    user_comments = supabase.table('comments').select('id').execute()
    print(f"✓ 전체 댓글 수: {len(user_comments.data)}개")

    if len(user_comments.data) > 0:
        for i, comment in enumerate(user_comments.data):
            user_id = KEEP_USER_IDS[i % 3]
            supabase.table('comments').update({
                'user_id': user_id
            }).eq('id', comment['id']).execute()
        print(f"✓ 모든 댓글 작성자를 일반 회원 3명으로 변경 완료")

# 8. 불필요한 가상 정치인 삭제 (실제 정치인 30명 + 가상 정치인 3명 제외)
print("\n[8단계] 불필요한 가상 정치인 삭제")
keep_all_politicians = REAL_POLITICIANS + KEEP_FAKE_POLITICIANS
delete_politicians = supabase.table('politicians').select('id, name').not_.in_('id', keep_all_politicians).execute()
print(f"✓ 삭제할 가상 정치인 수: {len(delete_politicians.data)}명")

if len(delete_politicians.data) > 0:
    delete_count = 0
    for p in delete_politicians.data:
        try:
            # CASCADE 삭제 (관련 데이터 자동 삭제)
            supabase.table('politicians').delete().eq('id', p['id']).execute()
            delete_count += 1
            print(f"  ✓ 삭제: {p['name']} ({p['id']})")
        except Exception as e:
            print(f"  ⚠️ {p['name']} 삭제 실패: {e}")
    print(f"✓ {delete_count}명 삭제 완료")

# 9. 삭제할 일반 회원 삭제 (유지할 3명 제외)
if len(profiles_response.data) >= 3:
    print("\n[9단계] 불필요한 일반 회원 삭제")
    delete_users = supabase.table('profiles').select('id, username').not_.in_('id', KEEP_USER_IDS).execute()
    print(f"✓ 삭제할 회원 수: {len(delete_users.data)}명")

    if len(delete_users.data) > 0:
        delete_count = 0
        for u in delete_users.data:
            try:
                # profiles 삭제 (auth.users는 자동 삭제 안 됨)
                supabase.table('profiles').delete().eq('id', u['id']).execute()
                delete_count += 1
            except Exception as e:
                print(f"  ⚠️ {u.get('username', 'Unknown')} 삭제 실패: {e}")
        print(f"✓ {delete_count}명 삭제 완료")

print("\n" + "=" * 60)
print("✅ 테스트 데이터 정리 완료!")
print("=" * 60)
print("\n최종 결과:")
print(f"  - 실제 정치인: {len(REAL_POLITICIANS)}명 (유지)")
print(f"  - 가상 정치인: {len(KEEP_FAKE_POLITICIANS)}명 (글 작성용)")
print(f"  - 일반 회원: 3명")
print(f"  - 모든 게시글/댓글 작성자가 가상 정치인 {len(KEEP_FAKE_POLITICIANS)}명 + 일반 회원 3명으로 변경됨")
print("=" * 60)
