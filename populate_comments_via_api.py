import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
import random
import json
import time

# Local API endpoint
API_BASE = "http://localhost:3000/api"

# 댓글 템플릿들
comment_templates = [
    "좋은 의견입니다. 저도 동의합니다.",
    "이 부분에 대해서는 좀 더 논의가 필요할 것 같습니다.",
    "구체적인 근거가 있으신가요?",
    "제 생각에는 다른 방안도 고려해봐야 할 것 같습니다.",
    "정말 중요한 이슈네요. 관심 가져주셔서 감사합니다.",
    "반대 의견입니다. 이런 문제가 있을 수 있습니다.",
    "실현 가능성을 좀 더 따져봐야 할 것 같아요.",
    "전적으로 동의합니다. 빨리 실행되었으면 좋겠습니다.",
    "이전 정책과 비교해서 어떤 차이가 있나요?",
    "다른 지역의 사례는 어떤지 궁금합니다.",
    "예산 확보는 어떻게 할 계획이신가요?",
    "장기적인 효과를 고려하면 좋을 것 같습니다.",
    "현실적으로 가능한 방안인가요?",
    "이 정책의 수혜 대상은 누구인가요?",
    "부작용은 없을까요?",
    "좋은 시작이라고 생각합니다.",
    "더 나은 대안이 있을 것 같습니다.",
    "시민들의 의견도 듣고 진행하면 좋겠습니다.",
    "전문가의 검토가 필요할 것 같습니다.",
    "법적인 문제는 없나요?",
]

# 대댓글 템플릿들
reply_templates = [
    "맞는 말씀입니다.",
    "그 부분은 생각 못했네요. 좋은 지적입니다.",
    "저는 다르게 생각합니다.",
    "추가로 이런 점도 고려해야 할 것 같습니다.",
    "동의합니다.",
    "그렇게 단순한 문제가 아닙니다.",
    "좋은 의견 감사합니다.",
    "구체적으로 어떤 방법을 제안하시나요?",
    "정확한 지적입니다.",
    "다른 관점에서 보면 이렇게도 볼 수 있습니다.",
]

try:
    # 1. 모든 게시글 가져오기
    print("=== 게시글 조회 중... ===")
    response = requests.get(f"{API_BASE}/posts?limit=100")
    posts_data = response.json()

    if not posts_data.get('success'):
        print(f"오류: 게시글 조회 실패 - {posts_data.get('error')}")
        sys.exit(1)

    posts = posts_data['data']
    print(f"총 {len(posts)}개의 게시글 발견")

    # 2. 각 게시글에 대해 댓글 개수 확인
    print("\n=== 댓글 생성 시작 ===")
    created_comments = 0
    created_replies = 0

    for idx, post in enumerate(posts[:30]):  # 처음 30개 게시글만 처리
        post_id = post['id']
        post_title = post['title'][:30] + "..." if len(post['title']) > 30 else post['title']

        # 기존 댓글 확인
        comments_response = requests.get(f"{API_BASE}/comments?post_id={post_id}")
        existing_comments_data = comments_response.json()

        if existing_comments_data.get('success'):
            existing_comments = existing_comments_data.get('data', [])
            existing_count = len(existing_comments)
        else:
            existing_comments = []
            existing_count = 0

        # 각 게시글에 2-4개의 새 댓글 생성
        num_new_comments = random.randint(2, 4)

        print(f"\n[{idx+1}/{len(posts[:30])}] 게시글: {post_title}")
        print(f"  기존 댓글: {existing_count}개 | 추가할 댓글: {num_new_comments}개")

        post_new_comments = []

        for i in range(num_new_comments):
            # 댓글 내용 선택
            comment_content = random.choice(comment_templates)

            # 댓글 생성 API 호출
            payload = {
                'post_id': post_id,
                'content': comment_content,
            }

            try:
                create_response = requests.post(
                    f"{API_BASE}/comments",
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                )
                result = create_response.json()

                if result.get('success'):
                    created_comments += 1
                    post_new_comments.append(result['data'])
                    print(f"    ✅ 댓글 {i+1} 생성: {comment_content[:30]}...")
                else:
                    print(f"    ❌ 댓글 생성 실패: {result.get('error')}")

                # API 부하 방지를 위한 짧은 대기
                time.sleep(0.1)

            except Exception as e:
                print(f"    ❌ 오류: {str(e)}")

        # 3. 일부 댓글에 대댓글 추가 (기존 댓글 중 일부 선택)
        all_comments = existing_comments + post_new_comments

        if len(all_comments) > 0:
            # 30% 확률로 대댓글 추가
            num_replies = random.randint(0, min(2, len(all_comments)))

            if num_replies > 0:
                selected_comments = random.sample(all_comments, num_replies)

                for comment in selected_comments:
                    # 대댓글 내용 선택
                    reply_content = random.choice(reply_templates)

                    # 대댓글 생성 API 호출
                    payload = {
                        'post_id': post_id,
                        'content': reply_content,
                        'parent_id': comment['id'],
                    }

                    try:
                        create_response = requests.post(
                            f"{API_BASE}/comments",
                            json=payload,
                            headers={'Content-Type': 'application/json'}
                        )
                        result = create_response.json()

                        if result.get('success'):
                            created_replies += 1
                            print(f"      ↳ 대댓글 생성: {reply_content[:30]}...")
                        else:
                            print(f"      ❌ 대댓글 생성 실패: {result.get('error')}")

                        time.sleep(0.1)

                    except Exception as e:
                        print(f"      ❌ 오류: {str(e)}")

    # 4. 최종 결과
    print("\n=== 생성 완료 ===")
    print(f"총 생성된 댓글: {created_comments}개")
    print(f"총 생성된 대댓글: {created_replies}개")
    print(f"총 생성: {created_comments + created_replies}개")

except Exception as e:
    print(f"\n오류 발생: {str(e)}")
    import traceback
    traceback.print_exc()
