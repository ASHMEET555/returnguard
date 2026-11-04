import { useState, useEffect, useCallback } from 'react';
import { useReturnGuard } from './context';
import type { AnalyticsSummary, ScoreResult, DecisionListResponse, ModelPerformance, DecisionAuditReconstruction } from '@returnguard/sdk';

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
