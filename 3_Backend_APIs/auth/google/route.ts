/**
 * P1BA3: Google OAuth Integration
 * 작업일: 2025-11-03
 * 설명: Google OAuth 인증 엔드포인트
 * GET/POST /api/auth/google
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, ERROR_CODES, supabaseClient } from '@/infrastructure/core';
import { errorHandler, Logger } from '@/infrastructure/error-handling';

/**
 * Google OAuth 리다이렉트 URI 구성
 */
function getGoogleOAuthRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/google/callback`;
}

/**
 * Google OAuth URL 생성
 */
function getGoogleAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getGoogleOAuthRedirectUri();

  if (!clientId) {
    throw new Error('Google Client ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * GET /api/auth/google - Google OAuth 시작
 */
async function handleGet(req: NextRequest) {
  const logger = Logger.getInstance();

  try {
    const authUrl = getGoogleAuthUrl();
    logger.info('Google OAuth initiated', { redirectUri: getGoogleOAuthRedirectUri() });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Google OAuth initiation failed', error as Error);

    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to initiate Google OAuth',
      500
    );
  }
}

/**
 * POST /api/auth/google/callback - Google OAuth 콜백 처리
 */
async function handlePost(req: NextRequest) {
  const logger = Logger.getInstance();

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Authorization code is required',
        400
      );
    }

    // TODO: Exchange authorization code for tokens
    // This requires backend-to-backend communication with Google OAuth servers
    // Implementation would depend on your specific setup

    logger.info('Google OAuth callback received', { code: code.substring(0, 10) + '...' });

    return createSuccessResponse(
      {
        message: 'Google OAuth callback processed',
        status: 'pending_implementation',
      },
      200
    );
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Google OAuth callback failed', error as Error);

    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to process Google OAuth callback',
      500
    );
  }
}

/**
 * Handler wrapper
 */
async function handler(req: NextRequest) {
  if (req.method === 'GET') {
    return handleGet(req);
  } else if (req.method === 'POST') {
    return handlePost(req);
  } else {
    return createErrorResponse(
      ERROR_CODES.INVALID_REQUEST,
      'Method not allowed',
      405
    );
  }
}

export const GET = errorHandler(handleGet);
export const POST = errorHandler(handlePost);

/**
 * Google OAuth 콜백 엔드포인트
 */
export async function getCallback(code: string, state?: string) {
  const logger = Logger.getInstance();

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getGoogleOAuthRedirectUri();

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const googleUser = await userInfoResponse.json();

    // Create or update user in Supabase
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error('Database error');
    }

    if (!profile) {
      // Create new user
      const { data: newUser, error: createError } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: googleUser.id,
          email: googleUser.email,
          nickname: googleUser.name || googleUser.email.split('@')[0],
          full_name: googleUser.name,
          avatar_url: googleUser.picture,
          is_verified: true,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      logger.info('New Google OAuth user created', { email: googleUser.email });
    } else {
      logger.info('Existing Google OAuth user logged in', { email: googleUser.email });
    }

    return {
      success: true,
      user: profile || { email: googleUser.email, nickname: googleUser.name },
      tokens,
    };
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Google OAuth callback processing failed', error as Error);
    throw error;
  }
}
