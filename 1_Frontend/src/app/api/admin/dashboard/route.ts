// P1BA4: Mock API - 기타 (Admin Dashboard API - 대시보드 및 감시)
// Supabase 연동 - 관리자 대시보드 통계 및 활동 데이터
// Updated: 2025-11-17 - requireAdmin() 추가

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/helpers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 병렬로 모든 통계 데이터 가져오기
    const [
      usersResult,
      postsResult,
      commentsResult,
      paymentsResult,
      inquiriesResult,
      auditLogsResult
    ] = await Promise.all([
      // 전체 사용자 수
      supabase.from('users').select('user_id', { count: 'exact', head: true }),
      // 전체 게시물 수
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      // 전체 댓글 수
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      // 전체 결제 금액 및 건수
      supabase.from('payments').select('amount'),
      // 대기 중인 문의 수
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      // 최근 감사 로그
      supabase.from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // 최근 활동 가져오기 (게시물, 댓글, 결제 등을 하나의 타임라인으로)
    const recentActivities: Array<{
      id: string;
      type: string;
      user_name: string;
      description: string;
      timestamp: string;
    }> = [];

    // 최근 게시물
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, title, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentPosts) {
      recentActivities.push(
        ...recentPosts.map(post => ({
          id: `post-${post.id}`,
          type: '게시글',
          user_name: '회원',
          description: `님이 새 게시글을 작성했습니다: ${post.title?.substring(0, 30) || '제목 없음'}`,
          timestamp: post.created_at,
        }))
      );
    }

    // 최근 결제
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('id, amount, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentPayments) {
      recentActivities.push(
        ...recentPayments.map(payment => ({
          id: `payment-${payment.id}`,
          type: '결제',
          user_name: '회원',
          description: `님이 결제를 완료했습니다: ${(payment.amount || 0).toLocaleString()}원`,
          timestamp: payment.created_at,
        }))
      );
    }

    // 최근 문의
    const { data: recentInquiries } = await supabase
      .from('inquiries')
      .select('id, title, created_at, email')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentInquiries) {
      recentActivities.push(
        ...recentInquiries.map(inquiry => ({
          id: `inquiry-${inquiry.id}`,
          type: '문의',
          user_name: inquiry.email?.split('@')[0] || '익명',
          description: `님이 문의를 접수했습니다: ${inquiry.title?.substring(0, 30) || '제목 없음'}`,
          timestamp: inquiry.created_at,
        }))
      );
    }

    // 최근 회원가입
    const { data: recentUsers } = await supabase
      .from('users')
      .select('user_id, nickname, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentUsers) {
      recentActivities.push(
        ...recentUsers.map(user => ({
          id: `user-${user.user_id}`,
          type: '회원',
          user_name: user.nickname || '새 회원',
          description: '님이 회원가입했습니다.',
          timestamp: user.created_at,
        }))
      );
    }

    // 타임스탬프로 정렬
    recentActivities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // 결제 총액 계산
    const totalPayments = paymentsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const dashboard = {
      total_users: usersResult.count || 0,
      total_posts: postsResult.count || 0,
      total_comments: commentsResult.count || 0,
      total_payments: totalPayments,
      recent_activity: recentActivities.slice(0, 10),
      moderation_queue: 0, // 승인 대기 게시물 (필요시 구현)
      pending_reports: inquiriesResult.count || 0, // 대기 중인 문의 수
      warnings_issued: 0, // 경고 발행 수 (필요시 구현)
      audit_logs: auditLogsResult.data || [],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: dashboard }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
