// Task ID: P4BA15
// Supabase Storage Upload Utilities for PDF Reports

import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Upload report PDF to Supabase Storage
 *
 * @param politicianId - Politician UUID
 * @param evaluationId - Evaluation UUID
 * @param pdfBuffer - PDF file buffer
 * @returns Public URL of uploaded PDF
 */
export async function uploadReportPDF(
  politicianId: string,
  evaluationId: string,
  pdfBuffer: Buffer
): Promise<string> {
  const supabase = createClient();

  // Construct file path: reports/{politician_id}/{evaluation_id}.pdf
  const fileName = `${politicianId}/${evaluationId}.pdf`;

  try {
    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
        cacheControl: '604800', // Cache for 7 days
      });

    if (uploadError) {
      console.error('Failed to upload PDF to storage:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL');
    }

    const publicUrl = urlData.publicUrl;

    // 3. Update ai_evaluations table with report_url
    // Note: This assumes report_url column exists in ai_evaluations table
    // If the column doesn't exist, it should be added via migration
    const { error: updateError } = await supabase
      .from('ai_evaluations')
      .update({
        report_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', evaluationId);

    if (updateError) {
      // Log warning but don't fail - the file is already uploaded
      console.warn('Failed to update ai_evaluations.report_url:', updateError);
      // We'll still return the public URL
    }

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadReportPDF:', error);
    throw error;
  }
}

/**
 * Delete report PDF from Supabase Storage
 *
 * @param politicianId - Politician UUID
 * @param evaluationId - Evaluation UUID
 */
export async function deleteReportPDF(
  politicianId: string,
  evaluationId: string
): Promise<void> {
  const supabase = createClient();

  const fileName = `${politicianId}/${evaluationId}.pdf`;

  const { error } = await supabase.storage.from('reports').remove([fileName]);

  if (error) {
    console.error('Failed to delete PDF from storage:', error);
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

/**
 * Check if report PDF exists
 *
 * @param politicianId - Politician UUID
 * @param evaluationId - Evaluation UUID
 * @returns true if file exists
 */
export async function reportPDFExists(
  politicianId: string,
  evaluationId: string
): Promise<boolean> {
  const supabase = createClient();

  const fileName = `${politicianId}/${evaluationId}.pdf`;

  const { data, error } = await supabase.storage.from('reports').list(politicianId, {
    search: `${evaluationId}.pdf`,
  });

  if (error) {
    console.error('Failed to check PDF existence:', error);
    return false;
  }

  return data ? data.length > 0 : false;
}

/**
 * Get public URL for existing report PDF
 *
 * @param politicianId - Politician UUID
 * @param evaluationId - Evaluation UUID
 * @returns Public URL or null if not found
 */
export async function getReportPDFUrl(
  politicianId: string,
  evaluationId: string
): Promise<string | null> {
  const supabase = createClient();

  const exists = await reportPDFExists(politicianId, evaluationId);
  if (!exists) {
    return null;
  }

  const fileName = `${politicianId}/${evaluationId}.pdf`;
  const { data } = supabase.storage.from('reports').getPublicUrl(fileName);

  return data?.publicUrl || null;
}

/**
 * Create reports bucket if it doesn't exist
 * This should be run during setup/initialization
 */
export async function ensureReportsBucketExists(): Promise<void> {
  const supabase = createClient();

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Failed to list buckets:', listError);
    throw new Error(`Failed to check buckets: ${listError.message}`);
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === 'reports');

  if (!bucketExists) {
    // Create bucket
    const { error: createError } = await supabase.storage.createBucket('reports', {
      public: true, // Make bucket public so PDFs can be accessed via URL
      fileSizeLimit: 10485760, // 10MB max file size
      allowedMimeTypes: ['application/pdf'],
    });

    if (createError) {
      console.error('Failed to create reports bucket:', createError);
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }

    console.log('Successfully created reports bucket');
  }
}
