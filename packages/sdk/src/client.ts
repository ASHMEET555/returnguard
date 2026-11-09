/**
 * ReturnGuardClient implementation
 */

import { ClientOptions } from "./auth";
import { Transport } from "./transport";
import {
  TransactionInvestigationResponse,
  AnalyticsSummary,
  CloseInvestigationPayload,
  CustomerListParams,
  CustomerListResponse,
  CustomerProfileResponse,
  DecisionAuditReconstruction,
  DecisionListParams,
  DecisionListResponse,
  InvestigationAssessment,
  InvestigationDetail,
  InvestigationListParams,
  InvestigationListResponse,
  InvestigationTimelineResponse,
  ModelPerformance,
  ReviewsListParams,
  ReviewsListResponse,
  ReviewSubmitPayload,
  ReviewSubmitResult,
  RiskTrendsResponse,
  ScorePayload,
  ScoreResult,
} from "./types";

export class ReturnGuardClient {
  private readonly transport: Transport;

  constructor(options: ClientOptions) {
    this.transport = new Transport(options);
  }

  /**
   * Scores a transaction for fraud risk and soft policy recommendations.
   * POST /v1/score. NEVER retried automatically.
   */
  public async scoreTransaction(payload: ScorePayload): Promise<ScoreResult> {
    return this.transport.request<ScoreResult>({
      method: "POST",
      path: "/v1/score",
      body: payload,
      allowRetry: false,
    });
  }

  /**
   * Decision resource operations.
   */
  public readonly decisions = {
    /**
     * Lists stored decisions with stable cursor pagination.
     * GET /v1/decisions. Retriable.
     */
    list: async (params?: DecisionListParams): Promise<DecisionListResponse> => {
      return this.transport.request<DecisionListResponse>({
        method: "GET",
        path: "/v1/decisions",
        query: {
          cursor: params?.cursor,
          limit: params?.limit,
        },
      });
    },

    /**
     * Retrieves a single stored decision by ID.
     * GET /v1/decisions/{id}. Retriable.
     */
    get: async (id: string): Promise<ScoreResult> => {
      return this.transport.request<ScoreResult>({
        method: "GET",
        path: `/v1/decisions/${encodeURIComponent(id)}`,
      });
    },

    /**
     * Reconstructs the full audit trail and evidence chain for a decision.
     * GET /v1/decisions/{id}/audit. Retriable.
     */
    audit: async (id: string): Promise<DecisionAuditReconstruction> => {
      return this.transport.request<DecisionAuditReconstruction>({
        method: "GET",
        path: `/v1/decisions/${encodeURIComponent(id)}/audit`,
      });
    },

    /**
     * Loops over all cursors to retrieve all decisions.
     * Protected by max-pages guard (default 50). No async generators.
     */
    listAll: async (options?: { maxPages?: number; pageSize?: number }): Promise<ScoreResult[]> => {
      const maxPages = options?.maxPages ?? 50;
      const pageSize = options?.pageSize ?? 50;
      const allResults: ScoreResult[] = [];

      let cursor: string | undefined = undefined;
      let page = 0;

      while (page < maxPages) {
        page++;
        const resp: DecisionListResponse = await this.decisions.list({
          cursor,
          limit: pageSize,
        });

        allResults.push(...resp.items);

        if (!resp.next_cursor || resp.items.length === 0) {
          break;
        }
        cursor = resp.next_cursor;
      }

      return allResults;
    },
  };

  /**
   * Review resource operations for human-in-the-loop decisions.
   */
  public readonly reviews = {
    /**
     * Lists decisions needing review or with review statuses.
     * GET /v1/reviews. Retriable.
     */
    list: async (params?: ReviewsListParams): Promise<ReviewsListResponse> => {
      return this.transport.request<ReviewsListResponse>({
        method: "GET",
        path: "/v1/reviews",
        query: {
          cursor: params?.cursor,
          limit: params?.limit,
          status: params?.status,
        },
      });
    },

    /**
     * Submits a review resolution (approve, reject, escalate).
     * POST /v1/reviews. NEVER retried automatically.
     */
    submit: async (payload: ReviewSubmitPayload): Promise<ReviewSubmitResult> => {
      return this.transport.request<ReviewSubmitResult>({
        method: "POST",
        path: "/v1/reviews",
        body: payload,
        allowRetry: false,
      });
    },
  };

  /**
   * Analytics resource operations.
   */
  public readonly analytics = {
    /**
     * Retrieves aggregated risk and transaction analytics summary.
     * GET /v1/analytics/summary. Retriable.
     */
    summary: async (): Promise<AnalyticsSummary> => {
      return this.transport.request<AnalyticsSummary>({
        method: "GET",
        path: "/v1/analytics/summary",
      });
    },

    /**
     * Retrieves risk trends, score distribution, and channel breakdowns.
     * GET /v1/analytics/risk-trends. Retriable.
     */
    riskTrends: async (): Promise<RiskTrendsResponse> => {
      return this.transport.request<RiskTrendsResponse>({
        method: "GET",
        path: "/v1/analytics/risk-trends",
      });
    },
  };

  /**
   * Customer resource operations.
   */
  public readonly customers = {
    /**
     * Lists tenant customers with stable cursor pagination.
     * GET /v1/customers. Retriable.
     */
    list: async (params?: CustomerListParams): Promise<CustomerListResponse> => {
      const query: Record<string, string | number | undefined> = {};
      if (params?.cursor) query.cursor = params.cursor;
      if (params?.limit !== undefined) query.limit = params.limit;
      return this.transport.request<CustomerListResponse>({
        method: "GET",
        path: "/v1/customers",
        query,
      });
    },

    /**
     * Retrieves customer profile with linked devices, addresses, and order history.
     * GET /v1/customers/{customer_id}. Retriable.
     */
    get: async (customerId: string): Promise<CustomerProfileResponse> => {
      return this.transport.request<CustomerProfileResponse>({
        method: "GET",
        path: `/v1/customers/${encodeURIComponent(customerId)}`,
      });
    },
  };

  /**
   * Model performance reporting operations.
   */
  public readonly models = {
    /**
     * Retrieves model performance metrics split by synthetic and IEEE-CIS benchmarks.
     * GET /v1/models/performance. Retriable.
     */
    performance: async (): Promise<ModelPerformance> => {
      return this.transport.request<ModelPerformance>({
        method: "GET",
        path: "/v1/models/performance",
      });
    },
  };

  /**
   * Transaction-level investigation operations.
   */
  public readonly transactions = {
    /**
     * Retrieves the current investigation associated with a transaction.
     * GET /v1/transactions/{transaction_id}/investigation. Retriable.
     */
    getInvestigation: async (transactionId: string): Promise<TransactionInvestigationResponse> => {
      return this.transport.request<TransactionInvestigationResponse>({
        method: "GET",
        path: `/v1/transactions/${encodeURIComponent(transactionId)}/investigation`,
      });
    },

    /**
     * Opens a manual investigation or returns the existing open one.
     * POST /v1/transactions/{transaction_id}/investigation. NEVER retried automatically.
     */
    openInvestigation: async (
      transactionId: string,
      payload?: { reason?: string }
    ): Promise<TransactionInvestigationResponse> => {
      return this.transport.request<TransactionInvestigationResponse>({
        method: "POST",
        path: `/v1/transactions/${encodeURIComponent(transactionId)}/investigation`,
        body: payload || {},
        allowRetry: false,
      });
    },
  };

  /**
   * Investigation and human review operations.
   */
  public readonly investigations = {
    /**
     * Lists investigations with cursor pagination and status filter.
     * GET /v1/investigations. Retriable.
     */
    list: async (params?: InvestigationListParams): Promise<InvestigationListResponse> => {
      const query: Record<string, string | number | undefined> = {};
      if (params?.status) query.status = params.status;
      if (params?.cursor) query.cursor = params.cursor;
      if (params?.limit !== undefined) query.limit = params.limit;
      return this.transport.request<InvestigationListResponse>({
        method: "GET",
        path: "/v1/investigations",
        query,
      });
    },

    /**
     * Retrieves full investigation detail.
     * GET /v1/investigations/{id}. Retriable.
     */
    get: async (id: string): Promise<InvestigationDetail> => {
      return this.transport.request<InvestigationDetail>({
        method: "GET",
        path: `/v1/investigations/${encodeURIComponent(id)}`,
      });
    },

    /**
     * Retrieves LLM assessment and validator trace.
     * GET /v1/investigations/{id}/assessment. Retriable.
     */
    getAssessment: async (id: string): Promise<InvestigationAssessment> => {
      return this.transport.request<InvestigationAssessment>({
        method: "GET",
        path: `/v1/investigations/${encodeURIComponent(id)}/assessment`,
      });
    },

    /**
     * Retrieves ordered step log / timeline.
     * GET /v1/investigations/{id}/timeline. Retriable.
     */
    getTimeline: async (id: string): Promise<InvestigationTimelineResponse> => {
      return this.transport.request<InvestigationTimelineResponse>({
        method: "GET",
        path: `/v1/investigations/${encodeURIComponent(id)}/timeline`,
      });
    },

    /**
     * Starts review (transitions OPEN to IN_REVIEW).
     * POST /v1/investigations/{id}/start-review. NEVER retried automatically.
     */
    startReview: async (id: string): Promise<{ status: string; current_status: string; reviewer: string }> => {
      return this.transport.request<{ status: string; current_status: string; reviewer: string }>({
        method: "POST",
        path: `/v1/investigations/${encodeURIComponent(id)}/start-review`,
        allowRetry: false,
      });
    },

    /**
     * Adds reviewer note.
     * POST /v1/investigations/{id}/notes. NEVER retried automatically.
     */
    addNote: async (id: string, note: string): Promise<{ status: string; step_id: string; note: string }> => {
      return this.transport.request<{ status: string; step_id: string; note: string }>({
        method: "POST",
        path: `/v1/investigations/${encodeURIComponent(id)}/notes`,
        body: { note },
        allowRetry: false,
      });
    },

    /**
     * Requests missing documents.
     * POST /v1/investigations/{id}/request-documents. NEVER retried automatically.
     */
    requestDocuments: async (id: string): Promise<{ status: string; step_id: string; missing_evidence_types: string[] }> => {
      return this.transport.request<{ status: string; step_id: string; missing_evidence_types: string[] }>({
        method: "POST",
        path: `/v1/investigations/${encodeURIComponent(id)}/request-documents`,
        allowRetry: false,
      });
    },

    /**
     * Approves evidence pack.
     * POST /v1/investigations/{id}/approve. NEVER retried automatically.
     */
    approvePack: async (
      id: string,
      payload: { pack_hash: string; reason?: string }
    ): Promise<{ status: string; pack_hash: string; decision: string }> => {
      return this.transport.request<{ status: string; pack_hash: string; decision: string }>({
        method: "POST",
        path: `/v1/investigations/${encodeURIComponent(id)}/approve`,
        body: { pack_hash: payload.pack_hash, decision: "APPROVE", reason: payload.reason },
        allowRetry: false,
      });
    },

    /**
     * Rejects evidence pack.
     * POST /v1/investigations/{id}/reject. NEVER retried automatically.
     */
    rejectPack: async (id: string, reason: string): Promise<{ status: string; decision: string; reason: string }> => {
      return this.transport.request<{ status: string; decision: string; reason: string }>({
        method: "POST",
        path: `/v1/investigations/${encodeURIComponent(id)}/reject`,
        body: { reason },
        allowRetry: false,
      });
    },

    /**
     * Closes investigation.
     * POST /v1/investigations/{id}/close. NEVER retried automatically.
     */
    close: async (
      id: string,
      payload: CloseInvestigationPayload
    ): Promise<{ status: string; outcome: string; note: string; closed_by: string }> => {
      return this.transport.request<{ status: string; outcome: string; note: string; closed_by: string }>({
        method: "POST",
        path: `/v1/investigations/${encodeURIComponent(id)}/close`,
        body: payload,
        allowRetry: false,
      });
    },

    /**
     * Reopens investigation.
     * POST /v1/investigations/{id}/reopen. NEVER retried automatically.
     */
    reopen: async (
      id: string,
      reason: string
    ): Promise<{ status: string; current_status: string; reason: string; reopened_by: string }> => {
      return this.transport.request<{ status: string; current_status: string; reason: string; reopened_by: string }>({
        method: "POST",
        path: `/v1/investigations/${encodeURIComponent(id)}/reopen`,
        body: { reason },
        allowRetry: false,
      });
    },
  };
}
