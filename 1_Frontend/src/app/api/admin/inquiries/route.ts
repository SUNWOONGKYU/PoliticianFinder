// Task ID: P3BA24
// Admin Inquiries Management API
// GET: Fetch all inquiries with filtering
// POST: Create new inquiry
// PATCH: Update inquiry status and admin response
// Updated: 2025-11-17 - requireAdmin() 추가 (GET, PATCH만)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendInquiryResponseEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth/helpers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/inquiries - 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("inquiries")
      .select(
        `
        *,
        user:users!inquiries_user_id_fkey(user_id, name, email),
        politician:politicians!inquiries_politician_id_fkey(id, name, party, position),
        admin:users!inquiries_admin_id_fkey(user_id, name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (priority && priority !== "all") {
      query = query.eq("priority", priority);
    }

    const { data: inquiries, error, count } = await query;

    if (error) {
      console.error("Error fetching inquiries:", error);
      return NextResponse.json(
        { error: "문의 목록을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      inquiries,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/admin/inquiries - 새 문의 생성 (from connection page)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const {
      email,
      politician_id,
      politician_name,
      title,
      content,
      priority = "normal",
    } = body;

    // Validation
    if (!email || !title || !content) {
      return NextResponse.json(
        { error: "이메일, 제목, 내용은 필수 항목입니다." },
        { status: 400 }
      );
    }

    // user_id can be passed in request or left null for anonymous inquiries
    const user_id = body.user_id || null;

    // Insert inquiry
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .insert({
        user_id,
        email,
        politician_id: politician_id || null,
        politician_name: politician_name || null,
        title,
        content,
        priority,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating inquiry:", error);
      return NextResponse.json(
        { error: "문의 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/inquiries - 문의 상태 및 답변 업데이트
export async function PATCH(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { inquiry_id, status, priority, admin_response } = body;

    if (!inquiry_id) {
      return NextResponse.json(
        { error: "문의 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (admin_response !== undefined) {
      updateData.admin_response = admin_response;
      updateData.admin_id = body.admin_id || null;
      updateData.responded_at = new Date().toISOString();
    }

    // Handle resolved status
    if (status === "resolved" && !updateData.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
    }

    // Update inquiry
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", inquiry_id)
      .select(
        `
        *,
        user:users!inquiries_user_id_fkey(user_id, name, email),
        politician:politicians!inquiries_politician_id_fkey(id, name, party, position),
        admin:users!inquiries_admin_id_fkey(user_id, name)
      `
      )
      .single();

    if (error) {
      console.error("Error updating inquiry:", error);
      return NextResponse.json(
        { error: "문의 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    // Send email notification if admin response was provided
    if (admin_response && inquiry.email) {
      const emailResult = await sendInquiryResponseEmail({
        to: inquiry.email,
        inquiryTitle: inquiry.title,
        inquiryContent: inquiry.content,
        adminResponse: admin_response,
        inquiryId: inquiry.id,
      });

      if (!emailResult.success) {
        console.error("Failed to send email, but inquiry was updated:", emailResult.error);
        // Don't fail the request if email fails - inquiry is already updated
      } else {
        console.log("Email notification sent successfully to:", inquiry.email);
      }
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
