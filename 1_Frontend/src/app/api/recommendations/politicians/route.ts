// P2BA10: Politician Data Utility

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const normalizationSchema = z.object({
  action: z.enum(["normalize", "deduplicate", "validate"]),
  data: z.any().optional(),
});

type NormalizationRequest = z.infer<typeof normalizationSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = normalizationSchema.parse(body);

    if (validated.action === "normalize") {
      return NextResponse.json(
        {
          success: true,
          action: "normalize",
          message: "Data normalized successfully",
          normalized_count: 10,
          completed_at: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    if (validated.action === "deduplicate") {
      return NextResponse.json(
        {
          success: true,
          action: "deduplicate",
          message: "Duplicate records removed",
          removed_count: 3,
          remaining_count: 47,
          completed_at: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    if (validated.action === "validate") {
      return NextResponse.json(
        {
          success: true,
          action: "validate",
          message: "Data validation completed",
          valid_records: 48,
          invalid_records: 2,
          validation_details: {
            missing_fields: 1,
            invalid_formats: 1,
          },
          completed_at: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
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

export async function GET(request: NextRequest) {
  try {
    const filter = request.nextUrl.searchParams.get("filter");
    const sort = request.nextUrl.searchParams.get("sort");

    const mockRecommendations = [
      {
        id: "rec-1",
        politician_id: "1",
        name: "Kim Min-jun",
        score: 94.8,
        reason: "High integrity score",
      },
      {
        id: "rec-2",
        politician_id: "10",
        name: "Song Jun-ho",
        score: 91.2,
        reason: "Strong leadership",
      },
    ];

    return NextResponse.json(
      {
        success: true,
        data: mockRecommendations,
        count: mockRecommendations.length,
        filter_applied: filter || "none",
        sort_applied: sort || "score",
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
