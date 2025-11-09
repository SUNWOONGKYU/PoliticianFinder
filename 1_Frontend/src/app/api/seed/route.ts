// P2BA7: Election Commission Data Crawling

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const crawlRequestSchema = z.object({
  source: z.enum(["nec", "data_go_kr", "politician_info"]).optional(),
  limit: z.string().optional().default("100").transform(Number),
});

type CrawlRequest = z.infer<typeof crawlRequestSchema>;

const mockNECData = [
  {
    id: "nec-1",
    name: "Kim Min-jun",
    party: "Democratic Party",
    position: "National Assembly",
    region: "Seoul",
    district: "Gangnam-gu A",
    election_date: "2024-04-10",
    votes_received: 125000,
    vote_percentage: 45.2,
    elected: true,
    source: "nec",
  },
  {
    id: "nec-2",
    name: "Lee Seo-yeon",
    party: "People Power",
    position: "National Assembly",
    region: "Busan",
    district: "Haeundae-gu B",
    election_date: "2024-04-10",
    votes_received: 98000,
    vote_percentage: 38.5,
    elected: true,
    source: "nec",
  },
];

export async function GET(request: NextRequest) {
  try {
    const source = request.nextUrl.searchParams.get("source") || "nec";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100");

    return NextResponse.json(
      {
        success: true,
        source: "nec",
        data: mockNECData.slice(0, limit),
        count: mockNECData.length,
        metadata: {
          provider: "National Election Commission",
          last_update: new Date().toISOString(),
          records_imported: mockNECData.length,
        },
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
    const validated = crawlRequestSchema.parse(body);

    const crawlResult = {
      task_id: "crawl_" + Date.now(),
      status: "pending",
      source: validated.source || "nec",
      limit: validated.limit,
      started_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Crawling task started",
        data: crawlResult,
      },
      { status: 202 }
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

export async function PATCH(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get("task_id");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "task_id is required" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        task_id: taskId,
        status: "completed",
        verification: {
          total_records: 2,
          verified: 2,
          failed: 0,
          duplicate_removed: 0,
          last_update: new Date().toISOString(),
        },
        completed_at: new Date().toISOString(),
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
