"""
프로필 이미지 URL 업데이트 스크립트
JSON 파일에서 이미지 URL을 읽어 DB에 업데이트
"""
import os
import json
from supabase import create_client, Client

# Supabase 설정
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY environment variables are required")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# JSON 파일 경로들
JSON_FILES = [
    "../../../0-3_AI_Evaluation_Engine/설계문서_V6.0/busan_mayor_candidates_basic_info.json",
    "../../../0-3_AI_Evaluation_Engine/설계문서_V6.0/busan_mayor_candidates_new_10.json",
    "../../../0-3_AI_Evaluation_Engine/설계문서_V6.0/gyeonggi_governor_candidates_basic_info.json",
    "../../../0-3_AI_Evaluation_Engine/설계문서_V6.0/gyeonggi_governor_candidates_new_10.json",
    "../../../0-3_AI_Evaluation_Engine/설계문서_V6.0/seoul_mayor_candidates_basic_info.json",
]

def load_image_data():
    """JSON 파일에서 이름-이미지URL 매핑 로드"""
    image_map = {}
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for json_file in JSON_FILES:
        file_path = os.path.join(script_dir, json_file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    name = item.get('name')
                    image_url = item.get('profile_image_url')
                    if name and image_url and image_url.strip():
                        image_map[name] = image_url
                        print(f"  Loaded: {name} -> {image_url[:50]}...")
        except FileNotFoundError:
            print(f"  File not found: {json_file}")
        except Exception as e:
            print(f"  Error loading {json_file}: {e}")

    return image_map

def update_profile_images():
    """DB의 정치인 프로필 이미지 URL 업데이트"""
    print("=" * 60)
    print("프로필 이미지 URL 업데이트 시작")
    print("=" * 60)

    # 1. JSON에서 이미지 데이터 로드
    print("\n1. JSON 파일에서 이미지 URL 로드 중...")
    image_map = load_image_data()
    print(f"\n   총 {len(image_map)}개 이미지 URL 로드됨")

    if not image_map:
        print("Error: No image data found in JSON files")
        return

    # 2. DB에서 정치인 목록 가져오기
    print("\n2. DB에서 정치인 목록 조회 중...")
    result = supabase.table("politicians").select("id, name, profile_image_url").execute()
    politicians = result.data
    print(f"   총 {len(politicians)}명 정치인 조회됨")

    # 3. 이미지 URL 업데이트
    print("\n3. 프로필 이미지 URL 업데이트 중...")
    updated_count = 0
    skipped_count = 0
    not_found_count = 0

    for politician in politicians:
        name = politician.get('name')
        current_url = politician.get('profile_image_url') or ''
        politician_id = politician.get('id')

        # JSON에 이미지 URL이 있는 경우
        if name in image_map:
            new_url = image_map[name]

            # 현재 URL이 비어있거나 다른 경우 업데이트
            if not current_url or current_url != new_url:
                try:
                    supabase.table("politicians").update({
                        "profile_image_url": new_url
                    }).eq("id", politician_id).execute()
                    print(f"   [OK] Updated: {name}")
                    updated_count += 1
                except Exception as e:
                    print(f"   [ERROR] Error updating {name}: {e}")
            else:
                skipped_count += 1
        else:
            not_found_count += 1

    # 4. 결과 요약
    print("\n" + "=" * 60)
    print("업데이트 완료!")
    print("=" * 60)
    print(f"  업데이트됨: {updated_count}명")
    print(f"  이미 최신: {skipped_count}명")
    print(f"  이미지 없음: {not_found_count}명")

if __name__ == "__main__":
    update_profile_images()
