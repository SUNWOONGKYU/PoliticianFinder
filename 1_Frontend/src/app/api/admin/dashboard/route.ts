// P1BA4: Mock API - 기타 (Admin Dashboard API - 대시보드 및 감시)
// Supabase 연동 - 관리자 대시보드 통계 및 활동 데이터
// Updated: 2026-01-14 - 보안 강화: JWT + DB role 검증 추가
// Updated: 2026-01-19 - 보안 강화: 구조화된 로깅 시스템 적용

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logger, logApiError } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    // 1. 세션 검증
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 관리자 역할 확인 (DB에서)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 3. 관리자 권한 확인 완료 - Service Role 클라이언트 사용
    const adminClient = createAdminClient();

    // 병렬로 모든 통계 데이터 가져오기
    const [
      usersResult,
      postsResult,
      commentsResult,
      paymentsResult,
      paymentsCountResult,
      inquiriesResult,
      auditLogsResult,
      noticesResult
    ] = await Promise.all([
      // 전체 사용자 수
      adminClient.from('users').select('user_id', { count: 'exact', head: true }),
      // 전체 게시물 수
      adminClient.from('posts').select('id', { count: 'exact', head: true }),
      // 전체 댓글 수
      adminClient.from('comments').select('id', { count: 'exact', head: true }),
      // 전체 결제 금액
      adminClient.from('payments').select('amount'),
      // 전체 결제 건수
      adminClient.from('payments').select('id', { count: 'exact', head: true }),
      // 대기 중인 문의 수
      adminClient.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      // 최근 감사 로그
      adminClient.from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      // 최근 공지사항 (상위 3개)
      adminClient.from('notices')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
    ]) as any;

    // 최근 활동 가져오기 (게시물, 댓글, 결제 등을 하나의 타임라인으로)
    const recentActivities: Array<{
      id: string;
      type: string;
      user_name: string;
      description: string;
      timestamp: string;
    }> = [];

    // 최근 게시물
    const { data: recentPosts } = await adminClient
      .from('posts')
      .select('id, title, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5) as any;

    if (recentPosts) {
      recentActivities.push(
        ...recentPosts.map((post: any) => ({
          id: `post-${post.id}`,
          type: '게시글',
          user_name: '회원',
          description: `님이 새 게시글을 작성했습니다: ${post.title?.substring(0, 30) || '제목 없음'}`,
          timestamp: post.created_at,
        }))
      );
    }

    // 최근 결제
    const { data: recentPayments } = await adminClient
      .from('payments')
      .select('id, amount, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5) as any;

    if (recentPayments) {
      recentActivities.push(
        ...recentPayments.map((payment: any) => ({
          id: `payment-${payment.id}`,
          type: '결제',
          user_name: '회원',
          description: `님이 결제를 완료했습니다: ${(payment.amount || 0).toLocaleString()}원`,
          timestamp: payment.created_at,
        }))
      );
    }

    // 최근 문의
    const { data: recentInquiries } = await adminClient
      .from('inquiries')
      .select('id, title, created_at, email')
      .order('created_at', { ascending: false })
      .limit(5) as any;

    if (recentInquiries) {
      recentActivities.push(
        ...recentInquiries.map((inquiry: any) => ({
          id: `inquiry-${inquiry.id}`,
          type: '문의',
          user_name: inquiry.email?.split('@')[0] || '익명',
          description: `님이 문의를 접수했습니다: ${inquiry.title?.substring(0, 30) || '제목 없음'}`,
          timestamp: inquiry.created_at,
        }))
      );
    }

    // 최근 회원가입
    const { data: recentUsers } = await adminClient
      .from('users')
      .select('user_id, nickname, created_at')
      .order('created_at', { ascending: false })
      .limit(5) as any;

    if (recentUsers) {
      recentActivities.push(
        ...recentUsers.map((user: any) => ({
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
    const totalPaymentsAmount = paymentsResult.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
    const totalPaymentsCount = paymentsCountResult.count || 0;

    // 공지사항 포맷팅
    const notices = (noticesResult.data || []).map((notice: any) => ({
      id: notice.id,
      title: notice.title,
      created_at: notice.created_at
    }));

    const dashboard = {
      total_users: usersResult.count || 0,
      total_posts: postsResult.count || 0,
      total_comments: commentsResult.count || 0,
      total_payments_amount: totalPaymentsAmount, // 총 결제 금액
      total_payments_count: totalPaymentsCount,   // 총 결제 건수
      recent_activity: recentActivities.slice(0, 10),
      moderation_queue: 0, // 승인 대기 게시물 (필요시 구현)
      pending_reports: inquiriesResult.count || 0, // 대기 중인 문의 수
      warnings_issued: 0, // 경고 발행 수 (필요시 구현)
      audit_logs: auditLogsResult.data || [],
      notices: notices, // 최근 공지사항
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: dashboard }, { status: 200 });
  } catch (error) {
    logApiError('GET', '/api/admin/dashboard', error);
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
