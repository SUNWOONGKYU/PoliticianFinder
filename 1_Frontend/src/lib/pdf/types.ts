// Task ID: P4BA15
// PDF Report Types

import { Database } from '@/lib/database.types';

/**
 * Politician data for PDF report
 */
export interface PoliticianForReport {
  id: string;
  name: string;
  political_party_id: number | null;
  position_id: number | null;
  profile_image_url: string | null;
  bio: string | null;
}

/**
 * AI Evaluation data for PDF report
 */
export interface EvaluationForReport {
  id: string;
  politician_id: string;
  evaluation_date: string;
  overall_score: number;
  overall_grade: string;
  summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  detailed_analysis: DetailedAnalysis;
  ai_model_version: string | null;
}

/**
 * Detailed analysis structure
 */
export interface DetailedAnalysis {
  integrity_score: number;
  integrity_evidence: string;
  expertise_score: number;
  expertise_evidence: string;
  communication_score: number;
  communication_evidence: string;
  leadership_score: number;
  leadership_evidence: string;
  transparency_score: number;
  transparency_evidence: string;
  responsiveness_score: number;
  responsiveness_evidence: string;
  innovation_score: number;
  innovation_evidence: string;
  collaboration_score: number;
  collaboration_evidence: string;
  constituency_service_score: number;
  constituency_service_evidence: string;
  policy_impact_score: number;
  policy_impact_evidence: string;
}

/**
 * Historical evaluation for trend chart
 */
export interface EvaluationHistory {
  evaluation_date: string;
  overall_score: number;
  overall_grade: string;
}

/**
 * Criterion for rendering
 */
export interface CriterionData {
  name: string;
  nameKo: string;
  score: number;
  evidence: string;
}

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}
