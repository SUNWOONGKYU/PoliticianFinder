#!/usr/bin/env python3
import re

filepath = '1_Frontend/src/app/api/admin/users/route.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: GET function auth check (lines 17-23)
pattern1 = r'(export async function GET\(request: NextRequest\) \{\s+try \{\s+)// 관리자 권한 확인\s+const authResult = await requireAuth\(\);\s+if \(authResult instanceof NextResponse\) \{\s+return authResult;\s+\}\s+const \{ user \} = authResult;'
replacement1 = r'\1// 관리자 권한 확인 (개발 중 임시 비활성화)\n    // const authResult = await requireAuth();\n    // if (authResult instanceof NextResponse) {\n    //   return authResult;\n    // }\n    // const { user } = authResult;'

# Pattern 2: PATCH function auth check
pattern2 = r'(export async function PATCH\(request: NextRequest\) \{\s+try \{\s+)// 관리자 권한 확인\s+const authResult = await requireAuth\(\);\s+if \(authResult instanceof NextResponse\) \{\s+return authResult;\s+\}\s+const \{ user \} = authResult;'
replacement2 = r'\1// 관리자 권한 확인 (개발 중 임시 비활성화)\n    // const authResult = await requireAuth();\n    // if (authResult instanceof NextResponse) {\n    //   return authResult;\n    // }\n    // const { user } = authResult;'

# Pattern 3: DELETE function auth check
pattern3 = r'(export async function DELETE\(request: NextRequest\) \{\s+try \{\s+)// 관리자 권한 확인\s+const authResult = await requireAuth\(\);\s+if \(authResult instanceof NextResponse\) \{\s+return authResult;\s+\}\s+const \{ user \} = authResult;'
replacement3 = r'\1// 관리자 권한 확인 (개발 중 임시 비활성화)\n    // const authResult = await requireAuth();\n    // if (authResult instanceof NextResponse) {\n    //   return authResult;\n    // }\n    // const { user } = authResult;'

# Apply patterns
new_content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)
new_content = re.sub(pattern2, replacement2, new_content, flags=re.DOTALL)
new_content = re.sub(pattern3, replacement3, new_content, flags=re.DOTALL)

# Replace admin_id references
new_content = re.sub(r'admin_id: user\.id,', '// admin_id: user.id, // 개발 중 임시 비활성화', new_content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Admin users API 인증 체크 수정 완료!")
