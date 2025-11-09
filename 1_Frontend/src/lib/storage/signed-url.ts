// Task ID: P4BA16
// Signed URL generation for secure PDF downloads

import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Create signed download URL for a report
 *
 * @param reportUrl - Public URL of the report (from ai_evaluations.report_url)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL for downloading the report
 */
export async function createSignedDownloadUrl(
  reportUrl: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();

  try {
    // Extract file path from the public URL
    // Expected format: https://xxx.supabase.co/storage/v1/object/public/reports/{politician_id}/{evaluation_id}.pdf
    const filePath = extractFilePathFromUrl(reportUrl);

    if (!filePath) {
      throw new Error('Invalid report URL format');
    }

    // Create signed URL from Supabase Storage
    const { data, error } = await supabase.storage
      .from('reports')
      .createSignedUrl(filePath, expiresIn, {
        download: true, // Force download instead of preview
      });

    if (error) {
      console.error('Failed to create signed URL:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned from Supabase');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed download URL:', error);
    throw error;
  }
}

/**
 * Extract file path from public URL
 *
 * @param publicUrl - Public URL from Supabase Storage
 * @returns File path relative to bucket root
 */
function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathname = url.pathname;

    // Pattern: /storage/v1/object/public/reports/{file_path}
    const match = pathname.match(/\/storage\/v1\/object\/public\/reports\/(.+)$/);

    if (match && match[1]) {
      return match[1];
    }

    // Alternative pattern if URL structure is different
    // Pattern: /reports/{file_path}
    const altMatch = pathname.match(/\/reports\/(.+)$/);
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

/**
 * Get download filename from evaluation
 *
 * @param politicianName - Politician name
 * @param evaluator - AI evaluator name
 * @param evaluationDate - Evaluation date
 * @returns Sanitized filename for download
 */
export function getDownloadFilename(
  politicianName: string,
  evaluator: string,
  evaluationDate: string
): string {
  // Sanitize politician name (remove special characters)
  const sanitizedName = politicianName
    .replace(/[^a-zA-Z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '_');

  // Format date as YYYY-MM-DD
  const formattedDate = new Date(evaluationDate).toISOString().split('T')[0];

  // Create filename
  return `${sanitizedName}_${evaluator}_평가리포트_${formattedDate}.pdf`;
}

/**
 * Verify report file exists in storage
 *
 * @param politicianId - Politician UUID
 * @param evaluationId - Evaluation UUID
 * @returns true if file exists
 */
export async function verifyReportExists(
  politicianId: string,
  evaluationId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const fileName = `${politicianId}/${evaluationId}.pdf`;

    // List files in the politician's folder
    const { data, error } = await supabase.storage
      .from('reports')
      .list(politicianId, {
        search: `${evaluationId}.pdf`,
      });

    if (error) {
      console.error('Error checking file existence:', error);
      return false;
    }

    return data ? data.length > 0 : false;
  } catch (error) {
    console.error('Error verifying report existence:', error);
    return false;
  }
}
