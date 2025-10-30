#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
커뮤니티 Mock 데이터 생성 스크립트
게시글 20개, 댓글 50개 생성
"""

import json
import random
from datetime import datetime, timedelta

# 30명의 정치인 이름 목록 (이미 생성된 데이터)
politician_names = [
    '김민준', '이서연', '박지후', '최하은', '정도윤', '강준우', '조시우', '윤하준',
    '장지훈', '임승현', '한우진', '오지우', '서서윤', '신지민', '권수아', '황민서',
    '안예은', '송채원', '전지안', '홍서준', '김도현', '이유진', '박서현', '최민지',
    '정예린', '강하늘', '조윤아', '윤재영', '장민호', '임수빈'
]

# 일반 회원 닉네임 목록
user_names = [
    '정치관심러', '민주시민', '정의로운세상', '청년의목소리', '투명한정치',
    '정치평론가', '시민참여자', '민생이우선', '깨어있는시민', '정치개혁',
    '공정한사회', '정치는우리의것', '변화를원해', '더나은내일', '시민의힘',
    '정치토론러', '올바른선택', '미래세대', '투표하는시민', '정책분석가'
]

# 게시글 카테고리
categories = ['discussion', 'question', 'news', 'general', 'official']

# 게시글 제목과 내용 템플릿
post_templates = [
    {
        'title': '청년 일자리 공약, 실현 가능성은?',
        'content': '최근 여러 정치인들이 청년 일자리 창출을 공약으로 내세우고 있습니다. 하지만 구체적인 실행 계획이 부족해 보입니다. 여러분의 의견은 어떠신가요?',
        'category': 'discussion',
        'tags': ['청년정책', '일자리', '공약검증']
    },
    {
        'title': '지역 교통 인프라 개선 예산안에 대해',
        'content': '우리 지역 교통 인프라 개선을 위한 예산안이 통과되었습니다. 시민들의 실생활에 큰 도움이 될 것으로 기대됩니다.',
        'category': 'news',
        'tags': ['교통', '인프라', '예산']
    },
    {
        'title': '정치인 평가 시스템, 어떻게 개선할 수 있을까요?',
        'content': '현재 플랫폼의 정치인 평가 시스템에 대한 의견을 나누고 싶습니다. AI 평가와 회원 평가의 균형을 어떻게 맞춰야 할까요?',
        'category': 'question',
        'tags': ['평가시스템', '개선제안', 'AI']
    },
    {
        'title': '중소기업 지원 정책의 실효성',
        'content': '중소기업 지원 정책들이 많이 발표되지만, 실제로 중소기업을 운영하는 입장에서는 체감이 잘 안 됩니다. 현장의 목소리를 정책에 반영할 방법이 필요합니다.',
        'category': 'discussion',
        'tags': ['중소기업', '경제정책', '현장목소리']
    },
    {
        'title': '교육 개혁안, 찬반 의견 나눠봐요',
        'content': '새로운 교육 개혁안이 발표되었습니다. 학생, 학부모, 교사 모두의 입장에서 다양한 의견을 듣고 싶습니다.',
        'category': 'discussion',
        'tags': ['교육', '개혁안', '토론']
    },
    {
        'title': '복지 정책 확대, 재원 마련은?',
        'content': '복지 정책 확대에는 모두 찬성하지만, 재원 마련 방안에 대해서는 의견이 분분합니다. 증세 vs 재정 효율화, 어떤 방법이 더 합리적일까요?',
        'category': 'question',
        'tags': ['복지', '재정', '증세']
    },
    {
        'title': '환경 정책 공약 비교 분석',
        'content': '각 정당의 환경 정책 공약을 비교 분석해봤습니다. 실현 가능성과 효과성 측면에서 평가해보고 싶습니다.',
        'category': 'discussion',
        'tags': ['환경', '기후변화', '공약비교']
    },
    {
        'title': '지역 발전 정책에 대한 의견',
        'content': '우리 지역 발전을 위한 정책들이 필요합니다. 지역 주민들의 실질적인 의견을 모아 정치인들에게 전달하면 좋겠습니다.',
        'category': 'general',
        'tags': ['지역발전', '주민참여', '정책제안']
    },
    {
        'title': '공공의료 확대 정책 어떻게 보시나요?',
        'content': '공공의료 확대 정책이 발표되었습니다. 의료 접근성 향상에 도움이 될지, 의료 서비스 질에는 어떤 영향이 있을지 토론해봅시다.',
        'category': 'discussion',
        'tags': ['의료', '공공의료', '보건정책']
    },
    {
        'title': '부동산 정책, 실수요자 보호는?',
        'content': '최근 부동산 정책들이 연이어 발표되고 있습니다. 투기 억제도 중요하지만 실수요자 보호 방안도 충분히 고려되었는지 궁금합니다.',
        'category': 'question',
        'tags': ['부동산', '주택정책', '실수요자']
    },
    {
        'title': '디지털 전환 정책, 소외계층 배려는?',
        'content': '정부의 디지털 전환 정책이 빠르게 진행되고 있습니다. 하지만 디지털 소외계층에 대한 배려가 부족해 보입니다.',
        'category': 'discussion',
        'tags': ['디지털', '포용정책', '소외계층']
    },
    {
        'title': '국방 정책 방향성에 대해',
        'content': '변화하는 안보 환경 속에서 우리나라 국방 정책의 방향성에 대한 토론이 필요합니다.',
        'category': 'discussion',
        'tags': ['국방', '안보', '정책방향']
    },
    {
        'title': '지방 소멸 위기, 어떻게 해결할까?',
        'content': '지방 소멸 위기가 심각합니다. 청년 유출을 막고 지역 경제를 살릴 수 있는 실질적인 정책이 필요합니다.',
        'category': 'discussion',
        'tags': ['지방소멸', '인구정책', '지역경제']
    },
    {
        'title': '정치 투명성 제고 방안',
        'content': '정치 자금, 정책 결정 과정 등 정치의 투명성을 높이기 위한 방안들을 함께 논의해봅시다.',
        'category': 'general',
        'tags': ['투명성', '정치개혁', '시민참여']
    },
    {
        'title': '기후 위기 대응 정책 긴급합니다',
        'content': '기후 위기가 현실이 되고 있습니다. 더 늦기 전에 실질적인 대응 정책이 필요합니다.',
        'category': 'news',
        'tags': ['기후위기', '환경', '긴급대응']
    },
    {
        'title': '스타트업 지원 정책, 현장의 목소리',
        'content': '스타트업 지원 정책들이 많지만 실제 스타트업 현장에서는 체감이 어렵습니다. 실질적인 지원 방안을 제안합니다.',
        'category': 'question',
        'tags': ['스타트업', '창업지원', '현장목소리']
    },
    {
        'title': '농업 정책, 농민들의 실질적 도움 될까?',
        'content': '농업 정책들이 발표되고 있지만 실제 농민들에게 얼마나 도움이 될지 의문입니다. 농촌 현장의 목소리를 들어야 합니다.',
        'category': 'discussion',
        'tags': ['농업', '농촌정책', '농민']
    },
    {
        'title': '[공식] 청년 일자리 창출 정책 설명',
        'content': '안녕하세요. 청년 일자리 2만개 창출 공약에 대해 구체적인 실행 계획을 말씀드리겠습니다. 중소기업 인턴십 프로그램 1만개, 공공부문 신규 채용 5천개, 창업 지원 5천개로 구성됩니다.',
        'category': 'official',
        'tags': ['청년정책', '일자리', '공약설명']
    },
    {
        'title': '육아 지원 정책 확대 필요성',
        'content': '저출산 문제 해결을 위해서는 실질적인 육아 지원 정책 확대가 필수입니다. 보육비 지원, 육아휴직 확대 등이 필요합니다.',
        'category': 'discussion',
        'tags': ['육아', '저출산', '복지정책']
    },
    {
        'title': '문화 예술 지원 정책 어떻게 보시나요?',
        'content': '문화 예술 분야에 대한 지원 정책이 부족하다는 의견이 많습니다. 예술인들의 안정적인 창작 활동을 위한 지원 방안이 필요합니다.',
        'category': 'general',
        'tags': ['문화', '예술', '지원정책']
    }
]

# 댓글 내용 템플릿
comment_templates = [
    '정말 중요한 지적이십니다. 이 부분에 대해 더 깊이 논의가 필요할 것 같습니다.',
    '저도 같은 생각입니다. 실질적인 변화가 필요한 시점입니다.',
    '다른 관점에서 보면 이런 측면도 고려해야 할 것 같습니다.',
    '구체적인 데이터나 사례가 있으면 더 설득력이 있을 것 같습니다.',
    '좋은 의견 감사합니다. 이런 토론이 더 많아졌으면 좋겠습니다.',
    '현장의 목소리를 잘 대변해주셨네요. 공감합니다.',
    '이 정책의 실행 가능성에 대해서는 좀 더 검토가 필요할 것 같습니다.',
    '시민들의 의견이 정책에 실제로 반영되는 시스템이 필요합니다.',
    '정치인들이 이런 의견들을 경청했으면 좋겠습니다.',
    '매우 시의적절한 주제입니다. 관심 가져주셔서 감사합니다.',
    '반대 의견도 있지만, 건설적인 토론이 중요하다고 봅니다.',
    '이 부분은 재정적 측면도 함께 고려해야 할 것 같습니다.',
    '장기적인 관점에서 접근이 필요한 문제입니다.',
    '단기적 효과뿐 아니라 장기적 영향도 살펴봐야겠네요.',
    '실제 현장에서는 이런 어려움이 있습니다.',
    '정책의 취지는 좋지만 실행 방안이 구체적이지 않네요.',
    '이런 문제는 여러 부처가 협력해서 해결해야 할 것 같습니다.',
    '시민 참여를 통한 정책 개선이 필요합니다.',
    '투명한 정보 공개가 먼저 이루어져야 한다고 봅니다.',
    '전문가들의 의견도 함께 들어보면 좋겠습니다.',
    '동의합니다. 실제로 이렇게 진행되면 좋을 것 같습니다.',
    '이 의견에 한 가지 더 추가하자면, 예산 확보가 먼저입니다.',
    '실행력이 관건이겠네요. 계속 지켜봐야 할 것 같습니다.',
    '좋은 지적입니다. 이런 부분들이 빠지기 쉬운데 잘 짚어주셨어요.',
    '현실적인 대안을 제시해주셔서 감사합니다.',
]

def generate_posts():
    """게시글 20개 생성"""
    posts = []
    now = datetime.now()

    for i in range(20):
        template = post_templates[i]

        # 작성자 타입 결정 (18개 일반 회원, 2개 정치인)
        is_politician = i >= 18

        if is_politician:
            author = random.choice(politician_names)
            author_id = f'politician_{random.randint(1, 30)}'
            author_type = 'politician'
            politician_id = random.randint(1, 30)
        else:
            author = random.choice(user_names)
            author_id = f'user_{random.randint(1000, 9999)}'
            author_type = 'user'
            politician_id = None

        # 시간 범위: 최근 30일 내
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        created_at = now - timedelta(days=days_ago, hours=hours_ago)

        # 추천/비추천 생성
        upvotes = random.randint(5, 150)
        downvotes = random.randint(0, upvotes // 3)
        score = upvotes - downvotes

        post = {
            'id': i + 1,
            'title': template['title'],
            'content': template['content'],
            'category': template['category'],
            'author': author,
            'author_id': author_id,
            'author_type': author_type,
            'politician_id': politician_id,
            'upvotes': upvotes,
            'downvotes': downvotes,
            'score': score,
            'views': random.randint(upvotes * 5, upvotes * 15),
            'comment_count': 0,  # 나중에 댓글 생성 후 업데이트
            'tags': template['tags'],
            'is_pinned': i == 0,  # 첫 번째 게시글만 고정
            'is_best': score > 80,
            'is_hot': score > 50 and days_ago < 3,
            'created_at': created_at.isoformat() + 'Z'
        }
        posts.append(post)

    return posts

def generate_comments(posts):
    """댓글 50개 생성 (무제한 대댓글 구조)"""
    comments = []
    comment_id = 1
    now = datetime.now()

    # 각 게시글에 평균 2-3개 댓글 (총 50개)
    comments_per_post = [3, 2, 4, 1, 3, 2, 3, 2, 4, 1, 3, 2, 3, 2, 4, 3, 2, 1, 2, 3]

    for post_idx, post in enumerate(posts):
        post_id = post['id']
        num_comments = comments_per_post[post_idx]
        post_created = datetime.fromisoformat(post['created_at'].replace('Z', ''))

        # 각 게시글의 댓글 생성
        post_comments = []

        for j in range(num_comments):
            # 원댓글 생성
            author = random.choice(user_names + politician_names)
            author_id = f'user_{random.randint(1000, 9999)}'

            # 게시글 작성 이후 시간
            hours_after_post = random.randint(1, min(24 * 7, int((now - post_created).total_seconds() / 3600)))
            created_at = post_created + timedelta(hours=hours_after_post)

            upvotes = random.randint(1, 50)
            downvotes = random.randint(0, upvotes // 4)

            comment = {
                'id': comment_id,
                'post_id': post_id,
                'parent_id': None,
                'depth': 0,
                'author': author,
                'author_id': author_id,
                'content': random.choice(comment_templates),
                'upvotes': upvotes,
                'downvotes': downvotes,
                'score': upvotes - downvotes,
                'created_at': created_at.isoformat() + 'Z'
            }
            comments.append(comment)
            post_comments.append(comment)
            comment_id += 1

            # 20% 확률로 대댓글 생성
            if random.random() < 0.3 and comment_id <= 50:
                depth_1_author = random.choice(user_names + politician_names)
                depth_1_author_id = f'user_{random.randint(1000, 9999)}'

                hours_after_comment = random.randint(1, 24)
                depth_1_created_at = created_at + timedelta(hours=hours_after_comment)

                depth_1_upvotes = random.randint(1, 30)
                depth_1_downvotes = random.randint(0, depth_1_upvotes // 4)

                depth_1_comment = {
                    'id': comment_id,
                    'post_id': post_id,
                    'parent_id': comment['id'],
                    'depth': 1,
                    'author': depth_1_author,
                    'author_id': depth_1_author_id,
                    'content': random.choice(comment_templates),
                    'upvotes': depth_1_upvotes,
                    'downvotes': depth_1_downvotes,
                    'score': depth_1_upvotes - depth_1_downvotes,
                    'created_at': depth_1_created_at.isoformat() + 'Z'
                }
                comments.append(depth_1_comment)
                comment_id += 1

                # 10% 확률로 대대댓글 생성
                if random.random() < 0.2 and comment_id <= 50:
                    depth_2_author = random.choice(user_names + politician_names)
                    depth_2_author_id = f'user_{random.randint(1000, 9999)}'

                    hours_after_depth_1 = random.randint(1, 12)
                    depth_2_created_at = depth_1_created_at + timedelta(hours=hours_after_depth_1)

                    depth_2_upvotes = random.randint(1, 20)
                    depth_2_downvotes = random.randint(0, depth_2_upvotes // 4)

                    depth_2_comment = {
                        'id': comment_id,
                        'post_id': post_id,
                        'parent_id': depth_1_comment['id'],
                        'depth': 2,
                        'author': depth_2_author,
                        'author_id': depth_2_author_id,
                        'content': random.choice(comment_templates),
                        'upvotes': depth_2_upvotes,
                        'downvotes': depth_2_downvotes,
                        'score': depth_2_upvotes - depth_2_downvotes,
                        'created_at': depth_2_created_at.isoformat() + 'Z'
                    }
                    comments.append(depth_2_comment)
                    comment_id += 1

        # 게시글의 댓글 수 업데이트
        post['comment_count'] = len([c for c in comments if c['post_id'] == post_id])

    return comments

def generate_stats(posts, comments):
    """통계 데이터 생성"""

    # 정치인 통계 (30명 기준)
    politician_stats = {
        'total': 30,
        'by_status': {
            '현직': 20,
            '후보자': 5,
            '예비후보자': 3,
            '출마자': 2
        },
        'by_category': {
            '국회의원': 12,
            '광역단체장': 6,
            '광역의원': 4,
            '기초단체장': 5,
            '기초의원': 3
        },
        'by_party': {
            '더불어민주당': 10,
            '국민의힘': 10,
            '정의당': 3,
            '개혁신당': 3,
            '무소속': 3,
            '기타': 1
        }
    }

    # 커뮤니티 통계
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)

    posts_today = len([p for p in posts if datetime.fromisoformat(p['created_at'].replace('Z', '')) >= today_start])
    comments_today = len([c for c in comments if datetime.fromisoformat(c['created_at'].replace('Z', '')) >= today_start])

    posts_by_category = {}
    for post in posts:
        category = post['category']
        posts_by_category[category] = posts_by_category.get(category, 0) + 1

    community_stats = {
        'total_posts': len(posts),
        'total_comments': len(comments),
        'total_users': 1234,  # Mock 데이터
        'posts_by_category': posts_by_category,
        'posts_today': posts_today,
        'comments_today': comments_today,
        'most_active_users': [
            {'name': '정치관심러', 'posts': 5, 'comments': 15},
            {'name': '민주시민', 'posts': 3, 'comments': 12}
        ]
    }

    return {
        'politician_stats': politician_stats,
        'community_stats': community_stats
    }

def main():
    """메인 함수"""
    print('Community Mock data generating...')

    # 게시글 생성
    posts = generate_posts()
    print(f'Posts created: {len(posts)}')

    # 댓글 생성
    comments = generate_comments(posts)
    print(f'Comments created: {len(comments)}')

    # 통계 생성
    stats = generate_stats(posts, comments)
    print(f'Stats created')

    # 결과 출력
    result = {
        'posts': posts,
        'comments': comments,
        'stats': stats
    }

    # JSON 파일로 저장
    output_path = 'G:/내 드라이브/Developement/PoliticianFinder/Developement_Real_PoliticianFinder/UIUX_Design/prototypes/html/assets/community-data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f'\nCommunity data created: {output_path}')
    print(f'   - Posts: {len(posts)}')
    print(f'   - Comments: {len(comments)} (depth 0-2)')
    print(f'   - Stats: politician_stats, community_stats')

if __name__ == '__main__':
    main()
