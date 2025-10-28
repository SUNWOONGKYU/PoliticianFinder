/**
 * P5B1: Feedback API
 *
 * Collects user feedback for application improvements
 * POST /api/feedback - Submit user feedback
 *
 * Features:
 * - Rate limiting for spam prevention
 * - Optional authentication (anonymous feedback allowed)
 * - Validates feedback type and content
 * - Logs feedback for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface FeedbackRequest {
  type: 'bug' | 'feature' | 'improvement' | 'other';
  subject: string;
  message: string;
  page_url?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback_id?: string;
  error?: string;
}

/**
 * POST /api/feedback
 * Submit user feedback
 */
export async function POST(request: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Get user (optional - allow anonymous feedback)
    const { data: { user } } = await supabase.auth.getUser();

    // Rate limiting - stricter for anonymous users
    const identifier = user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = await applyRateLimit(
      request,
      user ? 'userAction' : 'strictAction',
      identifier
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Parse request body
    const body: FeedbackRequest = await request.json();
    const { type, subject, message, page_url, metadata } = body;

    // Validation
    if (!type || !['bug', 'feature', 'improvement', 'other'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid feedback type. Must be: bug, feature, improvement, or other'
        },
        { status: 400 }
      );
    }

    if (!subject || subject.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Subject must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Collect additional context
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || page_url || 'unknown';

    // Insert feedback into database
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id || null,
        type,
        subject: subject.trim(),
        message: message.trim(),
        page_url: referer,
        user_agent: userAgent,
        metadata: metadata || {},
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Failed to insert feedback', {
        endpoint: '/api/feedback',
        method: 'POST',
        userId: user?.id,
        errorCode: 'FEEDBACK_INSERT_ERROR',
        statusCode: 500,
        metadata: {
          error: insertError.message,
          type,
          subject
        }
      });

      return NextResponse.json(
        { success: false, error: 'Failed to submit feedback. Please try again.' },
        { status: 500 }
      );
    }

    // Log successful feedback submission
    logger.info('Feedback submitted successfully', {
      endpoint: '/api/feedback',
      method: 'POST',
      userId: user?.id,
      duration: Date.now() - startTime,
      metadata: {
        feedback_id: feedback.id,
        type,
        subject,
        is_authenticated: !!user
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your feedback!',
        feedback_id: feedback.id
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('POST /api/feedback error', {
      endpoint: '/api/feedback',
      method: 'POST',
      errorCode: 'FEEDBACK_ERROR',
      statusCode: 500,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: {
        message: errorMessage
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * Retrieve feedback list (admin only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      logger.warn('Unauthorized feedback access attempt', {
        endpoint: '/api/feedback',
        method: 'GET',
        userId: user.id,
        errorCode: 'FORBIDDEN',
        statusCode: 403
      });

      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type && ['bug', 'feature', 'improvement', 'other'].includes(type)) {
      query = query.eq('type', type);
    }

    if (status && ['new', 'in_progress', 'resolved', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch feedback', {
        endpoint: '/api/feedback',
        method: 'GET',
        userId: user.id,
        errorCode: 'FEEDBACK_FETCH_ERROR',
        metadata: { error: error.message }
      });

      return NextResponse.json(
        { success: false, error: 'Failed to retrieve feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    logger.error('GET /api/feedback error', {
      endpoint: '/api/feedback',
      method: 'GET',
      errorCode: 'FEEDBACK_ERROR',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { success: false, error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
