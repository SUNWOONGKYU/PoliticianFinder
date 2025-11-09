// P3BA4: Real API - Payment Statistics (Supabase Integration)
// 결제 통계 API - 실시간 Supabase 데이터 연동

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 모든 결제 데이터 가져오기
    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, created_at, status');

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: '결제 통계 조회 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    const allPayments = payments || [];

    // 총 결제 금액 (완료된 결제만)
    const completedPayments = allPayments.filter(p => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 총 거래 건수
    const totalTransactions = completedPayments.length;

    // 평균 결제 금액
    const averageAmount = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // 이번 달 결제 금액
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyPayments = completedPayments.filter(p => {
      const paymentDate = new Date(p.created_at);
      return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 일별 결제 통계 (최근 30일)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentPayments = completedPayments.filter(p =>
      new Date(p.created_at) >= thirtyDaysAgo
    );

    // 일별로 그룹화
    const dailyStats: Record<string, { date: string; revenue: number; count: number }> = {};

    recentPayments.forEach(payment => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, revenue: 0, count: 0 };
      }
      dailyStats[date].revenue += payment.amount;
      dailyStats[date].count += 1;
    });

    const dailyData = Object.values(dailyStats).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        averageAmount,
        monthlyRevenue,
        dailyStats: dailyData,
      },
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('GET /api/statistics/payments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
