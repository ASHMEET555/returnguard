import { useState, useEffect, useCallback } from 'react';
import { useReturnGuard } from './context';
import type {
  AnalyticsSummary,
  ScoreResult,
  DecisionListResponse,
  ModelPerformance,
  DecisionAuditReconstruction,
  CustomerListResponse,
  CustomerProfileResponse,
  RiskTrendsResponse,
  ReviewsListResponse,
} from '@returnguard/sdk';

export function useRiskSummary() {
  const { client, dateRange, currency } = useReturnGuard();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.analytics.summary();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, dateRange, currency]);

  return { data, loading, error, refetch: fetchSummary };
}

export function useRiskTrends() {
  const { client } = useReturnGuard();
  const [data, setData] = useState<RiskTrendsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.analytics.riskTrends();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { data, loading, error, refetch: fetchTrends };
}

export function useRiskDecisions(limit: number = 25) {
  const { client } = useReturnGuard();
  const [page, setPage] = useState<DecisionListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const fetchDecisions = useCallback(async (targetCursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.decisions.list({ limit, cursor: targetCursor });
      setPage(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, limit]);

  useEffect(() => {
    fetchDecisions(cursor);
  }, [fetchDecisions, cursor]);

  const nextPage = useCallback(() => {
    if (page?.next_cursor) {
      setCursor(page.next_cursor);
    }
  }, [page]);

  const resetPage = useCallback(() => {
    setCursor(undefined);
  }, []);

  return {
    items: page?.items ?? [],
    nextCursor: page?.next_cursor,
    hasMore: Boolean(page?.next_cursor),
    loading,
    error,
    nextPage,
    resetPage,
    refetch: () => fetchDecisions(cursor),
  };
}

export function useTransactionRisk(decisionId: string | null) {
  const { client } = useReturnGuard();
  const [decision, setDecision] = useState<ScoreResult | null>(null);
  const [audit, setAudit] = useState<DecisionAuditReconstruction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!decisionId) {
      setDecision(null);
      setAudit(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      client.decisions.get(decisionId),
      client.decisions.audit(decisionId).catch(() => null),
    ])
      .then(([decRes, auditRes]) => {
        if (!active) return;
        setDecision(decRes);
        setAudit(auditRes);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [client, decisionId]);

  return { decision, audit, loading, error };
}

export function useCustomers(limit: number = 25) {
  const { client } = useReturnGuard();
  const [page, setPage] = useState<CustomerListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const fetchCustomers = useCallback(async (targetCursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.customers.list({ limit, cursor: targetCursor });
      setPage(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, limit]);

  useEffect(() => {
    fetchCustomers(cursor);
  }, [fetchCustomers, cursor]);

  const nextPage = useCallback(() => {
    if (page?.next_cursor) {
      setCursor(page.next_cursor);
    }
  }, [page]);

  return {
    items: page?.items ?? [],
    nextCursor: page?.next_cursor,
    hasMore: page?.has_more ?? false,
    loading,
    error,
    nextPage,
    refetch: () => fetchCustomers(cursor),
  };
}

export function useCustomerProfile(customerId: string | null) {
  const { client } = useReturnGuard();
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!customerId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    client.customers.get(customerId)
      .then((res) => {
        if (active) setProfile(res);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [client, customerId]);

  return { profile, loading, error };
}

export function useReviews(limit: number = 25) {
  const { client } = useReturnGuard();
  const [page, setPage] = useState<ReviewsListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.reviews.list({ limit });
      setPage(res);
      return res;
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { items: page?.items ?? [], loading, error, refetch: fetchReviews };
}

export function useModelPerformance() {
  const { client } = useReturnGuard();
  const [data, setData] = useState<ModelPerformance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    client.models.performance()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client]);

  return { data, loading, error };
}

export function useReviewQueue(limit: number = 50, statusFilter?: string) {
  const { client, configuration } = useReturnGuard();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.reviews.list({ limit, status: statusFilter });
      setReviews(res.items || []);
      return res.items || [];
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client, limit, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (decisionId: string, action: 'APPROVE' | 'REJECT', notes?: string) => {
      setActionLoading(true);
      try {
        if (configuration?.onReviewAction) {
          await configuration.onReviewAction(decisionId, action, notes);
        }
        const sdkAction = (action.toLowerCase() === 'approve' ? 'approve' : 'reject') as 'approve' | 'reject';
        const result = await client.reviews.submit({
          decision_id: decisionId,
          action: sdkAction,
          notes: notes || `Merchant review: ${action}`,
        });
        await fetchReviews();
        return result;
      } catch (err: unknown) {
        throw err instanceof Error ? err : new Error(String(err));
      } finally {
        setActionLoading(false);
      }
    },
    [client, fetchReviews, configuration]
  );

  return {
    reviews,
    items: reviews,
    loading,
    error,
    actionLoading,
    refetch: fetchReviews,
    submitReview,
    approve: (decisionId: string, notes?: string) => submitReview(decisionId, 'APPROVE', notes),
    reject: (decisionId: string, notes?: string) => submitReview(decisionId, 'REJECT', notes),
  };
}
