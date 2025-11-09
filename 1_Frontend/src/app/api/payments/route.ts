// P1BA4: Mock API - 기타 (결제 API - 정치인 검증 및 결제 처리 포함)
// Supabase 연동 - 결제 데이터 관리

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock User UUID for testing
const MOCK_USER_ID = '7f61567b-bbdf-427a-90a9-0ee060ef4595';

const paymentSchema = z.object({
  user_id: z.string().uuid().optional(),
  politician_id: z.string().uuid(),
  amount: z.number().min(1000),
  payment_method: z.enum(["credit_card", "bank_transfer", "paypal"]),
  verified_politician: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const payment = paymentSchema.parse({
      ...body,
      user_id: body.user_id || MOCK_USER_ID,
    });

    // 정치인 검증 확인
    const { data: politician, error: politicianError } = await supabase
      .from('politicians')
      .select('id, name, verified_at')
      .eq('id', payment.politician_id)
      .single();

    if (politicianError || !politician) {
      return NextResponse.json(
        { success: false, error: "정치인을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 검증된 정치인인지 확인 (verified_at이 null이 아닌 경우)
    if (!politician.verified_at && payment.verified_politician) {
      return NextResponse.json(
        { success: false, error: "정치인이 검증되지 않았습니다" },
        { status: 400 }
      );
    }

    // 결제 생성
    const transaction_id = `txn_${Math.random().toString(36).substring(2, 15)}`;
    const { data: newPayment, error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: payment.user_id,
        politician_id: payment.politician_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        status: 'completed',
        transaction_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "결제 처리 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newPayment,
          politician_name: politician.name
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/payments error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const user_id = request.nextUrl.searchParams.get("user_id") || MOCK_USER_ID;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from('payments')
      .select('*, politicians(name, party, position)', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: "결제 내역 조회 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        pagination: { page, limit, total, totalPages },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
