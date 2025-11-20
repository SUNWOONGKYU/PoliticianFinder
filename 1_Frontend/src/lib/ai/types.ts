// Task ID: P4BA14
// AI Evaluation Types

/**
 * AI Model Identifiers (3 models: Claude, ChatGPT, Grok)
 */
export type AIModel = 'claude' | 'chatgpt' | 'grok';

/**
 * Evaluation Criteria Names (10 criteria)
 */
export type CriteriaName =
  | 'integrity'
  | 'expertise'
  | 'communication'
  | 'leadership'
  | 'transparency'
  | 'responsiveness'
  | 'innovation'
  | 'collaboration'
  | 'constituency_service'
  | 'policy_impact';

/**
 * Single Criterion Evaluation
 */
export interface CriterionEvaluation {
  score: number; // 0-100
  evidence: string; // 3,000+ characters in Korean
}

/**
 * Complete Evaluation Criteria (10 items)
 */
export interface EvaluationCriteria {
  integrity: CriterionEvaluation;
  expertise: CriterionEvaluation;
  communication: CriterionEvaluation;
  leadership: CriterionEvaluation;
  transparency: CriterionEvaluation;
  responsiveness: CriterionEvaluation;
  innovation: CriterionEvaluation;
  collaboration: CriterionEvaluation;
  constituency_service: CriterionEvaluation;
  policy_impact: CriterionEvaluation;
}

/**
 * Politician Data for Evaluation
 */
export interface PoliticianEvaluationData {
  id: string;
  name: string;
  party: string;
  position: string;
  region: string;
  bio?: string;
  recentActivities?: string[];
  pledges?: Array<{
    title: string;
    description: string;
    status: string;
  }>;
  newsArticles?: Array<{
    title: string;
    summary: string;
    url: string;
  }>;
}

/**
 * AI Evaluation Result
 */
export interface AIEvaluationResult {
  overall_score: number;
  overall_grade: string;
  criteria: EvaluationCriteria;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  sources: string[];
}

/**
 * Database Evaluation Record
 */
export interface DatabaseEvaluation {
  id?: string;
  politician_id: string;
  evaluation_date: string;
  overall_score: number;
  overall_grade: string;
  pledge_completion_rate: number;
  activity_score: number;
  controversy_score: number;
  public_sentiment_score: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  detailed_analysis: {
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
  };
  sources: string[];
  ai_model_version: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * AI Client Configuration
 */
export interface AIClientConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}
