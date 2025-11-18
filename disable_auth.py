#!/usr/bin/env python3
import re
import sys

# Admin API 파일들
files = [
    '1_Frontend/src/app/api/admin/users/route.ts',
    '1_Frontend/src/app/api/notifications/route.ts',
]

auth_check_pattern = r'''(\s+)(// 관리자 권한 확인|// 사용자 인증)
(\s+)const authResult = await requireAuth\(\);
(\s+)if \(authResult instanceof NextResponse\) \{
(\s+)return authResult;
(\s+)\}
(\s+)const \{ user \} = authResult;'''

auth_check_replacement = r'''\1// 관리자 권한 확인 (개발 중 임시 비활성화)
\3// const authResult = await requireAuth();
\4// if (authResult instanceof NextResponse) {
\5//   return authResult;
\6// }
\7// const { user } = authResult;'''

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace all auth checks
        new_content = re.sub(auth_check_pattern, auth_check_replacement, content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ {filepath}: 인증 체크 주석 처리 완료")
        else:
            print(f"⏭️  {filepath}: 변경 사항 없음 (이미 주석 처리됨)")
    except FileNotFoundError:
        print(f"❌ {filepath}: 파일을 찾을 수 없습니다")
    except Exception as e:
        print(f"❌ {filepath}: 오류 발생 - {e}")

print("\n✅ 모든 파일 처리 완료!")
