// Task ID: P4BA16
// Payment verification library for report downloads

import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Payment verification result
 */
export interface PaymentVerificationResult {
  verified: boolean;
  paymentId?: string;
  message?: string;
}

/**
 * Payment metadata interface
 */
interface PaymentMetadata {
  politician_id: string;
  politician_name: string;
  evaluators: string[];
  purchased_all: boolean;
}

/**
 * Verify if user has paid for the report
 *
 * @param userId - User UUID
 * @param evaluationId - Evaluation UUID
 * @returns Verification result with payment ID if verified
 */
export async function verifyPayment(
  userId: string,
  evaluationId: string
): Promise<PaymentVerificationResult> {
  const supabase = createClient();

  try {
    // 1. Fetch evaluation info to check politician_id and evaluator
    const { data: evaluation, error: evaluationError } = await supabase
      .from('ai_evaluations')
      .select('politician_id, evaluator')
      .eq('id', evaluationId)
      .single();

    if (evaluationError || !evaluation) {
      return {
        verified: false,
        message: '평가 정보를 찾을 수 없습니다',
      };
    }

    // 2. Fetch user's completed payments for this politician
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, metadata, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Failed to fetch payments:', paymentsError);
      return {
        verified: false,
        message: '결제 정보 조회 중 오류가 발생했습니다',
      };
    }

    if (!payments || payments.length === 0) {
      return {
        verified: false,
        message: '결제 이력이 없습니다',
      };
    }

    // 3. Check if any payment covers this evaluation
    for (const payment of payments) {
      const metadata = payment.metadata as unknown as PaymentMetadata;

      // Check if payment is for the same politician
      if (metadata?.politician_id !== evaluation.politician_id) {
        continue;
      }

      // Check if purchased all evaluators
      if (metadata?.purchased_all === true) {
        return {
          verified: true,
          paymentId: payment.id,
        };
      }

      // Check if purchased this specific evaluator
      if (
        evaluation.evaluator &&
        metadata?.evaluators &&
        metadata.evaluators.includes(evaluation.evaluator)
      ) {
        return {
          verified: true,
          paymentId: payment.id,
        };
      }
    }

    // 4. No matching payment found
    return {
      verified: false,
      message: '이 리포트에 대한 구매 이력이 없습니다',
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      verified: false,
      message: '결제 검증 중 오류가 발생했습니다',
    };
  }
}

/**
 * Check download count for a user and evaluation
 *
 * @param userId - User UUID
 * @param evaluationId - Evaluation UUID
 * @param maxDownloads - Maximum allowed downloads (default: 10)
 * @returns Download count and whether limit is exceeded
 */
export async function checkDownloadLimit(
  userId: string,
  evaluationId: string,
  maxDownloads: number = 10
): Promise<{
  count: number;
  limitExceeded: boolean;
  remaining: number;
}> {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from('download_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId);

    if (error) {
      console.error('Failed to check download count:', error);
      throw error;
    }

    const downloadCount = count || 0;
    const limitExceeded = downloadCount >= maxDownloads;
    const remaining = Math.max(0, maxDownloads - downloadCount);

    return {
      count: downloadCount,
      limitExceeded,
      remaining,
    };
  } catch (error) {
    console.error('Error checking download limit:', error);
    throw error;
  }
}

/**
 * Record download history
 *
 * @param userId - User UUID
 * @param evaluationId - Evaluation UUID
 * @param paymentId - Payment UUID
 * @param ipAddress - User IP address (optional)
 * @param userAgent - User agent string (optional)
 */
export async function recordDownload(
  userId: string,
  evaluationId: string,
  paymentId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('download_history').insert({
      user_id: userId,
      evaluation_id: evaluationId,
      payment_id: paymentId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error('Failed to record download:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error recording download:', error);
    throw error;
  }
}
