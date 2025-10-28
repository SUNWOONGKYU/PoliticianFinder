export interface BetaTester {
  id: string;
  email: string;
  name: string;
  invite_code: string;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  feedback_count: number;
  created_at: string;
}

export interface BetaInviteRequest {
  email: string;
  name: string;
}

export interface BetaInviteResponse {
  invite_code: string;
  expires_at: string;
}
