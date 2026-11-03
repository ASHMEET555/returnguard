/**
 * ReturnGuardClient implementation
 */

import { ClientOptions } from "./auth";
import { Transport } from "./transport";
import {
  AnalyticsSummary,
  DecisionAuditReconstruction,
  DecisionListParams,
  DecisionListResponse,
  ModelPerformance,
  ReviewsListParams,
  ReviewsListResponse,
  ReviewSubmitPayload,
  ReviewSubmitResult,
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
}
