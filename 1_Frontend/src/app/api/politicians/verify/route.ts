// P2BA4: 정치인 본인 인증 API (Real DB)
// Updated: 2025-11-17 - Mock 데이터 제거, 실제 DB 쿼리 사용

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const verifySchema = z.object({
  name: z.string().min(1),
  party: z.string().min(1),
  position: z.string().min(1),
});

type VerifyRequest = z.infer<typeof verifySchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifySchema.parse(body);

    const supabase = await createClient();

    // DB에서 정치인 정보 검증
    const { data: politician, error } = await supabase
      .from('politicians')
      .select('id, name, party, position, identity, region, district')
      .eq('name', validated.name)
      .eq('party', validated.party)
      .eq('position', validated.position)
      .single();

    if (error || !politician) {
      console.log('[정치인 본인 인증 API] 검증 실패:', validated);
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "정치인 정보가 일치하지 않습니다. 이름, 소속 정당, 직위를 확인해주세요.",
        },
        { status: 404 }
      );
    }

    console.log('[정치인 본인 인증 API] 검증 성공:', politician.name);

    return NextResponse.json(
      {
        success: true,
        verified: true,
        politician: {
          id: politician.id,
          name: politician.name,
          party: politician.party,
          position: politician.position,
          identity: politician.identity,
          region: politician.region,
          district: politician.district,
        },
        verified_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
