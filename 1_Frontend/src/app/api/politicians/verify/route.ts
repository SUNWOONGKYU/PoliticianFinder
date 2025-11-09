// P2BA4: 정치인 본인 인증 API

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  name: z.string().min(1),
  party: z.string().min(1),
  position: z.string().min(1),
});

type VerifyRequest = z.infer<typeof verifySchema>;

// Mock 정치인 데이터 (검증용)
const mockPoliticians = [
  { name: "김민준", party: "더불어민주당", position: "국회의원" },
  { name: "이서연", party: "국민의힘", position: "국회의원" },
  { name: "박지후", party: "정의당", position: "광역의원" },
  { name: "최지우", party: "더불어민주당", position: "국회의원" },
  { name: "정하은", party: "국민의힘", position: "기초의원" },
  { name: "윤서준", party: "더불어민주당", position: "광역의원" },
  { name: "장민아", party: "국민의힘", position: "기초단체장" },
  { name: "오지훈", party: "정의당", position: "국회의원" },
  { name: "강명화", party: "더불어민주당", position: "국회의원" },
  { name: "송준호", party: "국민의힘", position: "광역단체장" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = verifySchema.parse(body);

    // 정치인 정보 검증 (실제로는 DB에서 검증)
    const politician = mockPoliticians.find(
      (p) =>
        p.name === validated.name &&
        p.party === validated.party &&
        p.position === validated.position
    );

    if (!politician) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Politician information does not match our records",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        verified: true,
        politician: {
          name: politician.name,
          party: politician.party,
          position: politician.position,
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
