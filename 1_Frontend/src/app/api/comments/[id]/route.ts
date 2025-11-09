// P3BA5: 댓글 수정/삭제 API

import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/comments/{id}
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    return NextResponse.json(
      {
        success: true,
        data: { commentId: params.id, ...body, updatedAt: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/comments/{id}
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json(
      {
        success: true,
        data: { commentId: params.id },
        message: '댓글이 삭제되었습니다.',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
