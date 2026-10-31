/**
 * ReturnGuard Score Response contract and domain types
 * Mirrored from 02-architecture.md
 */

export type Channel = 'cod' | 'paypal';

export type Severity = 'none' | 'info' | 'warning' | 'critical';

export type SuggestedAction =
  | 'allow'
  | 'step_up_verify'
  | 'prefer_prepaid'
  | 'manual_review';

export interface ScoreResponse {
  order_id: string;
  channel: Channel;
  risk_score: number;
  severity: Severity;
  reason_codes: string[];
  rule_hits: string[];
  ring_id?: string | null;
  suggested_action: SuggestedAction;
  shadow: boolean;
  model_version: string;
}

export interface ScoreRequest {
  order_id: string;
}
