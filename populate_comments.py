import sys
sys.stdout.reconfigure(encoding='utf-8')
from supabase import create_client
import uuid
import random
from datetime import datetime, timedelta

supabase_url = 'https://icxnbrkrjwqbezxmepbm.supabase.co'
supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeG5icmtyandicWJlenhtZXBibSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzA4ODc4NjcsImV4cCI6MjA0NjQ2Mzg2N30.SXVjNbXHjMmlSCmIXlkK4yO5PJRp3aRvjVUQh_F0CKc'
supabase = create_client(supabase_url, supabase_key)

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
    posts_result = supabase.table('posts').select('id, title, category, politician_id, user_id').execute()
    posts = posts_result.data
    print(f"총 {len(posts)}개의 게시글 발견")

    # 2. 모든 사용자 가져오기
    print("\n=== 사용자 조회 중... ===")
    users_result = supabase.table('users').select('user_id, nickname').execute()
    users = users_result.data
    print(f"총 {len(users)}명의 사용자 발견")

    if len(users) == 0:
        print("오류: 사용자가 없습니다. 먼저 사용자를 생성해주세요.")
        sys.exit(1)

    # 3. 기존 댓글 수 확인
    existing_comments_result = supabase.table('comments').select('*', count='exact').execute()
    existing_count = existing_comments_result.count or 0
    print(f"\n기존 댓글: {existing_count}개")

    # 4. 각 게시글에 댓글 생성
    print("\n=== 댓글 생성 시작 ===")
    created_comments = 0
    created_replies = 0

    for post in posts:
        post_id = post['id']
        post_title = post['title'][:30] + "..." if len(post['title']) > 30 else post['title']

        # 각 게시글에 2-5개의 댓글 생성
        num_comments = random.randint(2, 5)

        print(f"\n게시글: {post_title}")
        print(f"  생성할 댓글 수: {num_comments}개")

        post_comments = []

        for i in range(num_comments):
            # 랜덤 사용자 선택
            author = random.choice(users)

            # 댓글 내용 선택
            comment_content = random.choice(comment_templates)

            # 생성 시간 (과거 1-30일 사이)
            days_ago = random.randint(1, 30)
            created_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23))

            new_comment = {
                'id': str(uuid.uuid4()),
                'post_id': post_id,
                'user_id': author['user_id'],
                'content': comment_content,
                'parent_id': None,
                'upvotes': random.randint(0, 50),
                'downvotes': random.randint(0, 10),
                'is_deleted': False,
                'created_at': created_at.isoformat(),
                'updated_at': created_at.isoformat(),
            }

            # 댓글 삽입
            result = supabase.table('comments').insert(new_comment).execute()

            if result.data:
                created_comments += 1
                post_comments.append(new_comment)
                print(f"    ✅ 댓글 {i+1} 생성: {author['nickname']} - {comment_content[:20]}...")

        # 5. 일부 댓글에 대댓글 추가 (30% 확률)
        for comment in post_comments:
            if random.random() < 0.3:  # 30% 확률로 대댓글 추가
                # 랜덤 사용자 선택
                reply_author = random.choice(users)

                # 대댓글 내용 선택
                reply_content = random.choice(reply_templates)

                # 원댓글보다 나중 시간
                comment_time = datetime.fromisoformat(comment['created_at'])
                reply_time = comment_time + timedelta(hours=random.randint(1, 48))

                reply = {
                    'id': str(uuid.uuid4()),
                    'post_id': post_id,
                    'user_id': reply_author['user_id'],
                    'content': reply_content,
                    'parent_id': comment['id'],
                    'upvotes': random.randint(0, 20),
                    'downvotes': random.randint(0, 5),
                    'is_deleted': False,
                    'created_at': reply_time.isoformat(),
                    'updated_at': reply_time.isoformat(),
                }

                # 대댓글 삽입
                result = supabase.table('comments').insert(reply).execute()

                if result.data:
                    created_replies += 1
                    print(f"      ↳ 대댓글 생성: {reply_author['nickname']} - {reply_content[:20]}...")

    # 6. 최종 결과 확인
    print("\n=== 생성 완료 ===")
    final_result = supabase.table('comments').select('*', count='exact').execute()
    final_count = final_result.count or 0

    print(f"\n총 생성된 댓글: {created_comments}개")
    print(f"총 생성된 대댓글: {created_replies}개")
    print(f"최종 댓글 총 개수: {final_count}개")
    print(f"증가량: {final_count - existing_count}개")

except Exception as e:
    print(f"\n오류 발생: {str(e)}")
    import traceback
    traceback.print_exc()
