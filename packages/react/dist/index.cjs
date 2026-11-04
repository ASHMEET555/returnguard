"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CustomersPage: () => CustomersPage,
  DashboardShell: () => DashboardShell,
  DetailDrawer: () => DetailDrawer,
  OverviewPage: () => OverviewPage,
  ReturnGuardDashboard: () => ReturnGuardDashboard,
  ReturnGuardProvider: () => ReturnGuardProvider,
  RiskBadge: () => RiskBadge,
  TransactionsGrid: () => TransactionsGrid,
  TransactionsPage: () => TransactionsPage,
  useModelPerformance: () => useModelPerformance,
  useReturnGuard: () => useReturnGuard,
  useRiskDecisions: () => useRiskDecisions,
  useRiskSummary: () => useRiskSummary,
  useTransactionRisk: () => useTransactionRisk
});
module.exports = __toCommonJS(index_exports);

// src/context.tsx
var import_react = require("react");
var import_sdk = require("@returnguard/sdk");
var import_jsx_runtime = require("react/jsx-runtime");
var ReturnGuardContext = (0, import_react.createContext)(null);
var ReturnGuardProvider = ({
  client,
  clientOptions,
  defaultTheme = "dark",
  defaultCurrency = "USD",
  children
}) => {
  const [theme, setTheme] = (0, import_react.useState)(defaultTheme);
  const [currency, setCurrency] = (0, import_react.useState)(defaultCurrency);
  const [dateRange, setDateRange] = (0, import_react.useState)("30d");
  const resolvedClient = (0, import_react.useMemo)(() => {
    if (client) return client;
    if (clientOptions) return new import_sdk.ReturnGuardClient(clientOptions);
    throw new Error('ReturnGuardProvider requires either a "client" or "clientOptions" prop.');
  }, [client, clientOptions]);
  (0, import_react.useEffect)(() => {
    document.documentElement.setAttribute("data-rg-theme", theme);
  }, [theme]);
  const value = (0, import_react.useMemo)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReturnGuardContext.Provider, { value, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `rg-root rg-theme-${theme}`, children }) });
};
function useReturnGuard() {
  const context = (0, import_react.useContext)(ReturnGuardContext);
  if (!context) {
    throw new Error("useReturnGuard must be used within a ReturnGuardProvider");
  }
  return context;
}

// src/hooks.ts
var import_react2 = require("react");
function useRiskSummary() {
  const { client, dateRange, currency } = useReturnGuard();
  const [data, setData] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const fetchSummary = (0, import_react2.useCallback)(async () => {
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
  (0, import_react2.useEffect)(() => {
    fetchSummary();
  }, [fetchSummary, dateRange, currency]);
  return { data, loading, error, refetch: fetchSummary };
}
function useRiskDecisions(limit = 25) {
  const { client } = useReturnGuard();
  const [page, setPage] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const [cursor, setCursor] = (0, import_react2.useState)(void 0);
  const fetchDecisions = (0, import_react2.useCallback)(async (targetCursor) => {
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
  (0, import_react2.useEffect)(() => {
    fetchDecisions(cursor);
  }, [fetchDecisions, cursor]);
  const nextPage = (0, import_react2.useCallback)(() => {
    if (page?.next_cursor) {
      setCursor(page.next_cursor);
    }
  }, [page]);
  const resetPage = (0, import_react2.useCallback)(() => {
    setCursor(void 0);
  }, []);
  return {
    items: page?.items ?? [],
    nextCursor: page?.next_cursor,
    hasMore: Boolean(page?.next_cursor),
    loading,
    error,
    nextPage,
    resetPage,
    refetch: () => fetchDecisions(cursor)
  };
}
function useTransactionRisk(decisionId) {
  const { client } = useReturnGuard();
  const [decision, setDecision] = (0, import_react2.useState)(null);
  const [audit, setAudit] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
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
  const [data, setData] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
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
var import_jsx_runtime2 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `rg-badge rg-badge-${variant} ${className}`, children: label });
};

// src/components/DashboardShell.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rg-shell", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "rg-sidebar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rg-sidebar-header", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rg-brand-logo", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u{1F6E1}\uFE0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: brandTitle }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rg-brand-badge", children: "SaaS" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("nav", { className: "rg-sidebar-nav", children: navItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "button",
        {
          type: "button",
          className: `rg-nav-item ${currentTab === item.id ? "active" : ""}`,
          onClick: () => !item.disabled && onTabChange(item.id),
          disabled: item.disabled,
          style: { opacity: item.disabled ? 0.45 : 1 },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: item.icon }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: item.label })
          ]
        },
        item.id
      )) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rg-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "rg-topbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rg-topbar-left", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "Tenant:" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: 13, fontWeight: 600 }, children: "Active Session" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rg-topbar-right", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "USD", children: "USD ($)" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "EUR", children: "EUR (\u20AC)" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "GBP", children: "GBP (\xA3)" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "INR", children: "INR (\u20B9)" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "24h", children: "Last 24 Hours" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "7d", children: "Last 7 Days" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "30d", children: "Last 30 Days" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("main", { className: "rg-content", children })
    ] })
  ] });
};

// src/components/OverviewPage.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var OverviewPage = () => {
  const { data, loading, error, refetch } = useRiskSummary();
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading risk operations summary..." });
  }
  if (error) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { padding: 24, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { style: { margin: "0 0 8px 0", color: "var(--rg-high-text)" }, children: "Failed to load risk summary" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: error.message }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
  const summary = data ?? {
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
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Risk Operations Overview" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Portfolio risk posture, policy distributions, and live transaction indicators." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Transactions Scored" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u{1F4B3}" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rg-card-value", children: summary.total_decisions.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rg-card-subtitle", children: "Lifetime scored payments" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Flagged Transactions" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u26A0\uFE0F" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rg-card-value", children: flaggedCount.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card-subtitle", children: [
          flaggedPct,
          "% flag rate"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "High Risk / Block Action" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u{1F6A8}" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rg-card-value", children: summary.block_count.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rg-card-subtitle", children: "Recommended hold/stop" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "Average Risk Score" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u{1F4C8}" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rg-card-value", children: (summary.average_risk_score * 100).toFixed(0) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "rg-card-subtitle", children: "Portfolio scale (0 - 100)" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Policy Action Breakdown" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RiskBadge, { action: "ALLOW" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontWeight: 600, fontSize: 14 }, children: summary.allow_count.toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RiskBadge, { action: "REVIEW" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontWeight: 600, fontSize: 14 }, children: summary.review_count.toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RiskBadge, { action: "BLOCK" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontWeight: 600, fontSize: 14 }, children: summary.block_count.toLocaleString() })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { style: { margin: "0 0 16px 0", fontSize: 15, fontWeight: 600 }, children: "Scoring System Health" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Engine Status" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { color: "var(--rg-low-text)", fontWeight: 600 }, children: "\u25CF Operational" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Shadow Mode" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontWeight: 600 }, children: "Active (Default)" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Serving Model" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontFamily: "monospace" }, children: "candidate_lgbm_v1" })
          ] })
        ] })
      ] })
    ] })
  ] });
};

// src/components/TransactionsGrid.tsx
var import_react3 = require("react");
var import_ag_grid_react = require("ag-grid-react");
var import_ag_grid = require("ag-grid-community/styles/ag-grid.css");
var import_ag_theme_alpine = require("ag-grid-community/styles/ag-theme-alpine.css");
var import_jsx_runtime5 = require("react/jsx-runtime");
var TransactionsGrid = ({
  items,
  loading = false,
  onRowClick,
  quickFilterText = ""
}) => {
  const columnDefs = (0, import_react3.useMemo)(
    () => [
      {
        field: "order_id",
        headerName: "Order ID",
        minWidth: 160,
        pinned: "left",
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontFamily: "monospace", fontWeight: 600 }, children: params.value || "--" })
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
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RiskBadge, { score: params.value }),
        sort: "desc"
      },
      {
        field: "suggested_action",
        headerName: "ReturnGuard Policy",
        width: 180,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RiskBadge, { action: params.value })
      },
      {
        field: "tier",
        headerName: "Tier",
        width: 110,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RiskBadge, { severity: params.value })
      },
      {
        field: "severity",
        headerName: "Severity",
        width: 110,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RiskBadge, { severity: params.value })
      },
      {
        headerName: "Payment Status",
        width: 150,
        valueGetter: () => "Authorized",
        cellRenderer: () => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 12, color: "var(--rg-low-text)", fontWeight: 600 }, children: "\u25CF Authorized" })
      },
      {
        field: "model_version",
        headerName: "Model Version",
        minWidth: 150,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 12, fontFamily: "monospace", color: "var(--rg-text-muted)" }, children: params.value || "candidate_lgbm_v1" })
      }
    ],
    []
  );
  const defaultColDef = (0, import_react3.useMemo)(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1
    }),
    []
  );
  const handleRowClicked = (event) => {
    const id = event.data?.decision_id || event.data?.order_id;
    if (id && onRowClick) {
      onRowClick(id);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        import_ag_grid_react.AgGridReact,
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
var import_react4 = require("react");

// src/components/DetailDrawer.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var DetailDrawer = ({ decisionId, onClose }) => {
  const { decision, audit, loading, error } = useTransactionRisk(decisionId);
  if (!decisionId) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "rg-drawer-overlay", onClick: onClose, role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-drawer", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-drawer-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: "Transaction Investigation" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 16, fontWeight: 700, marginTop: 2 }, children: decision?.order_id || decisionId })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-drawer-body", children: [
      loading && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading scoring audit and explanation..." }),
      error && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { padding: 16, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "var(--rg-high-text)", fontWeight: 600 }, children: "Failed to load decision" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 12, marginTop: 4 }, children: error.message })
      ] }),
      decision && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "rg-drawer-section-title", children: "ReturnGuard Recommendation" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RiskBadge, { score: decision.risk_score }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RiskBadge, { action: decision.suggested_action }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
              "Severity: ",
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: decision.severity })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "ReturnGuard evaluates transaction characteristics and recommends an operational hold/action. Actual capture or decline is executed independently by the payment provider." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "rg-drawer-section-title", children: "Why This Was Flagged" }),
          decision.reason_codes && decision.reason_codes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: decision.reason_codes.map((rc) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
          )) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "No specific rule or anomaly triggers flagged for this transaction." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "rg-drawer-section-title", children: "Payment & Processor Context" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: "var(--rg-text-muted)" }, children: "Order ID:" }),
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { style: { fontFamily: "monospace" }, children: decision.order_id || "--" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: "var(--rg-text-muted)" }, children: "Channel:" }),
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: decision.channel || "web" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: "var(--rg-text-muted)" }, children: "Mode:" }),
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: decision.shadow ? "Shadow Mode" : "Enforcement" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: "var(--rg-text-muted)" }, children: "Provider Status:" }),
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { style: { color: "var(--rg-low-text)" }, children: "Authorized (Pending Capture)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-drawer-section", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "rg-drawer-section-title", children: "Audit Trail & Signals" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: audit ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "Decision ID:" }),
              " ",
              audit.data.decision.decision_id
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "Order ID:" }),
              " ",
              audit.data.decision.order_id
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "Policy Action:" }),
              " ",
              audit.data.policy_trace.policy_action
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { marginTop: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "Reconstructed Features:" }),
              " ",
              Object.keys(audit.data.feature_snapshot || {}).length,
              " features verified"
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { children: "Basic audit event snapshot recorded. Full feature reconstruction stored in tenant repository." }) })
        ] })
      ] })
    ] })
  ] }) });
};

// src/components/TransactionsPage.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var TransactionsPage = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useRiskDecisions(50);
  const [selectedId, setSelectedId] = (0, import_react4.useState)(null);
  const [searchTerm, setSearchTerm] = (0, import_react4.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Transaction Risk Explorer" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Search, filter, and inspect scored payments and policy actions." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: 12 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
    error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { marginBottom: 16, padding: 12, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { style: { color: "var(--rg-high-text)", fontSize: 13 }, children: [
      "Failed to load transactions: ",
      error.message
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      TransactionsGrid,
      {
        items,
        loading,
        quickFilterText: searchTerm,
        onRowClick: (id) => setSelectedId(id)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Showing ",
        items.length,
        " records in current page"
      ] }),
      hasMore && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(DetailDrawer, { decisionId: selectedId, onClose: () => setSelectedId(null) })
  ] });
};

// src/components/CustomersPage.tsx
var import_react5 = __toESM(require("react"), 1);
var import_jsx_runtime8 = require("react/jsx-runtime");
var CustomersPage = () => {
  const { items, loading, error } = useRiskDecisions(100);
  const customerMap = import_react5.default.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const item of items) {
      const custId = item.order_id ? `cust_${item.order_id.slice(-6)}` : `cust_anon_${(item.decision_id || "000000").slice(0, 6)}`;
      const existing = map.get(custId) || { count: 0, maxScore: 0, channel: item.channel || "web" };
      existing.count += 1;
      existing.maxScore = Math.max(existing.maxScore, item.risk_score || 0);
      map.set(custId, existing);
    }
    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats }));
  }, [items]);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Customer Directory (Foundation)" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Scoped customer risk entities derived from scored transactions and order references." })
    ] }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { color: "var(--rg-text-muted)" }, children: "Loading customers..." }),
    error && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { color: "var(--rg-high-text)" }, children: [
      "Failed to load customers: ",
      error.message
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }, children: customerMap.map((cust) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "rg-card", style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontWeight: 600, fontFamily: "monospace" }, children: cust.id }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RiskBadge, { score: cust.maxScore })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Scored Transactions: ",
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: cust.count })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Channel: ",
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: cust.channel })
      ] })
    ] }, cust.id)) })
  ] });
};

// src/components/ReturnGuardDashboard.tsx
var import_react6 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var ReturnGuardDashboard = ({
  initialTab = "overview",
  brandTitle = "ReturnGuard"
}) => {
  const [currentTab, setCurrentTab] = (0, import_react6.useState)(initialTab);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(DashboardShell, { currentTab, onTabChange: setCurrentTab, brandTitle, children: [
    currentTab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(OverviewPage, {}),
    currentTab === "transactions" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(TransactionsPage, {}),
    currentTab === "customers" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CustomersPage, {})
  ] });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.cjs.map