#!/bin/bash

# 댓글 템플릿 배열
comments=(
    "좋은 의견입니다. 저도 동의합니다."
    "이 부분에 대해서는 좀 더 논의가 필요할 것 같습니다."
    "구체적인 근거가 있으신가요?"
    "제 생각에는 다른 방안도 고려해봐야 할 것 같습니다."
    "정말 중요한 이슈네요. 관심 가져주셔서 감사합니다."
    "반대 의견입니다. 이런 문제가 있을 수 있습니다."
    "실현 가능성을 좀 더 따져봐야 할 것 같아요."
    "전적으로 동의합니다. 빨리 실행되었으면 좋겠습니다."
    "이전 정책과 비교해서 어떤 차이가 있나요?"
    "다른 지역의 사례는 어떤지 궁금합니다."
    "예산 확보는 어떻게 할 계획이신가요?"
    "장기적인 효과를 고려하면 좋을 것 같습니다."
    "현실적으로 가능한 방안인가요?"
    "이 정책의 수혜 대상은 누구인가요?"
    "부작용은 없을까요?"
)

# 대댓글 템플릿 배열
replies=(
    "맞는 말씀입니다."
    "그 부분은 생각 못했네요. 좋은 지적입니다."
    "저는 다르게 생각합니다."
    "추가로 이런 점도 고려해야 할 것 같습니다."
    "동의합니다."
)

API_BASE="http://localhost:3000/api"

echo "=== 게시글 조회 중... ==="
# 게시글 목록 가져오기
posts_json=$(curl -s "${API_BASE}/posts?limit=30")

# jq로 post ID 추출
post_ids=$(echo "$posts_json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    for post in data['data']:
        print(post['id'])
")

echo "게시글 개수: $(echo "$post_ids" | wc -l)"

created=0
replies_created=0

# 각 게시글에 댓글 추가
for post_id in $post_ids; do
    echo ""
    echo "게시글 ID: ${post_id:0:8}..."

    # 각 게시글에 2-3개 댓글 생성
    num_comments=$((2 + RANDOM % 2))

    for i in $(seq 1 $num_comments); do
        # 랜덤 댓글 선택
        idx=$((RANDOM % ${#comments[@]}))
        comment_text="${comments[$idx]}"

        # JSON 이스케이프 처리
        comment_json=$(python3 -c "import json; print(json.dumps('$comment_text'))")

        # 댓글 생성 API 호출
        result=$(curl -s -X POST "${API_BASE}/comments" \
            -H "Content-Type: application/json" \
            -d "{\"post_id\":\"$post_id\",\"content\":$comment_json}")

        success=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))")

        if [ "$success" = "True" ]; then
            created=$((created + 1))
            echo "  ✅ 댓글 $i 생성: ${comment_text:0:30}..."
        else
            echo "  ❌ 댓글 생성 실패"
        fi

        sleep 0.1
    done

    # 30% 확률로 대댓글 추가
    if [ $((RANDOM % 10)) -lt 3 ]; then
        # 이 게시글의 댓글 목록 가져오기
        comments_json=$(curl -s "${API_BASE}/comments?post_id=$post_id")

        # 첫 번째 댓글 ID 가져오기
        first_comment_id=$(echo "$comments_json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success') and len(data['data']) > 0:
    print(data['data'][0]['id'])
else:
    print('')
")

        if [ ! -z "$first_comment_id" ]; then
            # 랜덤 대댓글 선택
            idx=$((RANDOM % ${#replies[@]}))
            reply_text="${replies[$idx]}"

            # JSON 이스케이프 처리
            reply_json=$(python3 -c "import json; print(json.dumps('$reply_text'))")

            # 대댓글 생성 API 호출
            result=$(curl -s -X POST "${API_BASE}/comments" \
                -H "Content-Type: application/json" \
                -d "{\"post_id\":\"$post_id\",\"content\":$reply_json,\"parent_id\":\"$first_comment_id\"}")

            success=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))")

            if [ "$success" = "True" ]; then
                replies_created=$((replies_created + 1))
                echo "    ↳ 대댓글 생성: ${reply_text:0:30}..."
            fi

            sleep 0.1
        fi
    fi
done

echo ""
echo "=== 생성 완료 ==="
echo "총 생성된 댓글: $created 개"
echo "총 생성된 대댓글: $replies_created 개"
echo "총 생성: $((created + replies_created)) 개"
