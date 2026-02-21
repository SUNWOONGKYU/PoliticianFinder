import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// DELETE: 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const noticeId = params.id;

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', noticeId);

    if (error) {
      console.error('Notice delete error:', error);
      return NextResponse.json(
        { success: false, error: '공지사항 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Notice DELETE API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
