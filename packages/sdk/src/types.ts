/**
 * ReturnGuard API Types & Request/Response Contracts
 */

export interface ReasonCode {
  feature: string;
  direction: string;
  shap_rank: number;
}

export interface ScorePayload {
  order_id?: string;
  transaction_id?: string;
  amount: number;
  channel?: string;
  customer_id?: string;
  device_id?: string;
  geo_region?: string;
  payment_method?: string;
  status?: string;
  merchant_id?: string;
  merchant_category?: string;
  timestamp?: string;
  account_created?: string;
  features?: Record<string, number>;
  prior_transactions?: Array<Record<string, unknown>>;
  ring_id?: string;
  force_unavailable?: boolean;
}

export interface ScoreResult {
  order_id: string;
  channel: string;
  risk_score: number;
  risk_score_100: number;
  tier: string;
  policy_rule: string;
  policy_action: string;
  severity: string;
  suggested_action: string;
  reason_codes: ReasonCode[];
  rule_hits: string[];
  ring_id?: string | null;
  model_version: string;
  dataset: string;
  threshold: number;
  model_status: string;
  feature_completeness: number;
  explanation_status: string;
  shadow: boolean;
  decision_id?: string | null;
}

export interface DecisionListParams {
  cursor?: string;
  limit?: number;
}

export interface DecisionListResponse {
  items: ScoreResult[];
  next_cursor: string | null;
  limit: number;
}

export interface ReviewItem {
  decision_id: string;
  order_id: string;
  risk_score: number;
  tier: string;
  policy_action: string;
  suggested_action: string;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
  reviewer?: string | null;
  notes?: string | null;
}

export interface ReviewsListParams {
  cursor?: string;
  limit?: number;
  status?: string;
}

export interface ReviewsListResponse {
  items: ReviewItem[];
  next_cursor: string | null;
  limit: number;
}

export interface ReviewSubmitPayload {
  decision_id: string;
  action: "approve" | "reject" | "escalate";
  notes?: string;
}

export interface ReviewSubmitResult {
  review_id: string;
  decision_id: string;
  action: string;
  status: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  tenant_id: string;
  total_decisions: number;
  allow_count: number;
  review_count: number;
  block_count: number;
  average_risk_score: number;
  total_volume_inr: number;
  high_risk_volume_inr: number;
  tier_distribution: Record<string, number>;
}

export interface ModelDatasetMetrics {
  dataset_name: string;
  auc_roc: number;
  auc_pr: number;
  precision: number;
  recall: number;
  f1_score: number;
  threshold: number;
  sample_count: number;
}

export interface ModelPerformance {
  model_version: string;
  synthetic: ModelDatasetMetrics;
  ieee_cis: ModelDatasetMetrics;
  active_dataset: string;
  honest_limits_note: string;
}

export interface AuditReconstructionData {
  decision: {
    decision_id: string;
    order_id: string;
    merchant_id?: string;
    channel: string;
    risk_score: number;
    tier: string;
    model_version: string;
    model_status: string;
    threshold: number;
    feature_completeness: number;
    explanation_status: string;
    shadow: boolean;
    created_at?: string | null;
  };
  policy_trace: {
    policy_rule: string;
    policy_action: string;
    suggested_action: string;
    severity: string;
    tier: string;
    threshold: number;
    rule_hits: string[];
  };
  shap_top_k: ReasonCode[];
  rule_hits: string[];
  feature_snapshot: Record<string, unknown>;
  relay_events: Array<{
    event_id: string;
    event_type: string;
    status: string;
    summary?: string | null;
    received_at?: string | null;
  }>;
}

export interface DecisionAuditReconstruction {
  status: string;
  data: AuditReconstructionData;
}
