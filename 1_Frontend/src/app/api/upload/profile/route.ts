// P2BA8: Politician Data Seeding

import { NextRequest, NextResponse } from "next/server";

const generateMockPoliticians = (count: number) => {
  const parties = ["Democratic Party", "People Power", "Justice Party"];
  const positions = ["National Assembly", "Metropolitan Council", "Local Councilor"];
  const regions = ["Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Gyeonggi"];
  const names = [
    "Kim Min-jun", "Lee Seo-yeon", "Park Ji-hu", "Choi Ji-woo",
    "Jung Ha-eun", "Yun Seo-jun", "Jang Min-a", "Oh Ji-hoon",
    "Kang Myung-hwa", "Song Jun-ho"
  ];

  const politicians = [];
  for (let i = 0; i < Math.min(count, 50); i++) {
    politicians.push({
      id: "pol_" + (i + 1),
      name: names[i % names.length] + "_" + i,
      party: parties[i % parties.length],
      position: positions[i % positions.length],
      region: regions[i % regions.length],
      overall_ai_score: 60 + Math.random() * 40,
      member_rating: 3 + Math.random() * 2,
      member_count: Math.floor(100 + Math.random() * 1900),
      followers: Math.floor(100 + Math.random() * 2000),
      verified_at: new Date(2024, 0, 1 + (i % 365)).toISOString(),
      created_at: new Date().toISOString(),
    });
  }
  return politicians;
};

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const politicians = generateMockPoliticians(limit);

    return NextResponse.json(
      {
        success: true,
        message: "Politician data seeding completed",
        data: politicians,
        count: politicians.length,
        seeded_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = Math.min(body.count || 50, 50);
    const politicians = generateMockPoliticians(count);

    return NextResponse.json(
      {
        success: true,
        message: count + " politicians seeded successfully",
        data: politicians,
        count: politicians.length,
        seeded_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: true,
        message: "All seeded politician data cleared",
        deleted_count: 50,
        cleared_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
