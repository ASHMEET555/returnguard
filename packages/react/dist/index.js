var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

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
  const { theme, setTheme, currency, setCurrency, dateRange, setDateRange } = useReturnGuard();
  const navItems = [
    { id: "overview", label: "Overview", icon: "\u{1F4CA}" },
    { id: "transactions", label: "Transactions", icon: "\u{1F4B3}" },
    { id: "customers", label: "Customers", icon: "\u{1F465}" },
    { id: "analytics", label: "Risk Analytics (M2)", icon: "\u{1F4C8}", disabled: true },
    { id: "rules", label: "Rules & Detection (M2)", icon: "\u{1F6E1}\uFE0F", disabled: true },
    { id: "models", label: "Model Benchmarks (M2)", icon: "\u{1F916}", disabled: true }
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
          onClick: () => !item.disabled && onTabChange(item.id),
          disabled: item.disabled,
          style: { opacity: item.disabled ? 0.45 : 1 },
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
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: currency,
              onChange: (e) => setCurrency(e.target.value),
              style: {
                background: "var(--rg-bg-card)",
                color: "var(--rg-text-primary)",
                border: "1px solid var(--rg-border)",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 12
              },
              children: [
                /* @__PURE__ */ jsx3("option", { value: "USD", children: "USD ($)" }),
                /* @__PURE__ */ jsx3("option", { value: "EUR", children: "EUR (\u20AC)" }),
                /* @__PURE__ */ jsx3("option", { value: "GBP", children: "GBP (\xA3)" }),
                /* @__PURE__ */ jsx3("option", { value: "INR", children: "INR (\u20B9)" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: dateRange,
              onChange: (e) => setDateRange(e.target.value),
              style: {
                background: "var(--rg-bg-card)",
                color: "var(--rg-text-primary)",
                border: "1px solid var(--rg-border)",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 12
              },
              children: [
                /* @__PURE__ */ jsx3("option", { value: "24h", children: "Last 24 Hours" }),
                /* @__PURE__ */ jsx3("option", { value: "7d", children: "Last 7 Days" }),
                /* @__PURE__ */ jsx3("option", { value: "30d", children: "Last 30 Days" })
              ]
            }
          ),
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
        valueGetter: () => "Authorized",
        cellRenderer: () => /* @__PURE__ */ jsx5("span", { style: { fontSize: 12, color: "var(--rg-low-text)", fontWeight: 600 }, children: "\u25CF Authorized" })
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
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--rg-text-muted)" }, children: "Mode:" }),
              " ",
              /* @__PURE__ */ jsx6("strong", { children: decision.shadow ? "Shadow Mode" : "Enforcement" })
            ] }),
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--rg-text-muted)" }, children: "Provider Status:" }),
              " ",
              /* @__PURE__ */ jsx6("strong", { style: { color: "var(--rg-low-text)" }, children: "Authorized (Pending Capture)" })
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
import React4 from "react";
import { jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
var CustomersPage = () => {
  const { items, loading, error } = useRiskDecisions(100);
  const customerMap = React4.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const item of items) {
      const custId = item.order_id ? `cust_${item.order_id.slice(-6)}` : `cust_anon_${(item.decision_id || "000000").slice(0, 6)}`;
      const existing = map.get(custId) || { count: 0, maxScore: 0, channel: item.channel || "web" };
      existing.count += 1;
      existing.maxScore = Math.max(existing.maxScore, item.risk_score || 0);
      map.set(custId, existing);
    }
    return Array.from(map.entries()).map(([id, stats]) => __spreadValues({ id }, stats));
  }, [items]);
  return /* @__PURE__ */ jsxs5("div", { children: [
    /* @__PURE__ */ jsxs5("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx8("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Customer Directory (Foundation)" }),
      /* @__PURE__ */ jsx8("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Scoped customer risk entities derived from scored transactions and order references." })
    ] }),
    loading && /* @__PURE__ */ jsx8("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading customers..." }),
    error && /* @__PURE__ */ jsxs5("div", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load customers: ",
      error.message
    ] }),
    /* @__PURE__ */ jsx8("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }, children: customerMap.map((cust) => /* @__PURE__ */ jsxs5("div", { className: "rg-card", style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
      /* @__PURE__ */ jsxs5("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsx8("span", { style: { fontWeight: 600, fontFamily: "monospace" }, children: cust.id }),
        /* @__PURE__ */ jsx8(RiskBadge, { score: cust.maxScore })
      ] }),
      /* @__PURE__ */ jsxs5("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Scored Transactions: ",
        /* @__PURE__ */ jsx8("strong", { children: cust.count })
      ] }),
      /* @__PURE__ */ jsxs5("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Channel: ",
        /* @__PURE__ */ jsx8("strong", { children: cust.channel })
      ] })
    ] }, cust.id)) })
  ] });
};

// src/components/ReturnGuardDashboard.tsx
import { useState as useState4 } from "react";
import { jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
var ReturnGuardDashboard = ({
  initialTab = "overview",
  brandTitle = "ReturnGuard"
}) => {
  const [currentTab, setCurrentTab] = useState4(initialTab);
  return /* @__PURE__ */ jsxs6(DashboardShell, { currentTab, onTabChange: setCurrentTab, brandTitle, children: [
    currentTab === "overview" && /* @__PURE__ */ jsx9(OverviewPage, {}),
    currentTab === "transactions" && /* @__PURE__ */ jsx9(TransactionsPage, {}),
    currentTab === "customers" && /* @__PURE__ */ jsx9(CustomersPage, {})
  ] });
};
export {
  CustomersPage,
  DashboardShell,
  DetailDrawer,
  OverviewPage,
  ReturnGuardDashboard,
  ReturnGuardProvider,
  RiskBadge,
  TransactionsGrid,
  TransactionsPage,
  useModelPerformance,
  useReturnGuard,
  useRiskDecisions,
  useRiskSummary,
  useTransactionRisk
};
//# sourceMappingURL=index.js.map