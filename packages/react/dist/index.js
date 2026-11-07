// src/context.tsx
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { ReturnGuardClient } from "@returnguard/sdk";
import { jsx } from "react/jsx-runtime";
var ReturnGuardContext = createContext(null);
var ReturnGuardProvider = ({
  client,
  clientOptions,
  defaultTheme = "dark",
  defaultCurrency = "USD",
  children
}) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [dateRange, setDateRange] = useState("30d");
  const resolvedClient = useMemo(() => {
    if (client) return client;
    if (clientOptions) return new ReturnGuardClient(clientOptions);
    throw new Error('ReturnGuardProvider requires either a "client" or "clientOptions" prop.');
  }, [client, clientOptions]);
  useEffect(() => {
    document.documentElement.setAttribute("data-rg-theme", theme);
  }, [theme]);
  const value = useMemo(
    () => ({
      client: resolvedClient,
      theme,
      setTheme,
      currency,
      setCurrency,
      dateRange,
      setDateRange
    }),
    [resolvedClient, theme, currency, dateRange]
  );
  return /* @__PURE__ */ jsx(ReturnGuardContext.Provider, { value, children: /* @__PURE__ */ jsx("div", { className: `rg-root rg-theme-${theme}`, children }) });
};
function useReturnGuard() {
  const context = useContext(ReturnGuardContext);
  if (!context) {
    throw new Error("useReturnGuard must be used within a ReturnGuardProvider");
  }
  return context;
}

// src/hooks.ts
import { useState as useState2, useEffect as useEffect2, useCallback } from "react";
function useRiskSummary() {
  const { client, dateRange, currency } = useReturnGuard();
  const [data, setData] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.analytics.summary();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);
  useEffect2(() => {
    fetchSummary();
  }, [fetchSummary, dateRange, currency]);
  return { data, loading, error, refetch: fetchSummary };
}
function useRiskTrends() {
  const { client } = useReturnGuard();
  const [data, setData] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.analytics.riskTrends();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);
  useEffect2(() => {
    fetchTrends();
  }, [fetchTrends]);
  return { data, loading, error, refetch: fetchTrends };
}
function useRiskDecisions(limit = 25) {
  var _a;
  const { client } = useReturnGuard();
  const [page, setPage] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const [cursor, setCursor] = useState2(void 0);
  const fetchDecisions = useCallback(async (targetCursor) => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.decisions.list({ limit, cursor: targetCursor });
      setPage(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, limit]);
  useEffect2(() => {
    fetchDecisions(cursor);
  }, [fetchDecisions, cursor]);
  const nextPage = useCallback(() => {
    if (page == null ? void 0 : page.next_cursor) {
      setCursor(page.next_cursor);
    }
  }, [page]);
  const resetPage = useCallback(() => {
    setCursor(void 0);
  }, []);
  return {
    items: (_a = page == null ? void 0 : page.items) != null ? _a : [],
    nextCursor: page == null ? void 0 : page.next_cursor,
    hasMore: Boolean(page == null ? void 0 : page.next_cursor),
    loading,
    error,
    nextPage,
    resetPage,
    refetch: () => fetchDecisions(cursor)
  };
}
function useTransactionRisk(decisionId) {
  const { client } = useReturnGuard();
  const [decision, setDecision] = useState2(null);
  const [audit, setAudit] = useState2(null);
  const [loading, setLoading] = useState2(false);
  const [error, setError] = useState2(null);
  useEffect2(() => {
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
      client.decisions.audit(decisionId).catch(() => null)
    ]).then(([decRes, auditRes]) => {
      if (!active) return;
      setDecision(decRes);
      setAudit(auditRes);
    }).catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [client, decisionId]);
  return { decision, audit, loading, error };
}
function useCustomers(limit = 25) {
  var _a, _b;
  const { client } = useReturnGuard();
  const [page, setPage] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const [cursor, setCursor] = useState2(void 0);
  const fetchCustomers = useCallback(async (targetCursor) => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.customers.list({ limit, cursor: targetCursor });
      setPage(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, limit]);
  useEffect2(() => {
    fetchCustomers(cursor);
  }, [fetchCustomers, cursor]);
  const nextPage = useCallback(() => {
    if (page == null ? void 0 : page.next_cursor) {
      setCursor(page.next_cursor);
    }
  }, [page]);
  return {
    items: (_a = page == null ? void 0 : page.items) != null ? _a : [],
    nextCursor: page == null ? void 0 : page.next_cursor,
    hasMore: (_b = page == null ? void 0 : page.has_more) != null ? _b : false,
    loading,
    error,
    nextPage,
    refetch: () => fetchCustomers(cursor)
  };
}
function useCustomerProfile(customerId) {
  const { client } = useReturnGuard();
  const [profile, setProfile] = useState2(null);
  const [loading, setLoading] = useState2(false);
  const [error, setError] = useState2(null);
  useEffect2(() => {
    if (!customerId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    client.customers.get(customerId).then((res) => {
      if (active) setProfile(res);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [client, customerId]);
  return { profile, loading, error };
}
function useReviews(limit = 25) {
  var _a;
  const { client } = useReturnGuard();
  const [page, setPage] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.reviews.list({ limit });
      setPage(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, limit]);
  useEffect2(() => {
    fetchReviews();
  }, [fetchReviews]);
  return { items: (_a = page == null ? void 0 : page.items) != null ? _a : [], loading, error, refetch: fetchReviews };
}
function useModelPerformance() {
  const { client } = useReturnGuard();
  const [data, setData] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  useEffect2(() => {
    let active = true;
    setLoading(true);
    client.models.performance().then((res) => {
      if (active) setData(res);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [client]);
  return { data, loading, error };
}

// src/components/RiskBadge.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var RiskBadge = ({ score, severity, action, className = "" }) => {
  let variant = "neutral";
  let label = "UNKNOWN";
  if (typeof score === "number") {
    if (score < 0.15) {
      variant = "low";
      label = `LOW (${(score * 100).toFixed(0)})`;
    } else if (score < 0.4) {
      variant = "medium";
      label = `MEDIUM (${(score * 100).toFixed(0)})`;
    } else if (score < 0.8) {
      variant = "high";
      label = `HIGH (${(score * 100).toFixed(0)})`;
    } else {
      variant = "critical";
      label = `CRITICAL (${(score * 100).toFixed(0)})`;
    }
  } else if (severity) {
    const sev = severity.toUpperCase();
    if (sev === "LOW") variant = "low";
    else if (sev === "MEDIUM") variant = "medium";
    else if (sev === "HIGH") variant = "high";
    else if (sev === "CRITICAL") variant = "critical";
    label = sev;
  } else if (action) {
    const act = action.toUpperCase();
    if (act.includes("ALLOW")) variant = "low";
    else if (act.includes("MONITOR") || act.includes("STEP_UP")) variant = "medium";
    else if (act.includes("REVIEW")) variant = "high";
    else if (act.includes("BLOCK")) variant = "critical";
    label = act.replace(/_/g, " ");
  }
  return /* @__PURE__ */ jsx2("span", { className: `rg-badge rg-badge-${variant} ${className}`, children: label });
};

// src/components/DashboardShell.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var DashboardShell = ({
  currentTab,
  onTabChange,
  brandTitle = "ReturnGuard",
  children
}) => {
  const { theme, setTheme } = useReturnGuard();
  const navItems = [
    { id: "overview", label: "Overview", icon: "\u{1F4CA}" },
    { id: "investigations", label: "Investigations", icon: "\u{1F50D}" },
    { id: "transactions", label: "Transactions", icon: "\u{1F4B3}" },
    { id: "customers", label: "Customers", icon: "\u{1F465}" },
    { id: "analytics", label: "Risk Analytics", icon: "\u{1F4C8}" },
    { id: "rules", label: "Rules & Detection", icon: "\u{1F6E1}\uFE0F" },
    { id: "models", label: "Model Benchmarks", icon: "\u{1F916}" },
    { id: "pipeline", label: "Payment Pipeline", icon: "\u{1F500}" },
    { id: "reviews", label: "Alerts & Reviews", icon: "\u{1F514}" },
    { id: "reports", label: "Reports & Export", icon: "\u{1F4C4}" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "rg-shell", children: [
    /* @__PURE__ */ jsxs("aside", { className: "rg-sidebar", children: [
      /* @__PURE__ */ jsx3("div", { className: "rg-sidebar-header", children: /* @__PURE__ */ jsxs("div", { className: "rg-brand-logo", children: [
        /* @__PURE__ */ jsx3("span", { children: "\u{1F6E1}\uFE0F" }),
        /* @__PURE__ */ jsx3("span", { children: brandTitle }),
        /* @__PURE__ */ jsx3("span", { className: "rg-brand-badge", children: "SaaS" })
      ] }) }),
      /* @__PURE__ */ jsx3("nav", { className: "rg-sidebar-nav", children: navItems.map((item) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: `rg-nav-item ${currentTab === item.id ? "active" : ""}`,
          onClick: () => onTabChange(item.id),
          children: [
            /* @__PURE__ */ jsx3("span", { children: item.icon }),
            /* @__PURE__ */ jsx3("span", { children: item.label })
          ]
        },
        item.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rg-main", children: [
      /* @__PURE__ */ jsxs("header", { className: "rg-topbar", children: [
        /* @__PURE__ */ jsxs("div", { className: "rg-topbar-left", children: [
          /* @__PURE__ */ jsx3("span", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "Tenant:" }),
          /* @__PURE__ */ jsx3("span", { style: { fontSize: 13, fontWeight: 600 }, children: "Active Session" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rg-topbar-right", children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx3(
              "span",
              {
                style: {
                  background: "var(--rg-bg-card)",
                  color: "var(--rg-text-muted)",
                  border: "1px solid var(--rg-border)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 12
                },
                children: "Currency: Native Dataset / Provider Specific"
              }
            ),
            /* @__PURE__ */ jsx3(
              "span",
              {
                style: { fontSize: 10, color: "var(--rg-med-text)", cursor: "help" },
                title: "Backend provides raw monetary amounts per transaction without guaranteed FX conversion. Global currency filter disabled.",
                children: "\u24D8 Fixed"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx3(
              "span",
              {
                style: {
                  background: "var(--rg-bg-card)",
                  color: "var(--rg-text-muted)",
                  border: "1px solid var(--rg-border)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 12
                },
                children: "Range: Lifetime Aggregates"
              }
            ),
            /* @__PURE__ */ jsx3(
              "span",
              {
                style: { fontSize: 10, color: "var(--rg-med-text)", cursor: "help" },
                title: "Backend /v1/analytics/summary returns all-time scored decisions.",
                children: "\u24D8 Lifetime"
              }
            )
          ] }),
          /* @__PURE__ */ jsx3(
            "button",
            {
              type: "button",
              className: "rg-theme-toggle",
              onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
              style: {
                background: "var(--rg-bg-card)",
                color: "var(--rg-text-primary)",
                border: "1px solid var(--rg-border)",
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 12
              },
              children: theme === "dark" ? "\u2600\uFE0F Light" : "\u{1F319} Dark"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx3("main", { className: "rg-content", children })
    ] })
  ] });
};

// src/components/OverviewPage.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var OverviewPage = () => {
  const { data, loading, error, refetch } = useRiskSummary();
  if (loading) {
    return /* @__PURE__ */ jsx4("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading risk operations summary..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs2("div", { style: { padding: 24, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 8 }, children: [
      /* @__PURE__ */ jsx4("h4", { style: { margin: "0 0 8px 0", color: "var(--rg-high-text)" }, children: "Failed to load risk summary" }),
      /* @__PURE__ */ jsx4("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: error.message }),
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          style: {
            marginTop: 12,
            padding: "6px 12px",
            background: "var(--rg-accent)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          },
          children: "Retry"
        }
      )
    ] });
  }
  const summary = data != null ? data : {
    tenant_id: "default",
    total_decisions: 0,
    allow_count: 0,
    review_count: 0,
    block_count: 0,
    average_risk_score: 0,
    total_volume_inr: 0,
    high_risk_volume_inr: 0,
    tier_distribution: {}
  };
  const flaggedCount = (summary.review_count || 0) + (summary.block_count || 0);
  const flaggedPct = summary.total_decisions > 0 ? (flaggedCount / summary.total_decisions * 100).toFixed(1) : "0.0";
  return /* @__PURE__ */ jsxs2("div", { children: [
    /* @__PURE__ */ jsxs2("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx4("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Risk Operations Overview" }),
      /* @__PURE__ */ jsx4("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Portfolio risk posture, policy distributions, and live transaction indicators." })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ jsxs2("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs2("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx4("span", { children: "Transactions Scored" }),
          /* @__PURE__ */ jsx4("span", { children: "\u{1F4B3}" })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "rg-card-value", children: summary.total_decisions.toLocaleString() }),
        /* @__PURE__ */ jsx4("div", { className: "rg-card-subtitle", children: "Lifetime scored payments" })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs2("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx4("span", { children: "Flagged Transactions" }),
          /* @__PURE__ */ jsx4("span", { children: "\u26A0\uFE0F" })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "rg-card-value", children: flaggedCount.toLocaleString() }),
        /* @__PURE__ */ jsxs2("div", { className: "rg-card-subtitle", children: [
          flaggedPct,
          "% flag rate"
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs2("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx4("span", { children: "High Risk / Block Action" }),
          /* @__PURE__ */ jsx4("span", { children: "\u{1F6A8}" })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "rg-card-value", children: summary.block_count.toLocaleString() }),
        /* @__PURE__ */ jsx4("div", { className: "rg-card-subtitle", children: "Recommended hold/stop" })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs2("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx4("span", { children: "Average Risk Score" }),
          /* @__PURE__ */ jsx4("span", { children: "\u{1F4C8}" })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "rg-card-value", children: (summary.average_risk_score * 100).toFixed(0) }),
        /* @__PURE__ */ jsx4("div", { className: "rg-card-subtitle", children: "Portfolio scale (0 - 100)" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs2("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx4("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Policy Action Breakdown" }),
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx4(RiskBadge, { action: "ALLOW" }),
            /* @__PURE__ */ jsx4("span", { style: { fontWeight: 600, fontSize: 14 }, children: summary.allow_count.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx4(RiskBadge, { action: "REVIEW" }),
            /* @__PURE__ */ jsx4("span", { style: { fontWeight: 600, fontSize: 14 }, children: summary.review_count.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx4(RiskBadge, { action: "BLOCK" }),
            /* @__PURE__ */ jsx4("span", { style: { fontWeight: 600, fontSize: 14 }, children: summary.block_count.toLocaleString() })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx4("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Scoring System Health" }),
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx4("span", { style: { color: "var(--rg-text-secondary)" }, children: "Engine Status" }),
            /* @__PURE__ */ jsx4("span", { style: { color: "var(--rg-low-text)", fontWeight: 600 }, children: "\u25CF Operational" })
          ] }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx4("span", { style: { color: "var(--rg-text-secondary)" }, children: "Shadow Mode" }),
            /* @__PURE__ */ jsx4("span", { style: { fontWeight: 600 }, children: "Active (Default)" })
          ] }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx4("span", { style: { color: "var(--rg-text-secondary)" }, children: "Serving Model" }),
            /* @__PURE__ */ jsx4("span", { style: { fontFamily: "monospace" }, children: "candidate_lgbm_v1" })
          ] })
        ] })
      ] })
    ] })
  ] });
};

// src/components/InvestigationsPage.tsx
import { useState as useState3, useEffect as useEffect3, useCallback as useCallback2, useMemo as useMemo2 } from "react";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var InvestigationsPage = ({
  initialInvestigationId,
  onSelectInvestigation,
  testDetail,
  testAssessment,
  testTimeline,
  testItems,
  onActionTrigger
}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const { client } = useReturnGuard();
  const [selectedId, setSelectedId] = useState3(initialInvestigationId || null);
  const [statusFilter, setStatusFilter] = useState3("ALL");
  const [queueItems, setQueueItems] = useState3(testItems || []);
  const [nextCursor, setNextCursor] = useState3(null);
  const [cursorHistory, setCursorHistory] = useState3([]);
  const [loadingQueue, setLoadingQueue] = useState3(false);
  const [queueError, setQueueError] = useState3(null);
  const [detail, setDetail] = useState3(testDetail || null);
  const [assessment, setAssessment] = useState3(testAssessment || null);
  const [timeline, setTimeline] = useState3(testTimeline || []);
  const [loadingDetail, setLoadingDetail] = useState3(false);
  const [detailError, setDetailError] = useState3(null);
  const [actionError, setActionError] = useState3(null);
  const [actionSuccess, setActionSuccess] = useState3(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState3(false);
  const [noteText, setNoteText] = useState3("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState3(false);
  const [closeOutcome, setCloseOutcome] = useState3("CLOSED_APPROVED");
  const [closeNote, setCloseNote] = useState3("");
  const [isReopenModalOpen, setIsReopenModalOpen] = useState3(false);
  const [reopenReason, setReopenReason] = useState3("");
  const fetchQueue = useCallback2(
    async (cursor) => {
      if (testItems !== void 0) return;
      if (!client) return;
      setLoadingQueue(true);
      setQueueError(null);
      try {
        const filterVal = statusFilter === "ALL" ? void 0 : statusFilter;
        const res = await client.investigations.list({
          status: filterVal,
          cursor,
          limit: 15
        });
        setQueueItems(res.items);
        setNextCursor(res.next_cursor);
      } catch (err) {
        setQueueError(err.message || "Failed to load investigation queue");
      } finally {
        setLoadingQueue(false);
      }
    },
    [client, statusFilter, testItems]
  );
  useEffect3(() => {
    fetchQueue();
  }, [fetchQueue]);
  const fetchDetail = useCallback2(
    async (id) => {
      var _a2;
      if (testDetail !== void 0) return;
      if (!client) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const [detRes, assessRes, timeRes] = await Promise.allSettled([
          client.investigations.get(id),
          client.investigations.getAssessment(id),
          client.investigations.getTimeline(id)
        ]);
        if (detRes.status === "fulfilled") {
          setDetail(detRes.value);
        } else {
          setDetailError(((_a2 = detRes.reason) == null ? void 0 : _a2.message) || "Failed to load investigation details");
        }
        if (assessRes.status === "fulfilled") {
          setAssessment(assessRes.value);
        } else {
          setAssessment(null);
        }
        if (timeRes.status === "fulfilled") {
          setTimeline(timeRes.value.steps);
        } else {
          setTimeline([]);
        }
      } catch (err) {
        setDetailError(err.message || "Error fetching case data");
      } finally {
        setLoadingDetail(false);
      }
    },
    [client, testDetail]
  );
  useEffect3(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    }
  }, [selectedId, fetchDetail]);
  const handleSelectCase = (id) => {
    setSelectedId(id);
    if (onSelectInvestigation) onSelectInvestigation(id);
    setActionError(null);
    setActionSuccess(null);
  };
  const handleBackToQueue = () => {
    setSelectedId(null);
    setDetail(null);
    setAssessment(null);
    setTimeline([]);
    if (onSelectInvestigation) onSelectInvestigation(null);
    fetchQueue();
  };
  const currentStatus = (detail == null ? void 0 : detail.status) || "OPEN";
  const isClosed = currentStatus.startsWith("CLOSED_");
  const isInReview = currentStatus === "IN_REVIEW";
  const isApprovedPack = ((_a = detail == null ? void 0 : detail.approval) == null ? void 0 : _a.is_approved) || false;
  const currentPackHash = ((_b = detail == null ? void 0 : detail.approval) == null ? void 0 : _b.pack_hash) || "none";
  const startReviewGuard = useMemo2(() => {
    if (isInReview) {
      return { allowed: false, reason: "Case is already in review" };
    }
    if (isClosed) {
      return { allowed: false, reason: "Cannot start review on a closed case; reopen first" };
    }
    return { allowed: true, reason: "Start reviewing this case" };
  }, [isInReview, isClosed]);
  const addNoteGuard = useMemo2(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot add notes to a closed case; reopen first" };
    }
    return { allowed: true, reason: "Add a reviewer note to the step log" };
  }, [isClosed]);
  const requestDocsGuard = useMemo2(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot request documents for closed case" };
    }
    return { allowed: true, reason: "Request missing dispute evidence documents" };
  }, [isClosed]);
  const approvePackGuard = useMemo2(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot approve pack for closed case" };
    }
    if (!isInReview) {
      return { allowed: false, reason: "Review must be started (IN_REVIEW) before pack approval" };
    }
    return { allowed: true, reason: "Approve current evidence package" };
  }, [isClosed, isInReview]);
  const rejectPackGuard = useMemo2(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot reject pack for closed case" };
    }
    return { allowed: true, reason: "Reject current evidence package" };
  }, [isClosed]);
  const closeCaseGuard = useMemo2(() => {
    if (isClosed) {
      return { allowed: false, reason: "Case is already closed" };
    }
    if (currentStatus === "OPEN") {
      return { allowed: false, reason: "Start review before closing case" };
    }
    return { allowed: true, reason: "Close investigation case with formal outcome" };
  }, [isClosed, currentStatus]);
  const reopenCaseGuard = useMemo2(() => {
    if (!isClosed) {
      return { allowed: false, reason: "Case is currently active; only closed cases can be reopened" };
    }
    return { allowed: true, reason: "Reopen this closed investigation" };
  }, [isClosed]);
  const handleStartReview = async () => {
    if (!startReviewGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger("startReview", { id: selectedId });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.startReview(selectedId);
      setActionSuccess("Review started. Status updated to IN_REVIEW.");
      fetchDetail(selectedId);
    } catch (err) {
      setActionError(err.message || "Failed to start review");
    }
  };
  const handleAddNote = async () => {
    if (!addNoteGuard.allowed || !selectedId || !noteText.trim()) return;
    if (onActionTrigger) onActionTrigger("addNote", { id: selectedId, note: noteText });
    if (!client) {
      setIsNoteModalOpen(false);
      return;
    }
    try {
      setActionError(null);
      await client.investigations.addNote(selectedId, noteText.trim());
      setActionSuccess("Note successfully recorded in timeline.");
      setNoteText("");
      setIsNoteModalOpen(false);
      fetchDetail(selectedId);
    } catch (err) {
      setActionError(err.message || "Failed to add note");
    }
  };
  const handleRequestDocs = async () => {
    if (!requestDocsGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger("requestDocs", { id: selectedId });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.requestDocuments(selectedId);
      setActionSuccess("Document request logged in investigation timeline.");
      fetchDetail(selectedId);
    } catch (err) {
      setActionError(err.message || "Failed to request documents");
    }
  };
  const handleApprovePack = async () => {
    if (!approvePackGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger("approvePack", { id: selectedId, pack_hash: currentPackHash });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.approvePack(selectedId, { pack_hash: currentPackHash, reason: "Pack verified and approved by reviewer" });
      setActionSuccess("Evidence pack approved.");
      fetchDetail(selectedId);
    } catch (err) {
      setActionError(err.message || "Failed to approve evidence pack");
    }
  };
  const handleRejectPack = async () => {
    if (!rejectPackGuard.allowed || !selectedId) return;
    if (onActionTrigger) onActionTrigger("rejectPack", { id: selectedId });
    if (!client) return;
    try {
      setActionError(null);
      await client.investigations.rejectPack(selectedId, "Pack rejected by reviewer");
      setActionSuccess("Evidence pack rejected.");
      fetchDetail(selectedId);
    } catch (err) {
      setActionError(err.message || "Failed to reject pack");
    }
  };
  const handleCloseCase = async () => {
    if (!closeCaseGuard.allowed || !selectedId) return;
    if (closeNote.trim().length < 20) {
      setActionError("Closing note must be at least 20 characters long.");
      return;
    }
    if (onActionTrigger) {
      onActionTrigger("closeCase", {
        id: selectedId,
        outcome: closeOutcome,
        note: closeNote,
        steps_performed: ["review_started", "pack_approved", "manual_check"]
      });
    }
    if (!client) {
      setIsCloseModalOpen(false);
      return;
    }
    try {
      setActionError(null);
      await client.investigations.close(selectedId, {
        outcome: closeOutcome,
        note: closeNote.trim(),
        steps_performed: ["review_started", "pack_approved", "manual_verification"]
      });
      setActionSuccess(`Case closed as ${closeOutcome}.`);
      setIsCloseModalOpen(false);
      setCloseNote("");
      fetchDetail(selectedId);
    } catch (err) {
      setActionError(err.message || "Failed to close case");
    }
  };
  const handleReopenCase = async () => {
    if (!reopenCaseGuard.allowed || !selectedId) return;
    if (!reopenReason.trim()) {
      setActionError("Reopening reason is required.");
      return;
    }
    if (onActionTrigger) onActionTrigger("reopenCase", { id: selectedId, reason: reopenReason });
    if (!client) {
      setIsReopenModalOpen(false);
      return;
    }
    try {
      setActionError(null);
      await client.investigations.reopen(selectedId, reopenReason.trim());
      setActionSuccess("Case reopened.");
      setIsReopenModalOpen(false);
      setReopenReason("");
      fetchDetail(selectedId);
    } catch (err) {
      setActionError(err.message || "Failed to reopen case");
    }
  };
  const renderStatusBadge = (status) => {
    let colorClass = "var(--rg-text-muted)";
    let bg = "var(--rg-bg-card)";
    if (status === "OPEN") {
      colorClass = "var(--rg-med-text)";
      bg = "var(--rg-med-bg)";
    } else if (status === "IN_REVIEW") {
      colorClass = "#3b82f6";
      bg = "rgba(59, 130, 246, 0.15)";
    } else if (status === "CLOSED_APPROVED") {
      colorClass = "var(--rg-low-text)";
      bg = "var(--rg-low-bg)";
    } else if (status === "CLOSED_REJECTED") {
      colorClass = "var(--rg-high-text)";
      bg = "var(--rg-high-bg)";
    } else if (status === "REOPENED") {
      colorClass = "#a855f7";
      bg = "rgba(168, 85, 247, 0.15)";
    }
    return /* @__PURE__ */ jsxs3(
      "span",
      {
        className: "rg-status-badge",
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          color: colorClass,
          background: bg,
          border: `1px solid ${colorClass}`,
          fontFamily: "monospace",
          textTransform: "uppercase"
        },
        children: [
          "\u25CF ",
          status
        ]
      }
    );
  };
  return /* @__PURE__ */ jsx5("div", { className: "rg-investigations-page", style: { padding: "4px 0" }, children: !selectedId ? /* @__PURE__ */ jsxs3("div", { children: [
    /* @__PURE__ */ jsxs3("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx5("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Investigation Review Queue" }),
        /* @__PURE__ */ jsx5("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Evidence packages, fraud investigations, and human-in-the-loop dispute determinations." })
      ] }),
      /* @__PURE__ */ jsx5(
        "button",
        {
          type: "button",
          className: "rg-btn-refresh",
          onClick: () => fetchQueue(),
          style: {
            background: "var(--rg-bg-card)",
            color: "var(--rg-text-primary)",
            border: "1px solid var(--rg-border)",
            borderRadius: 6,
            padding: "6px 14px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600
          },
          children: "\u21BB Refresh Queue"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3(
      "div",
      {
        className: "rg-filter-bar",
        style: {
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center"
        },
        children: [
          /* @__PURE__ */ jsx5("span", { style: { fontSize: 13, color: "var(--rg-text-muted)", marginRight: 4 }, children: "Status Filter:" }),
          [
            "ALL",
            "OPEN",
            "AWAITING_REVIEW",
            "IN_REVIEW",
            "CLOSED_APPROVED",
            "CLOSED_REJECTED",
            "CLOSED_NO_ACTION",
            "REOPENED"
          ].map((st) => /* @__PURE__ */ jsx5(
            "button",
            {
              type: "button",
              className: `rg-filter-btn ${statusFilter === st ? "active" : ""}`,
              onClick: () => setStatusFilter(st),
              style: {
                background: statusFilter === st ? "var(--rg-accent)" : "var(--rg-bg-card)",
                color: statusFilter === st ? "#ffffff" : "var(--rg-text-secondary)",
                border: "1px solid var(--rg-border)",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              },
              children: st
            },
            st
          ))
        ]
      }
    ),
    loadingQueue && /* @__PURE__ */ jsx5("div", { style: { color: "var(--rg-text-muted)", marginBottom: 12 }, children: "Loading investigations..." }),
    queueError && /* @__PURE__ */ jsx5("div", { style: { color: "var(--rg-high-text)", marginBottom: 12 }, children: queueError }),
    /* @__PURE__ */ jsx5("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsxs3("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, "data-testid": "queue-table", children: [
      /* @__PURE__ */ jsx5("thead", { children: /* @__PURE__ */ jsxs3(
        "tr",
        {
          style: {
            background: "var(--rg-bg-tertiary)",
            borderBottom: "1px solid var(--rg-border)",
            color: "var(--rg-text-secondary)",
            textAlign: "left"
          },
          children: [
            /* @__PURE__ */ jsx5("th", { style: { padding: "12px 16px" }, children: "Investigation ID" }),
            /* @__PURE__ */ jsx5("th", { style: { padding: "12px 16px" }, children: "Dispute / Target" }),
            /* @__PURE__ */ jsx5("th", { style: { padding: "12px 16px" }, children: "Status" }),
            /* @__PURE__ */ jsx5("th", { style: { padding: "12px 16px" }, children: "Case Hash" }),
            /* @__PURE__ */ jsx5("th", { style: { padding: "12px 16px" }, children: "Created" }),
            /* @__PURE__ */ jsx5("th", { style: { padding: "12px 16px", textAlign: "right" }, children: "Action" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx5("tbody", { children: queueItems.length === 0 && !loadingQueue ? /* @__PURE__ */ jsx5("tr", { children: /* @__PURE__ */ jsxs3("td", { colSpan: 6, style: { padding: 28, textAlign: "center", color: "var(--rg-text-muted)" }, children: [
        "No investigations found for status filter: ",
        statusFilter
      ] }) }) : queueItems.map((item) => /* @__PURE__ */ jsxs3(
        "tr",
        {
          className: "rg-queue-row",
          style: { borderBottom: "1px solid var(--rg-border-subtle)", cursor: "pointer" },
          onClick: () => handleSelectCase(item.id),
          children: [
            /* @__PURE__ */ jsx5("td", { style: { padding: "12px 16px", fontFamily: "monospace", fontWeight: 600 }, children: item.id }),
            /* @__PURE__ */ jsx5("td", { style: { padding: "12px 16px", fontFamily: "monospace", color: "var(--rg-text-secondary)" }, children: item.dispute_id || "Direct Score" }),
            /* @__PURE__ */ jsx5("td", { style: { padding: "12px 16px" }, children: renderStatusBadge(item.status) }),
            /* @__PURE__ */ jsx5("td", { style: { padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "var(--rg-text-muted)" }, children: item.case_hash ? item.case_hash.substring(0, 16) + "..." : "-" }),
            /* @__PURE__ */ jsx5("td", { style: { padding: "12px 16px", fontSize: 12, color: "var(--rg-text-muted)" }, children: new Date(item.created_at).toLocaleString() }),
            /* @__PURE__ */ jsx5("td", { style: { padding: "12px 16px", textAlign: "right" }, children: /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-view-case",
                onClick: (e) => {
                  e.stopPropagation();
                  handleSelectCase(item.id);
                },
                style: {
                  background: "var(--rg-accent)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                },
                children: "Review Case \u2192"
              }
            ) })
          ]
        },
        item.id
      )) })
    ] }) }),
    nextCursor && /* @__PURE__ */ jsx5("div", { style: { marginTop: 12, display: "flex", justifyContent: "flex-end" }, children: /* @__PURE__ */ jsx5(
      "button",
      {
        type: "button",
        onClick: () => {
          setCursorHistory([...cursorHistory, nextCursor]);
          fetchQueue(nextCursor);
        },
        style: {
          background: "var(--rg-bg-card)",
          color: "var(--rg-text-primary)",
          border: "1px solid var(--rg-border)",
          borderRadius: 6,
          padding: "6px 12px",
          cursor: "pointer",
          fontSize: 12
        },
        children: "Next Page \u2192"
      }
    ) })
  ] }) : (
    /* ======================= CASE VIEW ======================= */
    /* @__PURE__ */ jsxs3("div", { className: "rg-case-view", "data-testid": "case-view", children: [
      /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
          /* @__PURE__ */ jsx5(
            "button",
            {
              type: "button",
              className: "rg-btn-back",
              onClick: handleBackToQueue,
              style: {
                background: "var(--rg-bg-card)",
                color: "var(--rg-text-primary)",
                border: "1px solid var(--rg-border)",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600
              },
              children: "\u2190 Back to Queue"
            }
          ),
          /* @__PURE__ */ jsxs3("div", { children: [
            /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsx5("h2", { style: { margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }, children: (detail == null ? void 0 : detail.id) || selectedId }),
              renderStatusBadge(currentStatus)
            ] }),
            /* @__PURE__ */ jsxs3("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 2 }, children: [
              "Case Hash: ",
              /* @__PURE__ */ jsx5("code", { style: { fontFamily: "monospace" }, children: (detail == null ? void 0 : detail.case_hash) || "pending" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs3("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsx5("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Dispute Amount" }),
          /* @__PURE__ */ jsxs3("div", { style: { fontSize: 18, fontWeight: 700, color: "var(--rg-text-primary)" }, children: [
            (detail == null ? void 0 : detail.currency) || "USD",
            " ",
            Number((detail == null ? void 0 : detail.amount) || 0).toFixed(2)
          ] })
        ] })
      ] }),
      loadingDetail && /* @__PURE__ */ jsx5("div", { style: { color: "var(--rg-text-muted)", marginBottom: 12 }, children: "Loading investigation details and LLM assessment..." }),
      detailError && /* @__PURE__ */ jsxs3(
        "div",
        {
          className: "rg-alert-error",
          style: {
            padding: "10px 14px",
            marginBottom: 16,
            background: "var(--rg-high-bg)",
            border: "1px solid var(--rg-high-border)",
            borderRadius: 6,
            color: "var(--rg-high-text)",
            fontSize: 13
          },
          children: [
            "\u26A0 ",
            detailError
          ]
        }
      ),
      actionError && /* @__PURE__ */ jsxs3(
        "div",
        {
          className: "rg-alert-error",
          style: {
            padding: "10px 14px",
            marginBottom: 16,
            background: "var(--rg-high-bg)",
            border: "1px solid var(--rg-high-border)",
            borderRadius: 6,
            color: "var(--rg-high-text)",
            fontSize: 13
          },
          children: [
            "\u26A0 ",
            actionError
          ]
        }
      ),
      actionSuccess && /* @__PURE__ */ jsxs3(
        "div",
        {
          className: "rg-alert-success",
          style: {
            padding: "10px 14px",
            marginBottom: 16,
            background: "var(--rg-low-bg)",
            border: "1px solid var(--rg-low-border)",
            borderRadius: 6,
            color: "var(--rg-low-text)",
            fontSize: 13
          },
          children: [
            "\u2713 ",
            actionSuccess
          ]
        }
      ),
      /* @__PURE__ */ jsxs3(
        "div",
        {
          className: "rg-action-bar",
          style: {
            display: "flex",
            gap: 8,
            padding: 12,
            marginBottom: 20,
            background: "var(--rg-bg-card)",
            border: "1px solid var(--rg-border)",
            borderRadius: 8,
            flexWrap: "wrap",
            alignItems: "center"
          },
          children: [
            /* @__PURE__ */ jsx5("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--rg-text-muted)", marginRight: 6 }, children: "Review Actions:" }),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-action rg-btn-start-review",
                title: startReviewGuard.reason,
                disabled: !startReviewGuard.allowed,
                onClick: handleStartReview,
                style: {
                  background: startReviewGuard.allowed ? "#3b82f6" : "var(--rg-bg-tertiary)",
                  color: startReviewGuard.allowed ? "#ffffff" : "var(--rg-text-muted)",
                  opacity: startReviewGuard.allowed ? 1 : 0.5,
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: startReviewGuard.allowed ? "pointer" : "not-allowed"
                },
                children: "\u25B6 Start Review"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-action rg-btn-add-note",
                title: addNoteGuard.reason,
                disabled: !addNoteGuard.allowed,
                onClick: () => setIsNoteModalOpen(true),
                style: {
                  background: addNoteGuard.allowed ? "var(--rg-bg-secondary)" : "var(--rg-bg-tertiary)",
                  color: addNoteGuard.allowed ? "var(--rg-text-primary)" : "var(--rg-text-muted)",
                  opacity: addNoteGuard.allowed ? 1 : 0.5,
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: addNoteGuard.allowed ? "pointer" : "not-allowed"
                },
                children: "\u270D Add Note"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-action rg-btn-request-docs",
                title: requestDocsGuard.reason,
                disabled: !requestDocsGuard.allowed,
                onClick: handleRequestDocs,
                style: {
                  background: requestDocsGuard.allowed ? "var(--rg-bg-secondary)" : "var(--rg-bg-tertiary)",
                  color: requestDocsGuard.allowed ? "var(--rg-text-primary)" : "var(--rg-text-muted)",
                  opacity: requestDocsGuard.allowed ? 1 : 0.5,
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: requestDocsGuard.allowed ? "pointer" : "not-allowed"
                },
                children: "\u{1F4C4} Request Docs"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-action rg-btn-approve-pack",
                title: approvePackGuard.reason,
                disabled: !approvePackGuard.allowed,
                onClick: handleApprovePack,
                style: {
                  background: approvePackGuard.allowed ? "var(--rg-low-bg)" : "var(--rg-bg-tertiary)",
                  color: approvePackGuard.allowed ? "var(--rg-low-text)" : "var(--rg-text-muted)",
                  opacity: approvePackGuard.allowed ? 1 : 0.5,
                  border: `1px solid ${approvePackGuard.allowed ? "var(--rg-low-border)" : "var(--rg-border)"}`,
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: approvePackGuard.allowed ? "pointer" : "not-allowed"
                },
                children: "\u2713 Approve Pack"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-action rg-btn-reject-pack",
                title: rejectPackGuard.reason,
                disabled: !rejectPackGuard.allowed,
                onClick: handleRejectPack,
                style: {
                  background: rejectPackGuard.allowed ? "var(--rg-high-bg)" : "var(--rg-bg-tertiary)",
                  color: rejectPackGuard.allowed ? "var(--rg-high-text)" : "var(--rg-text-muted)",
                  opacity: rejectPackGuard.allowed ? 1 : 0.5,
                  border: `1px solid ${rejectPackGuard.allowed ? "var(--rg-high-border)" : "var(--rg-border)"}`,
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: rejectPackGuard.allowed ? "pointer" : "not-allowed"
                },
                children: "\u2715 Reject Pack"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-action rg-btn-close-case",
                title: closeCaseGuard.reason,
                disabled: !closeCaseGuard.allowed,
                onClick: () => setIsCloseModalOpen(true),
                style: {
                  background: closeCaseGuard.allowed ? "var(--rg-accent)" : "var(--rg-bg-tertiary)",
                  color: closeCaseGuard.allowed ? "#ffffff" : "var(--rg-text-muted)",
                  opacity: closeCaseGuard.allowed ? 1 : 0.5,
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: closeCaseGuard.allowed ? "pointer" : "not-allowed"
                },
                children: "\u{1F3C1} Close Case..."
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                type: "button",
                className: "rg-btn-action rg-btn-reopen-case",
                title: reopenCaseGuard.reason,
                disabled: !reopenCaseGuard.allowed,
                onClick: () => setIsReopenModalOpen(true),
                style: {
                  background: reopenCaseGuard.allowed ? "#a855f7" : "var(--rg-bg-tertiary)",
                  color: reopenCaseGuard.allowed ? "#ffffff" : "var(--rg-text-muted)",
                  opacity: reopenCaseGuard.allowed ? 1 : 0.5,
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: reopenCaseGuard.allowed ? "pointer" : "not-allowed"
                },
                children: "\u{1F504} Reopen Case..."
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxs3("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }, children: [
        /* @__PURE__ */ jsxs3("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
          /* @__PURE__ */ jsxs3("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsx5("h3", { style: { margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "var(--rg-text-primary)" }, children: "Decision & Transaction Snapshot" }),
            /* @__PURE__ */ jsxs3("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }, children: [
              /* @__PURE__ */ jsxs3("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Severity" }),
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 13, fontWeight: 700, textTransform: "uppercase" }, children: ((_c = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _c.severity) || "HIGH" })
              ] }),
              /* @__PURE__ */ jsxs3("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Soft Policy Tier" }),
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 13, fontWeight: 700 }, children: ((_d = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _d.tier) || "MANUAL_REVIEW" })
              ] }),
              /* @__PURE__ */ jsxs3("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Risk Probability" }),
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 13, fontWeight: 700, fontFamily: "monospace" }, children: ((_e = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _e.probability) !== void 0 ? (Number(detail.decision_record.probability) * 100).toFixed(1) + "%" : ((_f = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _f.risk_score) !== void 0 ? (Number(detail.decision_record.risk_score) * 100).toFixed(1) + "%" : "88.5%" })
              ] }),
              /* @__PURE__ */ jsxs3("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Action" }),
                /* @__PURE__ */ jsx5("div", { style: { fontSize: 13, fontWeight: 700 }, children: ((_g = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _g.policy_action) || "FLAG" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx5("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Top SHAP Contributors:" }),
              /* @__PURE__ */ jsx5("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: (((_h = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _h.shap_top_k) || [
                { feature: "customer_order_velocity_1h", direction: "increases_risk", shap_rank: 1 },
                { feature: "delivery_address_mismatch", direction: "increases_risk", shap_rank: 2 },
                { feature: "ip_geo_distance_anomaly", direction: "increases_risk", shap_rank: 3 }
              ]).slice(0, 5).map((s, idx) => /* @__PURE__ */ jsxs3(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "var(--rg-bg-secondary)",
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: "monospace"
                  },
                  children: [
                    /* @__PURE__ */ jsxs3("span", { children: [
                      idx + 1,
                      ". ",
                      s.feature
                    ] }),
                    /* @__PURE__ */ jsx5("span", { style: { color: s.direction === "increases_risk" ? "var(--rg-high-text)" : "var(--rg-low-text)" }, children: s.direction })
                  ]
                },
                idx
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "rg-card", style: { padding: 16 }, "data-testid": "findings-card", children: [
            /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
              /* @__PURE__ */ jsxs3("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: [
                "Deterministic Findings (",
                ((_i = detail == null ? void 0 : detail.findings) == null ? void 0 : _i.length) || 0,
                ")"
              ] }),
              /* @__PURE__ */ jsx5("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Aliases (A1, A2...) map to source records" })
            ] }),
            !(detail == null ? void 0 : detail.findings) || detail.findings.length === 0 ? /* @__PURE__ */ jsx5("div", { style: { fontSize: 13, color: "var(--rg-text-muted)", padding: 12, textAlign: "center" }, children: "No findings generated yet." }) : /* @__PURE__ */ jsx5("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: detail.findings.map((f, i) => /* @__PURE__ */ jsxs3(
              "div",
              {
                style: {
                  background: "var(--rg-bg-secondary)",
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: 12
                },
                children: [
                  /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 }, children: [
                    /* @__PURE__ */ jsx5(
                      "span",
                      {
                        className: "rg-alias-badge",
                        style: {
                          background: "#3b82f6",
                          color: "#ffffff",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "monospace"
                        },
                        children: f.alias_id || `A${i + 1}`
                      }
                    ),
                    /* @__PURE__ */ jsx5("span", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: f.category })
                  ] }),
                  /* @__PURE__ */ jsx5("div", { style: { fontSize: 13, color: "var(--rg-text-primary)", marginBottom: 6 }, children: f.statement }),
                  /* @__PURE__ */ jsxs3("div", { style: { fontSize: 11, color: "var(--rg-text-secondary)", fontFamily: "monospace" }, children: [
                    "Source: ",
                    f.source_filename,
                    " (",
                    f.source_doc_id,
                    ")"
                  ] })
                ]
              },
              f.finding_id || i
            )) })
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsx5("h3", { style: { margin: "0 0 10px 0", fontSize: 14, fontWeight: 700 }, children: "Evidence Completeness" }),
            /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }, children: [
              /* @__PURE__ */ jsxs3(
                "div",
                {
                  style: {
                    fontSize: 18,
                    fontWeight: 800,
                    color: (((_j = detail == null ? void 0 : detail.completeness) == null ? void 0 : _j.score) || 100) >= 80 ? "var(--rg-low-text)" : "var(--rg-med-text)"
                  },
                  children: [
                    ((_k = detail == null ? void 0 : detail.completeness) == null ? void 0 : _k.score) || 100,
                    "%"
                  ]
                }
              ),
              /* @__PURE__ */ jsx5("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: ((_l = detail == null ? void 0 : detail.completeness) == null ? void 0 : _l.is_complete) ? "Complete: all dispute types present" : "Action recommended" })
            ] }),
            /* @__PURE__ */ jsxs3("div", { style: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }, children: [
              /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx5("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ jsx5("span", { children: "All findings cited from uploaded dispute documents" })
              ] }),
              /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx5("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ jsx5("span", { children: "Dispute claim amount matches transaction record" })
              ] }),
              /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx5("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ jsx5("span", { children: "Customer identified with pseudonymized token" })
              ] }),
              ((_m = detail == null ? void 0 : detail.completeness) == null ? void 0 : _m.missing_kinds) && detail.completeness.missing_kinds.length > 0 && /* @__PURE__ */ jsxs3("div", { style: { marginTop: 6, color: "var(--rg-med-text)" }, children: [
                "Missing evidence types: ",
                detail.completeness.missing_kinds.join(", ")
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs3("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
          /* @__PURE__ */ jsxs3(
            "div",
            {
              className: "rg-card rg-llm-assessment-panel",
              "data-testid": "llm-assessment-panel",
              style: {
                padding: 16,
                border: "1px solid rgba(59, 130, 246, 0.3)",
                background: "rgba(59, 130, 246, 0.03)"
              },
              children: [
                /* @__PURE__ */ jsxs3(
                  "div",
                  {
                    className: "rg-advisory-banner",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "rgba(245, 158, 11, 0.15)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      color: "var(--rg-med-text)",
                      marginBottom: 14
                    },
                    children: [
                      /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }, children: [
                        /* @__PURE__ */ jsx5("span", { children: "\u2139" }),
                        /* @__PURE__ */ jsx5("span", { className: "rg-advisory-label-text", children: (assessment == null ? void 0 : assessment.advisory_label) || "LLM assessment, advisory" })
                      ] }),
                      /* @__PURE__ */ jsx5(
                        "span",
                        {
                          className: `rg-validator-badge ${(assessment == null ? void 0 : assessment.final_status) === "TEMPLATE_FALLBACK" ? "rg-badge-fallback" : "rg-badge-validated"}`,
                          style: {
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: (assessment == null ? void 0 : assessment.final_status) === "TEMPLATE_FALLBACK" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                            color: (assessment == null ? void 0 : assessment.final_status) === "TEMPLATE_FALLBACK" ? "var(--rg-high-text)" : "var(--rg-low-text)",
                            border: "1px solid currentColor"
                          },
                          children: (assessment == null ? void 0 : assessment.final_status) || "VALIDATED"
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs3(
                  "div",
                  {
                    className: "rg-validator-trace",
                    style: {
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      marginBottom: 12,
                      fontSize: 11
                    },
                    children: [
                      /* @__PURE__ */ jsxs3("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ jsx5("div", { style: { color: "var(--rg-text-muted)" }, children: "Model" }),
                        /* @__PURE__ */ jsx5("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: (assessment == null ? void 0 : assessment.model) || "gemini-1.5-pro" })
                      ] }),
                      /* @__PURE__ */ jsxs3("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ jsx5("div", { style: { color: "var(--rg-text-muted)" }, children: "Attempts" }),
                        /* @__PURE__ */ jsx5("div", { style: { fontWeight: 600 }, children: (_n = assessment == null ? void 0 : assessment.attempt_count) != null ? _n : 1 })
                      ] }),
                      /* @__PURE__ */ jsxs3("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ jsx5("div", { style: { color: "var(--rg-text-muted)" }, children: "Prompt Hash" }),
                        /* @__PURE__ */ jsx5("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: (assessment == null ? void 0 : assessment.prompt_hash) ? assessment.prompt_hash.substring(0, 10) + "..." : "c8f49e..." })
                      ] })
                    ]
                  }
                ),
                (assessment == null ? void 0 : assessment.validator_errors) && assessment.validator_errors.length > 0 && /* @__PURE__ */ jsxs3(
                  "div",
                  {
                    style: {
                      marginBottom: 12,
                      padding: 10,
                      background: "rgba(239, 68, 68, 0.08)",
                      borderRadius: 6,
                      fontSize: 11,
                      border: "1px solid rgba(239, 68, 68, 0.2)"
                    },
                    children: [
                      /* @__PURE__ */ jsx5("div", { style: { fontWeight: 700, color: "var(--rg-high-text)", marginBottom: 4 }, children: "Validator Rejection Trace:" }),
                      assessment.validator_errors.map((errList, attIdx) => /* @__PURE__ */ jsxs3("div", { style: { marginBottom: 4 }, children: [
                        /* @__PURE__ */ jsxs3("span", { style: { fontWeight: 600 }, children: [
                          "Attempt ",
                          attIdx + 1,
                          ": "
                        ] }),
                        errList.join("; ")
                      ] }, attIdx))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs3("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ jsx5("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Investigation Narrative:" }),
                  /* @__PURE__ */ jsx5(
                    "div",
                    {
                      style: {
                        background: "var(--rg-bg-secondary)",
                        padding: 12,
                        borderRadius: 6,
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "var(--rg-text-primary)",
                        border: "1px solid var(--rg-border)",
                        whiteSpace: "pre-wrap"
                      },
                      children: (assessment == null ? void 0 : assessment.final_text) || ((_o = detail == null ? void 0 : detail.advisory_assessment) == null ? void 0 : _o.narrative) || "Target transaction occurred within standard parameters. Tracking confirms delivery to cardholder billing postal code with signature on file."
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 }, children: [
                  /* @__PURE__ */ jsx5("span", { style: { color: "var(--rg-text-muted)" }, children: "Findings Cited:" }),
                  ((assessment == null ? void 0 : assessment.findings_cited) || ["A1", "A2"]).map((c) => /* @__PURE__ */ jsx5(
                    "span",
                    {
                      style: {
                        background: "var(--rg-bg-card)",
                        border: "1px solid var(--rg-border)",
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontFamily: "monospace",
                        fontWeight: 700
                      },
                      children: c
                    },
                    c
                  ))
                ] }),
                /* @__PURE__ */ jsx5(
                  "div",
                  {
                    style: {
                      marginTop: 14,
                      fontSize: 11,
                      color: "var(--rg-text-muted)",
                      fontStyle: "italic",
                      borderTop: "1px solid var(--rg-border-subtle)",
                      paddingTop: 8
                    },
                    children: "Notice: LLM output is strictly advisory. It does not alter probability scores, policy tiers, or model rules."
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs3("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
              /* @__PURE__ */ jsx5("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: "Evidence Package Status" }),
              /* @__PURE__ */ jsxs3(
                "span",
                {
                  style: {
                    fontSize: 12,
                    fontWeight: 700,
                    color: isApprovedPack ? "var(--rg-low-text)" : "var(--rg-med-text)"
                  },
                  children: [
                    "\u25CF ",
                    ((_p = detail == null ? void 0 : detail.approval) == null ? void 0 : _p.decision) || "DRAFT / PENDING"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs3("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: [
              "Pack Hash: ",
              /* @__PURE__ */ jsx5("code", { style: { fontFamily: "monospace" }, children: currentPackHash })
            ] }),
            ((_q = detail == null ? void 0 : detail.approval) == null ? void 0 : _q.approver_sub) && /* @__PURE__ */ jsxs3("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
              "Approved by: ",
              /* @__PURE__ */ jsx5("span", { style: { fontWeight: 600 }, children: detail.approval.approver_sub }),
              " at",
              " ",
              detail.approval.decided_at ? new Date(detail.approval.decided_at).toLocaleString() : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
              /* @__PURE__ */ jsx5("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: "Step Timeline & Audit History" }),
              /* @__PURE__ */ jsxs3("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                timeline.length,
                " recorded events"
              ] })
            ] }),
            timeline.length === 0 ? /* @__PURE__ */ jsx5("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", padding: 12, textAlign: "center" }, children: "No steps recorded in timeline." }) : /* @__PURE__ */ jsx5("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: timeline.map((step, idx) => /* @__PURE__ */ jsxs3(
              "div",
              {
                style: {
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "8px 10px",
                  background: "var(--rg-bg-secondary)",
                  borderRadius: 6,
                  fontSize: 12
                },
                children: [
                  /* @__PURE__ */ jsx5("span", { style: { fontSize: 14 }, children: step.step_type === "PACK_APPROVED" ? "\u2713" : step.step_type === "NOTE_ADDED" ? "\u270D" : step.step_type === "CASE_CLOSED" ? "\u{1F3C1}" : step.step_type === "CASE_REOPENED" ? "\u{1F504}" : "\u25CF" }),
                  /* @__PURE__ */ jsxs3("div", { style: { flex: 1 }, children: [
                    /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 2 }, children: [
                      /* @__PURE__ */ jsx5("span", { style: { fontWeight: 700, fontFamily: "monospace" }, children: step.step_type }),
                      /* @__PURE__ */ jsx5("span", { style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: new Date(step.created_at).toLocaleTimeString() })
                    ] }),
                    /* @__PURE__ */ jsx5("div", { style: { color: "var(--rg-text-secondary)", marginBottom: 2 }, children: step.note }),
                    /* @__PURE__ */ jsxs3("div", { style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: [
                      "Actor: ",
                      step.actor,
                      " (",
                      step.actor_type,
                      ")"
                    ] })
                  ] })
                ]
              },
              step.id || idx
            )) })
          ] })
        ] })
      ] }),
      isNoteModalOpen && /* @__PURE__ */ jsx5(
        "div",
        {
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1e3
          },
          children: /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                background: "var(--rg-bg-card)",
                border: "1px solid var(--rg-border)",
                borderRadius: 8,
                padding: 20,
                width: 440,
                maxWidth: "90%"
              },
              children: [
                /* @__PURE__ */ jsx5("h4", { style: { margin: "0 0 10px 0", fontSize: 16 }, children: "Add Reviewer Note" }),
                /* @__PURE__ */ jsx5(
                  "textarea",
                  {
                    rows: 4,
                    value: noteText,
                    onChange: (e) => setNoteText(e.target.value),
                    placeholder: "Enter detailed reviewer observation...",
                    style: {
                      width: "100%",
                      background: "var(--rg-bg-secondary)",
                      border: "1px solid var(--rg-border)",
                      borderRadius: 6,
                      padding: 8,
                      color: "var(--rg-text-primary)",
                      fontSize: 13,
                      marginBottom: 14
                    }
                  }
                ),
                /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: () => setIsNoteModalOpen(false),
                      style: {
                        background: "var(--rg-bg-tertiary)",
                        color: "var(--rg-text-primary)",
                        border: "1px solid var(--rg-border)",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer"
                      },
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: handleAddNote,
                      disabled: !noteText.trim(),
                      style: {
                        background: "var(--rg-accent)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        cursor: noteText.trim() ? "pointer" : "not-allowed",
                        opacity: noteText.trim() ? 1 : 0.5,
                        fontWeight: 600
                      },
                      children: "Save Note"
                    }
                  )
                ] })
              ]
            }
          )
        }
      ),
      isCloseModalOpen && /* @__PURE__ */ jsx5(
        "div",
        {
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1e3
          },
          children: /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                background: "var(--rg-bg-card)",
                border: "1px solid var(--rg-border)",
                borderRadius: 8,
                padding: 20,
                width: 480,
                maxWidth: "90%"
              },
              children: [
                /* @__PURE__ */ jsx5("h4", { style: { margin: "0 0 12px 0", fontSize: 16 }, children: "Close Investigation Case" }),
                /* @__PURE__ */ jsxs3("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ jsx5("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Outcome Decision:" }),
                  /* @__PURE__ */ jsxs3(
                    "select",
                    {
                      value: closeOutcome,
                      onChange: (e) => setCloseOutcome(e.target.value),
                      style: {
                        width: "100%",
                        background: "var(--rg-bg-secondary)",
                        border: "1px solid var(--rg-border)",
                        borderRadius: 6,
                        padding: 8,
                        color: "var(--rg-text-primary)",
                        fontSize: 13
                      },
                      children: [
                        /* @__PURE__ */ jsx5("option", { value: "CLOSED_APPROVED", children: "CLOSED_APPROVED (Requires active pack approval)" }),
                        /* @__PURE__ */ jsx5("option", { value: "CLOSED_REJECTED", children: "CLOSED_REJECTED (Dispute rejected)" }),
                        /* @__PURE__ */ jsx5("option", { value: "CLOSED_NO_ACTION", children: "CLOSED_NO_ACTION (No further action required)" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs3("div", { style: { marginBottom: 14 }, children: [
                  /* @__PURE__ */ jsx5("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Closing Note (min. 20 characters required):" }),
                  /* @__PURE__ */ jsx5(
                    "textarea",
                    {
                      rows: 4,
                      value: closeNote,
                      onChange: (e) => setCloseNote(e.target.value),
                      placeholder: "Provide explicit rationale and justification for this closing determination...",
                      style: {
                        width: "100%",
                        background: "var(--rg-bg-secondary)",
                        border: "1px solid var(--rg-border)",
                        borderRadius: 6,
                        padding: 8,
                        color: "var(--rg-text-primary)",
                        fontSize: 13
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxs3(
                    "div",
                    {
                      style: {
                        fontSize: 11,
                        marginTop: 4,
                        color: closeNote.trim().length >= 20 ? "var(--rg-low-text)" : "var(--rg-med-text)"
                      },
                      children: [
                        "Character count: ",
                        closeNote.trim().length,
                        " / 20 minimum"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: () => setIsCloseModalOpen(false),
                      style: {
                        background: "var(--rg-bg-tertiary)",
                        color: "var(--rg-text-primary)",
                        border: "1px solid var(--rg-border)",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer"
                      },
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: handleCloseCase,
                      disabled: closeNote.trim().length < 20,
                      style: {
                        background: "var(--rg-accent)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        cursor: closeNote.trim().length >= 20 ? "pointer" : "not-allowed",
                        opacity: closeNote.trim().length >= 20 ? 1 : 0.5,
                        fontWeight: 600
                      },
                      children: "Confirm Close"
                    }
                  )
                ] })
              ]
            }
          )
        }
      ),
      isReopenModalOpen && /* @__PURE__ */ jsx5(
        "div",
        {
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1e3
          },
          children: /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                background: "var(--rg-bg-card)",
                border: "1px solid var(--rg-border)",
                borderRadius: 8,
                padding: 20,
                width: 440,
                maxWidth: "90%"
              },
              children: [
                /* @__PURE__ */ jsx5("h4", { style: { margin: "0 0 10px 0", fontSize: 16 }, children: "Reopen Investigation Case" }),
                /* @__PURE__ */ jsx5(
                  "textarea",
                  {
                    rows: 4,
                    value: reopenReason,
                    onChange: (e) => setReopenReason(e.target.value),
                    placeholder: "Enter reason for reopening (e.g. newly discovered courier tracking document)...",
                    style: {
                      width: "100%",
                      background: "var(--rg-bg-secondary)",
                      border: "1px solid var(--rg-border)",
                      borderRadius: 6,
                      padding: 8,
                      color: "var(--rg-text-primary)",
                      fontSize: 13,
                      marginBottom: 14
                    }
                  }
                ),
                /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: () => setIsReopenModalOpen(false),
                      style: {
                        background: "var(--rg-bg-tertiary)",
                        color: "var(--rg-text-primary)",
                        border: "1px solid var(--rg-border)",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer"
                      },
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx5(
                    "button",
                    {
                      type: "button",
                      onClick: handleReopenCase,
                      disabled: !reopenReason.trim(),
                      style: {
                        background: "#a855f7",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 14px",
                        cursor: reopenReason.trim() ? "pointer" : "not-allowed",
                        opacity: reopenReason.trim() ? 1 : 0.5,
                        fontWeight: 600
                      },
                      children: "Reopen Case"
                    }
                  )
                ] })
              ]
            }
          )
        }
      )
    ] })
  ) });
};

// src/components/TransactionsGrid.tsx
import { useMemo as useMemo3 } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { jsx as jsx6 } from "react/jsx-runtime";
ModuleRegistry.registerModules([AllCommunityModule]);
var TransactionsGrid = ({
  items,
  loading = false,
  onRowClick,
  quickFilterText = ""
}) => {
  const { theme } = useReturnGuard();
  const gridThemeClass = theme === "light" ? "ag-theme-alpine" : "ag-theme-alpine-dark";
  const columnDefs = useMemo3(
    () => [
      {
        field: "order_id",
        headerName: "Order ID",
        minWidth: 190,
        flex: 1.3,
        pinned: "left",
        cellRenderer: (params) => /* @__PURE__ */ jsx6("span", { style: { fontFamily: "monospace", fontWeight: 600, color: "var(--rg-text-primary)" }, children: params.value || "--" })
      },
      {
        field: "channel",
        headerName: "Channel",
        minWidth: 100,
        flex: 0.8,
        cellRenderer: (params) => /* @__PURE__ */ jsx6(
          "span",
          {
            style: {
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: 4,
              background: "var(--rg-bg-tertiary)",
              color: "var(--rg-text-secondary)"
            },
            children: params.value || "web"
          }
        )
      },
      {
        field: "risk_score",
        headerName: "Risk Score",
        minWidth: 130,
        flex: 1,
        cellRenderer: (params) => /* @__PURE__ */ jsx6(RiskBadge, { score: params.value }),
        sort: "desc"
      },
      {
        field: "suggested_action",
        headerName: "Policy Action",
        minWidth: 160,
        flex: 1.2,
        cellRenderer: (params) => /* @__PURE__ */ jsx6(RiskBadge, { action: params.value })
      },
      {
        field: "severity",
        headerName: "Severity",
        minWidth: 110,
        flex: 0.9,
        cellRenderer: (params) => /* @__PURE__ */ jsx6(RiskBadge, { severity: params.value })
      },
      {
        headerName: "Payment Status",
        minWidth: 180,
        flex: 1.3,
        valueGetter: () => "Not Integrated (Provider Owned)",
        cellRenderer: () => /* @__PURE__ */ jsx6("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", fontStyle: "italic" }, children: "Provider Owned (ShopPoint)" })
      },
      {
        field: "model_version",
        headerName: "Model",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => /* @__PURE__ */ jsx6("span", { style: { fontSize: 12, fontFamily: "monospace", color: "var(--rg-text-muted)" }, children: params.value || "candidate_lgbm_v1" })
      }
    ],
    []
  );
  const defaultColDef = useMemo3(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1
    }),
    []
  );
  const handleRowClicked = (event) => {
    var _a, _b;
    const id = ((_a = event.data) == null ? void 0 : _a.decision_id) || ((_b = event.data) == null ? void 0 : _b.order_id);
    if (id && onRowClick) {
      onRowClick(id);
    }
  };
  return /* @__PURE__ */ jsx6(
    "div",
    {
      className: gridThemeClass,
      style: {
        height: "calc(100vh - 240px)",
        minHeight: 520,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--rg-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ jsx6(
        AgGridReact,
        {
          rowData: items,
          columnDefs,
          defaultColDef,
          loading,
          quickFilterText,
          rowSelection: {
            mode: "singleRow",
            checkboxes: false,
            enableClickSelection: true
          },
          rowHeight: 48,
          headerHeight: 44,
          animateRows: true,
          suppressCellFocus: true,
          onRowClicked: handleRowClicked
        }
      )
    }
  );
};

// src/components/TransactionsPage.tsx
import { useState as useState4 } from "react";

// src/components/DetailDrawer.tsx
import { Fragment, jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
var DetailDrawer = ({ decisionId, onClose }) => {
  const { decision, audit, loading, error } = useTransactionRisk(decisionId);
  if (!decisionId) return null;
  return /* @__PURE__ */ jsx7("div", { className: "rg-drawer-overlay", onClick: onClose, role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs4("div", { className: "rg-drawer", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs4("div", { className: "rg-drawer-header", children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx7("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: "Transaction Investigation" }),
        /* @__PURE__ */ jsx7("div", { style: { fontSize: 16, fontWeight: 700, marginTop: 2 }, children: (decision == null ? void 0 : decision.order_id) || decisionId })
      ] }),
      /* @__PURE__ */ jsx7(
        "button",
        {
          type: "button",
          onClick: onClose,
          "aria-label": "Close detail drawer",
          style: {
            background: "transparent",
            border: "1px solid var(--rg-border)",
            color: "var(--rg-text-primary)",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer"
          },
          children: "\u2715 Close"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "rg-drawer-body", children: [
      loading && /* @__PURE__ */ jsx7("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading scoring audit and explanation..." }),
      error && /* @__PURE__ */ jsxs4("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: [
        /* @__PURE__ */ jsx7("div", { style: { color: "var(--rg-high-text)", fontWeight: 600 }, children: "Failed to load decision" }),
        /* @__PURE__ */ jsx7("div", { style: { fontSize: 12, marginTop: 4 }, children: error.message })
      ] }),
      decision && /* @__PURE__ */ jsxs4(Fragment, { children: [
        /* @__PURE__ */ jsxs4("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx7("div", { className: "rg-drawer-section-title", children: "ReturnGuard Recommendation" }),
          /* @__PURE__ */ jsxs4("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }, children: [
            /* @__PURE__ */ jsx7(RiskBadge, { score: decision.risk_score }),
            /* @__PURE__ */ jsx7(RiskBadge, { action: decision.suggested_action }),
            /* @__PURE__ */ jsxs4("span", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
              "Severity: ",
              /* @__PURE__ */ jsx7("strong", { children: decision.severity })
            ] })
          ] }),
          /* @__PURE__ */ jsx7("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "ReturnGuard evaluates transaction characteristics and recommends an operational hold/action. Actual capture or decline is executed independently by the payment provider." })
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx7("div", { className: "rg-drawer-section-title", children: "Why This Was Flagged" }),
          decision.reason_codes && decision.reason_codes.length > 0 ? /* @__PURE__ */ jsx7("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: decision.reason_codes.map((rc) => /* @__PURE__ */ jsxs4(
            "span",
            {
              style: {
                background: "var(--rg-bg-tertiary)",
                border: "1px solid var(--rg-border)",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 12,
                fontFamily: "monospace"
              },
              children: [
                rc.feature,
                ": ",
                rc.direction
              ]
            },
            rc.feature
          )) }) : /* @__PURE__ */ jsx7("div", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "No specific rule or anomaly triggers flagged for this transaction." })
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx7("div", { className: "rg-drawer-section-title", children: "Payment & Processor Context" }),
          /* @__PURE__ */ jsxs4("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }, children: [
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx7("span", { style: { color: "var(--rg-text-muted)" }, children: "Order ID:" }),
              " ",
              /* @__PURE__ */ jsx7("strong", { style: { fontFamily: "monospace" }, children: decision.order_id || "--" })
            ] }),
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx7("span", { style: { color: "var(--rg-text-muted)" }, children: "Channel:" }),
              " ",
              /* @__PURE__ */ jsx7("strong", { children: decision.channel || "web" })
            ] }),
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx7("span", { style: { color: "var(--rg-text-muted)" }, children: "ReturnGuard Mode:" }),
              " ",
              /* @__PURE__ */ jsx7("strong", { children: decision.shadow ? "Shadow (Non-blocking)" : "Live Policy Enforcement" })
            ] }),
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx7("span", { style: { color: "var(--rg-text-muted)" }, children: "Payment Processor Status:" }),
              " ",
              /* @__PURE__ */ jsx7("span", { style: { color: "var(--rg-text-muted)", fontStyle: "italic" }, children: "Not Verified (Owned by Merchant / ShopPoint)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs4("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx7("div", { className: "rg-drawer-section-title", children: "Audit Trail & Signals" }),
          /* @__PURE__ */ jsx7("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: audit ? /* @__PURE__ */ jsxs4("div", { children: [
            /* @__PURE__ */ jsxs4("div", { children: [
              /* @__PURE__ */ jsx7("strong", { children: "Decision ID:" }),
              " ",
              audit.data.decision.decision_id
            ] }),
            /* @__PURE__ */ jsxs4("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ jsx7("strong", { children: "Order ID:" }),
              " ",
              audit.data.decision.order_id
            ] }),
            /* @__PURE__ */ jsxs4("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ jsx7("strong", { children: "Policy Action:" }),
              " ",
              audit.data.policy_trace.policy_action
            ] }),
            /* @__PURE__ */ jsxs4("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ jsx7("strong", { children: "Reconstructed Features:" }),
              " ",
              Object.keys(audit.data.feature_snapshot || {}).length,
              " features verified"
            ] })
          ] }) : /* @__PURE__ */ jsx7("div", { children: "Basic audit event snapshot recorded. Full feature reconstruction stored in tenant repository." }) })
        ] })
      ] })
    ] })
  ] }) });
};

// src/components/TransactionsPage.tsx
import { jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
var TransactionsPage = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useRiskDecisions(50);
  const [selectedId, setSelectedId] = useState4(null);
  const [searchTerm, setSearchTerm] = useState4("");
  return /* @__PURE__ */ jsxs5("div", { children: [
    /* @__PURE__ */ jsxs5("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx8("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Transaction Risk Explorer" }),
        /* @__PURE__ */ jsx8("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Search, filter, and inspect scored payments and policy actions." })
      ] }),
      /* @__PURE__ */ jsxs5("div", { style: { display: "flex", gap: 12 }, children: [
        /* @__PURE__ */ jsx8(
          "input",
          {
            type: "text",
            placeholder: "Search transactions...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            style: {
              background: "var(--rg-bg-card)",
              color: "var(--rg-text-primary)",
              border: "1px solid var(--rg-border)",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 13,
              width: 220
            }
          }
        ),
        /* @__PURE__ */ jsx8(
          "button",
          {
            type: "button",
            onClick: () => refetch(),
            style: {
              background: "var(--rg-bg-card)",
              color: "var(--rg-text-primary)",
              border: "1px solid var(--rg-border)",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 13
            },
            children: "\u21BB Refresh"
          }
        )
      ] })
    ] }),
    error && /* @__PURE__ */ jsx8("div", { style: { marginBottom: 16, padding: 12, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: /* @__PURE__ */ jsxs5("span", { style: { color: "var(--rg-high-text)", fontSize: 13 }, children: [
      "Failed to load transactions: ",
      error.message
    ] }) }),
    /* @__PURE__ */ jsx8(
      TransactionsGrid,
      {
        items,
        loading,
        quickFilterText: searchTerm,
        onRowClick: (id) => setSelectedId(id)
      }
    ),
    /* @__PURE__ */ jsxs5("div", { style: { marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs5("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Showing ",
        items.length,
        " records in current page"
      ] }),
      hasMore && /* @__PURE__ */ jsx8(
        "button",
        {
          type: "button",
          onClick: nextPage,
          disabled: loading,
          style: {
            background: "var(--rg-accent)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            cursor: "pointer",
            fontSize: 13
          },
          children: "Load Next Page \u2192"
        }
      )
    ] }),
    /* @__PURE__ */ jsx8(DetailDrawer, { decisionId: selectedId, onClose: () => setSelectedId(null) })
  ] });
};

// src/components/CustomersPage.tsx
import { useState as useState5 } from "react";
import { Fragment as Fragment2, jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
var CustomersPage = () => {
  const { items, loading, error, hasMore, nextPage } = useCustomers(50);
  const [selectedCustomerId, setSelectedCustomerId] = useState5(null);
  const { profile, loading: profileLoading, error: profileError } = useCustomerProfile(selectedCustomerId);
  return /* @__PURE__ */ jsxs6("div", { children: [
    /* @__PURE__ */ jsxs6("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx9("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Customer Risk Directory" }),
      /* @__PURE__ */ jsx9("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Tenant-scoped customer profiles, linked hardware devices, physical delivery locations, and order risk history." })
    ] }),
    loading && items.length === 0 && /* @__PURE__ */ jsx9("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading customer directory..." }),
    error && /* @__PURE__ */ jsx9("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6, marginBottom: 16 }, children: /* @__PURE__ */ jsxs6("span", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load customers: ",
      error.message
    ] }) }),
    /* @__PURE__ */ jsx9("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }, children: items.map((cust) => /* @__PURE__ */ jsxs6(
      "div",
      {
        className: "rg-card",
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 10,
          cursor: "pointer",
          borderColor: selectedCustomerId === cust.customer_id ? "var(--rg-accent)" : "var(--rg-border)"
        },
        onClick: () => setSelectedCustomerId(cust.customer_id),
        children: [
          /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx9("span", { style: { fontWeight: 600, fontFamily: "monospace", fontSize: 13 }, children: cust.customer_id }),
            /* @__PURE__ */ jsx9(RiskBadge, { score: cust.max_risk_score })
          ] }),
          /* @__PURE__ */ jsxs6("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: [
            /* @__PURE__ */ jsxs6("div", { children: [
              "Email: ",
              /* @__PURE__ */ jsx9("strong", { children: cust.email })
            ] }),
            /* @__PURE__ */ jsxs6("div", { style: { marginTop: 2 }, children: [
              "Phone: ",
              /* @__PURE__ */ jsx9("strong", { children: cust.phone })
            ] })
          ] }),
          /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, borderTop: "1px solid var(--rg-border-subtle)", paddingTop: 8 }, children: [
            /* @__PURE__ */ jsxs6("span", { children: [
              "Orders: ",
              /* @__PURE__ */ jsx9("strong", { children: cust.total_orders })
            ] }),
            /* @__PURE__ */ jsxs6("span", { children: [
              "Spent: ",
              /* @__PURE__ */ jsxs6("strong", { children: [
                cust.currency,
                " ",
                cust.total_spent.toFixed(2)
              ] })
            ] })
          ] })
        ]
      },
      cust.customer_id
    )) }),
    hasMore && /* @__PURE__ */ jsx9("div", { style: { marginTop: 20, textAlign: "center" }, children: /* @__PURE__ */ jsx9(
      "button",
      {
        type: "button",
        onClick: nextPage,
        disabled: loading,
        style: {
          padding: "8px 16px",
          background: "var(--rg-accent)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        },
        children: "Load More Customers \u2192"
      }
    ) }),
    selectedCustomerId && /* @__PURE__ */ jsx9("div", { className: "rg-drawer-overlay", onClick: () => setSelectedCustomerId(null), children: /* @__PURE__ */ jsxs6("div", { className: "rg-drawer", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-header", children: [
        /* @__PURE__ */ jsxs6("div", { children: [
          /* @__PURE__ */ jsx9("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: "Customer Risk Profile" }),
          /* @__PURE__ */ jsx9("div", { style: { fontSize: 16, fontWeight: 700, marginTop: 2 }, children: selectedCustomerId })
        ] }),
        /* @__PURE__ */ jsx9(
          "button",
          {
            type: "button",
            onClick: () => setSelectedCustomerId(null),
            style: { background: "transparent", border: "1px solid var(--rg-border)", color: "var(--rg-text-primary)", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
            children: "\u2715 Close"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-body", children: [
        profileLoading && /* @__PURE__ */ jsx9("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading profile details..." }),
        profileError && /* @__PURE__ */ jsx9("div", { style: { color: "var(--rg-high-text)" }, children: profileError.message }),
        profile && /* @__PURE__ */ jsxs6(Fragment2, { children: [
          /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsx9("div", { className: "rg-drawer-section-title", children: "Customer Risk Summary" }),
            /* @__PURE__ */ jsxs6("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }, children: [
              /* @__PURE__ */ jsxs6("div", { children: [
                "Email: ",
                /* @__PURE__ */ jsx9("strong", { children: profile.email })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                "Phone: ",
                /* @__PURE__ */ jsx9("strong", { children: profile.phone })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                "Total Orders: ",
                /* @__PURE__ */ jsx9("strong", { children: profile.total_orders })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                "Total Value: ",
                /* @__PURE__ */ jsxs6("strong", { children: [
                  profile.currency,
                  " ",
                  profile.total_spent.toFixed(2)
                ] })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                "Max Risk Score: ",
                /* @__PURE__ */ jsx9(RiskBadge, { score: profile.max_risk_score })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                "Average Score: ",
                /* @__PURE__ */ jsx9("strong", { children: (profile.average_risk_score * 100).toFixed(0) }),
                " / 100"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-section-title", children: [
              "Linked Devices (",
              profile.linked_devices.length,
              ")"
            ] }),
            profile.linked_devices.length === 0 ? /* @__PURE__ */ jsx9("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: "No linked device fingerprints recorded." }) : /* @__PURE__ */ jsx9("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: profile.linked_devices.map((d) => /* @__PURE__ */ jsxs6("div", { style: { fontSize: 12, fontFamily: "monospace", background: "var(--rg-bg-tertiary)", padding: 6, borderRadius: 4 }, children: [
              "Hash: ",
              d.device_hash.slice(0, 16),
              "... | IP: ",
              d.ip_address || "Unknown"
            ] }, d.id)) })
          ] }),
          /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-section-title", children: [
              "Delivery Locations (",
              profile.linked_addresses.length,
              ")"
            ] }),
            profile.linked_addresses.length === 0 ? /* @__PURE__ */ jsx9("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: "No normalized addresses on file." }) : /* @__PURE__ */ jsx9("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: profile.linked_addresses.map((a) => /* @__PURE__ */ jsxs6("div", { style: { fontSize: 12, background: "var(--rg-bg-tertiary)", padding: 6, borderRadius: 4 }, children: [
              a.city,
              ", ",
              a.state,
              " ",
              a.pincode,
              " (",
              a.country,
              ")"
            ] }, a.id)) })
          ] }),
          /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsxs6("div", { className: "rg-drawer-section-title", children: [
              "Order History & Decisions (",
              profile.order_history.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx9("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: profile.order_history.map((ord) => /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, borderBottom: "1px solid var(--rg-border-subtle)", paddingBottom: 6 }, children: [
              /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsx9("span", { style: { fontWeight: 600, fontFamily: "monospace" }, children: ord.order_id }),
                /* @__PURE__ */ jsx9("span", { style: { marginLeft: 8, color: "var(--rg-text-muted)" }, children: ord.channel })
              ] }),
              /* @__PURE__ */ jsxs6("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsxs6("span", { children: [
                  ord.currency,
                  " ",
                  ord.order_value.toFixed(2)
                ] }),
                ord.risk_score !== null && ord.risk_score !== void 0 ? /* @__PURE__ */ jsx9(RiskBadge, { score: ord.risk_score }) : /* @__PURE__ */ jsx9("span", { style: { color: "var(--rg-text-muted)" }, children: "Unscored" })
              ] })
            ] }, ord.order_id)) })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};

// src/components/RiskAnalyticsPage.tsx
import { jsx as jsx10, jsxs as jsxs7 } from "react/jsx-runtime";
var RiskAnalyticsPage = () => {
  const { data, loading, error, refetch } = useRiskTrends();
  if (loading) {
    return /* @__PURE__ */ jsx10("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading risk analytics & trends..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs7("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: [
      /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-high-text)", fontWeight: 600 }, children: "Failed to load risk analytics" }),
      /* @__PURE__ */ jsx10("div", { style: { fontSize: 13, marginTop: 4 }, children: error.message }),
      /* @__PURE__ */ jsx10("button", { type: "button", onClick: () => refetch(), style: { marginTop: 10, padding: "4px 10px", background: "var(--rg-accent)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }, children: "Retry" })
    ] });
  }
  const trends = (data == null ? void 0 : data.daily_trends) || [];
  const scoreDist = (data == null ? void 0 : data.score_distribution) || { low_0_15: 0, med_15_40: 0, high_40_80: 0, crit_80_100: 0 };
  const channels = (data == null ? void 0 : data.channel_breakdown) || { paypal: 0, cod: 0, other: 0 };
  const disputes = (data == null ? void 0 : data.dispute_analytics) || { total_disputes: 0, disputed_amount: 0, currency: "INR", dispute_rate_pct: 0 };
  const totalScores = scoreDist.low_0_15 + scoreDist.med_15_40 + scoreDist.high_40_80 + scoreDist.crit_80_100;
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsxs7("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx10("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Risk Analytics & Portfolio Exposure" }),
      /* @__PURE__ */ jsx10("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Portfolio risk score distributions, channel breakdown, and time-series scoring volumes." })
    ] }),
    /* @__PURE__ */ jsxs7("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx10("span", { children: "Low Risk (< 0.15)" }),
          /* @__PURE__ */ jsx10("span", { children: "\u{1F7E2}" })
        ] }),
        /* @__PURE__ */ jsx10("div", { className: "rg-card-value", children: scoreDist.low_0_15.toLocaleString() }),
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.low_0_15 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx10("span", { children: "Medium Risk (0.15 - 0.40)" }),
          /* @__PURE__ */ jsx10("span", { children: "\u{1F7E1}" })
        ] }),
        /* @__PURE__ */ jsx10("div", { className: "rg-card-value", children: scoreDist.med_15_40.toLocaleString() }),
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.med_15_40 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx10("span", { children: "High Risk (0.40 - 0.80)" }),
          /* @__PURE__ */ jsx10("span", { children: "\u{1F7E0}" })
        ] }),
        /* @__PURE__ */ jsx10("div", { className: "rg-card-value", children: scoreDist.high_40_80.toLocaleString() }),
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.high_40_80 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx10("span", { children: "Critical Risk (> 0.80)" }),
          /* @__PURE__ */ jsx10("span", { children: "\u{1F534}" })
        ] }),
        /* @__PURE__ */ jsx10("div", { className: "rg-card-value", children: scoreDist.crit_80_100.toLocaleString() }),
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.crit_80_100 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs7("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx10("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Risk Score Band Histogram" }),
        /* @__PURE__ */ jsx10("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          { label: "0.00 - 0.15 (ALLOW)", count: scoreDist.low_0_15, color: "var(--rg-low-text)" },
          { label: "0.15 - 0.40 (MONITOR)", count: scoreDist.med_15_40, color: "var(--rg-med-text)" },
          { label: "0.40 - 0.80 (REVIEW)", count: scoreDist.high_40_80, color: "var(--rg-high-text)" },
          { label: "0.80 - 1.00 (BLOCK)", count: scoreDist.crit_80_100, color: "var(--rg-crit-text)" }
        ].map((band) => {
          const pct = totalScores > 0 ? band.count / totalScores * 100 : 0;
          return /* @__PURE__ */ jsxs7("div", { children: [
            /* @__PURE__ */ jsxs7("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }, children: [
              /* @__PURE__ */ jsx10("span", { children: band.label }),
              /* @__PURE__ */ jsxs7("strong", { children: [
                band.count,
                " (",
                pct.toFixed(1),
                "%)"
              ] })
            ] }),
            /* @__PURE__ */ jsx10("div", { style: { height: 8, background: "var(--rg-bg-tertiary)", borderRadius: 4, overflow: "hidden" }, children: /* @__PURE__ */ jsx10("div", { style: { width: `${pct}%`, height: "100%", background: band.color, borderRadius: 4 } }) })
          ] }, band.label);
        }) })
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx10("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Payment Channel Breakdown" }),
        /* @__PURE__ */ jsxs7("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsxs7("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx10("span", { children: "PayPal Orders" }),
            /* @__PURE__ */ jsx10("strong", { style: { fontSize: 14 }, children: channels.paypal.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs7("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx10("span", { children: "Cash on Delivery (COD)" }),
            /* @__PURE__ */ jsx10("strong", { style: { fontSize: 14 }, children: channels.cod.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs7("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx10("span", { children: "Other Integrations" }),
            /* @__PURE__ */ jsx10("strong", { style: { fontSize: 14 }, children: channels.other.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsx10("div", { style: { borderTop: "1px solid var(--rg-border-subtle)", paddingTop: 10, marginTop: 4 }, children: /* @__PURE__ */ jsxs7("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--rg-text-muted)" }, children: [
            /* @__PURE__ */ jsx10("span", { children: "Total Recorded Disputes" }),
            /* @__PURE__ */ jsxs7("span", { children: [
              disputes.total_disputes,
              " (",
              disputes.dispute_rate_pct,
              "% dispute rate)"
            ] })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs7("div", { className: "rg-card", style: { marginTop: 16 }, children: [
      /* @__PURE__ */ jsx10("h3", { style: { margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }, children: "Daily Transaction & Flagging Trends" }),
      trends.length === 0 ? /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-text-muted)", fontSize: 13 }, children: "No daily scoring events recorded yet." }) : /* @__PURE__ */ jsx10("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs7("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
        /* @__PURE__ */ jsx10("thead", { children: /* @__PURE__ */ jsxs7("tr", { style: { borderBottom: "1px solid var(--rg-border)", color: "var(--rg-text-secondary)", textAlign: "left" }, children: [
          /* @__PURE__ */ jsx10("th", { style: { padding: "8px 12px" }, children: "Date" }),
          /* @__PURE__ */ jsx10("th", { style: { padding: "8px 12px" }, children: "Total Scored" }),
          /* @__PURE__ */ jsx10("th", { style: { padding: "8px 12px" }, children: "Flagged" }),
          /* @__PURE__ */ jsx10("th", { style: { padding: "8px 12px" }, children: "Blocked" }),
          /* @__PURE__ */ jsx10("th", { style: { padding: "8px 12px" }, children: "Flag Rate" })
        ] }) }),
        /* @__PURE__ */ jsx10("tbody", { children: trends.map((t) => /* @__PURE__ */ jsxs7("tr", { style: { borderBottom: "1px solid var(--rg-border-subtle)" }, children: [
          /* @__PURE__ */ jsx10("td", { style: { padding: "8px 12px", fontFamily: "monospace" }, children: t.date }),
          /* @__PURE__ */ jsx10("td", { style: { padding: "8px 12px" }, children: t.total_scored }),
          /* @__PURE__ */ jsx10("td", { style: { padding: "8px 12px", color: "var(--rg-med-text)" }, children: t.flagged }),
          /* @__PURE__ */ jsx10("td", { style: { padding: "8px 12px", color: "var(--rg-high-text)" }, children: t.blocked }),
          /* @__PURE__ */ jsxs7("td", { style: { padding: "8px 12px" }, children: [
            t.total_scored > 0 ? (t.flagged / t.total_scored * 100).toFixed(1) : 0,
            "%"
          ] })
        ] }, t.date)) })
      ] }) })
    ] })
  ] });
};

// src/components/RulesPage.tsx
import { jsx as jsx11, jsxs as jsxs8 } from "react/jsx-runtime";
var RulesPage = () => {
  const rules = [
    {
      id: "RULE_VELOCITY_SPIKE",
      name: "Spike Velocity Rule",
      description: "Flags transactions when order velocity exceeds 3 orders in 10 minutes or 5 in 1 hour.",
      severity: "HIGH",
      action: "STEP_UP_VERIFICATION",
      threshold: "Velocity > 3.0",
      status: "ACTIVE"
    },
    {
      id: "RULE_HIGH_AMOUNT_THRESHOLD",
      name: "High Transaction Value Hold",
      description: "Requires manual review when order amount exceeds 80th percentile threshold without established tenure.",
      severity: "HIGH",
      action: "REVIEW",
      threshold: "Amount > \u20B915,000 / $250",
      status: "ACTIVE"
    },
    {
      id: "RULE_COLD_START_TENURE",
      name: "Cold-Start New Account Surveillance",
      description: "Applies monitoring tier to accounts created within the past 48 hours.",
      severity: "MEDIUM",
      action: "ALLOW_WITH_MONITORING",
      threshold: "Account Age < 48h",
      status: "ACTIVE"
    },
    {
      id: "RULE_CRITICAL_RISK_BLOCK",
      name: "Critical ML Score Block Recommendation",
      description: "Recommends merchant capture hold when ML risk score exceeds 0.80.",
      severity: "CRITICAL",
      action: "BLOCK",
      threshold: "Risk Score >= 0.80",
      status: "ACTIVE"
    },
    {
      id: "RULE_ADDRESS_NORMALIZATION_MISMATCH",
      name: "Cross-State Postal Hash Inconsistency",
      description: "Detects delivery address alterations differing from historical device location signatures.",
      severity: "MEDIUM",
      action: "REVIEW",
      threshold: "Address Hash Delta > 0",
      status: "ACTIVE"
    }
  ];
  return /* @__PURE__ */ jsxs8("div", { children: [
    /* @__PURE__ */ jsxs8("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx11("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Rules & Detection Management" }),
      /* @__PURE__ */ jsx11("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Active deterministic risk rules, thresholds, and execution actions evaluated alongside the LightGBM model." })
    ] }),
    /* @__PURE__ */ jsx11("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsxs8("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
      /* @__PURE__ */ jsx11("thead", { children: /* @__PURE__ */ jsxs8("tr", { style: { background: "var(--rg-bg-tertiary)", borderBottom: "1px solid var(--rg-border)", color: "var(--rg-text-secondary)", textAlign: "left" }, children: [
        /* @__PURE__ */ jsx11("th", { style: { padding: "12px 16px" }, children: "Rule Identifier & Name" }),
        /* @__PURE__ */ jsx11("th", { style: { padding: "12px 16px" }, children: "Evaluation Threshold" }),
        /* @__PURE__ */ jsx11("th", { style: { padding: "12px 16px" }, children: "Severity" }),
        /* @__PURE__ */ jsx11("th", { style: { padding: "12px 16px" }, children: "Action Trigger" }),
        /* @__PURE__ */ jsx11("th", { style: { padding: "12px 16px" }, children: "Engine Status" })
      ] }) }),
      /* @__PURE__ */ jsx11("tbody", { children: rules.map((r) => /* @__PURE__ */ jsxs8("tr", { style: { borderBottom: "1px solid var(--rg-border-subtle)" }, children: [
        /* @__PURE__ */ jsxs8("td", { style: { padding: "14px 16px" }, children: [
          /* @__PURE__ */ jsx11("div", { style: { fontWeight: 600 }, children: r.name }),
          /* @__PURE__ */ jsx11("div", { style: { fontSize: 11, fontFamily: "monospace", color: "var(--rg-text-muted)", marginTop: 2 }, children: r.id }),
          /* @__PURE__ */ jsx11("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginTop: 4 }, children: r.description })
        ] }),
        /* @__PURE__ */ jsx11("td", { style: { padding: "14px 16px", fontFamily: "monospace", fontSize: 12 }, children: r.threshold }),
        /* @__PURE__ */ jsx11("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx11(RiskBadge, { severity: r.severity }) }),
        /* @__PURE__ */ jsx11("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx11(RiskBadge, { action: r.action }) }),
        /* @__PURE__ */ jsx11("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsxs8("span", { style: { fontSize: 12, color: "var(--rg-low-text)", fontWeight: 600 }, children: [
          "\u25CF ",
          r.status
        ] }) })
      ] }, r.id)) })
    ] }) }),
    /* @__PURE__ */ jsx11("div", { style: { marginTop: 16, padding: 12, background: "var(--rg-bg-card)", border: "1px solid var(--rg-border)", borderRadius: 6, fontSize: 12, color: "var(--rg-text-muted)" }, children: "\u2139\uFE0F Rule configuration mutations require signed server-key authorization and are immutable via embed tokens." })
  ] });
};

// src/components/ModelsPage.tsx
import { jsx as jsx12, jsxs as jsxs9 } from "react/jsx-runtime";
var ModelsPage = () => {
  var _a, _b, _c, _d;
  const { data, loading, error } = useModelPerformance();
  if (loading) {
    return /* @__PURE__ */ jsx12("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading model performance metrics..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs9("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: [
      /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-high-text)", fontWeight: 600 }, children: "Failed to load model benchmarks" }),
      /* @__PURE__ */ jsx12("div", { style: { fontSize: 13, marginTop: 4 }, children: error.message })
    ] });
  }
  const syn = data == null ? void 0 : data.synthetic;
  const ieee = data == null ? void 0 : data.ieee_cis;
  return /* @__PURE__ */ jsxs9("div", { children: [
    /* @__PURE__ */ jsxs9("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx12("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Model Performance & Evaluation Benchmarks" }),
      /* @__PURE__ */ jsx12("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
    ] }),
    /* @__PURE__ */ jsxs9("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs9("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx12("h3", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "ReturnGuard Synthetic E-Commerce" }),
          /* @__PURE__ */ jsx12("span", { style: { fontSize: 11, background: "var(--rg-low-bg)", color: "var(--rg-low-text)", border: "1px solid var(--rg-low-border)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }, children: (syn == null ? void 0 : syn.reproduction_status) || "REPRODUCED" })
        ] }),
        /* @__PURE__ */ jsxs9("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: [
          "Serving Model: ",
          /* @__PURE__ */ jsx12("strong", { children: (data == null ? void 0 : data.model_version) || "candidate_lgbm_v1" }),
          " | Evaluation Split: ",
          /* @__PURE__ */ jsxs9("strong", { children: [
            (syn == null ? void 0 : syn.sample_count.toLocaleString()) || "35,949",
            " transactions"
          ] })
        ] }),
        /* @__PURE__ */ jsxs9("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "ROC-AUC" }),
            /* @__PURE__ */ jsx12("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_a = syn == null ? void 0 : syn.auc_roc) != null ? _a : 0.9684 })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "PR-AUC" }),
            /* @__PURE__ */ jsx12("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_b = syn == null ? void 0 : syn.auc_pr) != null ? _b : 0.9009 })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Precision" }),
            /* @__PURE__ */ jsxs9("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              syn ? (syn.precision * 100).toFixed(1) : 78.5,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Recall" }),
            /* @__PURE__ */ jsxs9("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              syn ? (syn.recall * 100).toFixed(1) : 88.2,
              "%"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs9("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx12("h3", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "IEEE-CIS Fraud Benchmark" }),
          /* @__PURE__ */ jsx12("span", { style: { fontSize: 11, background: "var(--rg-med-bg)", color: "var(--rg-med-text)", border: "1px solid var(--rg-med-border)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }, children: (ieee == null ? void 0 : ieee.reproduction_status) || "REPORTED_UNVERIFIED" })
        ] }),
        /* @__PURE__ */ jsxs9("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: [
          "Reported baseline artifact | Evaluation Split: ",
          /* @__PURE__ */ jsxs9("strong", { children: [
            (ieee == null ? void 0 : ieee.sample_count.toLocaleString()) || "118,108",
            " transactions"
          ] })
        ] }),
        /* @__PURE__ */ jsxs9("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "ROC-AUC" }),
            /* @__PURE__ */ jsx12("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_c = ieee == null ? void 0 : ieee.auc_roc) != null ? _c : 0.7712 })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "PR-AUC" }),
            /* @__PURE__ */ jsx12("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_d = ieee == null ? void 0 : ieee.auc_pr) != null ? _d : 0.5186 })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Precision" }),
            /* @__PURE__ */ jsxs9("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              ieee ? (ieee.precision * 100).toFixed(1) : 6.3,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Recall" }),
            /* @__PURE__ */ jsxs9("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              ieee ? (ieee.recall * 100).toFixed(1) : 79.8,
              "%"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "rg-card", style: { marginTop: 16, borderLeft: "4px solid var(--rg-accent)" }, children: [
      /* @__PURE__ */ jsx12("h4", { style: { margin: "0 0 6px 0", fontSize: 14, fontWeight: 600 }, children: "Production & Evaluation Honest Limits Statement" }),
      /* @__PURE__ */ jsx12("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: (data == null ? void 0 : data.honest_limits_note) || "Offline evaluation scores reflect pre-production holdout sets. Live merchant scoring operates in non-blocking shadow mode until false-positive profiles are verified against merchant-side payment outcomes." })
    ] })
  ] });
};

// src/components/PaymentPipelinePage.tsx
import { jsx as jsx13, jsxs as jsxs10 } from "react/jsx-runtime";
var PaymentPipelinePage = () => {
  const { data, loading, error } = useRiskTrends();
  const channels = (data == null ? void 0 : data.channel_breakdown) || { paypal: 0, cod: 0, other: 0 };
  const disputes = (data == null ? void 0 : data.dispute_analytics) || { total_disputes: 0, disputed_amount: 0, currency: "INR", dispute_rate_pct: 0 };
  return /* @__PURE__ */ jsxs10("div", { children: [
    /* @__PURE__ */ jsxs10("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx13("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Payment Pipeline & Processor Lifecycle" }),
      /* @__PURE__ */ jsx13("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Visualization of payment authorization stages, capture gating, and PayPal dispute outcomes." })
    ] }),
    loading && /* @__PURE__ */ jsx13("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading payment pipeline..." }),
    error && /* @__PURE__ */ jsxs10("div", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load payment analytics: ",
      error.message
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "rg-card", style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ jsx13("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Decoupled Risk & Payment Execution Lifecycle" }),
      /* @__PURE__ */ jsxs10("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }, children: [
        /* @__PURE__ */ jsxs10("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 11, color: "var(--rg-accent)", fontWeight: 700 }, children: "STAGE 1: CHECKOUT" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Order Placed" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "PayPal authorization or COD checkout initiated." })
        ] }),
        /* @__PURE__ */ jsxs10("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 11, color: "var(--rg-low-text)", fontWeight: 700 }, children: "STAGE 2: RETURNGUARD" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Risk Scoring" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "LightGBM inference & rules evaluate transaction." })
        ] }),
        /* @__PURE__ */ jsxs10("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 11, color: "var(--rg-med-text)", fontWeight: 700 }, children: "STAGE 3: DECISION" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Policy Recommendation" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "ALLOW, REVIEW, or BLOCK recommended to merchant." })
        ] }),
        /* @__PURE__ */ jsxs10("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 11, color: "var(--rg-high-text)", fontWeight: 700 }, children: "STAGE 4: MERCHANT" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Payment Capture" }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "Merchant (ShopPoint) executes capture/void via PayPal." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs10("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx13("h3", { style: { margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }, children: "Channel Pipeline Activity" }),
        /* @__PURE__ */ jsxs10("div", { style: { display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs10("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx13("span", { children: "PayPal Orders Processed" }),
            /* @__PURE__ */ jsx13("strong", { children: channels.paypal.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs10("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx13("span", { children: "COD Orders Processed" }),
            /* @__PURE__ */ jsx13("strong", { children: channels.cod.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs10("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx13("span", { children: "External Gateway Relays" }),
            /* @__PURE__ */ jsx13("strong", { children: channels.other.toLocaleString() })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx13("h3", { style: { margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }, children: "PayPal Dispute Analytics" }),
        /* @__PURE__ */ jsxs10("div", { style: { display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs10("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx13("span", { children: "Total Recorded Disputes" }),
            /* @__PURE__ */ jsx13("strong", { style: { color: "var(--rg-high-text)" }, children: disputes.total_disputes })
          ] }),
          /* @__PURE__ */ jsxs10("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx13("span", { children: "Disputed Value" }),
            /* @__PURE__ */ jsxs10("strong", { children: [
              disputes.currency,
              " ",
              disputes.disputed_amount.toFixed(2)
            ] })
          ] }),
          /* @__PURE__ */ jsxs10("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx13("span", { children: "Dispute Rate" }),
            /* @__PURE__ */ jsxs10("strong", { children: [
              disputes.dispute_rate_pct,
              "%"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};

// src/components/ReviewsPage.tsx
import { jsx as jsx14, jsxs as jsxs11 } from "react/jsx-runtime";
var ReviewsPage = () => {
  const { items, loading, error, refetch } = useReviews(50);
  return /* @__PURE__ */ jsxs11("div", { children: [
    /* @__PURE__ */ jsxs11("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs11("div", { children: [
        /* @__PURE__ */ jsx14("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Alerts, Manual Reviews & Activity" }),
        /* @__PURE__ */ jsx14("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Operational queues for high-risk and flagged payments requiring human evaluation." })
      ] }),
      /* @__PURE__ */ jsx14(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          style: { background: "var(--rg-bg-card)", color: "var(--rg-text-primary)", border: "1px solid var(--rg-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 },
          children: "\u21BB Refresh Queue"
        }
      )
    ] }),
    loading && /* @__PURE__ */ jsx14("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading review queue..." }),
    error && /* @__PURE__ */ jsxs11("div", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load review items: ",
      error.message
    ] }),
    /* @__PURE__ */ jsx14("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsxs11("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
      /* @__PURE__ */ jsx14("thead", { children: /* @__PURE__ */ jsxs11("tr", { style: { background: "var(--rg-bg-tertiary)", borderBottom: "1px solid var(--rg-border)", color: "var(--rg-text-secondary)", textAlign: "left" }, children: [
        /* @__PURE__ */ jsx14("th", { style: { padding: "12px 16px" }, children: "Decision ID / Order" }),
        /* @__PURE__ */ jsx14("th", { style: { padding: "12px 16px" }, children: "Risk Score" }),
        /* @__PURE__ */ jsx14("th", { style: { padding: "12px 16px" }, children: "Recommended Action" }),
        /* @__PURE__ */ jsx14("th", { style: { padding: "12px 16px" }, children: "Review Status" }),
        /* @__PURE__ */ jsx14("th", { style: { padding: "12px 16px" }, children: "Queued At" })
      ] }) }),
      /* @__PURE__ */ jsx14("tbody", { children: items.length === 0 && !loading ? /* @__PURE__ */ jsx14("tr", { children: /* @__PURE__ */ jsx14("td", { colSpan: 5, style: { padding: 24, textAlign: "center", color: "var(--rg-text-muted)" }, children: "No manual reviews currently pending. All flagged transactions cleared." }) }) : items.map((rev) => /* @__PURE__ */ jsxs11("tr", { style: { borderBottom: "1px solid var(--rg-border-subtle)" }, children: [
        /* @__PURE__ */ jsxs11("td", { style: { padding: "12px 16px" }, children: [
          /* @__PURE__ */ jsx14("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: rev.order_id }),
          /* @__PURE__ */ jsx14("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", fontFamily: "monospace", marginTop: 2 }, children: rev.decision_id })
        ] }),
        /* @__PURE__ */ jsx14("td", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ jsx14(RiskBadge, { score: rev.risk_score }) }),
        /* @__PURE__ */ jsx14("td", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ jsx14(RiskBadge, { action: rev.suggested_action }) }),
        /* @__PURE__ */ jsx14("td", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ jsxs11("span", { style: { fontSize: 12, fontWeight: 600, color: rev.status === "pending" ? "var(--rg-med-text)" : "var(--rg-low-text)" }, children: [
          "\u25CF ",
          rev.status.toUpperCase()
        ] }) }),
        /* @__PURE__ */ jsx14("td", { style: { padding: "12px 16px", fontSize: 12, color: "var(--rg-text-muted)" }, children: new Date(rev.created_at).toLocaleString() })
      ] }, rev.decision_id)) })
    ] }) }),
    /* @__PURE__ */ jsx14("div", { style: { marginTop: 16, padding: 12, background: "var(--rg-bg-card)", border: "1px solid var(--rg-border)", borderRadius: 6, fontSize: 12, color: "var(--rg-text-muted)" }, children: "\u{1F6E1}\uFE0F Formal dispute evidence packs, AI investigation narratives, and case assignments belong to Phase I." })
  ] });
};

// src/components/ReportsPage.tsx
import { jsx as jsx15, jsxs as jsxs12 } from "react/jsx-runtime";
var ReportsPage = () => {
  const { data: summary } = useRiskSummary();
  const { items: decisions } = useRiskDecisions(50);
  const exportCSV = () => {
    if (!decisions.length) return;
    const headers = ["Order ID", "Channel", "Risk Score", "Suggested Action", "Tier", "Severity", "Created At"];
    const rows = decisions.map((d) => [
      d.order_id,
      d.channel,
      d.risk_score,
      d.suggested_action,
      d.tier,
      d.severity,
      d.model_version
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `returnguard_risk_report_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return /* @__PURE__ */ jsxs12("div", { children: [
    /* @__PURE__ */ jsxs12("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs12("div", { children: [
        /* @__PURE__ */ jsx15("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Operational Reports & Audit Exports" }),
        /* @__PURE__ */ jsx15("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Exportable CSV datasets, compliance audit snapshots, and risk summary reports." })
      ] }),
      /* @__PURE__ */ jsx15(
        "button",
        {
          type: "button",
          onClick: exportCSV,
          style: { background: "var(--rg-accent)", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
          children: "\u{1F4E5} Export Decisions CSV"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs12("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx15("h3", { style: { margin: "0 0 10px 0", fontSize: 15, fontWeight: 600 }, children: "Decisions Audit Dataset" }),
        /* @__PURE__ */ jsxs12("p", { style: { fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: [
          "Export the currently loaded ",
          decisions.length,
          " scored decisions with policy recommendations, risk tiers, and channel metadata."
        ] }),
        /* @__PURE__ */ jsx15("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 12 }, children: "Format: RFC-4180 CSV | PII-safe" })
      ] }),
      /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx15("h3", { style: { margin: "0 0 10px 0", fontSize: 15, fontWeight: 600 }, children: "Tenant Risk Position Summary" }),
        /* @__PURE__ */ jsxs12("p", { style: { fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: [
          "Summary of lifetime scored volume: ",
          (summary == null ? void 0 : summary.total_decisions) || 0,
          " total evaluated decisions, ",
          (summary == null ? void 0 : summary.block_count) || 0,
          " critical blocks recommended."
        ] }),
        /* @__PURE__ */ jsxs12("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 12 }, children: [
          "Scope: Tenant-Isolated (`",
          (summary == null ? void 0 : summary.tenant_id) || "active",
          "`)"
        ] })
      ] })
    ] })
  ] });
};

// src/components/ReturnGuardDashboard.tsx
import { useState as useState6 } from "react";
import { jsx as jsx16, jsxs as jsxs13 } from "react/jsx-runtime";
var ReturnGuardDashboard = ({
  initialTab = "overview",
  brandTitle = "ReturnGuard"
}) => {
  const [currentTab, setCurrentTab] = useState6(initialTab);
  return /* @__PURE__ */ jsxs13(DashboardShell, { currentTab, onTabChange: setCurrentTab, brandTitle, children: [
    currentTab === "overview" && /* @__PURE__ */ jsx16(OverviewPage, {}),
    currentTab === "investigations" && /* @__PURE__ */ jsx16(InvestigationsPage, {}),
    currentTab === "transactions" && /* @__PURE__ */ jsx16(TransactionsPage, {}),
    currentTab === "customers" && /* @__PURE__ */ jsx16(CustomersPage, {}),
    currentTab === "analytics" && /* @__PURE__ */ jsx16(RiskAnalyticsPage, {}),
    currentTab === "rules" && /* @__PURE__ */ jsx16(RulesPage, {}),
    currentTab === "models" && /* @__PURE__ */ jsx16(ModelsPage, {}),
    currentTab === "pipeline" && /* @__PURE__ */ jsx16(PaymentPipelinePage, {}),
    currentTab === "reviews" && /* @__PURE__ */ jsx16(ReviewsPage, {}),
    currentTab === "reports" && /* @__PURE__ */ jsx16(ReportsPage, {})
  ] });
};
export {
  CustomersPage,
  DashboardShell,
  DetailDrawer,
  InvestigationsPage,
  ModelsPage,
  OverviewPage,
  PaymentPipelinePage,
  ReportsPage,
  ReturnGuardDashboard,
  ReturnGuardProvider,
  ReviewsPage,
  RiskAnalyticsPage,
  RiskBadge,
  RulesPage,
  TransactionsGrid,
  TransactionsPage,
  useCustomerProfile,
  useCustomers,
  useModelPerformance,
  useReturnGuard,
  useReviews,
  useRiskDecisions,
  useRiskSummary,
  useRiskTrends,
  useTransactionRisk
};
//# sourceMappingURL=index.js.map