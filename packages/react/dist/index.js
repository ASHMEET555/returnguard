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
                children: "\u24D8 Fixed"
              }
            )
          ] }),
          /* @__PURE__ */ jsx3(
            "button",
            {
              type: "button",
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

// src/components/TransactionsGrid.tsx
import { useMemo as useMemo2 } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { jsx as jsx5 } from "react/jsx-runtime";
var TransactionsGrid = ({
  items,
  loading = false,
  onRowClick,
  quickFilterText = ""
}) => {
  const columnDefs = useMemo2(
    () => [
      {
        field: "order_id",
        headerName: "Order ID",
        minWidth: 160,
        pinned: "left",
        cellRenderer: (params) => /* @__PURE__ */ jsx5("span", { style: { fontFamily: "monospace", fontWeight: 600 }, children: params.value || "--" })
      },
      {
        field: "channel",
        headerName: "Channel",
        width: 110
      },
      {
        field: "risk_score",
        headerName: "Risk Score",
        width: 140,
        cellRenderer: (params) => /* @__PURE__ */ jsx5(RiskBadge, { score: params.value }),
        sort: "desc"
      },
      {
        field: "suggested_action",
        headerName: "ReturnGuard Policy",
        width: 180,
        cellRenderer: (params) => /* @__PURE__ */ jsx5(RiskBadge, { action: params.value })
      },
      {
        field: "tier",
        headerName: "Tier",
        width: 110,
        cellRenderer: (params) => /* @__PURE__ */ jsx5(RiskBadge, { severity: params.value })
      },
      {
        field: "severity",
        headerName: "Severity",
        width: 110,
        cellRenderer: (params) => /* @__PURE__ */ jsx5(RiskBadge, { severity: params.value })
      },
      {
        headerName: "Payment Status",
        width: 150,
        valueGetter: () => "Not Integrated (Provider Owned)",
        cellRenderer: () => /* @__PURE__ */ jsx5("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", fontStyle: "italic" }, children: "Provider Owned (ShopPoint)" })
      },
      {
        field: "model_version",
        headerName: "Model Version",
        minWidth: 150,
        cellRenderer: (params) => /* @__PURE__ */ jsx5("span", { style: { fontSize: 12, fontFamily: "monospace", color: "var(--rg-text-muted)" }, children: params.value || "candidate_lgbm_v1" })
      }
    ],
    []
  );
  const defaultColDef = useMemo2(
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
  return /* @__PURE__ */ jsx5(
    "div",
    {
      className: "ag-theme-alpine-dark",
      style: {
        height: 520,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--rg-border)"
      },
      children: /* @__PURE__ */ jsx5(
        AgGridReact,
        {
          rowData: items,
          columnDefs,
          defaultColDef,
          loading,
          quickFilterText,
          rowSelection: { mode: "singleRow" },
          onRowClicked: handleRowClicked
        }
      )
    }
  );
};

// src/components/TransactionsPage.tsx
import { useState as useState3 } from "react";

// src/components/DetailDrawer.tsx
import { Fragment, jsx as jsx6, jsxs as jsxs3 } from "react/jsx-runtime";
var DetailDrawer = ({ decisionId, onClose }) => {
  const { decision, audit, loading, error } = useTransactionRisk(decisionId);
  if (!decisionId) return null;
  return /* @__PURE__ */ jsx6("div", { className: "rg-drawer-overlay", onClick: onClose, role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ jsxs3("div", { className: "rg-drawer", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs3("div", { className: "rg-drawer-header", children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsx6("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: "Transaction Investigation" }),
        /* @__PURE__ */ jsx6("div", { style: { fontSize: 16, fontWeight: 700, marginTop: 2 }, children: (decision == null ? void 0 : decision.order_id) || decisionId })
      ] }),
      /* @__PURE__ */ jsx6(
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
    /* @__PURE__ */ jsxs3("div", { className: "rg-drawer-body", children: [
      loading && /* @__PURE__ */ jsx6("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading scoring audit and explanation..." }),
      error && /* @__PURE__ */ jsxs3("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: [
        /* @__PURE__ */ jsx6("div", { style: { color: "var(--rg-high-text)", fontWeight: 600 }, children: "Failed to load decision" }),
        /* @__PURE__ */ jsx6("div", { style: { fontSize: 12, marginTop: 4 }, children: error.message })
      ] }),
      decision && /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsxs3("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx6("div", { className: "rg-drawer-section-title", children: "ReturnGuard Recommendation" }),
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }, children: [
            /* @__PURE__ */ jsx6(RiskBadge, { score: decision.risk_score }),
            /* @__PURE__ */ jsx6(RiskBadge, { action: decision.suggested_action }),
            /* @__PURE__ */ jsxs3("span", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
              "Severity: ",
              /* @__PURE__ */ jsx6("strong", { children: decision.severity })
            ] })
          ] }),
          /* @__PURE__ */ jsx6("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "ReturnGuard evaluates transaction characteristics and recommends an operational hold/action. Actual capture or decline is executed independently by the payment provider." })
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx6("div", { className: "rg-drawer-section-title", children: "Why This Was Flagged" }),
          decision.reason_codes && decision.reason_codes.length > 0 ? /* @__PURE__ */ jsx6("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: decision.reason_codes.map((rc) => /* @__PURE__ */ jsxs3(
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
          )) }) : /* @__PURE__ */ jsx6("div", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "No specific rule or anomaly triggers flagged for this transaction." })
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx6("div", { className: "rg-drawer-section-title", children: "Payment & Processor Context" }),
          /* @__PURE__ */ jsxs3("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }, children: [
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--rg-text-muted)" }, children: "Order ID:" }),
              " ",
              /* @__PURE__ */ jsx6("strong", { style: { fontFamily: "monospace" }, children: decision.order_id || "--" })
            ] }),
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--rg-text-muted)" }, children: "Channel:" }),
              " ",
              /* @__PURE__ */ jsx6("strong", { children: decision.channel || "web" })
            ] }),
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--rg-text-muted)" }, children: "ReturnGuard Mode:" }),
              " ",
              /* @__PURE__ */ jsx6("strong", { children: decision.shadow ? "Shadow (Non-blocking)" : "Live Policy Enforcement" })
            ] }),
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--rg-text-muted)" }, children: "Payment Processor Status:" }),
              " ",
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--rg-text-muted)", fontStyle: "italic" }, children: "Not Verified (Owned by Merchant / ShopPoint)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ jsx6("div", { className: "rg-drawer-section-title", children: "Audit Trail & Signals" }),
          /* @__PURE__ */ jsx6("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: audit ? /* @__PURE__ */ jsxs3("div", { children: [
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx6("strong", { children: "Decision ID:" }),
              " ",
              audit.data.decision.decision_id
            ] }),
            /* @__PURE__ */ jsxs3("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ jsx6("strong", { children: "Order ID:" }),
              " ",
              audit.data.decision.order_id
            ] }),
            /* @__PURE__ */ jsxs3("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ jsx6("strong", { children: "Policy Action:" }),
              " ",
              audit.data.policy_trace.policy_action
            ] }),
            /* @__PURE__ */ jsxs3("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ jsx6("strong", { children: "Reconstructed Features:" }),
              " ",
              Object.keys(audit.data.feature_snapshot || {}).length,
              " features verified"
            ] })
          ] }) : /* @__PURE__ */ jsx6("div", { children: "Basic audit event snapshot recorded. Full feature reconstruction stored in tenant repository." }) })
        ] })
      ] })
    ] })
  ] }) });
};

// src/components/TransactionsPage.tsx
import { jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
var TransactionsPage = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useRiskDecisions(50);
  const [selectedId, setSelectedId] = useState3(null);
  const [searchTerm, setSearchTerm] = useState3("");
  return /* @__PURE__ */ jsxs4("div", { children: [
    /* @__PURE__ */ jsxs4("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx7("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Transaction Risk Explorer" }),
        /* @__PURE__ */ jsx7("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Search, filter, and inspect scored payments and policy actions." })
      ] }),
      /* @__PURE__ */ jsxs4("div", { style: { display: "flex", gap: 12 }, children: [
        /* @__PURE__ */ jsx7(
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
        /* @__PURE__ */ jsx7(
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
    error && /* @__PURE__ */ jsx7("div", { style: { marginBottom: 16, padding: 12, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: /* @__PURE__ */ jsxs4("span", { style: { color: "var(--rg-high-text)", fontSize: 13 }, children: [
      "Failed to load transactions: ",
      error.message
    ] }) }),
    /* @__PURE__ */ jsx7(
      TransactionsGrid,
      {
        items,
        loading,
        quickFilterText: searchTerm,
        onRowClick: (id) => setSelectedId(id)
      }
    ),
    /* @__PURE__ */ jsxs4("div", { style: { marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs4("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Showing ",
        items.length,
        " records in current page"
      ] }),
      hasMore && /* @__PURE__ */ jsx7(
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
    /* @__PURE__ */ jsx7(DetailDrawer, { decisionId: selectedId, onClose: () => setSelectedId(null) })
  ] });
};

// src/components/CustomersPage.tsx
import { useState as useState4 } from "react";
import { Fragment as Fragment2, jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
var CustomersPage = () => {
  const { items, loading, error, hasMore, nextPage } = useCustomers(50);
  const [selectedCustomerId, setSelectedCustomerId] = useState4(null);
  const { profile, loading: profileLoading, error: profileError } = useCustomerProfile(selectedCustomerId);
  return /* @__PURE__ */ jsxs5("div", { children: [
    /* @__PURE__ */ jsxs5("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx8("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Customer Risk Directory" }),
      /* @__PURE__ */ jsx8("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Tenant-scoped customer profiles, linked hardware devices, physical delivery locations, and order risk history." })
    ] }),
    loading && items.length === 0 && /* @__PURE__ */ jsx8("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading customer directory..." }),
    error && /* @__PURE__ */ jsx8("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6, marginBottom: 16 }, children: /* @__PURE__ */ jsxs5("span", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load customers: ",
      error.message
    ] }) }),
    /* @__PURE__ */ jsx8("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }, children: items.map((cust) => /* @__PURE__ */ jsxs5(
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
          /* @__PURE__ */ jsxs5("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx8("span", { style: { fontWeight: 600, fontFamily: "monospace", fontSize: 13 }, children: cust.customer_id }),
            /* @__PURE__ */ jsx8(RiskBadge, { score: cust.max_risk_score })
          ] }),
          /* @__PURE__ */ jsxs5("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: [
            /* @__PURE__ */ jsxs5("div", { children: [
              "Email: ",
              /* @__PURE__ */ jsx8("strong", { children: cust.email })
            ] }),
            /* @__PURE__ */ jsxs5("div", { style: { marginTop: 2 }, children: [
              "Phone: ",
              /* @__PURE__ */ jsx8("strong", { children: cust.phone })
            ] })
          ] }),
          /* @__PURE__ */ jsxs5("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, borderTop: "1px solid var(--rg-border-subtle)", paddingTop: 8 }, children: [
            /* @__PURE__ */ jsxs5("span", { children: [
              "Orders: ",
              /* @__PURE__ */ jsx8("strong", { children: cust.total_orders })
            ] }),
            /* @__PURE__ */ jsxs5("span", { children: [
              "Spent: ",
              /* @__PURE__ */ jsxs5("strong", { children: [
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
    hasMore && /* @__PURE__ */ jsx8("div", { style: { marginTop: 20, textAlign: "center" }, children: /* @__PURE__ */ jsx8(
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
    selectedCustomerId && /* @__PURE__ */ jsx8("div", { className: "rg-drawer-overlay", onClick: () => setSelectedCustomerId(null), children: /* @__PURE__ */ jsxs5("div", { className: "rg-drawer", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-header", children: [
        /* @__PURE__ */ jsxs5("div", { children: [
          /* @__PURE__ */ jsx8("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: "Customer Risk Profile" }),
          /* @__PURE__ */ jsx8("div", { style: { fontSize: 16, fontWeight: 700, marginTop: 2 }, children: selectedCustomerId })
        ] }),
        /* @__PURE__ */ jsx8(
          "button",
          {
            type: "button",
            onClick: () => setSelectedCustomerId(null),
            style: { background: "transparent", border: "1px solid var(--rg-border)", color: "var(--rg-text-primary)", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
            children: "\u2715 Close"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-body", children: [
        profileLoading && /* @__PURE__ */ jsx8("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading profile details..." }),
        profileError && /* @__PURE__ */ jsx8("div", { style: { color: "var(--rg-high-text)" }, children: profileError.message }),
        profile && /* @__PURE__ */ jsxs5(Fragment2, { children: [
          /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsx8("div", { className: "rg-drawer-section-title", children: "Customer Risk Summary" }),
            /* @__PURE__ */ jsxs5("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }, children: [
              /* @__PURE__ */ jsxs5("div", { children: [
                "Email: ",
                /* @__PURE__ */ jsx8("strong", { children: profile.email })
              ] }),
              /* @__PURE__ */ jsxs5("div", { children: [
                "Phone: ",
                /* @__PURE__ */ jsx8("strong", { children: profile.phone })
              ] }),
              /* @__PURE__ */ jsxs5("div", { children: [
                "Total Orders: ",
                /* @__PURE__ */ jsx8("strong", { children: profile.total_orders })
              ] }),
              /* @__PURE__ */ jsxs5("div", { children: [
                "Total Value: ",
                /* @__PURE__ */ jsxs5("strong", { children: [
                  profile.currency,
                  " ",
                  profile.total_spent.toFixed(2)
                ] })
              ] }),
              /* @__PURE__ */ jsxs5("div", { children: [
                "Max Risk Score: ",
                /* @__PURE__ */ jsx8(RiskBadge, { score: profile.max_risk_score })
              ] }),
              /* @__PURE__ */ jsxs5("div", { children: [
                "Average Score: ",
                /* @__PURE__ */ jsx8("strong", { children: (profile.average_risk_score * 100).toFixed(0) }),
                " / 100"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-section-title", children: [
              "Linked Devices (",
              profile.linked_devices.length,
              ")"
            ] }),
            profile.linked_devices.length === 0 ? /* @__PURE__ */ jsx8("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: "No linked device fingerprints recorded." }) : /* @__PURE__ */ jsx8("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: profile.linked_devices.map((d) => /* @__PURE__ */ jsxs5("div", { style: { fontSize: 12, fontFamily: "monospace", background: "var(--rg-bg-tertiary)", padding: 6, borderRadius: 4 }, children: [
              "Hash: ",
              d.device_hash.slice(0, 16),
              "... | IP: ",
              d.ip_address || "Unknown"
            ] }, d.id)) })
          ] }),
          /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-section-title", children: [
              "Delivery Locations (",
              profile.linked_addresses.length,
              ")"
            ] }),
            profile.linked_addresses.length === 0 ? /* @__PURE__ */ jsx8("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: "No normalized addresses on file." }) : /* @__PURE__ */ jsx8("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: profile.linked_addresses.map((a) => /* @__PURE__ */ jsxs5("div", { style: { fontSize: 12, background: "var(--rg-bg-tertiary)", padding: 6, borderRadius: 4 }, children: [
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
          /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-section", children: [
            /* @__PURE__ */ jsxs5("div", { className: "rg-drawer-section-title", children: [
              "Order History & Decisions (",
              profile.order_history.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx8("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: profile.order_history.map((ord) => /* @__PURE__ */ jsxs5("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, borderBottom: "1px solid var(--rg-border-subtle)", paddingBottom: 6 }, children: [
              /* @__PURE__ */ jsxs5("div", { children: [
                /* @__PURE__ */ jsx8("span", { style: { fontWeight: 600, fontFamily: "monospace" }, children: ord.order_id }),
                /* @__PURE__ */ jsx8("span", { style: { marginLeft: 8, color: "var(--rg-text-muted)" }, children: ord.channel })
              ] }),
              /* @__PURE__ */ jsxs5("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsxs5("span", { children: [
                  ord.currency,
                  " ",
                  ord.order_value.toFixed(2)
                ] }),
                ord.risk_score !== null && ord.risk_score !== void 0 ? /* @__PURE__ */ jsx8(RiskBadge, { score: ord.risk_score }) : /* @__PURE__ */ jsx8("span", { style: { color: "var(--rg-text-muted)" }, children: "Unscored" })
              ] })
            ] }, ord.order_id)) })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};

// src/components/RiskAnalyticsPage.tsx
import { jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
var RiskAnalyticsPage = () => {
  const { data, loading, error, refetch } = useRiskTrends();
  if (loading) {
    return /* @__PURE__ */ jsx9("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading risk analytics & trends..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs6("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: [
      /* @__PURE__ */ jsx9("div", { style: { color: "var(--rg-high-text)", fontWeight: 600 }, children: "Failed to load risk analytics" }),
      /* @__PURE__ */ jsx9("div", { style: { fontSize: 13, marginTop: 4 }, children: error.message }),
      /* @__PURE__ */ jsx9("button", { type: "button", onClick: () => refetch(), style: { marginTop: 10, padding: "4px 10px", background: "var(--rg-accent)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }, children: "Retry" })
    ] });
  }
  const trends = (data == null ? void 0 : data.daily_trends) || [];
  const scoreDist = (data == null ? void 0 : data.score_distribution) || { low_0_15: 0, med_15_40: 0, high_40_80: 0, crit_80_100: 0 };
  const channels = (data == null ? void 0 : data.channel_breakdown) || { paypal: 0, cod: 0, other: 0 };
  const disputes = (data == null ? void 0 : data.dispute_analytics) || { total_disputes: 0, disputed_amount: 0, currency: "INR", dispute_rate_pct: 0 };
  const totalScores = scoreDist.low_0_15 + scoreDist.med_15_40 + scoreDist.high_40_80 + scoreDist.crit_80_100;
  return /* @__PURE__ */ jsxs6("div", { children: [
    /* @__PURE__ */ jsxs6("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx9("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Risk Analytics & Portfolio Exposure" }),
      /* @__PURE__ */ jsx9("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Portfolio risk score distributions, channel breakdown, and time-series scoring volumes." })
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ jsxs6("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "Low Risk (< 0.15)" }),
          /* @__PURE__ */ jsx9("span", { children: "\u{1F7E2}" })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: scoreDist.low_0_15.toLocaleString() }),
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.low_0_15 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs6("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "Medium Risk (0.15 - 0.40)" }),
          /* @__PURE__ */ jsx9("span", { children: "\u{1F7E1}" })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: scoreDist.med_15_40.toLocaleString() }),
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.med_15_40 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs6("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "High Risk (0.40 - 0.80)" }),
          /* @__PURE__ */ jsx9("span", { children: "\u{1F7E0}" })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: scoreDist.high_40_80.toLocaleString() }),
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.high_40_80 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs6("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "Critical Risk (> 0.80)" }),
          /* @__PURE__ */ jsx9("span", { children: "\u{1F534}" })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: scoreDist.crit_80_100.toLocaleString() }),
        /* @__PURE__ */ jsxs6("div", { className: "rg-card-subtitle", children: [
          totalScores ? (scoreDist.crit_80_100 / totalScores * 100).toFixed(1) : 0,
          "% of portfolio"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs6("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs6("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx9("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Risk Score Band Histogram" }),
        /* @__PURE__ */ jsx9("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          { label: "0.00 - 0.15 (ALLOW)", count: scoreDist.low_0_15, color: "var(--rg-low-text)" },
          { label: "0.15 - 0.40 (MONITOR)", count: scoreDist.med_15_40, color: "var(--rg-med-text)" },
          { label: "0.40 - 0.80 (REVIEW)", count: scoreDist.high_40_80, color: "var(--rg-high-text)" },
          { label: "0.80 - 1.00 (BLOCK)", count: scoreDist.crit_80_100, color: "var(--rg-crit-text)" }
        ].map((band) => {
          const pct = totalScores > 0 ? band.count / totalScores * 100 : 0;
          return /* @__PURE__ */ jsxs6("div", { children: [
            /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }, children: [
              /* @__PURE__ */ jsx9("span", { children: band.label }),
              /* @__PURE__ */ jsxs6("strong", { children: [
                band.count,
                " (",
                pct.toFixed(1),
                "%)"
              ] })
            ] }),
            /* @__PURE__ */ jsx9("div", { style: { height: 8, background: "var(--rg-bg-tertiary)", borderRadius: 4, overflow: "hidden" }, children: /* @__PURE__ */ jsx9("div", { style: { width: `${pct}%`, height: "100%", background: band.color, borderRadius: 4 } }) })
          ] }, band.label);
        }) })
      ] }),
      /* @__PURE__ */ jsxs6("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx9("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Payment Channel Breakdown" }),
        /* @__PURE__ */ jsxs6("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx9("span", { children: "PayPal Orders" }),
            /* @__PURE__ */ jsx9("strong", { style: { fontSize: 14 }, children: channels.paypal.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx9("span", { children: "Cash on Delivery (COD)" }),
            /* @__PURE__ */ jsx9("strong", { style: { fontSize: 14 }, children: channels.cod.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx9("span", { children: "Other Integrations" }),
            /* @__PURE__ */ jsx9("strong", { style: { fontSize: 14 }, children: channels.other.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsx9("div", { style: { borderTop: "1px solid var(--rg-border-subtle)", paddingTop: 10, marginTop: 4 }, children: /* @__PURE__ */ jsxs6("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--rg-text-muted)" }, children: [
            /* @__PURE__ */ jsx9("span", { children: "Total Recorded Disputes" }),
            /* @__PURE__ */ jsxs6("span", { children: [
              disputes.total_disputes,
              " (",
              disputes.dispute_rate_pct,
              "% dispute rate)"
            ] })
          ] }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "rg-card", style: { marginTop: 16 }, children: [
      /* @__PURE__ */ jsx9("h3", { style: { margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }, children: "Daily Transaction & Flagging Trends" }),
      trends.length === 0 ? /* @__PURE__ */ jsx9("div", { style: { color: "var(--rg-text-muted)", fontSize: 13 }, children: "No daily scoring events recorded yet." }) : /* @__PURE__ */ jsx9("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs6("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
        /* @__PURE__ */ jsx9("thead", { children: /* @__PURE__ */ jsxs6("tr", { style: { borderBottom: "1px solid var(--rg-border)", color: "var(--rg-text-secondary)", textAlign: "left" }, children: [
          /* @__PURE__ */ jsx9("th", { style: { padding: "8px 12px" }, children: "Date" }),
          /* @__PURE__ */ jsx9("th", { style: { padding: "8px 12px" }, children: "Total Scored" }),
          /* @__PURE__ */ jsx9("th", { style: { padding: "8px 12px" }, children: "Flagged" }),
          /* @__PURE__ */ jsx9("th", { style: { padding: "8px 12px" }, children: "Blocked" }),
          /* @__PURE__ */ jsx9("th", { style: { padding: "8px 12px" }, children: "Flag Rate" })
        ] }) }),
        /* @__PURE__ */ jsx9("tbody", { children: trends.map((t) => /* @__PURE__ */ jsxs6("tr", { style: { borderBottom: "1px solid var(--rg-border-subtle)" }, children: [
          /* @__PURE__ */ jsx9("td", { style: { padding: "8px 12px", fontFamily: "monospace" }, children: t.date }),
          /* @__PURE__ */ jsx9("td", { style: { padding: "8px 12px" }, children: t.total_scored }),
          /* @__PURE__ */ jsx9("td", { style: { padding: "8px 12px", color: "var(--rg-med-text)" }, children: t.flagged }),
          /* @__PURE__ */ jsx9("td", { style: { padding: "8px 12px", color: "var(--rg-high-text)" }, children: t.blocked }),
          /* @__PURE__ */ jsxs6("td", { style: { padding: "8px 12px" }, children: [
            t.total_scored > 0 ? (t.flagged / t.total_scored * 100).toFixed(1) : 0,
            "%"
          ] })
        ] }, t.date)) })
      ] }) })
    ] })
  ] });
};

// src/components/RulesPage.tsx
import { jsx as jsx10, jsxs as jsxs7 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsxs7("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx10("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Rules & Detection Management" }),
      /* @__PURE__ */ jsx10("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Active deterministic risk rules, thresholds, and execution actions evaluated alongside the LightGBM model." })
    ] }),
    /* @__PURE__ */ jsx10("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsxs7("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
      /* @__PURE__ */ jsx10("thead", { children: /* @__PURE__ */ jsxs7("tr", { style: { background: "var(--rg-bg-tertiary)", borderBottom: "1px solid var(--rg-border)", color: "var(--rg-text-secondary)", textAlign: "left" }, children: [
        /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Rule Identifier & Name" }),
        /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Evaluation Threshold" }),
        /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Severity" }),
        /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Action Trigger" }),
        /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Engine Status" })
      ] }) }),
      /* @__PURE__ */ jsx10("tbody", { children: rules.map((r) => /* @__PURE__ */ jsxs7("tr", { style: { borderBottom: "1px solid var(--rg-border-subtle)" }, children: [
        /* @__PURE__ */ jsxs7("td", { style: { padding: "14px 16px" }, children: [
          /* @__PURE__ */ jsx10("div", { style: { fontWeight: 600 }, children: r.name }),
          /* @__PURE__ */ jsx10("div", { style: { fontSize: 11, fontFamily: "monospace", color: "var(--rg-text-muted)", marginTop: 2 }, children: r.id }),
          /* @__PURE__ */ jsx10("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginTop: 4 }, children: r.description })
        ] }),
        /* @__PURE__ */ jsx10("td", { style: { padding: "14px 16px", fontFamily: "monospace", fontSize: 12 }, children: r.threshold }),
        /* @__PURE__ */ jsx10("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx10(RiskBadge, { severity: r.severity }) }),
        /* @__PURE__ */ jsx10("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsx10(RiskBadge, { action: r.action }) }),
        /* @__PURE__ */ jsx10("td", { style: { padding: "14px 16px" }, children: /* @__PURE__ */ jsxs7("span", { style: { fontSize: 12, color: "var(--rg-low-text)", fontWeight: 600 }, children: [
          "\u25CF ",
          r.status
        ] }) })
      ] }, r.id)) })
    ] }) }),
    /* @__PURE__ */ jsx10("div", { style: { marginTop: 16, padding: 12, background: "var(--rg-bg-card)", border: "1px solid var(--rg-border)", borderRadius: 6, fontSize: 12, color: "var(--rg-text-muted)" }, children: "\u2139\uFE0F Rule configuration mutations require signed server-key authorization and are immutable via embed tokens." })
  ] });
};

// src/components/ModelsPage.tsx
import { jsx as jsx11, jsxs as jsxs8 } from "react/jsx-runtime";
var ModelsPage = () => {
  var _a, _b, _c, _d;
  const { data, loading, error } = useModelPerformance();
  if (loading) {
    return /* @__PURE__ */ jsx11("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading model performance metrics..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs8("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: [
      /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-high-text)", fontWeight: 600 }, children: "Failed to load model benchmarks" }),
      /* @__PURE__ */ jsx11("div", { style: { fontSize: 13, marginTop: 4 }, children: error.message })
    ] });
  }
  const syn = data == null ? void 0 : data.synthetic;
  const ieee = data == null ? void 0 : data.ieee_cis;
  return /* @__PURE__ */ jsxs8("div", { children: [
    /* @__PURE__ */ jsxs8("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx11("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Model Performance & Evaluation Benchmarks" }),
      /* @__PURE__ */ jsx11("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
    ] }),
    /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs8("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx11("h3", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "ReturnGuard Synthetic E-Commerce" }),
          /* @__PURE__ */ jsx11("span", { style: { fontSize: 11, background: "var(--rg-low-bg)", color: "var(--rg-low-text)", border: "1px solid var(--rg-low-border)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }, children: (syn == null ? void 0 : syn.reproduction_status) || "REPRODUCED" })
        ] }),
        /* @__PURE__ */ jsxs8("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: [
          "Serving Model: ",
          /* @__PURE__ */ jsx11("strong", { children: (data == null ? void 0 : data.model_version) || "candidate_lgbm_v1" }),
          " | Evaluation Split: ",
          /* @__PURE__ */ jsxs8("strong", { children: [
            (syn == null ? void 0 : syn.sample_count.toLocaleString()) || "35,949",
            " transactions"
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "ROC-AUC" }),
            /* @__PURE__ */ jsx11("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_a = syn == null ? void 0 : syn.auc_roc) != null ? _a : 0.9684 })
          ] }),
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "PR-AUC" }),
            /* @__PURE__ */ jsx11("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_b = syn == null ? void 0 : syn.auc_pr) != null ? _b : 0.9009 })
          ] }),
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Precision" }),
            /* @__PURE__ */ jsxs8("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              syn ? (syn.precision * 100).toFixed(1) : 78.5,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Recall" }),
            /* @__PURE__ */ jsxs8("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              syn ? (syn.recall * 100).toFixed(1) : 88.2,
              "%"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx11("h3", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "IEEE-CIS Fraud Benchmark" }),
          /* @__PURE__ */ jsx11("span", { style: { fontSize: 11, background: "var(--rg-med-bg)", color: "var(--rg-med-text)", border: "1px solid var(--rg-med-border)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }, children: (ieee == null ? void 0 : ieee.reproduction_status) || "REPORTED_UNVERIFIED" })
        ] }),
        /* @__PURE__ */ jsxs8("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: [
          "Reported baseline artifact | Evaluation Split: ",
          /* @__PURE__ */ jsxs8("strong", { children: [
            (ieee == null ? void 0 : ieee.sample_count.toLocaleString()) || "118,108",
            " transactions"
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "ROC-AUC" }),
            /* @__PURE__ */ jsx11("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_c = ieee == null ? void 0 : ieee.auc_roc) != null ? _c : 0.7712 })
          ] }),
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "PR-AUC" }),
            /* @__PURE__ */ jsx11("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: (_d = ieee == null ? void 0 : ieee.auc_pr) != null ? _d : 0.5186 })
          ] }),
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Precision" }),
            /* @__PURE__ */ jsxs8("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              ieee ? (ieee.precision * 100).toFixed(1) : 6.3,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
            /* @__PURE__ */ jsx11("div", { style: { color: "var(--rg-text-muted)", fontSize: 11 }, children: "Recall" }),
            /* @__PURE__ */ jsxs8("div", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: [
              ieee ? (ieee.recall * 100).toFixed(1) : 79.8,
              "%"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "rg-card", style: { marginTop: 16, borderLeft: "4px solid var(--rg-accent)" }, children: [
      /* @__PURE__ */ jsx11("h4", { style: { margin: "0 0 6px 0", fontSize: 14, fontWeight: 600 }, children: "Production & Evaluation Honest Limits Statement" }),
      /* @__PURE__ */ jsx11("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: (data == null ? void 0 : data.honest_limits_note) || "Offline evaluation scores reflect pre-production holdout sets. Live merchant scoring operates in non-blocking shadow mode until false-positive profiles are verified against merchant-side payment outcomes." })
    ] })
  ] });
};

// src/components/PaymentPipelinePage.tsx
import { jsx as jsx12, jsxs as jsxs9 } from "react/jsx-runtime";
var PaymentPipelinePage = () => {
  const { data, loading, error } = useRiskTrends();
  const channels = (data == null ? void 0 : data.channel_breakdown) || { paypal: 0, cod: 0, other: 0 };
  const disputes = (data == null ? void 0 : data.dispute_analytics) || { total_disputes: 0, disputed_amount: 0, currency: "INR", dispute_rate_pct: 0 };
  return /* @__PURE__ */ jsxs9("div", { children: [
    /* @__PURE__ */ jsxs9("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx12("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Payment Pipeline & Processor Lifecycle" }),
      /* @__PURE__ */ jsx12("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Visualization of payment authorization stages, capture gating, and PayPal dispute outcomes." })
    ] }),
    loading && /* @__PURE__ */ jsx12("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading payment pipeline..." }),
    error && /* @__PURE__ */ jsxs9("div", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load payment analytics: ",
      error.message
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "rg-card", style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ jsx12("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Decoupled Risk & Payment Execution Lifecycle" }),
      /* @__PURE__ */ jsxs9("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }, children: [
        /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 11, color: "var(--rg-accent)", fontWeight: 700 }, children: "STAGE 1: CHECKOUT" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Order Placed" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "PayPal authorization or COD checkout initiated." })
        ] }),
        /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 11, color: "var(--rg-low-text)", fontWeight: 700 }, children: "STAGE 2: RETURNGUARD" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Risk Scoring" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "LightGBM inference & rules evaluate transaction." })
        ] }),
        /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 11, color: "var(--rg-med-text)", fontWeight: 700 }, children: "STAGE 3: DECISION" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Policy Recommendation" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "ALLOW, REVIEW, or BLOCK recommended to merchant." })
        ] }),
        /* @__PURE__ */ jsxs9("div", { style: { background: "var(--rg-bg-tertiary)", padding: 14, borderRadius: 6 }, children: [
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 11, color: "var(--rg-high-text)", fontWeight: 700 }, children: "STAGE 4: MERCHANT" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 14, fontWeight: 600, marginTop: 4 }, children: "Payment Capture" }),
          /* @__PURE__ */ jsx12("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 4 }, children: "Merchant (ShopPoint) executes capture/void via PayPal." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs9("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs9("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx12("h3", { style: { margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }, children: "Channel Pipeline Activity" }),
        /* @__PURE__ */ jsxs9("div", { style: { display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx12("span", { children: "PayPal Orders Processed" }),
            /* @__PURE__ */ jsx12("strong", { children: channels.paypal.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx12("span", { children: "COD Orders Processed" }),
            /* @__PURE__ */ jsx12("strong", { children: channels.cod.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx12("span", { children: "External Gateway Relays" }),
            /* @__PURE__ */ jsx12("strong", { children: channels.other.toLocaleString() })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs9("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx12("h3", { style: { margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }, children: "PayPal Dispute Analytics" }),
        /* @__PURE__ */ jsxs9("div", { style: { display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx12("span", { children: "Total Recorded Disputes" }),
            /* @__PURE__ */ jsx12("strong", { style: { color: "var(--rg-high-text)" }, children: disputes.total_disputes })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx12("span", { children: "Disputed Value" }),
            /* @__PURE__ */ jsxs9("strong", { children: [
              disputes.currency,
              " ",
              disputes.disputed_amount.toFixed(2)
            ] })
          ] }),
          /* @__PURE__ */ jsxs9("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsx12("span", { children: "Dispute Rate" }),
            /* @__PURE__ */ jsxs9("strong", { children: [
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
import { jsx as jsx13, jsxs as jsxs10 } from "react/jsx-runtime";
var ReviewsPage = () => {
  const { items, loading, error, refetch } = useReviews(50);
  return /* @__PURE__ */ jsxs10("div", { children: [
    /* @__PURE__ */ jsxs10("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx13("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Alerts, Manual Reviews & Activity" }),
        /* @__PURE__ */ jsx13("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Operational queues for high-risk and flagged payments requiring human evaluation." })
      ] }),
      /* @__PURE__ */ jsx13(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          style: { background: "var(--rg-bg-card)", color: "var(--rg-text-primary)", border: "1px solid var(--rg-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 },
          children: "\u21BB Refresh Queue"
        }
      )
    ] }),
    loading && /* @__PURE__ */ jsx13("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading review queue..." }),
    error && /* @__PURE__ */ jsxs10("div", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load review items: ",
      error.message
    ] }),
    /* @__PURE__ */ jsx13("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsxs10("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
      /* @__PURE__ */ jsx13("thead", { children: /* @__PURE__ */ jsxs10("tr", { style: { background: "var(--rg-bg-tertiary)", borderBottom: "1px solid var(--rg-border)", color: "var(--rg-text-secondary)", textAlign: "left" }, children: [
        /* @__PURE__ */ jsx13("th", { style: { padding: "12px 16px" }, children: "Decision ID / Order" }),
        /* @__PURE__ */ jsx13("th", { style: { padding: "12px 16px" }, children: "Risk Score" }),
        /* @__PURE__ */ jsx13("th", { style: { padding: "12px 16px" }, children: "Recommended Action" }),
        /* @__PURE__ */ jsx13("th", { style: { padding: "12px 16px" }, children: "Review Status" }),
        /* @__PURE__ */ jsx13("th", { style: { padding: "12px 16px" }, children: "Queued At" })
      ] }) }),
      /* @__PURE__ */ jsx13("tbody", { children: items.length === 0 && !loading ? /* @__PURE__ */ jsx13("tr", { children: /* @__PURE__ */ jsx13("td", { colSpan: 5, style: { padding: 24, textAlign: "center", color: "var(--rg-text-muted)" }, children: "No manual reviews currently pending. All flagged transactions cleared." }) }) : items.map((rev) => /* @__PURE__ */ jsxs10("tr", { style: { borderBottom: "1px solid var(--rg-border-subtle)" }, children: [
        /* @__PURE__ */ jsxs10("td", { style: { padding: "12px 16px" }, children: [
          /* @__PURE__ */ jsx13("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: rev.order_id }),
          /* @__PURE__ */ jsx13("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", fontFamily: "monospace", marginTop: 2 }, children: rev.decision_id })
        ] }),
        /* @__PURE__ */ jsx13("td", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ jsx13(RiskBadge, { score: rev.risk_score }) }),
        /* @__PURE__ */ jsx13("td", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ jsx13(RiskBadge, { action: rev.suggested_action }) }),
        /* @__PURE__ */ jsx13("td", { style: { padding: "12px 16px" }, children: /* @__PURE__ */ jsxs10("span", { style: { fontSize: 12, fontWeight: 600, color: rev.status === "pending" ? "var(--rg-med-text)" : "var(--rg-low-text)" }, children: [
          "\u25CF ",
          rev.status.toUpperCase()
        ] }) }),
        /* @__PURE__ */ jsx13("td", { style: { padding: "12px 16px", fontSize: 12, color: "var(--rg-text-muted)" }, children: new Date(rev.created_at).toLocaleString() })
      ] }, rev.decision_id)) })
    ] }) }),
    /* @__PURE__ */ jsx13("div", { style: { marginTop: 16, padding: 12, background: "var(--rg-bg-card)", border: "1px solid var(--rg-border)", borderRadius: 6, fontSize: 12, color: "var(--rg-text-muted)" }, children: "\u{1F6E1}\uFE0F Formal dispute evidence packs, AI investigation narratives, and case assignments belong to Phase I." })
  ] });
};

// src/components/ReportsPage.tsx
import { jsx as jsx14, jsxs as jsxs11 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs11("div", { children: [
    /* @__PURE__ */ jsxs11("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs11("div", { children: [
        /* @__PURE__ */ jsx14("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Operational Reports & Audit Exports" }),
        /* @__PURE__ */ jsx14("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Exportable CSV datasets, compliance audit snapshots, and risk summary reports." })
      ] }),
      /* @__PURE__ */ jsx14(
        "button",
        {
          type: "button",
          onClick: exportCSV,
          style: { background: "var(--rg-accent)", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
          children: "\u{1F4E5} Export Decisions CSV"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs11("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs11("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx14("h3", { style: { margin: "0 0 10px 0", fontSize: 15, fontWeight: 600 }, children: "Decisions Audit Dataset" }),
        /* @__PURE__ */ jsxs11("p", { style: { fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: [
          "Export the currently loaded ",
          decisions.length,
          " scored decisions with policy recommendations, risk tiers, and channel metadata."
        ] }),
        /* @__PURE__ */ jsx14("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 12 }, children: "Format: RFC-4180 CSV | PII-safe" })
      ] }),
      /* @__PURE__ */ jsxs11("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx14("h3", { style: { margin: "0 0 10px 0", fontSize: 15, fontWeight: 600 }, children: "Tenant Risk Position Summary" }),
        /* @__PURE__ */ jsxs11("p", { style: { fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: [
          "Summary of lifetime scored volume: ",
          (summary == null ? void 0 : summary.total_decisions) || 0,
          " total evaluated decisions, ",
          (summary == null ? void 0 : summary.block_count) || 0,
          " critical blocks recommended."
        ] }),
        /* @__PURE__ */ jsxs11("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 12 }, children: [
          "Scope: Tenant-Isolated (`",
          (summary == null ? void 0 : summary.tenant_id) || "active",
          "`)"
        ] })
      ] })
    ] })
  ] });
};

// src/components/ReturnGuardDashboard.tsx
import { useState as useState5 } from "react";
import { jsx as jsx15, jsxs as jsxs12 } from "react/jsx-runtime";
var ReturnGuardDashboard = ({
  initialTab = "overview",
  brandTitle = "ReturnGuard"
}) => {
  const [currentTab, setCurrentTab] = useState5(initialTab);
  return /* @__PURE__ */ jsxs12(DashboardShell, { currentTab, onTabChange: setCurrentTab, brandTitle, children: [
    currentTab === "overview" && /* @__PURE__ */ jsx15(OverviewPage, {}),
    currentTab === "transactions" && /* @__PURE__ */ jsx15(TransactionsPage, {}),
    currentTab === "customers" && /* @__PURE__ */ jsx15(CustomersPage, {}),
    currentTab === "analytics" && /* @__PURE__ */ jsx15(RiskAnalyticsPage, {}),
    currentTab === "rules" && /* @__PURE__ */ jsx15(RulesPage, {}),
    currentTab === "models" && /* @__PURE__ */ jsx15(ModelsPage, {}),
    currentTab === "pipeline" && /* @__PURE__ */ jsx15(PaymentPipelinePage, {}),
    currentTab === "reviews" && /* @__PURE__ */ jsx15(ReviewsPage, {}),
    currentTab === "reports" && /* @__PURE__ */ jsx15(ReportsPage, {})
  ] });
};
export {
  CustomersPage,
  DashboardShell,
  DetailDrawer,
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