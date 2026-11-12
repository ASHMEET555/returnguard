/**
 * ReturnGuard API Types & Request/Response Contracts
 */

export interface ReasonCode {
  feature: string;
  direction: string;
  shap_rank: number;
}

/**
 * Line item representation for order context and risk evaluation.
 *
 * MONETARY INPUT CONTRACT & COMPATIBILITY BEHAVIOR:
 * 1. Monetary decimal strings (e.g. "0.10", "1234.56", "99999999999999999.99") are the
 *    canonical representation for unit_price and total_amount.
 * 2. Non-integer JavaScript Numbers (e.g. 0.1, 0.1 + 0.2, 1.005) are strictly REJECTED
 *    to prevent IEEE-754 floating-point inaccuracies from silently corrupting exact arithmetic.
 * 3. Unsafe integer Numbers (exceeding Number.MAX_SAFE_INTEGER, NaN, Infinity) are REJECTED.
 * 4. Validated safe integer Numbers (e.g. 100, 0) are accepted temporarily for backward compatibility.
 * 5. Quantity accepts validated safe integer numbers (e.g. 1, 5) or decimal strings (e.g. "1", "2.5").
 * 6. Rejected values are NEVER converted into strings to claim precision was preserved.
 */
export interface PaymentLineItem {
  id?: string;
  name?: string;
  description?: string;
  quantity: number | string;
  unit_price: number | string;
  total_amount?: number | string;
  sku?: string;
  currency?: string;
}

/**
 * Structured order summary containing items and optional total.
 *
 * MONETARY INPUT CONTRACT:
 * Total follows the same monetary rules: decimal strings are canonical; validated safe integers
 * are accepted for compatibility; non-integer numbers and unsafe integers are rejected.
 */
export interface OrderSummary {
  order_id?: string;
  currency?: string;
  total?: number | string;
  item_count?: number;
  items?: PaymentLineItem[];
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
  line_items?: PaymentLineItem[];
  order_summary?: OrderSummary;
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
  currency?: string;
  line_items?: PaymentLineItem[];
  order_summary?: OrderSummary;
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
  reproduction_status: "REPRODUCED" | "REPORTED_UNVERIFIED";
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
  line_items?: PaymentLineItem[];
  order_summary?: OrderSummary;
}

export interface EvidencePackFinding {
  finding_code: string;
  severity: string;
  description: string;
  alias_refs: string[];
}

export interface EvidencePackDocument {
  document_id?: string;
  document_type: string;
  filename?: string;
  source?: string;
  description?: string;
  created_at?: string;
}

export interface EvidencePackData {
  version: number;
  pack_hash?: string;
  case_hash?: string;
  dispute?: {
    alias?: string;
    reason_code?: string;
    amount?: number;
    currency?: string;
    status?: string;
    opened_at?: string;
    received_at?: string;
  };
  target_transaction?: {
    transaction_alias?: string;
    amount?: number;
    currency?: string;
    channel?: string;
    order_time?: string;
    decision_record?: Record<string, unknown>;
  };
  deterministic_findings?: EvidencePackFinding[];
  investigation_narrative?: {
    summary?: string;
    key_evidence?: string[];
    recommended_action?: string;
    confidence?: number;
    [key: string]: unknown;
  };
  attached_documents?: EvidencePackDocument[];
}

export interface DecisionAuditReconstruction {
  status: string;
  data: AuditReconstructionData;
}


export interface CustomerListItem {
  customer_id: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  currency: string;
  max_risk_score: number;
  last_order_at?: string | null;
  created_at: string;
}

export interface CustomerListParams {
  cursor?: string;
  limit?: number;
}

export interface CustomerListResponse {
  items: CustomerListItem[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface LinkedDeviceItem {
  id: string;
  device_hash: string;
  ip_address?: string | null;
  created_at: string;
}

export interface LinkedAddressItem {
  id: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  created_at: string;
}

export interface CustomerOrderSummary {
  order_id: string;
  order_value: number;
  currency: string;
  channel: string;
  status: string;
  order_time: string;
  risk_score?: number | null;
  policy_action?: string | null;
}

export interface CustomerProfileResponse {
  customer_id: string;
  email: string;
  phone: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  currency: string;
  max_risk_score: number;
  average_risk_score: number;
  linked_devices: LinkedDeviceItem[];
  linked_addresses: LinkedAddressItem[];
  order_history: CustomerOrderSummary[];
}

export interface DailyTrendItem {
  date: string;
  total_scored: number;
  flagged: number;
  blocked: number;
}

export interface ScoreDistribution {
  low_0_15: number;
  med_15_40: number;
  high_40_80: number;
  crit_80_100: number;
}

export interface ChannelBreakdown {
  paypal: number;
  cod: number;
  other: number;
}

export interface DisputeAnalytics {
  total_disputes: number;
  disputed_amount: number;
  currency: string;
  dispute_rate_pct: number;
}

export interface RiskTrendsResponse {
  tenant_id: string;
  daily_trends: DailyTrendItem[];
  score_distribution: ScoreDistribution;
  channel_breakdown: ChannelBreakdown;
  policy_breakdown: Record<string, number>;
  dispute_analytics: DisputeAnalytics;
}

export interface InvestigationListItem {
  id: string;
  dispute_id: string | null;
  transaction_id?: string | null;
  status: string;
  source?: string;
  created_at: string;
  updated_at: string;
  case_hash: string;
}

export interface InvestigationListParams {
  status?: string;
  cursor?: string;
  limit?: number;
}

export interface InvestigationListResponse {
  items: InvestigationListItem[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface InvestigationFinding {
  finding_id: string;
  alias_id: string;
  category: string;
  statement: string;
  source_doc_id: string;
  source_filename: string;
  confidence: number;
  relevance: string;
}

export interface InvestigationAssessment {
  investigation_id: string;
  model: string;
  prompt_hash: string;
  attempt_count: number;
  validator_errors: string[][];
  final_status: "VALIDATED" | "TEMPLATE_FALLBACK";
  final_text: string;
  findings_cited: string[];
  advisory_label: string;
  created_at: string;
}

export interface InvestigationTimelineStep {
  id: string;
  step_type: string;
  actor: string;
  actor_type: string;
  note?: string | null;
  pack_hash?: string | null;
  created_at: string;
}

export interface InvestigationTimelineResponse {
  investigation_id: string;
  total_steps: number;
  steps: InvestigationTimelineStep[];
}

export interface InvestigationDetail {
  id: string;
  dispute_id: string | null;
  transaction_id: string | null;
  decision_id: string | null;
  status: string;
  source?: string;
  created_at: string;
  updated_at: string;
  case_hash: string;
  external_dispute_id?: string | null;
  reason_code: string;
  amount: number;
  currency: string;
  findings: InvestigationFinding[];
  advisory_assessment?: {
    disclaimer: string;
    narrative?: string | null;
  };
  decision_record?: {
    severity?: string;
    tier?: string;
    risk_score?: number;
    probability?: number;
    policy_action?: string;
    shap_top_k?: ReasonCode[];
  };
  approval?: {
    is_approved: boolean;
    decision: string;
    approver_sub?: string | null;
    decided_at?: string | null;
    pack_hash?: string | null;
  };
  completeness?: {
    score: number;
    is_complete: boolean;
    missing_kinds: string[];
    reasons: string[];
  };
}

export interface CloseInvestigationPayload {
  outcome: string;
  note: string;
  steps_performed?: string[];
}

export interface TransactionInvestigationResponse {
  id: string;
  merchant_id: string;
  transaction_id: string;
  decision_id?: string | null;
  dispute_id?: string | null;
  status: string;
  source: string;
  case_hash?: string | null;
  created_at: string;
  updated_at: string;
}
