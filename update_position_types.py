#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
출마직종 수정 스크립트
- 정원오: title을 "광역단체장"으로 수정
- 안태준: title을 "기초의원"으로 수정
"""

import os
import sys

# Windows 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from supabase import create_client, Client

# Supabase 설정
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.")
    print("다음 명령어로 설정하세요:")
    print('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
    exit(1)

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def update_politician_title(politician_id: str, name: str, new_title: str):
    """정치인의 title(출마직종) 업데이트"""
    try:
        # 현재 데이터 확인
        response = supabase.table("politicians").select("id, name, title, position").eq("id", politician_id).execute()

        if not response.data:
            print(f"❌ {name} (ID: {politician_id})를 찾을 수 없습니다.")
            return False

        current = response.data[0]
        print(f"\n📌 {name} 현재 데이터:")
        print(f"   - ID: {current['id']}")
        print(f"   - 이름: {current['name']}")
        print(f"   - 출마직종(title): {current.get('title', '(비어있음)')}")
        print(f"   - 직책(position): {current.get('position', '(비어있음)')}")

        # title 업데이트
        update_response = supabase.table("politicians").update({
            "title": new_title
        }).eq("id", politician_id).execute()

        if update_response.data:
            print(f"✅ {name}의 출마직종을 '{new_title}'으로 업데이트했습니다.")
            return True
        else:
            print(f"❌ {name} 업데이트 실패")
            return False

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def check_empty_titles():
    """title이 비어있거나 NULL인 정치인 확인"""
    try:
        print("\n🔍 출마직종(title)이 비어있는 정치인 확인 중...\n")

        # title이 NULL이거나 빈 문자열인 경우
        response = supabase.table("politicians").select("id, name, title, position, identity").or_("title.is.null,title.eq.").execute()

        if response.data:
            print(f"⚠️  출마직종이 비어있는 정치인: {len(response.data)}명")
            for p in response.data:
                print(f"   - {p['name']} (ID: {p['id']})")
                print(f"     현재 직책(position): {p.get('position', '(비어있음)')}")
                print(f"     신분(identity): {p.get('identity', '(비어있음)')}")
        else:
            print("✅ 모든 정치인이 출마직종을 가지고 있습니다.")

        return response.data

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return None

def main():
    print("=" * 60)
    print("정치인 출마직종(title) 업데이트 스크립트")
    print("=" * 60)

    # 1. 비어있는 title 확인
    empty_titles = check_empty_titles()

    print("\n" + "=" * 60)
    print("업데이트 시작")
    print("=" * 60)

    # 2. 정원오 업데이트
    success1 = update_politician_title(
        politician_id="17270f25",
        name="정원오",
        new_title="광역단체장"
    )

    # 3. 안태준 업데이트
    success2 = update_politician_title(
        politician_id="9dc9f3b4",
        name="안태준",
        new_title="기초의원"
    )

    print("\n" + "=" * 60)
    print("업데이트 완료")
    print("=" * 60)

    if success1 and success2:
        print("✅ 모든 업데이트가 성공적으로 완료되었습니다!")
    else:
        print("⚠️  일부 업데이트가 실패했습니다. 로그를 확인하세요.")

    # 4. 다시 확인
    print("\n" + "=" * 60)
    print("최종 확인")
    print("=" * 60)
    check_empty_titles()

if __name__ == "__main__":
    main()
