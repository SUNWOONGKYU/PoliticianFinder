// GET /api/notices/[id] - 공지사항 단일 조회
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noticeId = params.id;

    if (!noticeId) {
      return NextResponse.json(
        { success: false, error: "공지사항 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .eq("id", noticeId)
      .single();

    if (error) {
      console.error("Error fetching notice:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "공지사항을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/notices/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/notices/[id] - 공지사항 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noticeId = params.id;
    const body = await request.json();

    if (!noticeId) {
      return NextResponse.json(
        { success: false, error: "공지사항 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { title, content } = body;

    if (!title && !content) {
      return NextResponse.json(
        { success: false, error: "수정할 내용이 없습니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const { data, error } = await supabase
      .from("notices")
      .update(updateData)
      .eq("id", noticeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating notice:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "공지사항을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "공지사항이 수정되었습니다.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PATCH /api/notices/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notices/[id] - 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noticeId = params.id;

    if (!noticeId) {
      return NextResponse.json(
        { success: false, error: "공지사항 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", noticeId);

    if (error) {
      console.error("Error deleting notice:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "공지사항이 삭제되었습니다.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DELETE /api/notices/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
