// P1BA2: Mock API - 정치인
// POST /api/politicians/[id]/verify - 정치인 본인인증 (Supabase 연동)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const verifySchema = z.object({
  name: z.string().min(1),
  party: z.string().min(1),
  position: z.string().min(1),
  verificationCode: z.string().optional(),
});

type VerifyRequest = z.infer<typeof verifySchema>;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const validated = verifySchema.parse(body);

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 정치인 정보 검증 (DB에서 검증)
    const { data: politician, error } = await supabase
      .from("politicians")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !politician) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "정치인을 찾을 수 없습니다",
        },
        { status: 404 }
      );
    }

    // 정치인 정보 일치 여부 확인
    const isMatch =
      politician.name === validated.name &&
      politician.party === validated.party &&
      politician.position === validated.position;

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "정치인 정보가 일치하지 않습니다",
        },
        { status: 404 }
      );
    }

    // Mock: 본인인증 성공 시뮬레이션
    // 실제로는 이름, 생년월일, 전화번호, 인증코드를 검증해야 함
    const isVerificationSuccess =
      !validated.verificationCode || validated.verificationCode === "123456";

    if (!isVerificationSuccess) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "인증 코드가 올바르지 않습니다",
        },
        { status: 401 }
      );
    }

    // 검증 성공 시 DB 업데이트
    const verifiedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("politicians")
      .update({ verified_at: verifiedAt })
      .eq("id", id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
    }

    return NextResponse.json(
      {
        success: true,
        verified: true,
        politician: {
          id: politician.id,
          name: politician.name,
          party: politician.party,
          position: politician.position,
        },
        verified_at: verifiedAt,
        message: "본인인증이 완료되었습니다",
        claimToken: `claim-token-${id}-${Date.now()}`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, verified: false, error: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/politicians/[id]/verify error:", error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
