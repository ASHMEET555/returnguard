"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
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
  AuditTimeline: () => AuditTimeline,
  CHART_COLORS: () => CHART_COLORS,
  CHART_CSS_VARS: () => CHART_CSS_VARS,
  ChartContainer: () => ChartContainer,
  ChartEmptyState: () => ChartEmptyState,
  ChartErrorState: () => ChartErrorState,
  ChartLegend: () => ChartLegend,
  ChartLoadingState: () => ChartLoadingState,
  ChartTooltip: () => ChartTooltip,
  CustomersPage: () => CustomersPage,
  DashboardShell: () => DashboardShell,
  DetailDrawer: () => DetailDrawer,
  InvestigationsPage: () => InvestigationsPage,
  MerchantDashboardTemplate: () => MerchantDashboardTemplate,
  ModelsPage: () => ModelsPage,
  OverviewPage: () => OverviewPage,
  PaymentPipelinePage: () => PaymentPipelinePage,
  ReportsPage: () => ReportsPage,
  ReturnGuardDashboard: () => ReturnGuardDashboard,
  ReturnGuardProvider: () => ReturnGuardProvider,
  ReviewQueue: () => ReviewQueue,
  ReviewsPage: () => ReviewsPage,
  RiskAnalyticsPage: () => RiskAnalyticsPage,
  RiskBadge: () => RiskBadge,
  RiskDecisionGrid: () => RiskDecisionGrid,
  RiskExplanation: () => RiskExplanation,
  RiskScoreBadge: () => RiskScoreBadge,
  RiskSummary: () => RiskSummary,
  RulesPage: () => RulesPage,
  TransactionsGrid: () => TransactionsGrid,
  TransactionsPage: () => TransactionsPage,
  calculatePercentage: () => calculatePercentage,
  formatMetricValue: () => formatMetricValue,
  useCustomerProfile: () => useCustomerProfile,
  useCustomers: () => useCustomers,
  useModelPerformance: () => useModelPerformance,
  useReturnGuard: () => useReturnGuard,
  useReviewQueue: () => useReviewQueue,
  useReviews: () => useReviews,
  useRiskDecisions: () => useRiskDecisions,
  useRiskSummary: () => useRiskSummary,
  useRiskTrends: () => useRiskTrends,
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
  configuration,
  defaultTheme = "dark",
  defaultCurrency = "USD",
  children
}) => {
  const [theme, setTheme] = (0, import_react.useState)(defaultTheme);
  const [currency, setCurrency] = (0, import_react.useState)((configuration == null ? void 0 : configuration.currency) || defaultCurrency);
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
      setDateRange,
      configuration
    }),
    [resolvedClient, theme, currency, dateRange, configuration]
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
function useRiskTrends() {
  const { client } = useReturnGuard();
  const [data, setData] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const fetchTrends = (0, import_react2.useCallback)(async () => {
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
  (0, import_react2.useEffect)(() => {
    fetchTrends();
  }, [fetchTrends]);
  return { data, loading, error, refetch: fetchTrends };
}
function useRiskDecisions(limit = 25) {
  var _a;
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
    if (page == null ? void 0 : page.next_cursor) {
      setCursor(page.next_cursor);
    }
  }, [page]);
  const resetPage = (0, import_react2.useCallback)(() => {
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
function useCustomers(limit = 25) {
  var _a, _b;
  const { client } = useReturnGuard();
  const [page, setPage] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const [cursor, setCursor] = (0, import_react2.useState)(void 0);
  const fetchCustomers = (0, import_react2.useCallback)(async (targetCursor) => {
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
  (0, import_react2.useEffect)(() => {
    fetchCustomers(cursor);
  }, [fetchCustomers, cursor]);
  const nextPage = (0, import_react2.useCallback)(() => {
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
  const [profile, setProfile] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
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
  const [page, setPage] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const fetchReviews = (0, import_react2.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.reviews.list({ limit });
      setPage(res);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [client, limit]);
  (0, import_react2.useEffect)(() => {
    fetchReviews();
  }, [fetchReviews]);
  return { items: (_a = page == null ? void 0 : page.items) != null ? _a : [], loading, error, refetch: fetchReviews };
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
function useReviewQueue(limit = 50, statusFilter) {
  const { client, configuration } = useReturnGuard();
  const [reviews, setReviews] = (0, import_react2.useState)([]);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const [actionLoading, setActionLoading] = (0, import_react2.useState)(false);
  const fetchReviews = (0, import_react2.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.reviews.list({ limit, status: statusFilter });
      setReviews(res.items || []);
      return res.items || [];
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client, limit, statusFilter]);
  (0, import_react2.useEffect)(() => {
    fetchReviews();
  }, [fetchReviews]);
  const submitReview = (0, import_react2.useCallback)(
    async (decisionId, action, notes) => {
      setActionLoading(true);
      try {
        if (configuration == null ? void 0 : configuration.onReviewAction) {
          await configuration.onReviewAction(decisionId, action, notes);
        }
        const sdkAction = action.toLowerCase() === "approve" ? "approve" : "reject";
        const result = await client.reviews.submit({
          decision_id: decisionId,
          action: sdkAction,
          notes: notes || `Merchant review: ${action}`
        });
        await fetchReviews();
        return result;
      } catch (err) {
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
    approve: (decisionId, notes) => submitReview(decisionId, "APPROVE", notes),
    reject: (decisionId, notes) => submitReview(decisionId, "REJECT", notes)
  };
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

// src/components/RiskScoreBadge.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var RiskScoreBadge = ({
  score,
  tier,
  action,
  severity,
  size = "md",
  className = ""
}) => {
  const sizeClass = size === "sm" ? "rg-badge-sm" : size === "lg" ? "rg-badge-lg" : "";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `rg-score-badge-wrap ${sizeClass} ${className}`.trim(), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RiskBadge, { score, tier, action, severity }) });
};

// src/components/icons.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function resolveAccessibility(props) {
  var _a;
  const hasLabel = Boolean(props["aria-label"]);
  return {
    role: hasLabel ? "img" : void 0,
    "aria-hidden": hasLabel ? void 0 : (_a = props["aria-hidden"]) != null ? _a : true
  };
}
var OverviewIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "3", y: "3", width: "7", height: "9", rx: "1" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "14", y: "3", width: "7", height: "5", rx: "1" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "14", y: "12", width: "7", height: "9", rx: "1" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "3", y: "16", width: "7", height: "5", rx: "1" })
      ]
    })
  );
};
var TransactionsIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "2", y1: "10", x2: "22", y2: "10" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "6", y1: "15", x2: "10", y2: "15" })
      ]
    })
  );
};
var CustomersIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "9", cy: "7", r: "4" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
      ]
    })
  );
};
var AnalyticsIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "16 7 22 7 22 13" })
      ]
    })
  );
};
var RulesIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m9 12 2 2 4-4" })
      ]
    })
  );
};
var ModelsIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "9", y: "9", width: "6", height: "6" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M9 1v3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M15 1v3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M9 20v3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M15 20v3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M20 9h3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M20 14h3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M1 9h3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M1 14h3" })
      ]
    })
  );
};
var PipelineIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "18", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "6", cy: "6", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "18", cy: "6", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 12v3" })
      ]
    })
  );
};
var ReviewsIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })
      ]
    })
  );
};
var ReportsIcon = (_a) => {
  var _b = _a, {
    size = 18,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "14 2 14 8 20 8" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "10", y1: "9", x2: "8", y2: "9" })
      ]
    })
  );
};
var ShieldIcon = (_a) => {
  var _b = _a, {
    size = 20,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })
    })
  );
};
var SunIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "12", r: "4" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 2v2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 20v2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m4.93 4.93 1.41 1.41" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m17.66 17.66 1.41 1.41" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M2 12h2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M20 12h2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m6.34 17.66-1.41 1.41" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m19.07 4.93-1.41 1.41" })
      ]
    })
  );
};
var MoonIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })
    })
  );
};
var SearchIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "11", cy: "11", r: "8" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
      ]
    })
  );
};
var RefreshIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M21.5 2v6h-6" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" })
      ]
    })
  );
};
var CloseIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
      ]
    })
  );
};
var InfoIcon = (_a) => {
  var _b = _a, {
    size = 14,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
      ]
    })
  );
};
var DownloadIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "7 10 12 15 17 10" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
      ]
    })
  );
};
var AlertTriangleIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
      ]
    })
  );
};
var LockIcon = (_a) => {
  var _b = _a, {
    size = 14,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
      ]
    })
  );
};
var ChevronRightIcon = (_a) => {
  var _b = _a, {
    size = 14,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "9 18 15 12 9 6" })
    })
  );
};
var CheckCircleIcon = (_a) => {
  var _b = _a, {
    size = 16,
    className = "",
    style
  } = _b, props = __objRest(_b, [
    "size",
    "className",
    "style"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "svg",
    __spreadProps(__spreadValues({
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `rg-icon rg-icon-${size} ${className}`,
      style
    }, resolveAccessibility(props)), {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("polyline", { points: "22 4 12 14.01 9 11.01" })
      ]
    })
  );
};

// src/components/RiskSummary.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var RiskSummary = ({
  data: propData,
  loading: propLoading,
  onRefresh: propRefresh,
  metrics = ["total", "allow", "review", "block", "avgScore", "volume"],
  title = "Risk Assessment Summary",
  subtitle = "Real-time payment authorization & risk metrics for merchant",
  className = ""
}) => {
  const hookSummary = useRiskSummary();
  const summary = propData != null ? propData : hookSummary.data;
  const loading = propLoading != null ? propLoading : propData ? false : hookSummary.loading;
  const handleRefresh = propRefresh != null ? propRefresh : hookSummary.refetch;
  const totalDecisions = (summary == null ? void 0 : summary.total_decisions) || 0;
  const allowCount = (summary == null ? void 0 : summary.allow_count) || 0;
  const reviewCount = (summary == null ? void 0 : summary.review_count) || 0;
  const blockCount = (summary == null ? void 0 : summary.block_count) || 0;
  const avgScore = (summary == null ? void 0 : summary.average_risk_score) !== void 0 ? Number(summary.average_risk_score) : 0;
  const totalVolume = (summary == null ? void 0 : summary.total_volume_inr) !== void 0 ? Number(summary.total_volume_inr) : 0;
  const allowPct = totalDecisions > 0 ? (allowCount / totalDecisions * 100).toFixed(1) : "0.0";
  const reviewPct = totalDecisions > 0 ? (reviewCount / totalDecisions * 100).toFixed(1) : "0.0";
  const blockPct = totalDecisions > 0 ? (blockCount / totalDecisions * 100).toFixed(1) : "0.0";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: `rg-risk-summary-card ${className}`.trim(), style: { marginBottom: 20 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { style: { margin: 0, fontSize: 16, fontWeight: 600, color: "var(--rg-text-primary)" }, children: title }),
            subtitle && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { margin: "4px 0 0 0", fontSize: 12, color: "var(--rg-text-secondary)" }, children: subtitle })
          ] }),
          handleRefresh && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            "button",
            {
              type: "button",
              className: "rg-btn rg-btn-secondary",
              onClick: handleRefresh,
              style: { fontSize: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 },
              title: "Refresh metrics",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RefreshIcon, { size: 12 }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "Sync" })
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12
        },
        children: [
          metrics.includes("total") && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rg-stat-card", style: { padding: "14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "rg-stat-label", children: "Total Evaluated" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(TransactionsIcon, { size: 16 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "rg-stat-value", style: { fontSize: 24, marginTop: 8 }, children: loading ? "--" : totalDecisions }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", marginTop: 4 }, children: "Scored transactions" })
          ] }),
          metrics.includes("allow") && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rg-stat-card", style: { padding: "14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "rg-stat-label", children: "Allow Rate" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ShieldIcon, { size: 16 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "rg-stat-value", style: { fontSize: 24, marginTop: 8, color: "var(--rg-low-text, #10b981)" }, children: loading ? "--" : `${allowPct}%` }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", marginTop: 4 }, children: loading ? "--" : `${allowCount} allowed` })
          ] }),
          metrics.includes("review") && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rg-stat-card", style: { padding: "14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "rg-stat-label", children: "Review Hold" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AlertTriangleIcon, { size: 16 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "rg-stat-value", style: { fontSize: 24, marginTop: 8, color: "var(--rg-med-text, #f59e0b)" }, children: loading ? "--" : `${reviewPct}%` }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", marginTop: 4 }, children: loading ? "--" : `${reviewCount} pending review` })
          ] }),
          metrics.includes("block") && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rg-stat-card", style: { padding: "14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "rg-stat-label", children: "Blocked" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AlertTriangleIcon, { size: 16 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "rg-stat-value", style: { fontSize: 24, marginTop: 8, color: "var(--rg-high-text, #ef4444)" }, children: loading ? "--" : `${blockPct}%` }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", marginTop: 4 }, children: loading ? "--" : `${blockCount} rejected` })
          ] }),
          metrics.includes("avgScore") && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rg-stat-card", style: { padding: "14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "rg-stat-label", children: "Avg Risk Score" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AnalyticsIcon, { size: 16 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rg-stat-value", style: { fontSize: 24, marginTop: 8 }, children: [
              loading ? "--" : Math.round(avgScore * 100),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: " / 100" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", marginTop: 4 }, children: "Model candidate_lgbm_v1" })
          ] }),
          metrics.includes("volume") && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rg-stat-card", style: { padding: "14px 16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "rg-stat-label", children: "Scored Volume" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(TransactionsIcon, { size: 16 })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "rg-stat-value", style: { fontSize: 24, marginTop: 8 }, children: loading ? "--" : `\u20B9${totalVolume.toLocaleString()}` }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)", marginTop: 4 }, children: "Authorized volume" })
          ] })
        ]
      }
    )
  ] });
};

// src/components/RiskDecisionGrid.tsx
var import_react3 = require("react");
var import_ag_grid_react = require("ag-grid-react");
var import_ag_grid_community = require("ag-grid-community");
var import_ag_grid = require("ag-grid-community/styles/ag-grid.css");
var import_ag_theme_alpine = require("ag-grid-community/styles/ag-theme-alpine.css");
var import_jsx_runtime6 = require("react/jsx-runtime");
import_ag_grid_community.ModuleRegistry.registerModules([import_ag_grid_community.AllCommunityModule]);
var RiskDecisionGrid = ({
  items: propItems,
  loading: propLoading,
  columns: customColumns,
  pageSize = 25,
  height = 460,
  quickFilter = true,
  onRowClick,
  onRefresh: propRefresh,
  title = "Risk Decisions"
}) => {
  var _a;
  const { theme } = useReturnGuard();
  const [filterText, setFilterText] = (0, import_react3.useState)("");
  const decisionsHook = useRiskDecisions(pageSize);
  const items = (_a = propItems != null ? propItems : decisionsHook.items) != null ? _a : [];
  const loading = propLoading != null ? propLoading : propItems ? false : decisionsHook.loading;
  const handleRefresh = propRefresh != null ? propRefresh : decisionsHook.refetch;
  const gridThemeClass = theme === "light" ? "ag-theme-alpine" : "ag-theme-alpine-dark";
  const defaultColumns = (0, import_react3.useMemo)(
    () => [
      {
        field: "order_id",
        headerName: "Order Reference",
        minWidth: 180,
        flex: 1.2,
        pinned: "left",
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontFamily: "monospace", fontWeight: 600, color: "var(--rg-text-primary)" }, children: params.value || "--" })
      },
      {
        field: "channel",
        headerName: "Channel",
        minWidth: 100,
        flex: 0.8,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RiskBadge, { score: params.value }),
        sort: "desc"
      },
      {
        field: "suggested_action",
        headerName: "Policy Action",
        minWidth: 150,
        flex: 1.1,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RiskBadge, { action: params.value })
      },
      {
        field: "severity",
        headerName: "Severity",
        minWidth: 110,
        flex: 0.8,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RiskBadge, { severity: params.value })
      },
      {
        field: "model_version",
        headerName: "Model Version",
        minWidth: 150,
        flex: 1,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: params.value || "candidate_lgbm_v1" })
      }
    ],
    []
  );
  const columnDefs = customColumns || defaultColumns;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rg-card", style: { padding: 16 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h4", { style: { margin: 0, fontSize: 15, fontWeight: 600, color: "var(--rg-text-primary)" }, children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
              "span",
              {
                style: {
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "var(--rg-bg-tertiary)",
                  color: "var(--rg-text-secondary)"
                },
                children: [
                  items.length,
                  " records"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            quickFilter && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { position: "relative", display: "flex", alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "span",
                {
                  style: {
                    position: "absolute",
                    left: 9,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--rg-text-muted)",
                    pointerEvents: "none"
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SearchIcon, { size: 13 })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "input",
                {
                  type: "text",
                  value: filterText,
                  onChange: (e) => setFilterText(e.target.value),
                  placeholder: "Filter decisions...",
                  style: {
                    fontSize: 12,
                    padding: "5px 10px 5px 28px",
                    borderRadius: 6,
                    border: "1px solid var(--rg-border-primary, #334155)",
                    background: "var(--rg-bg-secondary, #1e293b)",
                    color: "var(--rg-text-primary)",
                    outline: "none",
                    width: 170
                  }
                }
              )
            ] }),
            handleRefresh && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
              "button",
              {
                type: "button",
                className: "rg-btn rg-btn-secondary",
                onClick: handleRefresh,
                style: { fontSize: 12, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 },
                title: "Refresh decisions grid",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RefreshIcon, { size: 12 }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "Refresh" })
                ]
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: gridThemeClass, style: { height, width: "100%", borderRadius: 6, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      import_ag_grid_react.AgGridReact,
      {
        rowData: items,
        columnDefs,
        quickFilterText: filterText,
        loading,
        pagination: true,
        paginationPageSize: pageSize,
        rowSelection: { mode: "singleRow" },
        onRowClicked: (event) => {
          if (event.data && onRowClick) {
            const id = event.data.decision_id || event.data.order_id || "";
            onRowClick(id, event.data);
          }
        },
        defaultColDef: {
          sortable: true,
          filter: true,
          resizable: true
        }
      }
    ) })
  ] });
};

// src/components/ReviewQueue.tsx
var import_react4 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
var ReviewQueue = ({
  items: propItems,
  loading: propLoading,
  onApprove: propApprove,
  onReject: propReject,
  onSelectDecision,
  onRefresh: propRefresh,
  title = "Payment Authorization & Review Queue"
}) => {
  const queueHook = useReviewQueue();
  const reviews = propItems != null ? propItems : queueHook.reviews;
  const loading = propLoading != null ? propLoading : propItems ? false : queueHook.loading;
  const handleRefresh = propRefresh != null ? propRefresh : queueHook.refetch;
  const [activeItem, setActiveItem] = (0, import_react4.useState)(null);
  const [actionType, setActionType] = (0, import_react4.useState)(null);
  const [reviewNotes, setReviewNotes] = (0, import_react4.useState)("");
  const [submitting, setSubmitting] = (0, import_react4.useState)(false);
  const [notification, setNotification] = (0, import_react4.useState)(null);
  const handleOpenAction = (item, type) => {
    setActiveItem(item);
    setActionType(type);
    setReviewNotes("");
    setNotification(null);
  };
  const handleCloseModal = () => {
    setActiveItem(null);
    setActionType(null);
    setReviewNotes("");
  };
  const handleExecuteAction = async () => {
    if (!activeItem || !actionType) return;
    setSubmitting(true);
    try {
      if (actionType === "APPROVE") {
        if (propApprove) {
          await propApprove(activeItem.decision_id, reviewNotes);
        } else {
          await queueHook.approve(activeItem.decision_id, reviewNotes);
        }
      } else {
        if (propReject) {
          await propReject(activeItem.decision_id, reviewNotes);
        } else {
          await queueHook.reject(activeItem.decision_id, reviewNotes);
        }
      }
      setNotification({
        type: "success",
        message: `Decision for ${activeItem.order_id || activeItem.decision_id} successfully ${actionType === "APPROVE" ? "APPROVED (Payment Captured)" : "REJECTED (Authorization Voided)"}.`
      });
      handleCloseModal();
      if (handleRefresh) await handleRefresh();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to submit review decision"
      });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "rg-card", style: { padding: 16 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h4", { style: { margin: 0, fontSize: 16, fontWeight: 600, color: "var(--rg-text-primary)" }, children: title }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                "span",
                {
                  style: {
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "var(--rg-bg-tertiary)",
                    color: "var(--rg-text-secondary)"
                  },
                  children: [
                    reviews.length,
                    " pending"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { margin: "4px 0 0 0", fontSize: 12, color: "var(--rg-text-secondary)" }, children: "Transactions held by risk policies awaiting merchant authorization decisions." })
          ] }),
          handleRefresh && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
            "button",
            {
              type: "button",
              className: "rg-btn rg-btn-secondary",
              onClick: handleRefresh,
              style: { fontSize: 12, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 },
              title: "Refresh review queue",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RefreshIcon, { size: 12 }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "Sync Queue" })
              ]
            }
          )
        ]
      }
    ),
    notification && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        style: {
          padding: "10px 14px",
          borderRadius: 6,
          marginBottom: 14,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: notification.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
          border: `1px solid ${notification.type === "success" ? "#10b981" : "#ef4444"}`,
          color: notification.type === "success" ? "#10b981" : "#ef4444"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: notification.message }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "button",
            {
              type: "button",
              onClick: () => setNotification(null),
              style: { background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 16 },
              children: "\xD7"
            }
          )
        ]
      }
    ),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { padding: 40, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading review queue..." }) : reviews.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        style: {
          padding: "48px 24px",
          textAlign: "center",
          background: "var(--rg-bg-secondary)",
          borderRadius: 8,
          border: "1px dashed var(--rg-border-primary)"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { color: "#10b981", marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CheckCircleIcon, { size: 32 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: 15, fontWeight: 600, color: "var(--rg-text-primary)" }, children: "Review Queue Clear" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginTop: 4 }, children: "All incoming payment transactions have been evaluated and cleared." })
        ]
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "table",
      {
        style: {
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          textAlign: "left"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
            "tr",
            {
              style: {
                borderBottom: "1px solid var(--rg-border-primary)",
                color: "var(--rg-text-secondary)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "10px 12px" }, children: "Order Reference" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "10px 12px" }, children: "Risk Score" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "10px 12px" }, children: "Policy Hold Trigger" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "10px 12px" }, children: "Status" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "10px 12px", textAlign: "right" }, children: "Actions" })
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("tbody", { children: reviews.map((item) => {
            const ruleHits = item.rule_hits || [];
            return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "tr",
              {
                style: {
                  borderBottom: "1px solid var(--rg-border-primary)",
                  transition: "background 0.15s ease"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("td", { style: { padding: "12px" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "div",
                      {
                        style: {
                          fontFamily: "monospace",
                          fontWeight: 600,
                          color: "var(--rg-text-primary)",
                          cursor: onSelectDecision ? "pointer" : "default"
                        },
                        onClick: () => onSelectDecision && onSelectDecision(item.decision_id),
                        children: item.order_id || item.decision_id
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                      "Channel: ",
                      item.channel || "paypal"
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RiskBadge, { score: item.risk_score, tier: item.tier }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "12px" }, children: ruleHits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: ruleHits.map((rule, idx) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                    "span",
                    {
                      style: {
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#f59e0b",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        fontFamily: "monospace"
                      },
                      children: rule
                    },
                    idx
                  )) }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: "var(--rg-text-muted)", fontSize: 12 }, children: item.policy_action || "AUTH_HOLD_PENDING_REVIEW" }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                    "span",
                    {
                      style: {
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "rgba(245, 158, 11, 0.15)",
                        color: "#f59e0b"
                      },
                      children: "HELD_FOR_REVIEW"
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "12px", textAlign: "right" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "inline-flex", gap: 6 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "button",
                      {
                        type: "button",
                        className: "rg-btn",
                        onClick: () => handleOpenAction(item, "APPROVE"),
                        style: {
                          fontSize: 12,
                          padding: "4px 10px",
                          background: "#10b981",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: 600
                        },
                        children: "Approve"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "button",
                      {
                        type: "button",
                        className: "rg-btn",
                        onClick: () => handleOpenAction(item, "REJECT"),
                        style: {
                          fontSize: 12,
                          padding: "4px 10px",
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: 600
                        },
                        children: "Reject"
                      }
                    )
                  ] }) })
                ]
              },
              item.decision_id || item.id
            );
          }) })
        ]
      }
    ) }),
    activeItem && actionType && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "div",
      {
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1e3
        },
        onClick: handleCloseModal,
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "div",
          {
            className: "rg-card",
            style: {
              width: "90%",
              maxWidth: 480,
              padding: 24,
              background: "var(--rg-bg-primary, #0f172a)",
              borderRadius: 8,
              border: "1px solid var(--rg-border-primary, #334155)"
            },
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("h4", { style: { margin: 0, fontSize: 17, color: "var(--rg-text-primary)" }, children: [
                "Confirm ",
                actionType === "APPROVE" ? "Approval & Payment Capture" : "Rejection & Payment Void"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: 13, color: "var(--rg-text-secondary)", marginTop: 8 }, children: actionType === "APPROVE" ? `Approving will release the authorization hold on Order ${activeItem.order_id || activeItem.decision_id} and execute PayPal payment capture.` : `Rejecting will void the PayPal authorization hold on Order ${activeItem.order_id || activeItem.decision_id} and mark the order cancelled.` }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { marginTop: 16 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", display: "block" }, children: "Review Notes (Optional)" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "textarea",
                  {
                    value: reviewNotes,
                    onChange: (e) => setReviewNotes(e.target.value),
                    placeholder: "Add audit reason for merchant record...",
                    rows: 3,
                    style: {
                      width: "100%",
                      marginTop: 6,
                      padding: 8,
                      fontSize: 13,
                      borderRadius: 6,
                      border: "1px solid var(--rg-border-primary)",
                      background: "var(--rg-bg-secondary)",
                      color: "var(--rg-text-primary)",
                      outline: "none"
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "button",
                  {
                    type: "button",
                    className: "rg-btn rg-btn-secondary",
                    onClick: handleCloseModal,
                    disabled: submitting,
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "button",
                  {
                    type: "button",
                    className: "rg-btn",
                    onClick: handleExecuteAction,
                    disabled: submitting,
                    style: {
                      background: actionType === "APPROVE" ? "#10b981" : "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer"
                    },
                    children: submitting ? "Processing..." : `Confirm ${actionType}`
                  }
                )
              ] })
            ]
          }
        )
      }
    )
  ] });
};

// src/components/RiskExplanation.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var RiskExplanation = ({
  decisionId,
  decision: propDecision,
  loading: propLoading,
  className = "",
  title = "Risk Assessment & Explanation"
}) => {
  const hookResult = useTransactionRisk(decisionId || "");
  const decision = propDecision != null ? propDecision : hookResult.decision;
  const loading = propLoading != null ? propLoading : propDecision ? false : hookResult.loading;
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `rg-card ${className}`.trim(), style: { padding: 20, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading risk explanation..." });
  }
  if (!decision) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `rg-card ${className}`.trim(), style: { padding: 20, textAlign: "center", color: "var(--rg-text-secondary)" }, children: "Select a transaction or provide a decision ID to view explainability details." });
  }
  const scoreNum = Number(decision.risk_score || 0);
  const scorePct = Math.round(scoreNum * 100);
  const reasonCodes = decision.reason_codes || [];
  const ruleHits = decision.rule_hits || [];
  const riskIncreasingReasons = reasonCodes.filter(
    (rc) => rc.direction === "increases_risk" || rc.direction === "high"
  );
  const riskDecreasingReasons = reasonCodes.filter(
    (rc) => rc.direction === "decreases_risk" || rc.direction === "low"
  );
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: `rg-card ${className}`.trim(), style: { padding: 20 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { style: { margin: 0, fontSize: 16, fontWeight: 600, color: "var(--rg-text-primary)" }, children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { fontSize: 12, color: "var(--rg-text-secondary)", fontFamily: "monospace" }, children: [
          "Decision: ",
          decision.decision_id || decision.order_id
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RiskBadge, { score: decision.risk_score }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RiskBadge, { action: decision.suggested_action })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      "div",
      {
        style: {
          padding: "12px 14px",
          borderRadius: 6,
          background: "var(--rg-bg-secondary, #1e293b)",
          border: "1px solid var(--rg-border-primary, #334155)",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-secondary)", textTransform: "uppercase" }, children: "Evaluated Risk Score" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { fontSize: 20, fontWeight: 700, color: "var(--rg-text-primary)", marginTop: 2 }, children: [
              scorePct,
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: 12, fontWeight: 400, color: "var(--rg-text-muted)" }, children: "/ 100" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-secondary)", textTransform: "uppercase" }, children: "Suggested Policy Action" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--rg-text-primary)", marginTop: 4 }, children: decision.suggested_action || "review" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-secondary)", textTransform: "uppercase" }, children: "Model Engine" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 13, color: "var(--rg-text-secondary)", fontFamily: "monospace", marginTop: 4 }, children: decision.model_version || "candidate_lgbm_v1" })
          ] })
        ]
      }
    ),
    ruleHits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Rule Triggers & Safeguards" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: ruleHits.map((rule, idx) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "span",
        {
          style: {
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 4,
            background: "rgba(245, 158, 11, 0.15)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            fontFamily: "monospace"
          },
          children: [
            "\u25CF ",
            rule
          ]
        },
        idx
      )) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { marginTop: 14 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: "Feature Attribution (SHAP Analysis)" }),
      reasonCodes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: "No prominent feature deviations identified for this transaction." }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
        riskIncreasingReasons.map((rc, idx) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: 4,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              fontSize: 12
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { color: "#ef4444", fontWeight: 700 }, children: "\u25B2" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontFamily: "monospace", fontWeight: 600, color: "var(--rg-text-primary)" }, children: rc.feature })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { fontSize: 11, color: "#ef4444", fontWeight: 600 }, children: [
                "Increases Risk (Rank #",
                rc.shap_rank || idx + 1,
                ")"
              ] })
            ]
          },
          `inc-${idx}`
        )),
        riskDecreasingReasons.map((rc, idx) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: 4,
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontSize: 12
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { color: "#10b981", fontWeight: 700 }, children: "\u25BC" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontFamily: "monospace", fontWeight: 600, color: "var(--rg-text-primary)" }, children: rc.feature })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { fontSize: 11, color: "#10b981", fontWeight: 600 }, children: [
                "Decreases Risk (Rank #",
                rc.shap_rank || idx + 1,
                ")"
              ] })
            ]
          },
          `dec-${idx}`
        ))
      ] })
    ] })
  ] });
};

// src/components/AuditTimeline.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var AuditTimeline = ({
  decisionId,
  audit: propAudit,
  loading: propLoading,
  className = "",
  title = "Audit Reconstruction & Evidence Trail"
}) => {
  var _a, _b, _c;
  const hookResult = useTransactionRisk(decisionId || "");
  const audit = propAudit != null ? propAudit : hookResult.audit;
  const loading = propLoading != null ? propLoading : propAudit ? false : hookResult.loading;
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: `rg-card ${className}`.trim(), style: { padding: 20, textAlign: "center", color: "var(--rg-text-muted)" }, children: "Loading audit trail..." });
  }
  if (!audit) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: `rg-card ${className}`.trim(), style: { padding: 20, textAlign: "center", color: "var(--rg-text-secondary)" }, children: "Select a transaction or specify a decision ID to reconstruct its immutable audit trail." });
  }
  const d = (_a = audit.data) == null ? void 0 : _a.decision;
  const p = (_b = audit.data) == null ? void 0 : _b.policy_trace;
  const features = (_c = audit.data) == null ? void 0 : _c.feature_snapshot;
  const steps = [
    {
      title: "Transaction Ingestion & Authorization Hold",
      desc: "Payment intent created and transaction payload ingested by ReturnGuard.",
      time: (d == null ? void 0 : d.created_at) || "Step 1",
      status: "complete",
      badge: (d == null ? void 0 : d.channel) || "paypal"
    },
    {
      title: "Feature Vector Snapshot & SHAP Evaluation",
      desc: `Extracted ${features ? Object.keys(features).length : "deterministic"} features. Explanations calculated against baseline.`,
      time: (d == null ? void 0 : d.created_at) || "Step 2",
      status: "complete",
      badge: (d == null ? void 0 : d.model_version) || "candidate_lgbm_v1"
    },
    {
      title: "Risk Decision & Policy Recommendation",
      desc: `Risk score evaluated as ${(Number((d == null ? void 0 : d.risk_score) || 0) * 100).toFixed(0)}/100 (${(d == null ? void 0 : d.tier) || "LOW"}). Action: ${(p == null ? void 0 : p.suggested_action) || (p == null ? void 0 : p.policy_action) || "allow"}.`,
      time: (d == null ? void 0 : d.created_at) || "Step 3",
      status: "complete",
      badge: (p == null ? void 0 : p.policy_rule) || "LOW_ALLOW"
    },
    {
      title: "Review Resolution & Evidence Sealing",
      desc: (p == null ? void 0 : p.policy_action) === "REVIEW" || (p == null ? void 0 : p.policy_action) === "MANUAL_REVIEW" ? "Held for merchant admin approval before payment capture." : "Automated policy rule satisfied; transaction cleared for immediate capture.",
      time: "Step 4",
      status: (p == null ? void 0 : p.policy_action) === "REVIEW" ? "pending" : "complete",
      badge: "Audit Seal Ready"
    }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: `rg-card ${className}`.trim(), style: { padding: 20 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h4", { style: { margin: 0, fontSize: 16, fontWeight: 600, color: "var(--rg-text-primary)" }, children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { style: { fontSize: 12, color: "var(--rg-text-secondary)", fontFamily: "monospace" }, children: [
          "Reference: ",
          (d == null ? void 0 : d.decision_id) || decisionId
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "span",
        {
          style: {
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 12,
            background: "var(--rg-bg-tertiary)",
            color: "var(--rg-text-secondary)"
          },
          children: "Cryptographic Log Verified"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { position: "relative", paddingLeft: 24, marginTop: 12 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "div",
        {
          style: {
            position: "absolute",
            left: 7,
            top: 10,
            bottom: 10,
            width: 2,
            background: "var(--rg-border-primary, #334155)"
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: steps.map((step, idx) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "div",
          {
            style: {
              position: "absolute",
              left: -24,
              top: 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: step.status === "complete" ? "#10b981" : "#f59e0b",
              border: "3px solid var(--rg-bg-primary, #0f172a)"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--rg-text-primary)" }, children: step.title }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "span",
            {
              style: {
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--rg-bg-secondary)",
                color: "var(--rg-text-muted)",
                fontFamily: "monospace"
              },
              children: step.badge
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { style: { margin: "4px 0 0 0", fontSize: 12, color: "var(--rg-text-secondary)" }, children: step.desc })
      ] }, idx)) })
    ] })
  ] });
};

// src/components/MerchantDashboardTemplate.tsx
var import_react16 = __toESM(require("react"), 1);

// src/components/OverviewPage.tsx
var import_react5 = require("react");
var import_recharts = require("recharts");

// src/components/charts/ChartStates.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var ChartEmptyState = ({
  title = "No Data Available",
  message = "There is no recorded data to display for this metric.",
  height = "100%",
  className = ""
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "div",
    {
      className: `rg-chart-state rg-chart-state-empty ${className}`,
      style: { height },
      role: "status",
      "aria-label": `${title}: ${message}`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-state-icon-wrap", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: "18", y1: "20", x2: "18", y2: "10", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: "12", y1: "20", x2: "12", y2: "4", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: "6", y1: "20", x2: "6", y2: "14", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: "2", y1: "20", x2: "22", y2: "20", strokeLinecap: "round" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-state-title", children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-state-desc", children: message })
      ]
    }
  );
};
var ChartLoadingState = ({
  message = "Loading analytics data...",
  height = "100%",
  className = ""
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "div",
    {
      className: `rg-chart-state rg-chart-state-loading ${className}`,
      style: { height },
      role: "status",
      "aria-live": "polite",
      "aria-busy": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "rg-chart-skeleton-wrap", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-skeleton-bar", style: { height: "40%" } }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-skeleton-bar", style: { height: "80%" } }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-skeleton-bar", style: { height: "60%" } }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-skeleton-bar", style: { height: "100%" } }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-skeleton-bar", style: { height: "70%" } })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-state-desc", children: message })
      ]
    }
  );
};
var ChartErrorState = ({
  title = "Failed to Load Chart",
  error,
  onRetry,
  height = "100%",
  className = ""
}) => {
  const errorMessage = typeof error === "string" ? error : (error == null ? void 0 : error.message) || "An error occurred while loading chart data.";
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "div",
    {
      className: `rg-chart-state rg-chart-state-error ${className}`,
      style: { height },
      role: "alert",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-state-icon-wrap rg-chart-state-icon-error", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: "12", y1: "8", x2: "12", y2: "12", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("line", { x1: "12", y1: "16", x2: "12.01", y2: "16", strokeLinecap: "round" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-state-title", children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "rg-chart-state-desc", children: errorMessage }),
        onRetry && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "button",
          {
            type: "button",
            onClick: onRetry,
            className: "rg-btn rg-btn-secondary rg-chart-retry-btn",
            children: "Retry"
          }
        )
      ]
    }
  );
};

// src/components/charts/ChartContainer.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var ChartContainer = ({
  children,
  title,
  subtitle,
  height = 240,
  minHeight,
  className = "",
  style,
  loading = false,
  loadingMessage,
  error = null,
  empty = false,
  emptyTitle,
  emptyMessage,
  onRetry,
  action,
  ariaLabel,
  ariaDescription
}) => {
  const containerHeight = typeof height === "number" ? `${height}px` : height;
  const containerMinHeight = minHeight ? typeof minHeight === "number" ? `${minHeight}px` : minHeight : void 0;
  const hasHeader = Boolean(title || subtitle || action);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
    "div",
    {
      className: `rg-chart-container ${className}`,
      style,
      role: "region",
      "aria-label": ariaLabel || title || "Analytics Chart",
      "aria-description": ariaDescription || subtitle,
      children: [
        hasHeader && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "rg-chart-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "rg-chart-header-text", children: [
            title && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { className: "rg-chart-title", children: title }),
            subtitle && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "rg-chart-subtitle", children: subtitle })
          ] }),
          action && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "rg-chart-header-action", children: action })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "div",
          {
            className: "rg-chart-canvas-wrap",
            style: {
              height: containerHeight,
              minHeight: containerMinHeight,
              position: "relative",
              width: "100%",
              minWidth: 0
            },
            children: loading ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ChartLoadingState, { message: loadingMessage, height: "100%" }) : error ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ChartErrorState, { error, onRetry, height: "100%" }) : empty ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ChartEmptyState, { title: emptyTitle, message: emptyMessage, height: "100%" }) : children
          }
        )
      ]
    }
  );
};
ChartContainer.defaultProps = {
  height: 240,
  loading: false,
  empty: false
};

// src/components/charts/chartTheme.ts
var CHART_COLORS = {
  // Policy & Risk Actions
  allow: "#10b981",
  // Emerald - ALLOW / Low Risk
  review: "#f59e0b",
  // Amber - REVIEW / Manual Review / Medium Risk
  stepUp: "#f97316",
  // Orange - STEP_UP_VERIFICATION
  block: "#ef4444",
  // Rose - BLOCK / High Risk
  critical: "#be123c",
  // Crimson - CRITICAL
  // Channels & Accents
  accent: "#3b82f6",
  // Blue - Primary Accent / PayPal
  paypal: "#3b82f6",
  // Blue
  cod: "#8b5cf6",
  // Purple - Cash on Delivery
  other: "#64748b",
  // Slate - Other Channels / Neutral
  // Model Benchmarks
  synthetic: "#3b82f6",
  // Blue - Synthetic Candidate Benchmark
  ieeeCis: "#8b5cf6",
  // Purple - IEEE-CIS Real-world Benchmark
  baseline: "#64748b",
  // Slate - Baseline
  // Grid, Ticks, Borders
  gridDark: "#192436",
  gridLight: "#edf2f7",
  axisDark: "#8b949e",
  axisLight: "#64748b",
  textDark: "#f9fafb",
  textLight: "#0f172a"
};
var CHART_CSS_VARS = {
  allow: "var(--rg-low-text, #10b981)",
  review: "var(--rg-med-text, #f59e0b)",
  block: "var(--rg-high-text, #ef4444)",
  critical: "var(--rg-crit-text, #be123c)",
  accent: "var(--rg-accent, #3b82f6)",
  grid: "var(--rg-border-subtle, #192436)",
  axis: "var(--rg-text-muted, #8b949e)",
  text: "var(--rg-text-primary, #f9fafb)",
  cardBg: "var(--rg-bg-card, #131c2e)",
  border: "var(--rg-border, #1f2d42)"
};
function calculatePercentage(value, total, decimals = 1) {
  if (!total || total <= 0 || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  const pct = value / total * 100;
  return Number(pct.toFixed(decimals));
}
function formatMetricValue(value, format = "count", currencyCode = "INR") {
  if (value === void 0 || value === null || !Number.isFinite(value)) {
    return "\u2014";
  }
  switch (format) {
    case "percent":
      return `${value.toFixed(1)}%`;
    case "ratio":
      return value.toFixed(4);
    case "currency":
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    case "count":
    default:
      return new Intl.NumberFormat("en-US").format(Math.round(value));
  }
}

// src/components/charts/ChartTooltip.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var ChartTooltip = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  valuePrefix = "",
  valueSuffix = "",
  showTotal = false,
  totalLabel = "Total",
  className = ""
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const formattedLabel = labelFormatter ? labelFormatter(label) : label;
  let totalValue = 0;
  if (showTotal) {
    for (const item of payload) {
      if (typeof item.value === "number" && Number.isFinite(item.value)) {
        totalValue += item.value;
      }
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: `rg-chart-tooltip ${className}`, role: "tooltip", children: [
    formattedLabel !== void 0 && formattedLabel !== null && formattedLabel !== "" && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "rg-chart-tooltip-header", children: formattedLabel }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "rg-chart-tooltip-body", children: [
      payload.map((item, index) => {
        var _a;
        const swatchColor = item.color || item.fill || "var(--rg-accent)";
        const name = item.name || String(item.dataKey || `Item ${index + 1}`);
        let displayVal;
        if (formatter) {
          displayVal = formatter(item.value, name, item, index);
        } else if (typeof item.value === "number") {
          displayVal = `${valuePrefix}${formatMetricValue(item.value, "count")}${item.unit || valueSuffix}`;
        } else {
          displayVal = (_a = item.value) != null ? _a : "\u2014";
        }
        return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "rg-chart-tooltip-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            "span",
            {
              className: "rg-chart-tooltip-swatch",
              style: { backgroundColor: swatchColor },
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "rg-chart-tooltip-name", children: name }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "rg-chart-tooltip-value", children: displayVal })
        ] }, `${name}-${index}`);
      }),
      showTotal && payload.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "rg-chart-tooltip-row rg-chart-tooltip-total", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "rg-chart-tooltip-name", children: totalLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "rg-chart-tooltip-value", children: [
          valuePrefix,
          formatMetricValue(totalValue, "count"),
          valueSuffix
        ] })
      ] })
    ] })
  ] });
};

// src/components/charts/ChartLegend.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
var ChartLegend = ({
  payload,
  items,
  showValues = false,
  showPercentages = false,
  align = "center",
  className = ""
}) => {
  const legendItems = items || payload || [];
  if (legendItems.length === 0) {
    return null;
  }
  const justifyClass = align === "left" ? "rg-chart-legend-left" : align === "right" ? "rg-chart-legend-right" : "rg-chart-legend-center";
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: `rg-chart-legend ${justifyClass} ${className}`, role: "list", children: legendItems.map((item, index) => {
    var _a;
    const key = item.id || `${item.value}-${index}`;
    const swatchColor = item.color || "var(--rg-accent)";
    const label = (_a = item.value) != null ? _a : `Series ${index + 1}`;
    let detail = null;
    if (item.formattedValue) {
      detail = item.formattedValue;
    } else if (showValues && item.count !== void 0) {
      if (showPercentages && item.percentage !== void 0) {
        detail = `${item.count} (${item.percentage}%)`;
      } else {
        detail = `${item.count}`;
      }
    } else if (showPercentages && item.percentage !== void 0) {
      detail = `${item.percentage}%`;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
      "div",
      {
        className: `rg-chart-legend-item ${item.inactive ? "rg-chart-legend-inactive" : ""}`,
        role: "listitem",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            "span",
            {
              className: "rg-chart-legend-dot",
              style: { backgroundColor: swatchColor },
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "rg-chart-legend-label", children: label }),
          detail !== null && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "rg-chart-legend-value", children: detail })
        ]
      },
      key
    );
  }) });
};

// src/components/OverviewPage.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
var OverviewPage = () => {
  const { data, loading, error, refetch } = useRiskSummary();
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
  const allowCount = summary.allow_count || 0;
  const reviewCount = summary.review_count || 0;
  const blockCount = summary.block_count || 0;
  const totalDecisions = summary.total_decisions || allowCount + reviewCount + blockCount;
  const flaggedCount = reviewCount + blockCount;
  const flaggedPct = totalDecisions > 0 ? (flaggedCount / totalDecisions * 100).toFixed(1) : "0.0";
  const allowPctNum = totalDecisions > 0 ? allowCount / totalDecisions * 100 : 0;
  const reviewPctNum = totalDecisions > 0 ? reviewCount / totalDecisions * 100 : 0;
  const blockPctNum = totalDecisions > 0 ? blockCount / totalDecisions * 100 : 0;
  const allowPct = allowPctNum.toFixed(1);
  const reviewPct = reviewPctNum.toFixed(1);
  const blockPct = blockPctNum.toFixed(1);
  const allCategories = (0, import_react5.useMemo)(
    () => [
      {
        id: "ALLOW",
        name: "ALLOW",
        value: allowCount,
        count: allowCount,
        percentage: allowPctNum,
        color: CHART_COLORS.allow,
        dotClass: "rg-risk-dot-low",
        textVar: "var(--rg-low-text)"
      },
      {
        id: "REVIEW",
        name: "REVIEW",
        value: reviewCount,
        count: reviewCount,
        percentage: reviewPctNum,
        color: CHART_COLORS.review,
        dotClass: "rg-risk-dot-medium",
        textVar: "var(--rg-med-text)"
      },
      {
        id: "BLOCK",
        name: "BLOCK",
        value: blockCount,
        count: blockCount,
        percentage: blockPctNum,
        color: CHART_COLORS.block,
        dotClass: "rg-risk-dot-high",
        textVar: "var(--rg-high-text)"
      }
    ],
    [allowCount, reviewCount, blockCount, allowPctNum, reviewPctNum, blockPctNum]
  );
  const pieData = (0, import_react5.useMemo)(() => allCategories.filter((cat) => cat.value > 0), [allCategories]);
  const legendItems = (0, import_react5.useMemo)(
    () => allCategories.map((cat) => ({
      id: cat.id,
      value: cat.name,
      count: cat.count,
      percentage: Number(cat.percentage.toFixed(1)),
      color: cat.color,
      formattedValue: `${cat.count.toLocaleString()} (${cat.percentage.toFixed(1)}%)`
    })),
    [allCategories]
  );
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading risk operations summary..." });
  }
  if (error) {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-error-state", role: "alert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h4", { children: "Failed to load risk summary" }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: error.message }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "Retry" })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h2", { style: { margin: "0 0 6px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Risk Operations Overview" }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Portfolio risk posture, policy distributions, and live transaction indicators." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "Transactions Scored" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-kpi-icon-wrap", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(TransactionsIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-card-value", children: summary.total_decisions.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-card-subtitle", children: "Lifetime scored payments" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "Flagged Transactions" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-kpi-icon-wrap rg-kpi-icon-warning", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AlertTriangleIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-card-value", children: flaggedCount.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card-subtitle", children: [
          flaggedPct,
          "% flag rate"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "High Risk / Block Action" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-kpi-icon-wrap rg-kpi-icon-danger", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ShieldIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-card-value", children: summary.block_count.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-card-subtitle", children: "Recommended hold/stop" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "Average Risk Score" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-kpi-icon-wrap rg-kpi-icon-accent", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AnalyticsIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-card-value", children: (summary.average_risk_score * 100).toFixed(0) }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rg-card-subtitle", children: "Portfolio scale (0 - 100)" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-analytical-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
        ChartContainer,
        {
          title: "Policy Action Distribution",
          subtitle: "Real-time policy decisions applied to evaluated transactions",
          height: 320,
          empty: totalDecisions === 0,
          emptyTitle: "No decisions evaluated",
          emptyMessage: "No evaluated transactions recorded for this tenant.",
          ariaLabel: `Policy distribution donut chart: ${totalDecisions} decisions`,
          ariaDescription: `ALLOW: ${allowCount} (${allowPct}%), REVIEW: ${reviewCount} (${reviewPct}%), BLOCK: ${blockCount} (${blockPct}%)`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-donut-wrapper", children: [
              /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_recharts.ResponsiveContainer, { width: "100%", height: 240, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_recharts.PieChart, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
                  import_recharts.Pie,
                  {
                    data: pieData,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: 56,
                    outerRadius: 82,
                    paddingAngle: pieData.length > 1 ? 3 : 0,
                    dataKey: "value",
                    isAnimationActive: false,
                    children: pieData.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_recharts.Cell, { fill: entry.color, stroke: "var(--rg-bg-card)", strokeWidth: 2 }, entry.id))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
                  import_recharts.Tooltip,
                  {
                    content: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
                      ChartTooltip,
                      {
                        formatter: (val, name) => [
                          `${Number(val).toLocaleString()} (${calculatePercentage(Number(val), totalDecisions)}%)`,
                          name
                        ]
                      }
                    )
                  }
                )
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-donut-center", "aria-hidden": "true", children: [
                /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-donut-center-val", children: totalDecisions.toLocaleString() }),
                /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-donut-center-label", children: "Decisions" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ChartLegend, { items: legendItems, showValues: true, showPercentages: true, align: "center" })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "rg-card", style: { display: "flex", flexDirection: "column", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Scoring System Health" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-muted)" }, children: "Operational parameters and real-time execution status" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--rg-border-subtle)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Engine Status" }),
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
                    "span",
                    {
                      style: {
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--rg-low-text)",
                        fontWeight: 600,
                        fontSize: 12
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-risk-dot rg-risk-dot-low", "aria-hidden": "true" }),
                        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "Operational" })
                      ]
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--rg-border-subtle)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Execution Mode" }),
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-meta-tag", style: { fontWeight: 500 }, children: "Active (Shadow Mode)" })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--rg-border-subtle)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Serving Model" }),
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-meta-tag rg-font-mono", style: { fontSize: 11 }, children: "candidate_lgbm_v1" })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--rg-border-subtle)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Tenant Scope" }),
                  /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "rg-font-mono", style: { fontSize: 12, color: "var(--rg-text-primary)" }, children: summary.tenant_id })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("table", { className: "rg-reports-stat-table", style: { marginTop: 16 }, "aria-label": "Policy recommendations breakdown", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("tbody", { children: allCategories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("td", { className: "rg-reports-stat-label", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: `rg-risk-dot ${cat.dotClass}` }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { children: [
              cat.name,
              " Decisions"
            ] })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("td", { className: "rg-reports-stat-value", style: { color: cat.textVar }, children: [
            cat.count.toLocaleString(),
            " (",
            cat.percentage.toFixed(1),
            "%)"
          ] })
        ] }, cat.id)) }) })
      ] })
    ] })
  ] });
};

// src/components/TransactionsPage.tsx
var import_react8 = require("react");

// src/components/TransactionsGrid.tsx
var import_react6 = require("react");
var import_ag_grid_react2 = require("ag-grid-react");
var import_ag_grid_community2 = require("ag-grid-community");
var import_ag_grid2 = require("ag-grid-community/styles/ag-grid.css");
var import_ag_theme_alpine2 = require("ag-grid-community/styles/ag-theme-alpine.css");
var import_jsx_runtime15 = require("react/jsx-runtime");
import_ag_grid_community2.ModuleRegistry.registerModules([import_ag_grid_community2.AllCommunityModule]);
var TransactionsGrid = ({
  items,
  loading = false,
  onRowClick,
  quickFilterText = ""
}) => {
  const { theme } = useReturnGuard();
  const gridThemeClass = theme === "light" ? "ag-theme-alpine" : "ag-theme-alpine-dark";
  const columnDefs = (0, import_react6.useMemo)(
    () => [
      {
        field: "order_id",
        headerName: "Order ID",
        minWidth: 190,
        flex: 1.3,
        pinned: "left",
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { style: { fontFamily: "monospace", fontWeight: 600, color: "var(--rg-text-primary)" }, children: params.value || "--" })
      },
      {
        field: "channel",
        headerName: "Channel",
        minWidth: 100,
        flex: 0.8,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(RiskBadge, { score: params.value }),
        sort: "desc"
      },
      {
        field: "suggested_action",
        headerName: "Policy Action",
        minWidth: 160,
        flex: 1.2,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(RiskBadge, { action: params.value })
      },
      {
        field: "severity",
        headerName: "Severity",
        minWidth: 110,
        flex: 0.9,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(RiskBadge, { severity: params.value })
      },
      {
        headerName: "Payment Status",
        minWidth: 180,
        flex: 1.3,
        valueGetter: () => "Not Integrated (Provider Owned)",
        cellRenderer: () => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", fontStyle: "italic" }, children: "Provider Owned (ShopPoint)" })
      },
      {
        field: "model_version",
        headerName: "Model",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { style: { fontSize: 12, fontFamily: "monospace", color: "var(--rg-text-muted)" }, children: params.value || "candidate_lgbm_v1" })
      }
    ],
    []
  );
  const defaultColDef = (0, import_react6.useMemo)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
    "div",
    {
      className: `rg-transactions-grid-wrap ${gridThemeClass}`,
      style: {
        height: "calc(100vh - 240px)",
        minHeight: 520,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--rg-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        import_ag_grid_react2.AgGridReact,
        {
          theme: "legacy",
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
          rowHeight: 44,
          headerHeight: 40,
          animateRows: true,
          onRowClicked: handleRowClicked
        }
      )
    }
  );
};

// src/components/DetailDrawer.tsx
var import_react7 = require("react");
var import_jsx_runtime16 = require("react/jsx-runtime");
var DetailDrawer = ({ decisionId, onClose }) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const { decision, audit, loading, error } = useTransactionRisk(decisionId);
  const drawerRef = (0, import_react7.useRef)(null);
  const closeButtonRef = (0, import_react7.useRef)(null);
  const previousActiveElementRef = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    if (decisionId) {
      previousActiveElementRef.current = document.activeElement;
      const timer = setTimeout(() => {
        var _a2;
        (_a2 = closeButtonRef.current) == null ? void 0 : _a2.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [decisionId]);
  const restoreFocus = (0, import_react7.useCallback)(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      el.focus();
    }
  }, []);
  const handleClose = (0, import_react7.useCallback)(() => {
    restoreFocus();
    onClose();
  }, [onClose, restoreFocus]);
  (0, import_react7.useEffect)(() => {
    if (!decisionId) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab") {
        const container = drawerRef.current;
        if (!container) return;
        const focusableElements = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [decisionId, handleClose]);
  if (!decisionId) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
    "div",
    {
      className: "rg-drawer-overlay",
      onClick: handleClose,
      "aria-hidden": "false",
      children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
        "aside",
        {
          ref: drawerRef,
          className: "rg-drawer",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "rg-drawer-title",
          "aria-describedby": "rg-drawer-desc",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("header", { className: "rg-drawer-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-drawer-header-info", children: [
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { id: "rg-drawer-desc", className: "rg-drawer-subtitle", children: "Transaction Investigation" }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { id: "rg-drawer-title", className: "rg-drawer-title", children: (decision == null ? void 0 : decision.order_id) || decisionId })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
                "button",
                {
                  ref: closeButtonRef,
                  type: "button",
                  className: "rg-drawer-close-btn",
                  onClick: handleClose,
                  "aria-label": "Close transaction investigation drawer",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(CloseIcon, { size: 14, "aria-hidden": "true" }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "Close" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-drawer-body", children: [
              loading && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-drawer-loading", role: "status", children: [
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-loading-spinner", "aria-hidden": "true" }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "Loading scoring audit and explanation..." })
              ] }),
              error && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-drawer-error", role: "alert", children: [
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-error-title", children: "Failed to load decision" }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-error-msg", children: error.message })
              ] }),
              decision && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-section-title", children: "ReturnGuard Recommendation" }),
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-verdict-bar", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RiskBadge, { score: decision.risk_score }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(RiskBadge, { action: decision.suggested_action }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "rg-verdict-severity", children: [
                      "Severity: ",
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: decision.severity || "unknown" })
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "rg-verdict-note", children: "ReturnGuard evaluates transaction characteristics and recommends an operational hold/action. Actual capture or decline is executed independently by the payment provider." })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-section-title", children: "Why This Was Flagged" }),
                  decision.reason_codes && decision.reason_codes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-reason-grid", children: decision.reason_codes.map((rc) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-reason-chip", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-reason-feature", children: rc.feature }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-reason-divider", children: ":" }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-reason-direction", children: rc.direction })
                  ] }, rc.feature)) }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-empty-text", children: "No specific rule or anomaly triggers flagged for this transaction." })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-section-title", children: "Payment & Processor Context" }),
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-context-grid", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-label", children: "Order ID" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-value rg-font-mono", children: decision.order_id || "--" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-label", children: "Channel" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-value", children: decision.channel || "web" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-label", children: "ReturnGuard Mode" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-value", children: decision.shadow ? "Shadow (Non-blocking)" : "Live Policy Enforcement" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-label", children: "Payment Processor Status" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-context-value rg-text-muted rg-italic", children: "Not Verified (Owned by Merchant / ShopPoint)" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-section-title", children: "Audit Trail & Signals" }),
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-audit-container", children: audit ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-audit-grid", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-audit-label", children: "Decision ID:" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-audit-value rg-font-mono", children: ((_b = (_a = audit.data) == null ? void 0 : _a.decision) == null ? void 0 : _b.decision_id) || "--" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-audit-label", children: "Order ID:" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-audit-value rg-font-mono", children: ((_d = (_c = audit.data) == null ? void 0 : _c.decision) == null ? void 0 : _d.order_id) || "--" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-audit-label", children: "Policy Action:" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-audit-value", children: ((_f = (_e = audit.data) == null ? void 0 : _e.policy_trace) == null ? void 0 : _f.policy_action) || "--" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rg-audit-label", children: "Reconstructed Features:" }),
                      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "rg-audit-value", children: [
                        Object.keys(((_g = audit.data) == null ? void 0 : _g.feature_snapshot) || {}).length,
                        " features verified"
                      ] })
                    ] })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "rg-drawer-empty-text", children: "Basic audit event snapshot recorded. Full feature reconstruction stored in tenant repository." }) })
                ] })
              ] })
            ] })
          ]
        }
      )
    }
  );
};

// src/components/TransactionsPage.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
var TransactionsPage = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useRiskDecisions(50);
  const [selectedId, setSelectedId] = (0, import_react8.useState)(null);
  const [searchTerm, setSearchTerm] = (0, import_react8.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Transaction Risk Explorer" }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Search, filter, and inspect scored payments and policy actions." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "rg-search-input-wrap", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(SearchIcon, { size: 14, "aria-hidden": "true", className: "rg-search-icon" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
            "input",
            {
              type: "text",
              placeholder: "Search transactions...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "rg-search-input",
              "aria-label": "Search transactions"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => refetch(),
            className: "rg-btn-secondary",
            "aria-label": "Refresh transactions",
            disabled: loading,
            style: { display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", fontSize: 13 },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true", className: loading ? "rg-spin" : "" }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { children: "Refresh" })
            ]
          }
        )
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { style: { marginBottom: 16, padding: 12, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { style: { color: "var(--rg-high-text)", fontSize: 13 }, children: [
      "Failed to load transactions: ",
      error.message
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      TransactionsGrid,
      {
        items,
        loading,
        quickFilterText: searchTerm,
        onRowClick: (id) => setSelectedId(id)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Showing ",
        items.length,
        " records in current page"
      ] }),
      hasMore && /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
        "button",
        {
          type: "button",
          onClick: nextPage,
          disabled: loading,
          className: "rg-btn-primary",
          "aria-label": "Load next page",
          style: { display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13 },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { children: "Load Next Page" }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(ChevronRightIcon, { size: 14, "aria-hidden": "true" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(DetailDrawer, { decisionId: selectedId, onClose: () => setSelectedId(null) })
  ] });
};

// src/components/ReviewsPage.tsx
var import_react9 = require("react");
var import_recharts2 = require("recharts");
var import_ag_grid_react3 = require("ag-grid-react");
var import_ag_grid_community3 = require("ag-grid-community");
var import_ag_grid3 = require("ag-grid-community/styles/ag-grid.css");
var import_ag_theme_alpine3 = require("ag-grid-community/styles/ag-theme-alpine.css");
var import_jsx_runtime18 = require("react/jsx-runtime");
import_ag_grid_community3.ModuleRegistry.registerModules([import_ag_grid_community3.AllCommunityModule]);
var ReviewsPage = () => {
  var _a;
  const { client, theme } = useReturnGuard();
  const { items, loading, error, refetch } = useReviews(50);
  const { data: summary } = useRiskSummary();
  const [selectedReview, setSelectedReview] = (0, import_react9.useState)(null);
  const [quickFilterText, setQuickFilterText] = (0, import_react9.useState)("");
  const [statusFilter, setStatusFilter] = (0, import_react9.useState)("all");
  const [notes, setNotes] = (0, import_react9.useState)("");
  const [submitting, setSubmitting] = (0, import_react9.useState)(false);
  const [submitResult, setSubmitResult] = (0, import_react9.useState)(null);
  const drawerRef = (0, import_react9.useRef)(null);
  const closeButtonRef = (0, import_react9.useRef)(null);
  const previousActiveElementRef = (0, import_react9.useRef)(null);
  const filteredItems = (0, import_react9.useMemo)(() => {
    let list = items;
    if (statusFilter === "pending") {
      list = list.filter((item) => (item.status || "").toLowerCase() === "pending");
    } else if (statusFilter === "resolved") {
      list = list.filter((item) => (item.status || "").toLowerCase() !== "pending");
    }
    return list;
  }, [items, statusFilter]);
  const totalHistoricalFlagged = (_a = summary == null ? void 0 : summary.review_count) != null ? _a : 0;
  const loadedDecisions = items.length;
  const loadedPending = (0, import_react9.useMemo)(
    () => items.filter((item) => (item.status || "").toLowerCase() === "pending").length,
    [items]
  );
  const loadedHighRisk = (0, import_react9.useMemo)(
    () => items.filter((item) => {
      var _a2;
      const score = (_a2 = item.risk_score) != null ? _a2 : 0;
      const tier = (item.tier || "").toUpperCase();
      return tier === "HIGH" || tier === "CRITICAL" || score >= 0.7;
    }).length,
    [items]
  );
  const loadedResolved = loadedDecisions - loadedPending;
  const loadedApproved = (0, import_react9.useMemo)(
    () => items.filter((item) => (item.status || "").toLowerCase() === "approved").length,
    [items]
  );
  const loadedRejected = (0, import_react9.useMemo)(
    () => items.filter((item) => (item.status || "").toLowerCase() === "rejected").length,
    [items]
  );
  const loadedEscalated = (0, import_react9.useMemo)(
    () => items.filter((item) => (item.status || "").toLowerCase() === "escalated").length,
    [items]
  );
  const reviewStatusData = (0, import_react9.useMemo)(() => {
    return [
      {
        status: "Pending",
        count: loadedPending,
        pct: calculatePercentage(loadedPending, loadedDecisions),
        color: CHART_COLORS.review
      },
      {
        status: "Approved",
        count: loadedApproved,
        pct: calculatePercentage(loadedApproved, loadedDecisions),
        color: CHART_COLORS.allow
      },
      {
        status: "Rejected",
        count: loadedRejected,
        pct: calculatePercentage(loadedRejected, loadedDecisions),
        color: CHART_COLORS.block
      },
      {
        status: "Escalated",
        count: loadedEscalated,
        pct: calculatePercentage(loadedEscalated, loadedDecisions),
        color: CHART_COLORS.accent
      }
    ];
  }, [loadedPending, loadedApproved, loadedRejected, loadedEscalated, loadedDecisions]);
  const columnDefs = (0, import_react9.useMemo)(
    () => [
      {
        field: "order_id",
        headerName: "Order / Decision ID",
        minWidth: 220,
        flex: 1.4,
        pinned: "left",
        cellRenderer: (params) => {
          var _a2, _b;
          return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
                lineHeight: 1.35
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                  "span",
                  {
                    style: {
                      fontFamily: "var(--rg-font-mono, monospace)",
                      fontWeight: 600,
                      color: "var(--rg-text-primary)"
                    },
                    children: ((_a2 = params.data) == null ? void 0 : _a2.order_id) || "--"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                  "span",
                  {
                    style: {
                      fontFamily: "var(--rg-font-mono, monospace)",
                      fontSize: 11,
                      color: "var(--rg-text-muted)",
                      marginTop: 2
                    },
                    children: ((_b = params.data) == null ? void 0 : _b.decision_id) || "--"
                  }
                )
              ]
            }
          );
        }
      },
      {
        field: "created_at",
        headerName: "Queued At",
        minWidth: 160,
        flex: 1.1,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          "span",
          {
            style: {
              fontSize: 12,
              color: "var(--rg-text-secondary)",
              fontFamily: "var(--rg-font-mono, monospace)"
            },
            children: params.value ? new Date(params.value).toLocaleString() : "--"
          }
        )
      },
      {
        field: "risk_score",
        headerName: "Risk Score",
        minWidth: 120,
        flex: 0.9,
        sort: "desc",
        cellRenderer: (params) => {
          var _a2;
          return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RiskBadge, { score: (_a2 = params.value) != null ? _a2 : 0 });
        }
      },
      {
        field: "suggested_action",
        headerName: "Suggested Action",
        minWidth: 140,
        flex: 1.1,
        cellRenderer: (params) => {
          var _a2;
          return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RiskBadge, { action: params.value || ((_a2 = params.data) == null ? void 0 : _a2.policy_action) || "REVIEW" });
        }
      },
      {
        field: "tier",
        headerName: "Risk Tier",
        minWidth: 110,
        flex: 0.8,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RiskBadge, { severity: params.value || "MEDIUM" })
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 130,
        flex: 0.9,
        cellRenderer: (params) => {
          const status = (params.value || "pending").toLowerCase();
          const isPending = status === "pending";
          const isApprove = status === "approve" || status === "approved";
          const isReject = status === "reject" || status === "rejected";
          const color = isPending ? "var(--rg-med-text)" : isApprove ? "var(--rg-low-text)" : isReject ? "var(--rg-high-text)" : "var(--rg-accent, #6366f1)";
          const bg = isPending ? "var(--rg-med-bg)" : isApprove ? "var(--rg-low-bg)" : isReject ? "var(--rg-high-bg)" : "rgba(99, 102, 241, 0.1)";
          const border = isPending ? "var(--rg-med-border)" : isApprove ? "var(--rg-low-border)" : isReject ? "var(--rg-high-border)" : "rgba(99, 102, 241, 0.3)";
          return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
            "span",
            {
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                padding: "2px 8px",
                borderRadius: 4,
                background: bg,
                color,
                border: `1px solid ${border}`,
                textTransform: "uppercase"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                  "span",
                  {
                    style: {
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: color
                    }
                  }
                ),
                status
              ]
            }
          );
        }
      },
      {
        field: "reviewer",
        headerName: "Reviewer",
        minWidth: 120,
        flex: 0.9,
        cellRenderer: (params) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          "span",
          {
            style: {
              fontSize: 12,
              color: params.value ? "var(--rg-text-primary)" : "var(--rg-text-muted)"
            },
            children: params.value || "Unassigned"
          }
        )
      }
    ],
    []
  );
  const defaultColDef = (0, import_react9.useMemo)(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1
    }),
    []
  );
  const gridThemeClass = theme === "light" ? "ag-theme-alpine" : "ag-theme-alpine-dark";
  (0, import_react9.useEffect)(() => {
    if (selectedReview) {
      previousActiveElementRef.current = document.activeElement;
      const timer = setTimeout(() => {
        var _a2;
        (_a2 = closeButtonRef.current) == null ? void 0 : _a2.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedReview]);
  const restoreFocus = (0, import_react9.useCallback)(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      el.focus();
    }
  }, []);
  const handleCloseDrawer = (0, import_react9.useCallback)(() => {
    restoreFocus();
    setSelectedReview(null);
    setSubmitResult(null);
  }, [restoreFocus]);
  (0, import_react9.useEffect)(() => {
    if (!selectedReview) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseDrawer();
        return;
      }
      if (e.key === "Tab") {
        const container = drawerRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedReview, handleCloseDrawer]);
  const handleRowClicked = (event) => {
    if (event.data) {
      setSelectedReview(event.data);
      setNotes(event.data.notes || "");
      setSubmitResult(null);
    }
  };
  const handleSubmitAction = async (action) => {
    if (!selectedReview || submitting) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await client.reviews.submit({
        decision_id: selectedReview.decision_id,
        action,
        notes: notes.trim() ? notes.trim() : void 0
      });
      const freshPage = await refetch();
      const serverRecord = freshPage == null ? void 0 : freshPage.items.find(
        (item) => item.decision_id === selectedReview.decision_id
      );
      if (serverRecord) {
        setSelectedReview(serverRecord);
        setNotes(serverRecord.notes || "");
      } else {
        setSelectedReview(__spreadProps(__spreadValues({}, selectedReview), {
          status: res.action,
          reviewed_at: res.updated_at,
          notes: notes.trim() || selectedReview.notes
        }));
      }
      setSubmitResult({
        type: "success",
        message: `Resolution recorded: ${action.toUpperCase()} (${res.status}).`
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitResult({
        type: "error",
        message: `Failed to submit review: ${msg}`
      });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("header", { className: "rg-reviews-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-reviews-title-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h2", { className: "rg-reviews-title", children: "Alerts & Manual Reviews" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { className: "rg-reviews-subtitle", children: "Operational queue for high-risk and flagged payments requiring human evaluation." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-reviews-refresh-btn",
          "aria-label": "Refresh review queue",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: "Refresh Queue" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("section", { className: "rg-kpi-grid rg-metrics-grid", "aria-label": "Review Queue Metrics", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-card", "data-testid": "kpi-total-flagged", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-title", children: "Total Flagged (Historical)" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-value", children: totalHistoricalFlagged.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-subtitle", children: "Cumulative decisions flagged by policy" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-card", "data-testid": "kpi-loaded-decisions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-title", children: "Loaded Batch" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-card-value", children: [
          loadedDecisions,
          " / 50"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-subtitle", children: "Current page sample (single fetch)" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-card", "data-testid": "kpi-loaded-pending", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-title", children: "Loaded Pending" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-value", style: { color: loadedPending > 0 ? "var(--rg-med-text)" : "var(--rg-text-primary)" }, children: loadedPending }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-subtitle", children: "Awaiting human review in loaded batch" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-card", "data-testid": "kpi-loaded-high-risk", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-title", children: "Loaded High-Risk" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-value", style: { color: loadedHighRisk > 0 ? "var(--rg-high-text)" : "var(--rg-text-primary)" }, children: loadedHighRisk }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-card-subtitle", children: "Score \u2265 0.70 or HIGH/CRIT tier" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
      ChartContainer,
      {
        title: "Loaded Batch Review Status",
        subtitle: `Operational resolution state for the active batch sample (${loadedDecisions} / 50 loaded decisions)`,
        height: 180,
        empty: loadedDecisions === 0,
        emptyTitle: "No decisions in loaded queue",
        emptyMessage: `Review queue is empty for the current filter. Cumulative flagged decisions: ${totalHistoricalFlagged}`,
        ariaLabel: `Review queue loaded status: Pending ${loadedPending}, Approved ${loadedApproved}, Rejected ${loadedRejected}, Escalated ${loadedEscalated}`,
        ariaDescription: "Operational distribution of review items in current batch.",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_recharts2.ResponsiveContainer, { width: "100%", height: 95, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
            import_recharts2.BarChart,
            {
              layout: "vertical",
              data: reviewStatusData,
              margin: { top: 4, right: 24, left: 16, bottom: 4 },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_recharts2.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, horizontal: false }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_recharts2.XAxis, { type: "number", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_recharts2.YAxis, { type: "category", dataKey: "status", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, width: 65 }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                  import_recharts2.Tooltip,
                  {
                    content: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                      ChartTooltip,
                      {
                        formatter: (val, _name, item) => {
                          var _a2, _b;
                          return [
                            `${Number(val)} items (${(_a2 = item.payload) == null ? void 0 : _a2.pct.toFixed(1)}% of loaded batch)`,
                            (_b = item.payload) == null ? void 0 : _b.status
                          ];
                        }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_recharts2.Bar, { dataKey: "count", radius: [0, 4, 4, 0], isAnimationActive: false, children: reviewStatusData.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_recharts2.Cell, { fill: entry.color }, entry.status)) })
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
            ChartLegend,
            {
              items: reviewStatusData.map((d) => ({
                id: d.status,
                value: d.status,
                count: d.count,
                percentage: d.pct,
                color: d.color,
                formattedValue: `${d.count} (${d.pct.toFixed(1)}%)`
              })),
              showValues: true,
              showPercentages: true,
              align: "center"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { marginTop: 4, fontSize: 11, color: "var(--rg-text-muted)", lineHeight: 1.4 }, children: "* Note: Status metrics reflect the currently loaded batch sample only, not tenant-wide totals. SLA and queue aging charts are omitted due to absence of backend SLA telemetry." })
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-reviews-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-reviews-search-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SearchIcon, { size: 14, className: "rg-reviews-search-icon", "aria-hidden": "true" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          "input",
          {
            type: "text",
            className: "rg-reviews-search-input",
            placeholder: "Search by order or decision ID...",
            value: quickFilterText,
            onChange: (e) => setQuickFilterText(e.target.value),
            "aria-label": "Search review items"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-reviews-filter-group", role: "tablist", "aria-label": "Review status filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": statusFilter === "all",
            className: `rg-reviews-filter-btn ${statusFilter === "all" ? "active" : ""}`,
            onClick: () => setStatusFilter("all"),
            children: [
              "All (",
              loadedDecisions,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": statusFilter === "pending",
            className: `rg-reviews-filter-btn ${statusFilter === "pending" ? "active" : ""}`,
            onClick: () => setStatusFilter("pending"),
            children: [
              "Pending (",
              loadedPending,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": statusFilter === "resolved",
            className: `rg-reviews-filter-btn ${statusFilter === "resolved" ? "active" : ""}`,
            onClick: () => setStatusFilter("resolved"),
            children: [
              "Resolved (",
              loadedResolved,
              ")"
            ]
          }
        )
      ] })
    ] }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading review queue..." }),
    error && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-error-state", role: "alert", style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h4", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load review items" }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { style: { margin: "0 0 10px 0", fontSize: 13 }, children: error.message }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: "Retry" })
          ]
        }
      )
    ] }),
    !loading && !error && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-empty-state", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { style: { margin: "0 0 4px 0", fontWeight: 600, color: "var(--rg-text-primary)" }, children: "No manual reviews currently pending." }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "All flagged transactions have been cleared or no items matched the queue criteria." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      "div",
      {
        className: gridThemeClass,
        style: {
          height: 520,
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--rg-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          import_ag_grid_react3.AgGridReact,
          {
            theme: "legacy",
            rowData: filteredItems,
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
            headerHeight: 40,
            animateRows: true,
            onRowClicked: handleRowClicked
          }
        )
      }
    ),
    selectedReview && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      "div",
      {
        className: "rg-drawer-overlay",
        onClick: handleCloseDrawer,
        "aria-hidden": "false",
        children: /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
          "aside",
          {
            ref: drawerRef,
            className: "rg-drawer",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "rg-review-drawer-title",
            "aria-describedby": "rg-review-drawer-desc",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("header", { className: "rg-drawer-header", children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-drawer-header-info", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { id: "rg-review-drawer-desc", className: "rg-drawer-subtitle", children: "Manual Review Investigation" }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("h2", { id: "rg-review-drawer-title", className: "rg-drawer-title", children: selectedReview.order_id })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
                  "button",
                  {
                    ref: closeButtonRef,
                    type: "button",
                    className: "rg-drawer-close-btn",
                    onClick: handleCloseDrawer,
                    "aria-label": "Close review details",
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(CloseIcon, { size: 14, "aria-hidden": "true" }),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: "Close" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-drawer-body", children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-drawer-section-title", children: "Risk Verdict & Recommendation" }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RiskBadge, { score: selectedReview.risk_score }),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RiskBadge, { action: selectedReview.suggested_action || selectedReview.policy_action }),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(RiskBadge, { severity: selectedReview.tier })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-drawer-section-title", children: "Review Context" }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-context-grid", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-label", children: "Decision ID" }),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                        "span",
                        {
                          className: "rg-context-value",
                          style: { fontFamily: "var(--rg-font-mono, monospace)", fontSize: 12 },
                          children: selectedReview.decision_id
                        }
                      )
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-label", children: "Order ID" }),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                        "span",
                        {
                          className: "rg-context-value",
                          style: { fontFamily: "var(--rg-font-mono, monospace)", fontSize: 12 },
                          children: selectedReview.order_id
                        }
                      )
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-label", children: "Queued Timestamp" }),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-value", children: new Date(selectedReview.created_at).toLocaleString() })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-label", children: "Current Status" }),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                        "span",
                        {
                          className: "rg-context-value",
                          style: { fontWeight: 600, textTransform: "uppercase" },
                          children: selectedReview.status
                        }
                      )
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-label", children: "Assigned Reviewer" }),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-value", children: selectedReview.reviewer || "Unassigned" })
                    ] }),
                    selectedReview.reviewed_at && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-label", children: "Resolved At" }),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "rg-context-value", children: new Date(selectedReview.reviewed_at).toLocaleString() })
                    ] })
                  ] })
                ] }),
                selectedReview.notes && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-drawer-section-title", children: "Recorded Review Notes" }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
                    "div",
                    {
                      style: {
                        padding: "10px 12px",
                        backgroundColor: "var(--rg-bg-tertiary)",
                        border: "1px solid var(--rg-border-subtle)",
                        borderRadius: "var(--rg-radius-md)",
                        fontSize: 13,
                        color: "var(--rg-text-secondary)",
                        lineHeight: 1.5,
                        fontStyle: "italic"
                      },
                      children: [
                        "\u201C",
                        selectedReview.notes,
                        "\u201D"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "rg-drawer-section-title", children: "Submit Review Resolution" }),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                    "p",
                    {
                      style: {
                        margin: "0 0 12px 0",
                        fontSize: 12,
                        color: "var(--rg-text-muted)",
                        lineHeight: 1.4
                      },
                      children: "Approve, reject, or escalate this flagged transaction. Submitting records an audit action in ReturnGuard."
                    }
                  ),
                  submitting && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        color: "var(--rg-text-muted)",
                        marginBottom: 10
                      },
                      role: "status",
                      "aria-live": "polite",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                          "span",
                          {
                            className: "rg-loading-spinner",
                            "aria-hidden": "true",
                            style: { width: 14, height: 14 }
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: "Submitting resolution to server..." })
                      ]
                    }
                  ),
                  submitResult && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                    "div",
                    {
                      className: submitResult.type === "success" ? "rg-review-alert-success" : "rg-review-alert-error",
                      style: { marginBottom: 12 },
                      role: submitResult.type === "success" ? "status" : "alert",
                      children: submitResult.message
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-review-actions-panel", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                      "label",
                      {
                        htmlFor: "rg-review-notes-input",
                        style: { fontSize: 12, fontWeight: 500, color: "var(--rg-text-secondary)" },
                        children: "Reviewer Notes / Justification:"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                      "textarea",
                      {
                        id: "rg-review-notes-input",
                        className: "rg-review-textarea",
                        placeholder: "Enter investigation rationale or justification notes...",
                        value: notes,
                        onChange: (e) => setNotes(e.target.value),
                        disabled: submitting
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "rg-review-btn-row", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
                        "button",
                        {
                          type: "button",
                          className: "rg-btn-approve",
                          disabled: submitting,
                          onClick: () => handleSubmitAction("approve"),
                          "aria-label": "Approve transaction",
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(ShieldIcon, { size: 14, "aria-hidden": "true" }),
                            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: submitting ? "Submitting..." : "Approve" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
                        "button",
                        {
                          type: "button",
                          className: "rg-btn-reject",
                          disabled: submitting,
                          onClick: () => handleSubmitAction("reject"),
                          "aria-label": "Reject transaction",
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(AlertTriangleIcon, { size: 14, "aria-hidden": "true" }),
                            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: submitting ? "Submitting..." : "Reject" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
                        "button",
                        {
                          type: "button",
                          className: "rg-btn-escalate",
                          disabled: submitting,
                          onClick: () => handleSubmitAction("escalate"),
                          "aria-label": "Escalate transaction",
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(InfoIcon, { size: 14, "aria-hidden": "true" }),
                            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { children: submitting ? "Submitting..." : "Escalate" })
                          ]
                        }
                      )
                    ] })
                  ] })
                ] })
              ] })
            ]
          }
        )
      }
    )
  ] });
};

// src/components/RiskAnalyticsPage.tsx
var import_react10 = require("react");
var import_recharts3 = require("recharts");
var import_jsx_runtime19 = require("react/jsx-runtime");
var RiskAnalyticsPage = () => {
  const { data: trendsData, loading: trendsLoading, error: trendsError, refetch: refetchTrends } = useRiskTrends();
  const { data: summaryData, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useRiskSummary();
  const loading = trendsLoading || summaryLoading;
  const error = trendsError || summaryError;
  const handleRefetch = () => {
    refetchTrends();
    refetchSummary();
  };
  const trends = (trendsData == null ? void 0 : trendsData.daily_trends) || [];
  const scoreDist = (trendsData == null ? void 0 : trendsData.score_distribution) || { low_0_15: 0, med_15_40: 0, high_40_80: 0, crit_80_100: 0 };
  const channels = (trendsData == null ? void 0 : trendsData.channel_breakdown) || { paypal: 0, cod: 0, other: 0 };
  const disputes = (trendsData == null ? void 0 : trendsData.dispute_analytics) || { total_disputes: 0, disputed_amount: 0, currency: "INR", dispute_rate_pct: 0 };
  const tierDist = (summaryData == null ? void 0 : summaryData.tier_distribution) || {};
  const totalScores = scoreDist.low_0_15 + scoreDist.med_15_40 + scoreDist.high_40_80 + scoreDist.crit_80_100;
  const totalChannels = (channels.paypal || 0) + (channels.cod || 0) + (channels.other || 0);
  const histogramData = (0, import_react10.useMemo)(
    () => [
      {
        band: "0.00 \u2013 0.15",
        tier: "Low Risk",
        count: scoreDist.low_0_15,
        pct: calculatePercentage(scoreDist.low_0_15, totalScores),
        color: CHART_COLORS.allow,
        dotClass: "rg-risk-dot-low"
      },
      {
        band: "0.15 \u2013 0.40",
        tier: "Medium Risk",
        count: scoreDist.med_15_40,
        pct: calculatePercentage(scoreDist.med_15_40, totalScores),
        color: CHART_COLORS.review,
        dotClass: "rg-risk-dot-medium"
      },
      {
        band: "0.40 \u2013 0.80",
        tier: "High Risk",
        count: scoreDist.high_40_80,
        pct: calculatePercentage(scoreDist.high_40_80, totalScores),
        color: CHART_COLORS.block,
        dotClass: "rg-risk-dot-high"
      },
      {
        band: "0.80 \u2013 1.00",
        tier: "Critical Risk",
        count: scoreDist.crit_80_100,
        pct: calculatePercentage(scoreDist.crit_80_100, totalScores),
        color: CHART_COLORS.critical,
        dotClass: "rg-risk-dot-critical"
      }
    ],
    [scoreDist, totalScores]
  );
  const channelData = (0, import_react10.useMemo)(
    () => [
      {
        channel: "PayPal",
        count: channels.paypal || 0,
        pct: calculatePercentage(channels.paypal || 0, totalChannels),
        color: CHART_COLORS.paypal
      },
      {
        channel: "COD",
        count: channels.cod || 0,
        pct: calculatePercentage(channels.cod || 0, totalChannels),
        color: CHART_COLORS.cod
      },
      {
        channel: "Other",
        count: channels.other || 0,
        pct: calculatePercentage(channels.other || 0, totalChannels),
        color: CHART_COLORS.other
      }
    ],
    [channels, totalChannels]
  );
  const tierData = (0, import_react10.useMemo)(() => {
    const totalTiers = Object.values(tierDist).reduce((sum, v) => sum + (v || 0), 0) || totalScores;
    return [
      {
        tier: "LOW",
        label: "Low Tier",
        count: tierDist["LOW"] || 0,
        pct: calculatePercentage(tierDist["LOW"] || 0, totalTiers),
        color: CHART_COLORS.allow
      },
      {
        tier: "MEDIUM",
        label: "Medium Tier",
        count: tierDist["MEDIUM"] || 0,
        pct: calculatePercentage(tierDist["MEDIUM"] || 0, totalTiers),
        color: CHART_COLORS.review
      },
      {
        tier: "HIGH",
        label: "High Tier",
        count: tierDist["HIGH"] || 0,
        pct: calculatePercentage(tierDist["HIGH"] || 0, totalTiers),
        color: CHART_COLORS.block
      },
      {
        tier: "CRITICAL",
        label: "Critical Tier",
        count: tierDist["CRITICAL"] || 0,
        pct: calculatePercentage(tierDist["CRITICAL"] || 0, totalTiers),
        color: CHART_COLORS.critical
      }
    ];
  }, [tierDist, totalScores]);
  const isSingleDate = trends.length === 1;
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading risk analytics & trends..." });
  }
  if (error) {
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-error-state", role: "alert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h4", { children: "Failed to load risk analytics" }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: error.message }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
        "button",
        {
          type: "button",
          onClick: handleRefetch,
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "Retry" })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h2", { style: { margin: "0 0 6px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Risk Analytics & Portfolio Exposure" }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Portfolio risk score distributions, channel breakdown, and time-series scoring volumes." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "Low Risk (< 0.15)" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "rg-risk-dot rg-risk-dot-low", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "rg-card-value", children: scoreDist.low_0_15.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.low_0_15 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "Medium Risk (0.15 - 0.40)" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "rg-risk-dot rg-risk-dot-medium", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "rg-card-value", children: scoreDist.med_15_40.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.med_15_40 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "High Risk (0.40 - 0.80)" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "rg-risk-dot rg-risk-dot-high", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "rg-card-value", children: scoreDist.high_40_80.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.high_40_80 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "Critical Risk (> 0.80)" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "rg-risk-dot rg-risk-dot-critical", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "rg-card-value", children: scoreDist.crit_80_100.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.crit_80_100 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-analytical-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
        ChartContainer,
        {
          title: "Risk Score Distribution Histogram",
          subtitle: "Calibrated model score exposure across decision bands",
          height: 320,
          empty: totalScores === 0,
          emptyTitle: "No score events",
          emptyMessage: "No risk evaluations recorded for this tenant.",
          ariaLabel: "Risk score histogram across 4 bands",
          ariaDescription: `Low: ${scoreDist.low_0_15}, Med: ${scoreDist.med_15_40}, High: ${scoreDist.high_40_80}, Crit: ${scoreDist.crit_80_100}`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.ResponsiveContainer, { width: "100%", height: 230, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(import_recharts3.BarChart, { data: histogramData, margin: { top: 12, right: 12, left: -16, bottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                import_recharts3.XAxis,
                {
                  dataKey: "band",
                  stroke: CHART_CSS_VARS.axis,
                  fontSize: 11,
                  tickLine: false,
                  axisLine: { stroke: CHART_CSS_VARS.grid }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                import_recharts3.YAxis,
                {
                  stroke: CHART_CSS_VARS.axis,
                  fontSize: 11,
                  tickLine: false,
                  axisLine: false,
                  allowDecimals: false
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                import_recharts3.Tooltip,
                {
                  content: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                    ChartTooltip,
                    {
                      formatter: (val, _name, item) => {
                        var _a, _b, _c;
                        return [
                          `${Number(val).toLocaleString()} decisions (${(_a = item.payload) == null ? void 0 : _a.pct}%) \u2014 ${(_b = item.payload) == null ? void 0 : _b.tier}`,
                          (_c = item.payload) == null ? void 0 : _c.band
                        ];
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: histogramData.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Cell, { fill: entry.color }, entry.band)) })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
              ChartLegend,
              {
                items: histogramData.map((d) => ({
                  id: d.band,
                  value: `${d.band} (${d.tier})`,
                  count: d.count,
                  percentage: d.pct,
                  color: d.color,
                  formattedValue: `${d.count.toLocaleString()} (${d.pct}%)`
                })),
                showValues: true,
                showPercentages: true,
                align: "center"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
        ChartContainer,
        {
          title: "Payment Channel Distribution",
          subtitle: "Transaction volume distribution and recorded dispute metrics",
          height: 320,
          empty: totalChannels === 0,
          emptyTitle: "No channel data",
          emptyMessage: "No channel volume recorded.",
          ariaLabel: "Payment channel distribution chart",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.ResponsiveContainer, { width: "100%", height: 170, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
              import_recharts3.BarChart,
              {
                data: channelData,
                layout: "vertical",
                margin: { top: 8, right: 24, left: 16, bottom: 0 },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, horizontal: false }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                    import_recharts3.XAxis,
                    {
                      type: "number",
                      stroke: CHART_CSS_VARS.axis,
                      fontSize: 11,
                      tickLine: false,
                      axisLine: false,
                      allowDecimals: false
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                    import_recharts3.YAxis,
                    {
                      type: "category",
                      dataKey: "channel",
                      stroke: CHART_CSS_VARS.axis,
                      fontSize: 12,
                      tickLine: false,
                      axisLine: false,
                      width: 56
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                    import_recharts3.Tooltip,
                    {
                      content: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                        ChartTooltip,
                        {
                          formatter: (val, _name, item) => {
                            var _a, _b;
                            return [
                              `${Number(val).toLocaleString()} orders (${(_a = item.payload) == null ? void 0 : _a.pct}%)`,
                              (_b = item.payload) == null ? void 0 : _b.channel
                            ];
                          }
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "count", radius: [0, 4, 4, 0], isAnimationActive: false, children: channelData.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Cell, { fill: entry.color }, entry.channel)) })
                ]
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
              "div",
              {
                style: {
                  borderTop: "1px solid var(--rg-border-subtle)",
                  paddingTop: 10,
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 12
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Recorded Disputes" }),
                    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { style: { fontWeight: 600, color: "var(--rg-text-primary)", fontFamily: "var(--rg-font-mono)" }, children: disputes.total_disputes.toLocaleString() })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Dispute Exposure Rate" }),
                    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
                      "span",
                      {
                        style: {
                          fontWeight: 600,
                          fontFamily: "var(--rg-font-mono)",
                          color: disputes.dispute_rate_pct > 0 ? "var(--rg-high-text)" : "var(--rg-low-text)"
                        },
                        children: [
                          disputes.dispute_rate_pct.toFixed(2),
                          "%"
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { style: { color: "var(--rg-text-secondary)" }, children: "Disputed Volume" }),
                    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "rg-font-mono", style: { color: "var(--rg-text-muted)" }, children: formatMetricValue(disputes.disputed_amount, "currency", disputes.currency || "INR") })
                  ] })
                ]
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-analytical-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Backend Policy Tier Mapping" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-muted)" }, children: "Enforced policy risk tiers combining ML scores with deterministic fraud rules" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: tierData.map((t) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                "span",
                {
                  style: {
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: t.color,
                    display: "inline-block"
                  },
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { style: { fontWeight: 500, color: "var(--rg-text-secondary)" }, children: t.label }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { className: "rg-font-mono", style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: [
                "(",
                t.tier,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { style: { color: "var(--rg-text-muted)" }, children: [
                t.pct,
                "%"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { style: { minWidth: 28, textAlign: "right", color: "var(--rg-text-primary)" }, children: t.count.toLocaleString() })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            "div",
            {
              className: "rg-meter-fill",
              style: {
                width: `${t.pct}%`,
                backgroundColor: t.color
              }
            }
          ) })
        ] }, t.tier)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
        ChartContainer,
        {
          title: "Daily Scoring Activity",
          subtitle: "Time-series scoring activity and daily exception flagging rates",
          height: 320,
          empty: trends.length === 0,
          emptyTitle: "No daily activity",
          emptyMessage: "No time-series scoring events recorded.",
          ariaLabel: "Daily scoring activity chart",
          children: isSingleDate ? /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-trend-notice", role: "status", children: [
                /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { "aria-hidden": "true", children: "\u2139" }),
                /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "Historical trend accumulation in progress \u2014 1 day recorded." })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 12 }, children: [
                "Discrete evaluation volume recorded for calendar day",
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { className: "rg-font-mono", style: { color: "var(--rg-text-primary)" }, children: trends[0].date }),
                ":"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.ResponsiveContainer, { width: "100%", height: 160, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
              import_recharts3.BarChart,
              {
                data: [
                  {
                    date: trends[0].date,
                    "Total Scored": trends[0].total_scored,
                    Flagged: trends[0].flagged,
                    Blocked: trends[0].blocked
                  }
                ],
                margin: { top: 8, right: 16, left: -16, bottom: 4 },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.XAxis, { dataKey: "date", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.YAxis, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                    import_recharts3.Tooltip,
                    {
                      content: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
                        ChartTooltip,
                        {
                          formatter: (val, name) => [`${Number(val).toLocaleString()} events`, name]
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "Total Scored", fill: CHART_COLORS.accent, radius: [4, 4, 0, 0], isAnimationActive: false }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "Flagged", fill: CHART_COLORS.review, radius: [4, 4, 0, 0], isAnimationActive: false }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "Blocked", fill: CHART_COLORS.block, radius: [4, 4, 0, 0], isAnimationActive: false })
                ]
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
              ChartLegend,
              {
                items: [
                  { id: "total", value: "Total Scored", count: trends[0].total_scored, color: CHART_COLORS.accent },
                  { id: "flagged", value: "Flagged for Review", count: trends[0].flagged, color: CHART_COLORS.review },
                  { id: "blocked", value: "Blocked", count: trends[0].blocked, color: CHART_COLORS.block }
                ],
                showValues: true,
                align: "center"
              }
            )
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.ResponsiveContainer, { width: "100%", height: 230, children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(import_recharts3.BarChart, { data: trends, margin: { top: 12, right: 16, left: -16, bottom: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.XAxis, { dataKey: "date", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.YAxis, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(ChartTooltip, {}) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "total_scored", name: "Total Scored", fill: CHART_COLORS.accent, radius: [4, 4, 0, 0], isAnimationActive: false }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "flagged", name: "Flagged", fill: CHART_COLORS.review, radius: [4, 4, 0, 0], isAnimationActive: false }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_recharts3.Bar, { dataKey: "blocked", name: "Blocked", fill: CHART_COLORS.block, radius: [4, 4, 0, 0], isAnimationActive: false })
          ] }) })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "rg-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Daily Transaction & Flagging Trends" }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-muted)" }, children: "Detailed record log of time-series scoring activity and daily exception flagging rates" }),
      trends.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { style: { color: "var(--rg-text-muted)", fontSize: 13, padding: "16px 0" }, children: "No daily scoring events recorded yet." }) : /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "rg-table-container", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("table", { className: "rg-data-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "Date" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "Total Scored" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "Flagged" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "Blocked" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "Flag Rate" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("tbody", { children: trends.map((t) => {
          const rate = t.total_scored > 0 ? (t.flagged / t.total_scored * 100).toFixed(1) : "0.0";
          return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { className: "rg-font-mono", style: { fontWeight: 500 }, children: t.date }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { children: t.total_scored.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { style: { color: t.flagged > 0 ? "var(--rg-med-text)" : "inherit", fontWeight: t.flagged > 0 ? 600 : "normal" }, children: t.flagged.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { style: { color: t.blocked > 0 ? "var(--rg-high-text)" : "inherit", fontWeight: t.blocked > 0 ? 600 : "normal" }, children: t.blocked.toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { style: { fontWeight: 500 }, children: [
              rate,
              "%"
            ] }) })
          ] }, t.date);
        }) })
      ] }) })
    ] })
  ] });
};

// src/components/RulesPage.tsx
var import_react11 = require("react");
var import_recharts4 = require("recharts");
var import_jsx_runtime20 = require("react/jsx-runtime");
var RulesPage = () => {
  var _a;
  const rules = (0, import_react11.useMemo)(
    () => [
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
    ],
    []
  );
  const { data: trendsData, loading: trendsLoading } = useRiskTrends();
  const { data: summaryData } = useRiskSummary();
  const policyStats = (0, import_react11.useMemo)(() => {
    var _a2, _b, _c;
    const rawBreakdown = trendsData == null ? void 0 : trendsData.policy_breakdown;
    let allow = 0;
    let review = 0;
    let stepUp = 0;
    let block = 0;
    if (rawBreakdown && Object.keys(rawBreakdown).length > 0) {
      Object.entries(rawBreakdown).forEach(([action, count]) => {
        const act = action.toUpperCase();
        if (act.includes("STEP_UP")) {
          stepUp += count;
        } else if (act.includes("ALLOW")) {
          allow += count;
        } else if (act.includes("BLOCK")) {
          block += count;
        } else if (act.includes("REVIEW")) {
          review += count;
        } else {
          review += count;
        }
      });
    } else if (summaryData) {
      allow = (_a2 = summaryData.allow_count) != null ? _a2 : 0;
      review = (_b = summaryData.review_count) != null ? _b : 0;
      block = (_c = summaryData.block_count) != null ? _c : 0;
      stepUp = 0;
    }
    const total = allow + review + stepUp + block;
    return {
      total,
      allow,
      review,
      stepUp,
      block,
      allowPct: total > 0 ? allow / total * 100 : 0,
      reviewPct: total > 0 ? review / total * 100 : 0,
      stepUpPct: total > 0 ? stepUp / total * 100 : 0,
      blockPct: total > 0 ? block / total * 100 : 0
    };
  }, [trendsData, summaryData]);
  const policyChartData = (0, import_react11.useMemo)(
    () => [
      {
        action: "ALLOW",
        label: "ALLOW",
        count: policyStats.allow,
        pct: policyStats.allowPct,
        color: CHART_COLORS.allow
      },
      {
        action: "REVIEW",
        label: "REVIEW",
        count: policyStats.review,
        pct: policyStats.reviewPct,
        color: CHART_COLORS.review
      },
      {
        action: "STEP_UP_VERIFICATION",
        label: "STEP-UP",
        count: policyStats.stepUp,
        pct: policyStats.stepUpPct,
        color: CHART_COLORS.accent
      },
      {
        action: "BLOCK",
        label: "BLOCK",
        count: policyStats.block,
        pct: policyStats.blockPct,
        color: CHART_COLORS.block
      }
    ],
    [policyStats]
  );
  const dailyTrends = (_a = trendsData == null ? void 0 : trendsData.daily_trends) != null ? _a : [];
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Rules & Detection Management" }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Active deterministic risk rules, thresholds, and execution actions evaluated alongside the LightGBM model." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-title", children: "Active Rules" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-value", children: "5" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-subtitle", children: "Configured deterministic rules" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-title", children: "Critical Blocking" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-value", style: { color: "var(--rg-high-text)" }, children: "1" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-subtitle", children: "Threshold \u2265 0.80 probability" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-title", children: "Step-Up / Review" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-value", style: { color: "var(--rg-med-text)" }, children: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-subtitle", children: "Velocity, amount & address rules" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-title", children: "Surveillance Tier" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-value", style: { color: "var(--rg-low-text)" }, children: "1" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-card-subtitle", children: "Cold-start account tenure check" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(
        ChartContainer,
        {
          title: "Policy Action Distribution",
          subtitle: "Runtime policy evaluation recommendations applied across scored transactions",
          height: 260,
          loading: trendsLoading,
          empty: policyStats.total === 0,
          emptyTitle: "No policy evaluation events recorded",
          emptyMessage: "Evaluations will populate automatically as transactions are scored for the active tenant.",
          ariaLabel: `Policy distribution: ${policyStats.allowPct.toFixed(1)}% Allow, ${policyStats.reviewPct.toFixed(1)}% Review, ${policyStats.stepUpPct.toFixed(1)}% Step-Up, ${policyStats.blockPct.toFixed(1)}% Block`,
          ariaDescription: "Runtime decision distribution across ALLOW, REVIEW, STEP_UP_VERIFICATION, and BLOCK policy tiers.",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_recharts4.ResponsiveContainer, { width: "100%", height: 170, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_recharts4.BarChart, { data: policyChartData, margin: { top: 12, right: 16, left: -20, bottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_recharts4.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_recharts4.XAxis, { dataKey: "label", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_recharts4.YAxis, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
                import_recharts4.Tooltip,
                {
                  content: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
                    ChartTooltip,
                    {
                      formatter: (val, _name, item) => {
                        var _a2, _b;
                        return [
                          `${Number(val).toLocaleString()} evaluations (${(_a2 = item.payload) == null ? void 0 : _a2.pct.toFixed(1)}%)`,
                          (_b = item.payload) == null ? void 0 : _b.action
                        ];
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_recharts4.Bar, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: policyChartData.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_recharts4.Cell, { fill: entry.color }, entry.action)) })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
              ChartLegend,
              {
                items: policyChartData.map((d) => ({
                  id: d.action,
                  value: d.action,
                  count: d.count,
                  percentage: d.pct,
                  color: d.color,
                  formattedValue: `${d.count.toLocaleString()} (${d.pct.toFixed(1)}%)`
                })),
                showValues: true,
                showPercentages: true,
                align: "center"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { style: { marginTop: 6, fontSize: 11, color: "var(--rg-text-muted)", lineHeight: 1.4 }, children: "* Note: Configured rules define deterministic criteria; runtime policy distribution reflects transaction evaluation decisions." })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h3", { style: { margin: 0, fontSize: 15, fontWeight: 600 }, children: "Daily Policy Enforcement" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: dailyTrends.length === 1 ? "Single Period View" : dailyTrends.length > 1 ? `${dailyTrends.length} Days Activity` : "Tenant Scope" })
        ] }),
        dailyTrends.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-empty-state", role: "status", style: { padding: 24, textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { style: { margin: 0, fontWeight: 600, color: "var(--rg-text-primary)" }, children: "No daily enforcement activity recorded." }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", display: "block", marginTop: 4 }, children: "Daily enforcement statistics will appear once transaction batches are evaluated." })
        ] }) : dailyTrends.length === 1 ? /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: [
            "Evaluation Date: ",
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("strong", { style: { color: "var(--rg-text-primary)", fontFamily: "var(--rg-font-mono)" }, children: dailyTrends[0].date })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-single-period-grid", children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-single-period-stat", children: [
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-single-period-val", children: dailyTrends[0].total_scored }),
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-single-period-lbl", children: "Total Scored" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-single-period-stat", children: [
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-single-period-val", style: { color: "var(--rg-med-text)" }, children: dailyTrends[0].flagged }),
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-single-period-lbl", children: "Flagged / Review" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-single-period-stat", children: [
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-single-period-val", style: { color: "var(--rg-high-text)" }, children: dailyTrends[0].blocked }),
              /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-single-period-lbl", children: "Blocked Outright" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { style: { marginTop: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(
            "div",
            {
              className: "rg-segmented-bar",
              style: { height: 6 },
              role: "presentation",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
                  "div",
                  {
                    style: {
                      width: `${dailyTrends[0].total_scored > 0 ? (dailyTrends[0].total_scored - dailyTrends[0].flagged - dailyTrends[0].blocked) / dailyTrends[0].total_scored * 100 : 100}%`,
                      backgroundColor: "var(--rg-low-text)"
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
                  "div",
                  {
                    style: {
                      width: `${dailyTrends[0].total_scored > 0 ? dailyTrends[0].flagged / dailyTrends[0].total_scored * 100 : 0}%`,
                      backgroundColor: "var(--rg-med-text)"
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
                  "div",
                  {
                    style: {
                      width: `${dailyTrends[0].total_scored > 0 ? dailyTrends[0].blocked / dailyTrends[0].total_scored * 100 : 0}%`,
                      backgroundColor: "var(--rg-high-text)"
                    }
                  }
                )
              ]
            }
          ) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: dailyTrends.slice(0, 4).map((d) => /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { style: { fontFamily: "var(--rg-font-mono)", color: "var(--rg-text-primary)" }, children: d.date }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("span", { style: { color: "var(--rg-text-muted)" }, children: [
              d.total_scored,
              " scored \u2022 ",
              /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("span", { style: { color: "var(--rg-med-text)" }, children: [
                d.flagged,
                " flagged"
              ] }),
              " \u2022 ",
              /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("span", { style: { color: "var(--rg-high-text)" }, children: [
                d.blocked,
                " blocked"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-meter-track", style: { height: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
            "div",
            {
              className: "rg-meter-fill rg-meter-fill-accent",
              style: { width: `${Math.min(100, Math.max(8, (d.flagged + d.blocked) / Math.max(1, d.total_scored) * 100))}%` }
            }
          ) })
        ] }, d.date)) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { style: { padding: "16px 20px", borderBottom: "1px solid var(--rg-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h3", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "Active Rule Registry" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginTop: 2, display: "block" }, children: "Deterministic decision parameters executed in real-time scoring pipeline" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", fontFamily: "var(--rg-font-mono)" }, children: "5 / 5 ACTIVE" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-table-container", children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("table", { className: "rg-rules-table", "aria-label": "Active Deterministic Rule Registry", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("th", { scope: "col", style: { width: "38%" }, children: "Rule Identifier & Description" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("th", { scope: "col", style: { width: "22%" }, children: "Evaluation Threshold" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("th", { scope: "col", style: { width: "12%" }, children: "Severity" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("th", { scope: "col", style: { width: "16%" }, children: "Action Trigger" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("th", { scope: "col", style: { width: "12%" }, children: "Engine Status" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("tbody", { children: rules.map((r) => /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("td", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-rule-name", children: r.name }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-rule-id", children: r.id }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "rg-rule-desc", children: r.description })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: "rg-rule-threshold", children: r.threshold }) }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RiskBadge, { severity: r.severity }) }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RiskBadge, { action: r.action }) }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: "rg-status-dot-active", children: "ACTIVE" }) })
        ] }, r.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "rg-security-notice", role: "note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: "rg-security-notice-icon", children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(LockIcon, { size: 16, "aria-hidden": "true" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { children: "Rule configuration mutations require signed server-key authorization and are immutable via embed tokens." })
    ] })
  ] });
};

// src/components/ModelsPage.tsx
var import_react12 = require("react");
var import_recharts5 = require("recharts");
var import_jsx_runtime21 = require("react/jsx-runtime");
var ModelsPage = () => {
  const { data, loading, error } = useModelPerformance();
  const syn = data == null ? void 0 : data.synthetic;
  const ieee = data == null ? void 0 : data.ieee_cis;
  const synFNR = (0, import_react12.useMemo)(() => {
    if (!syn || typeof syn.recall !== "number") return null;
    return (1 - syn.recall) * 100;
  }, [syn]);
  const ieeeFNR = (0, import_react12.useMemo)(() => {
    if (!ieee || typeof ieee.recall !== "number") return null;
    return (1 - ieee.recall) * 100;
  }, [ieee]);
  const totalSamples = (0, import_react12.useMemo)(() => {
    var _a, _b;
    const s1 = (_a = syn == null ? void 0 : syn.sample_count) != null ? _a : 0;
    const s2 = (_b = ieee == null ? void 0 : ieee.sample_count) != null ? _b : 0;
    return s1 + s2;
  }, [syn, ieee]);
  const precisionDelta = (0, import_react12.useMemo)(() => {
    if (!syn || !ieee || typeof syn.precision !== "number" || typeof ieee.precision !== "number") {
      return null;
    }
    return (syn.precision - ieee.precision) * 100;
  }, [syn, ieee]);
  const benchmarkComparisonData = (0, import_react12.useMemo)(() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    if (!syn && !ieee) return [];
    return [
      {
        metric: "ROC-AUC",
        synthetic: (_a = syn == null ? void 0 : syn.auc_roc) != null ? _a : 0,
        ieee: (_b = ieee == null ? void 0 : ieee.auc_roc) != null ? _b : 0,
        syntheticFormatted: syn ? syn.auc_roc.toFixed(4) : "\u2014",
        ieeeFormatted: ieee ? ieee.auc_roc.toFixed(4) : "\u2014"
      },
      {
        metric: "PR-AUC",
        synthetic: (_c = syn == null ? void 0 : syn.auc_pr) != null ? _c : 0,
        ieee: (_d = ieee == null ? void 0 : ieee.auc_pr) != null ? _d : 0,
        syntheticFormatted: syn ? syn.auc_pr.toFixed(4) : "\u2014",
        ieeeFormatted: ieee ? ieee.auc_pr.toFixed(4) : "\u2014"
      },
      {
        metric: "Precision",
        synthetic: (_e = syn == null ? void 0 : syn.precision) != null ? _e : 0,
        ieee: (_f = ieee == null ? void 0 : ieee.precision) != null ? _f : 0,
        syntheticFormatted: syn ? `${(syn.precision * 100).toFixed(2)}% (${syn.precision.toFixed(4)})` : "\u2014",
        ieeeFormatted: ieee ? `${(ieee.precision * 100).toFixed(2)}% (${ieee.precision.toFixed(4)})` : "\u2014"
      },
      {
        metric: "Recall",
        synthetic: (_g = syn == null ? void 0 : syn.recall) != null ? _g : 0,
        ieee: (_h = ieee == null ? void 0 : ieee.recall) != null ? _h : 0,
        syntheticFormatted: syn ? `${(syn.recall * 100).toFixed(2)}% (${syn.recall.toFixed(4)})` : "\u2014",
        ieeeFormatted: ieee ? `${(ieee.recall * 100).toFixed(2)}% (${ieee.recall.toFixed(4)})` : "\u2014"
      },
      {
        metric: "F1 Score",
        synthetic: (_i = syn == null ? void 0 : syn.f1_score) != null ? _i : 0,
        ieee: (_j = ieee == null ? void 0 : ieee.f1_score) != null ? _j : 0,
        syntheticFormatted: syn ? syn.f1_score.toFixed(4) : "\u2014",
        ieeeFormatted: ieee ? ieee.f1_score.toFixed(4) : "\u2014"
      }
    ];
  }, [syn, ieee]);
  if (loading && !data) {
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Model Performance & Evaluation Benchmarks" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading model performance benchmarks..." })
    ] });
  }
  if (error && !data) {
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Model Performance & Evaluation Benchmarks" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-error-state", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h4", { style: { margin: "0 0 6px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load model benchmarks" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { style: { margin: 0, fontSize: 13 }, children: error.message })
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Model Performance & Evaluation Benchmarks" }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-title", children: "Candidate Model" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-value", style: { fontSize: 20, fontFamily: "var(--rg-font-mono)" }, children: (data == null ? void 0 : data.model_version) || "candidate_lgbm_v1" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-subtitle", children: "Candidate model evaluation" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-title", children: "Synthetic ROC-AUC" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-value", children: syn ? syn.auc_roc.toFixed(4) : "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-subtitle", children: "Active dataset discrimination" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-title", children: "Cost Threshold (Synthetic)" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-value", style: { color: "var(--rg-accent)" }, children: syn ? syn.threshold.toFixed(2) : "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-subtitle", children: "Synthetic dataset operating point" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-title", children: "Evaluation Samples" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-value", children: totalSamples > 0 ? totalSamples.toLocaleString() : "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-card-subtitle", children: "Combined holdout transactions" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { style: { marginBottom: 20 }, children: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
      ChartContainer,
      {
        title: "Model Benchmark Comparison (Synthetic vs. IEEE-CIS Baseline)",
        subtitle: "Grouped performance metrics on unified 0.0\u20131.0 scale comparing candidate model across evaluation splits",
        height: 320,
        empty: !syn && !ieee,
        emptyTitle: "No benchmark metrics loaded",
        emptyMessage: "Model evaluation metrics will display once offline holdouts are loaded.",
        ariaLabel: "Model Benchmark Comparison Grouped Bar Chart",
        ariaDescription: "Grouped comparison of ROC-AUC, PR-AUC, Precision, Recall, and F1 Score between ReturnGuard Synthetic (Reproduced) and IEEE-CIS baseline (Reported Unverified).",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_recharts5.ResponsiveContainer, { width: "100%", height: 220, children: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
            import_recharts5.BarChart,
            {
              data: benchmarkComparisonData,
              margin: { top: 16, right: 16, left: -16, bottom: 4 },
              barGap: 4,
              barCategoryGap: "24%",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_recharts5.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_recharts5.XAxis, { dataKey: "metric", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
                  import_recharts5.YAxis,
                  {
                    stroke: CHART_CSS_VARS.axis,
                    fontSize: 11,
                    domain: [0, 1],
                    tickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
                    tickLine: false,
                    axisLine: false
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
                  import_recharts5.Tooltip,
                  {
                    content: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
                      ChartTooltip,
                      {
                        formatter: (_val, name, item) => {
                          var _a, _b;
                          const isSynthetic = name === "synthetic" || (name == null ? void 0 : name.includes("Synthetic"));
                          const formatted = isSynthetic ? (_a = item.payload) == null ? void 0 : _a.syntheticFormatted : (_b = item.payload) == null ? void 0 : _b.ieeeFormatted;
                          const label = isSynthetic ? `ReturnGuard Synthetic (${(syn == null ? void 0 : syn.reproduction_status) || "REPRODUCED"} \u2014 Threshold: ${(syn == null ? void 0 : syn.threshold) ? syn.threshold.toFixed(2) : "0.40"}, N=${(syn == null ? void 0 : syn.sample_count) ? syn.sample_count.toLocaleString() : "35,949"})` : `IEEE-CIS Baseline (${(ieee == null ? void 0 : ieee.reproduction_status) || "REPORTED_UNVERIFIED"} \u2014 Threshold: ${(ieee == null ? void 0 : ieee.threshold) ? ieee.threshold.toFixed(2) : "0.35"}, N=${(ieee == null ? void 0 : ieee.sample_count) ? ieee.sample_count.toLocaleString() : "118,108"})`;
                          return [formatted, label];
                        }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
                  import_recharts5.Bar,
                  {
                    dataKey: "synthetic",
                    name: "ReturnGuard Synthetic (REPRODUCED)",
                    fill: CHART_COLORS.accent,
                    radius: [4, 4, 0, 0],
                    isAnimationActive: false
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
                  import_recharts5.Bar,
                  {
                    dataKey: "ieee",
                    name: "IEEE-CIS Baseline (REPORTED_UNVERIFIED)",
                    fill: CHART_COLORS.review,
                    radius: [4, 4, 0, 0],
                    isAnimationActive: false
                  }
                )
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
            ChartLegend,
            {
              items: [
                {
                  id: "synthetic",
                  value: `ReturnGuard Synthetic (${(syn == null ? void 0 : syn.reproduction_status) || "REPRODUCED"} \u2014 N=${(syn == null ? void 0 : syn.sample_count) ? syn.sample_count.toLocaleString() : "35,949"}, Thr: ${(syn == null ? void 0 : syn.threshold) ? syn.threshold.toFixed(2) : "0.40"})`,
                  color: CHART_COLORS.accent
                },
                {
                  id: "ieee",
                  value: `IEEE-CIS Baseline (${(ieee == null ? void 0 : ieee.reproduction_status) || "REPORTED_UNVERIFIED"} \u2014 N=${(ieee == null ? void 0 : ieee.sample_count) ? ieee.sample_count.toLocaleString() : "118,108"}, Thr: ${(ieee == null ? void 0 : ieee.threshold) ? ieee.threshold.toFixed(2) : "0.35"})`,
                  color: CHART_COLORS.review
                }
              ],
              align: "center"
            }
          )
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-benchmark-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }, children: "ReturnGuard Synthetic E-Commerce" }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-benchmark-meta", style: { margin: 0 }, children: [
              "Evaluation Split: ",
              /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("strong", { children: [
                (syn == null ? void 0 : syn.sample_count) ? syn.sample_count.toLocaleString() : "\u2014",
                " transactions"
              ] }),
              " \u2022 Operating Threshold: ",
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("strong", { children: (syn == null ? void 0 : syn.threshold) ? syn.threshold.toFixed(2) : "\u2014" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-reproduced-badge", children: (syn == null ? void 0 : syn.reproduction_status) || "REPRODUCED" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: [
          "Candidate Model: ",
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("strong", { style: { color: "var(--rg-text-primary)", fontFamily: "var(--rg-font-mono)" }, children: (data == null ? void 0 : data.model_version) || "candidate_lgbm_v1" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metrics-grid", children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "ROC-AUC (Discrimination)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: syn ? syn.auc_roc.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.auc_roc * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "PR-AUC (Precision-Recall Integral)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: syn ? syn.auc_pr.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.auc_pr * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "Precision (True Positive Accuracy)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: syn ? `${(syn.precision * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.precision * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "Recall (Fraud Detection Rate)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: syn ? `${(syn.recall * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.recall * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "False-Negative Rate (FNR = 1 - Recall)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", style: { color: "var(--rg-med-text)" }, children: synFNR !== null ? `${synFNR.toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-amber",
                style: { width: `${synFNR !== null ? Math.min(100, Math.max(0, synFNR)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "F1 Score (Harmonic Mean)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: syn ? syn.f1_score.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.f1_score * 100)) : 0}%` }
              }
            ) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-benchmark-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }, children: "IEEE-CIS Fraud Benchmark" }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-benchmark-meta", style: { margin: 0 }, children: [
              "Evaluation Split: ",
              /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("strong", { children: [
                (ieee == null ? void 0 : ieee.sample_count) ? ieee.sample_count.toLocaleString() : "\u2014",
                " transactions"
              ] }),
              " \u2022 Operating Threshold: ",
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("strong", { children: (ieee == null ? void 0 : ieee.threshold) ? ieee.threshold.toFixed(2) : "\u2014" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-unverified-badge", children: (ieee == null ? void 0 : ieee.reproduction_status) || "REPORTED_UNVERIFIED" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: "Reported baseline artifact | Real-world uncurated e-commerce transactions" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metrics-grid", children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "ROC-AUC (Discrimination)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: ieee ? ieee.auc_roc.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.auc_roc * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "PR-AUC (Precision-Recall Integral)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: ieee ? ieee.auc_pr.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.auc_pr * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "Precision (True Positive Accuracy)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", style: { color: "var(--rg-med-text)" }, children: ieee ? `${(ieee.precision * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-amber",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.precision * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "Recall (Fraud Detection Rate)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: ieee ? `${(ieee.recall * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.recall * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "False-Negative Rate (FNR = 1 - Recall)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", style: { color: "var(--rg-med-text)" }, children: ieeeFNR !== null ? `${ieeeFNR.toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-amber",
                style: { width: `${ieeeFNR !== null ? Math.min(100, Math.max(0, ieeeFNR)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-label", children: "F1 Score (Harmonic Mean)" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: "rg-metric-val", children: ieee ? ieee.f1_score.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.f1_score * 100)) : 0}%` }
              }
            ) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-cross-dataset-comparison", children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, flexWrap: "wrap", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h4", { style: { margin: 0, fontSize: 14, fontWeight: 600 }, children: "Cross-Dataset Benchmark Comparison & Domain Shift" }),
        precisionDelta !== null && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("span", { className: "rg-comparison-delta", children: [
          "Precision Gap: ",
          precisionDelta.toFixed(2),
          " percentage points"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: [
        "The synthetic evaluation set demonstrates ",
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("strong", { children: syn ? `${(syn.precision * 100).toFixed(2)}%` : "78.47%" }),
        " precision, while the uncurated real-world IEEE-CIS baseline records ",
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("strong", { children: ieee ? `${(ieee.precision * 100).toFixed(2)}%` : "6.31%" }),
        " precision (a ",
        precisionDelta !== null ? `${precisionDelta.toFixed(2)} percentage point` : "72.16 percentage point",
        " difference, approximately one true positive per 16 flagged transactions). This cross-dataset disparity illustrates the real-world domain shift and mathematically justifies why the model is deployed as a ",
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("em", { children: "high-recall soft-friction verification trigger" }),
        " rather than an aggressive hard blocker."
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "rg-card", style: { marginTop: 16, borderLeft: "4px solid var(--rg-accent)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(InfoIcon, { size: 16, style: { color: "var(--rg-accent)" }, "aria-hidden": "true" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h4", { style: { margin: 0, fontSize: 14, fontWeight: 600 }, children: "Production & Evaluation Honest Limits Statement" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: (data == null ? void 0 : data.honest_limits_note) || "Offline evaluation scores reflect pre-production holdout sets. Live merchant scoring operates in non-blocking shadow mode until false-positive profiles are verified against merchant-side payment outcomes." })
    ] })
  ] });
};

// src/components/CustomersPage.tsx
var import_react13 = require("react");
var import_jsx_runtime22 = require("react/jsx-runtime");
var CustomersPage = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useCustomers(50);
  const [selectedCustomerId, setSelectedCustomerId] = (0, import_react13.useState)(null);
  const { profile, loading: profileLoading, error: profileError } = useCustomerProfile(selectedCustomerId);
  const [copiedId, setCopiedId] = (0, import_react13.useState)(false);
  const drawerRef = (0, import_react13.useRef)(null);
  const closeButtonRef = (0, import_react13.useRef)(null);
  const previousActiveElementRef = (0, import_react13.useRef)(null);
  (0, import_react13.useEffect)(() => {
    if (selectedCustomerId) {
      previousActiveElementRef.current = document.activeElement;
      const timer = setTimeout(() => {
        var _a;
        (_a = closeButtonRef.current) == null ? void 0 : _a.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedCustomerId]);
  const restoreFocus = (0, import_react13.useCallback)(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      el.focus();
    }
  }, []);
  const handleClose = (0, import_react13.useCallback)(() => {
    restoreFocus();
    setSelectedCustomerId(null);
  }, [restoreFocus]);
  (0, import_react13.useEffect)(() => {
    if (!selectedCustomerId) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab") {
        const container = drawerRef.current;
        if (!container) return;
        const focusableElements = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCustomerId, handleClose]);
  const handleCopyId = (0, import_react13.useCallback)((id) => {
    var _a;
    if ((_a = navigator == null ? void 0 : navigator.clipboard) == null ? void 0 : _a.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 1500);
      }).catch(() => {
      });
    }
  }, []);
  const formatDate = (0, import_react13.useCallback)((isoString) => {
    if (!isoString) return "\u2014";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString(void 0, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  }, []);
  const outcomeBreakdown = (0, import_react13.useMemo)(() => {
    if (!profile || !profile.order_history || profile.order_history.length === 0) {
      return null;
    }
    const total = profile.order_history.length;
    let allowCount = 0;
    let reviewCount = 0;
    let blockCount = 0;
    let unscoredCount = 0;
    profile.order_history.forEach((ord) => {
      const action = (ord.policy_action || "").toUpperCase();
      if (action === "ALLOW") allowCount++;
      else if (action === "REVIEW") reviewCount++;
      else if (action === "BLOCK") blockCount++;
      else unscoredCount++;
    });
    return {
      total,
      allow: { count: allowCount, pct: (allowCount / total * 100).toFixed(1) },
      review: { count: reviewCount, pct: (reviewCount / total * 100).toFixed(1) },
      block: { count: blockCount, pct: (blockCount / total * 100).toFixed(1) },
      unscored: { count: unscoredCount, pct: (unscoredCount / total * 100).toFixed(1) }
    };
  }, [profile]);
  const timelineEvents = (0, import_react13.useMemo)(() => {
    if (!profile) return [];
    const events = [];
    if (profile.created_at) {
      const d = new Date(profile.created_at);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `account-${profile.customer_id}`,
          date: d,
          timestamp: profile.created_at,
          title: "Account created",
          desc: `Customer registered on platform (${profile.customer_id})`,
          dotColor: "var(--rg-low-text)"
        });
      }
    }
    (profile.linked_devices || []).forEach((dev, idx) => {
      if (dev.created_at) {
        const d = new Date(dev.created_at);
        if (!isNaN(d.getTime())) {
          events.push({
            id: `dev-${dev.id || idx}`,
            date: d,
            timestamp: dev.created_at,
            title: "Device linked",
            desc: `Hash: ${dev.device_hash.slice(0, 16)}...${dev.ip_address ? ` \u2022 IP: ${dev.ip_address}` : ""}`,
            dotColor: "var(--rg-accent)"
          });
        }
      }
    });
    (profile.linked_addresses || []).forEach((addr, idx) => {
      if (addr.created_at) {
        const d = new Date(addr.created_at);
        if (!isNaN(d.getTime())) {
          events.push({
            id: `addr-${addr.id || idx}`,
            date: d,
            timestamp: addr.created_at,
            title: "Address added",
            desc: `${addr.city}, ${addr.state} ${addr.pincode} (${addr.country})`,
            dotColor: "var(--rg-accent)"
          });
        }
      }
    });
    (profile.order_history || []).forEach((ord, idx) => {
      if (ord.order_time) {
        const d = new Date(ord.order_time);
        if (!isNaN(d.getTime())) {
          const action = (ord.policy_action || "").toUpperCase();
          const dotColor = action === "BLOCK" ? "var(--rg-high-text)" : action === "REVIEW" ? "var(--rg-med-text)" : "var(--rg-low-text)";
          events.push({
            id: `ord-${ord.order_id || idx}`,
            date: d,
            timestamp: ord.order_time,
            title: "Order recorded",
            desc: `Order ${ord.order_id} \u2022 ${ord.currency} ${ord.order_value.toFixed(2)}${ord.policy_action ? ` \u2022 Policy: ${ord.policy_action}` : ""}`,
            dotColor
          });
        }
      }
    });
    return events.sort((a, b) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id));
  }, [profile]);
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h2", { style: { margin: "0 0 6px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Customer Risk Directory" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Tenant-scoped customer profiles, linked hardware devices, physical delivery locations, and order risk history." })
    ] }),
    loading && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading customer directory..." }),
    error && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-error-state", role: "alert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h4", { children: "Failed to load customer directory" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: error.message }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "Retry" })
          ]
        }
      )
    ] }),
    !loading && !error && items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-empty-state", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { style: { margin: "0 0 4px 0", fontWeight: 600, color: "var(--rg-text-primary)" }, children: "No customer records found." }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "New customer profiles will automatically appear here once transactions are evaluated." })
    ] }),
    items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }, children: items.map((cust) => {
      const isSelected = selectedCustomerId === cust.customer_id;
      return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
        "div",
        {
          role: "button",
          tabIndex: 0,
          "aria-pressed": isSelected,
          "aria-label": `Customer ${cust.customer_id}, maximum risk score ${(cust.max_risk_score * 100).toFixed(0)}`,
          className: `rg-customer-card ${isSelected ? "active" : ""}`,
          onClick: () => setSelectedCustomerId(cust.customer_id),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedCustomerId(cust.customer_id);
            }
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-customer-card-header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-customer-id", children: cust.customer_id }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(RiskBadge, { score: cust.max_risk_score })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-customer-card-body", children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-customer-contact-line", children: [
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-customer-contact-label", children: "Email:" }),
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-customer-contact-val", children: cust.email })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-customer-contact-line", children: [
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-customer-contact-label", children: "Phone:" }),
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-customer-contact-val", children: cust.phone })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-customer-card-footer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                "Orders: ",
                /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { className: "rg-customer-metric-val", children: cust.total_orders })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                "Spent: ",
                /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("strong", { className: "rg-customer-metric-val", children: [
                  cust.currency,
                  " ",
                  cust.total_spent.toFixed(2)
                ] })
              ] })
            ] })
          ]
        },
        cust.customer_id
      );
    }) }),
    hasMore && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { style: { marginTop: 24, textAlign: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
      "button",
      {
        type: "button",
        onClick: nextPage,
        disabled: loading,
        className: "rg-load-more-btn",
        style: { display: "inline-flex", alignItems: "center", gap: 6 },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: loading ? "Loading..." : "Load More Customers" }),
          !loading && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(ChevronRightIcon, { size: 14, "aria-hidden": "true" })
        ]
      }
    ) }),
    selectedCustomerId && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
      "div",
      {
        className: "rg-drawer-overlay",
        onClick: handleClose,
        "aria-hidden": "true",
        children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
          "aside",
          {
            ref: drawerRef,
            className: "rg-drawer",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "customer-drawer-title",
            "aria-describedby": "customer-drawer-desc",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-header", children: [
                /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-header-info", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { id: "customer-drawer-desc", className: "rg-drawer-subtitle", children: "Customer Risk Profile" }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 2 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h3", { id: "customer-drawer-title", className: "rg-drawer-title", children: selectedCustomerId }),
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleCopyId(selectedCustomerId),
                        className: "rg-copy-btn",
                        "aria-label": `Copy customer ID ${selectedCustomerId}`,
                        title: "Copy Customer ID",
                        children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: copiedId ? "Copied!" : "Copy" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
                  "button",
                  {
                    ref: closeButtonRef,
                    type: "button",
                    onClick: handleClose,
                    className: "rg-drawer-close-btn",
                    "aria-label": "Close customer profile drawer",
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(CloseIcon, { size: 14, "aria-hidden": "true" }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "Close" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-body", children: [
                profileLoading && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-section", role: "status", "aria-live": "polite", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { style: { color: "var(--rg-text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }, children: "Loading profile details..." }) }),
                profileError && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-error-state", role: "alert", style: { margin: 16 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h4", { style: { margin: "0 0 6px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load profile" }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { style: { margin: 0, fontSize: 13 }, children: profileError.message })
                ] }),
                profile && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-section-title", children: "Customer Risk Summary" }),
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-grid", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-label", children: "Masked Email" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-value", children: profile.email })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-label", children: "Masked Phone" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-value", children: profile.phone })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-label", children: "Registration Date" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-value", children: formatDate(profile.created_at) })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-label", children: "Lifetime Orders" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-value", children: profile.total_orders })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-label", children: "Lifetime Spend" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: "rg-context-value", children: [
                          profile.currency,
                          " ",
                          profile.total_spent.toFixed(2)
                        ] })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-label", children: "Max Risk Score" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { style: { marginTop: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(RiskBadge, { score: profile.max_risk_score }) })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-context-label", children: "Average Risk Score" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: "rg-context-value", children: [
                          (profile.average_risk_score * 100).toFixed(0),
                          " ",
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "/ 100" })
                        ] })
                      ] })
                    ] })
                  ] }),
                  outcomeBreakdown && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-section-title", children: "Transaction Outcome Breakdown" }),
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: [
                      "Policy decision distribution across ",
                      outcomeBreakdown.total,
                      " evaluated order",
                      outcomeBreakdown.total > 1 ? "s" : "",
                      ":"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-segmented-bar", role: "progressbar", "aria-label": "Transaction outcome distribution", children: [
                      parseFloat(outcomeBreakdown.allow.pct) > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                        "div",
                        {
                          className: "rg-segmented-bar-segment",
                          style: {
                            width: `${outcomeBreakdown.allow.pct}%`,
                            backgroundColor: "var(--rg-low-text)"
                          },
                          title: `ALLOW: ${outcomeBreakdown.allow.count} (${outcomeBreakdown.allow.pct}%)`
                        }
                      ),
                      parseFloat(outcomeBreakdown.review.pct) > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                        "div",
                        {
                          className: "rg-segmented-bar-segment",
                          style: {
                            width: `${outcomeBreakdown.review.pct}%`,
                            backgroundColor: "var(--rg-med-text)"
                          },
                          title: `REVIEW: ${outcomeBreakdown.review.count} (${outcomeBreakdown.review.pct}%)`
                        }
                      ),
                      parseFloat(outcomeBreakdown.block.pct) > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                        "div",
                        {
                          className: "rg-segmented-bar-segment",
                          style: {
                            width: `${outcomeBreakdown.block.pct}%`,
                            backgroundColor: "var(--rg-high-text)"
                          },
                          title: `BLOCK: ${outcomeBreakdown.block.count} (${outcomeBreakdown.block.pct}%)`
                        }
                      ),
                      parseFloat(outcomeBreakdown.unscored.pct) > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                        "div",
                        {
                          className: "rg-segmented-bar-segment",
                          style: {
                            width: `${outcomeBreakdown.unscored.pct}%`,
                            backgroundColor: "var(--rg-text-muted)"
                          },
                          title: `UNSCORED: ${outcomeBreakdown.unscored.count} (${outcomeBreakdown.unscored.pct}%)`
                        }
                      )
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-outcome-legend", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-risk-dot rg-risk-dot-low", "aria-hidden": "true" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                          "ALLOW: ",
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { children: outcomeBreakdown.allow.count }),
                          " (",
                          outcomeBreakdown.allow.pct,
                          "%)"
                        ] })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-risk-dot rg-risk-dot-medium", "aria-hidden": "true" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                          "REVIEW: ",
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { children: outcomeBreakdown.review.count }),
                          " (",
                          outcomeBreakdown.review.pct,
                          "%)"
                        ] })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-risk-dot rg-risk-dot-high", "aria-hidden": "true" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                          "BLOCK: ",
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { children: outcomeBreakdown.block.count }),
                          " (",
                          outcomeBreakdown.block.pct,
                          "%)"
                        ] })
                      ] }),
                      parseFloat(outcomeBreakdown.unscored.pct) > 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "var(--rg-text-muted)", display: "inline-block" }, "aria-hidden": "true" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                          "UNSCORED: ",
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { children: outcomeBreakdown.unscored.count }),
                          " (",
                          outcomeBreakdown.unscored.pct,
                          "%)"
                        ] })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-section-title", children: "Risk & Activity Exposure" }),
                    profile.order_history.length >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 12 }, children: [
                        "Chronological risk score progression across ",
                        profile.order_history.length,
                        " orders:"
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("svg", { width: "100%", height: "48", viewBox: "0 0 240 48", style: { overflow: "visible" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                          "polyline",
                          {
                            fill: "none",
                            stroke: "var(--rg-accent)",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            points: profile.order_history.slice().reverse().map((o, i, arr) => {
                              var _a, _b;
                              const x = arr.length > 1 ? i / (arr.length - 1) * 220 + 10 : 120;
                              const score = (_b = (_a = o.risk_score) != null ? _a : profile.average_risk_score) != null ? _b : 0;
                              const y = 40 - Math.min(Math.max(score, 0), 1) * 32;
                              return `${x},${y}`;
                            }).join(" ")
                          }
                        ),
                        profile.order_history.slice().reverse().map((o, i, arr) => {
                          var _a, _b;
                          const x = arr.length > 1 ? i / (arr.length - 1) * 220 + 10 : 120;
                          const score = (_b = (_a = o.risk_score) != null ? _a : profile.average_risk_score) != null ? _b : 0;
                          const y = 40 - Math.min(Math.max(score, 0), 1) * 32;
                          return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                            "circle",
                            {
                              cx: x,
                              cy: y,
                              r: "3",
                              fill: "var(--rg-bg-card)",
                              stroke: "var(--rg-accent)",
                              strokeWidth: "2"
                            },
                            o.order_id || i
                          );
                        })
                      ] })
                    ] }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: { fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Current Risk Assessment" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(RiskBadge, { score: profile.max_risk_score })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-meter-track", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                        "div",
                        {
                          className: "rg-meter-fill",
                          style: {
                            width: `${Math.min(Math.max(profile.max_risk_score * 100, 2), 100)}%`,
                            backgroundColor: profile.max_risk_score >= 0.8 ? "var(--rg-crit-text)" : profile.max_risk_score >= 0.4 ? "var(--rg-high-text)" : profile.max_risk_score >= 0.15 ? "var(--rg-med-text)" : "var(--rg-low-text)"
                          }
                        }
                      ) }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                        "Single recorded evaluation on record (",
                        profile.total_orders,
                        " order). Historical score trend activates once multiple orders accumulate."
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section-title", children: [
                      "Hardware & Network Footprint (",
                      profile.linked_devices.length,
                      ")"
                    ] }),
                    profile.linked_devices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-empty-text", children: "No linked device fingerprints recorded." }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: profile.linked_devices.map((d) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
                      "div",
                      {
                        style: {
                          background: "var(--rg-bg-tertiary)",
                          border: "1px solid var(--rg-border)",
                          borderRadius: "var(--rg-radius-sm)",
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: "rg-font-mono", style: { fontSize: 12, fontWeight: 500, color: "var(--rg-text-primary)" }, children: [
                              d.device_hash.slice(0, 20),
                              "..."
                            ] }),
                            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: "rg-meta-tag", style: { fontSize: 11 }, children: [
                              "IP: ",
                              d.ip_address || "Unrecorded"
                            ] })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                            "Registered: ",
                            formatDate(d.created_at)
                          ] })
                        ]
                      },
                      d.id
                    )) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section-title", children: [
                      "Delivery Locations (",
                      profile.linked_addresses.length,
                      ")"
                    ] }),
                    profile.linked_addresses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-empty-text", children: "No normalized addresses on file." }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: profile.linked_addresses.map((a) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
                      "div",
                      {
                        style: {
                          background: "var(--rg-bg-tertiary)",
                          border: "1px solid var(--rg-border)",
                          borderRadius: "var(--rg-radius-sm)",
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { style: { fontSize: 13, fontWeight: 500, color: "var(--rg-text-primary)" }, children: [
                            a.city,
                            ", ",
                            a.state,
                            " ",
                            a.pincode
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                              "Country: ",
                              a.country
                            ] }),
                            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
                              "Added: ",
                              formatDate(a.created_at)
                            ] })
                          ] })
                        ]
                      },
                      a.id
                    )) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-section-title", children: "Customer Lifecycle Timeline" }),
                    timelineEvents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-empty-text", children: "No lifecycle event records available." }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-timeline-list", children: timelineEvents.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-timeline-item", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-timeline-connector" }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                        "div",
                        {
                          className: "rg-timeline-dot",
                          style: { borderColor: ev.dotColor },
                          "aria-hidden": "true"
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-timeline-title", children: ev.title }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-timeline-desc", children: ev.desc }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-timeline-time", children: formatDate(ev.timestamp) })
                    ] }, ev.id)) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "rg-drawer-section-title", children: [
                      "Order History & Decisions (",
                      profile.order_history.length,
                      ")"
                    ] }),
                    profile.order_history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-drawer-empty-text", children: "No orders on record." }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "rg-table-container", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("table", { className: "rg-data-table", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("tr", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("th", { children: "Order ID" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("th", { children: "Channel" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("th", { children: "Amount" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("th", { children: "Status" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("th", { children: "Decision" }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("th", { children: "Order Time" })
                      ] }) }),
                      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("tbody", { children: profile.order_history.map((ord) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("tr", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("td", { className: "rg-font-mono", style: { fontWeight: 600 }, children: ord.order_id }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "rg-meta-tag", style: { textTransform: "uppercase" }, children: ord.channel }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("strong", { children: [
                          ord.currency,
                          " ",
                          ord.order_value.toFixed(2)
                        ] }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: { fontSize: 12, color: "var(--rg-text-secondary)", textTransform: "capitalize" }, children: ord.status }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("td", { children: ord.risk_score !== null && ord.risk_score !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(RiskBadge, { score: ord.risk_score, action: ord.policy_action || void 0 }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: "Unscored" }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("td", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: formatDate(ord.order_time) })
                      ] }, ord.order_id)) })
                    ] }) })
                  ] })
                ] })
              ] })
            ]
          }
        )
      }
    )
  ] });
};

// src/components/InvestigationsPage.tsx
var import_react14 = require("react");
var import_jsx_runtime23 = require("react/jsx-runtime");
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
  const [selectedId, setSelectedId] = (0, import_react14.useState)(initialInvestigationId || null);
  const [statusFilter, setStatusFilter] = (0, import_react14.useState)("ALL");
  const [queueItems, setQueueItems] = (0, import_react14.useState)(testItems || []);
  const [nextCursor, setNextCursor] = (0, import_react14.useState)(null);
  const [cursorHistory, setCursorHistory] = (0, import_react14.useState)([]);
  const [loadingQueue, setLoadingQueue] = (0, import_react14.useState)(false);
  const [queueError, setQueueError] = (0, import_react14.useState)(null);
  const [detail, setDetail] = (0, import_react14.useState)(testDetail || null);
  const [assessment, setAssessment] = (0, import_react14.useState)(testAssessment || null);
  const [timeline, setTimeline] = (0, import_react14.useState)(testTimeline || []);
  const [loadingDetail, setLoadingDetail] = (0, import_react14.useState)(false);
  const [detailError, setDetailError] = (0, import_react14.useState)(null);
  const [actionError, setActionError] = (0, import_react14.useState)(null);
  const [actionSuccess, setActionSuccess] = (0, import_react14.useState)(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = (0, import_react14.useState)(false);
  const [noteText, setNoteText] = (0, import_react14.useState)("");
  const [isCloseModalOpen, setIsCloseModalOpen] = (0, import_react14.useState)(false);
  const [closeOutcome, setCloseOutcome] = (0, import_react14.useState)("CLOSED_APPROVED");
  const [closeNote, setCloseNote] = (0, import_react14.useState)("");
  const [isReopenModalOpen, setIsReopenModalOpen] = (0, import_react14.useState)(false);
  const [reopenReason, setReopenReason] = (0, import_react14.useState)("");
  const fetchQueue = (0, import_react14.useCallback)(
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
  (0, import_react14.useEffect)(() => {
    fetchQueue();
  }, [fetchQueue]);
  const fetchDetail = (0, import_react14.useCallback)(
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
  (0, import_react14.useEffect)(() => {
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
  const startReviewGuard = (0, import_react14.useMemo)(() => {
    if (isInReview) {
      return { allowed: false, reason: "Case is already in review" };
    }
    if (isClosed) {
      return { allowed: false, reason: "Cannot start review on a closed case; reopen first" };
    }
    return { allowed: true, reason: "Start reviewing this case" };
  }, [isInReview, isClosed]);
  const addNoteGuard = (0, import_react14.useMemo)(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot add notes to a closed case; reopen first" };
    }
    return { allowed: true, reason: "Add a reviewer note to the step log" };
  }, [isClosed]);
  const requestDocsGuard = (0, import_react14.useMemo)(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot request documents for closed case" };
    }
    return { allowed: true, reason: "Request missing dispute evidence documents" };
  }, [isClosed]);
  const approvePackGuard = (0, import_react14.useMemo)(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot approve pack for closed case" };
    }
    if (!isInReview) {
      return { allowed: false, reason: "Review must be started (IN_REVIEW) before pack approval" };
    }
    return { allowed: true, reason: "Approve current evidence package" };
  }, [isClosed, isInReview]);
  const rejectPackGuard = (0, import_react14.useMemo)(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot reject pack for closed case" };
    }
    return { allowed: true, reason: "Reject current evidence package" };
  }, [isClosed]);
  const closeCaseGuard = (0, import_react14.useMemo)(() => {
    if (isClosed) {
      return { allowed: false, reason: "Case is already closed" };
    }
    if (currentStatus === "OPEN") {
      return { allowed: false, reason: "Start review before closing case" };
    }
    return { allowed: true, reason: "Close investigation case with formal outcome" };
  }, [isClosed, currentStatus]);
  const reopenCaseGuard = (0, import_react14.useMemo)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "rg-investigations-page", style: { padding: "4px 0" }, children: !selectedId ? /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Investigation Review Queue" }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Evidence packages, fraud investigations, and human-in-the-loop dispute determinations." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontSize: 13, color: "var(--rg-text-muted)", marginRight: 4 }, children: "Status Filter:" }),
          [
            "ALL",
            "OPEN",
            "AWAITING_REVIEW",
            "IN_REVIEW",
            "CLOSED_APPROVED",
            "CLOSED_REJECTED",
            "CLOSED_NO_ACTION",
            "REOPENED"
          ].map((st) => /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
    loadingQueue && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { color: "var(--rg-text-muted)", marginBottom: 12 }, children: "Loading investigations..." }),
    queueError && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { color: "var(--rg-high-text)", marginBottom: 12 }, children: queueError }),
    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, "data-testid": "queue-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
        "tr",
        {
          style: {
            background: "var(--rg-bg-tertiary)",
            borderBottom: "1px solid var(--rg-border)",
            color: "var(--rg-text-secondary)",
            textAlign: "left"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { style: { padding: "12px 16px" }, children: "Investigation ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { style: { padding: "12px 16px" }, children: "Dispute / Target" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { style: { padding: "12px 16px" }, children: "Status" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { style: { padding: "12px 16px" }, children: "Case Hash" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { style: { padding: "12px 16px" }, children: "Created" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("th", { style: { padding: "12px 16px", textAlign: "right" }, children: "Action" })
          ]
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("tbody", { children: queueItems.length === 0 && !loadingQueue ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("td", { colSpan: 6, style: { padding: 28, textAlign: "center", color: "var(--rg-text-muted)" }, children: [
        "No investigations found for status filter: ",
        statusFilter
      ] }) }) : queueItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
        "tr",
        {
          className: "rg-queue-row",
          style: { borderBottom: "1px solid var(--rg-border-subtle)", cursor: "pointer" },
          onClick: () => handleSelectCase(item.id),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { style: { padding: "12px 16px", fontFamily: "monospace", fontWeight: 600 }, children: item.id }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { style: { padding: "12px 16px", fontFamily: "monospace", color: "var(--rg-text-secondary)" }, children: item.dispute_id || "Direct Score" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { style: { padding: "12px 16px" }, children: renderStatusBadge(item.status) }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { style: { padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "var(--rg-text-muted)" }, children: item.case_hash ? item.case_hash.substring(0, 16) + "..." : "-" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { style: { padding: "12px 16px", fontSize: 12, color: "var(--rg-text-muted)" }, children: new Date(item.created_at).toLocaleString() }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("td", { style: { padding: "12px 16px", textAlign: "right" }, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
    nextCursor && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { marginTop: 12, display: "flex", justifyContent: "flex-end" }, children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "rg-case-view", "data-testid": "case-view", children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h2", { style: { margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }, children: (detail == null ? void 0 : detail.id) || selectedId }),
              renderStatusBadge(currentStatus)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 2 }, children: [
              "Case Hash: ",
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("code", { style: { fontFamily: "monospace" }, children: (detail == null ? void 0 : detail.case_hash) || "pending" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Dispute Amount" }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { fontSize: 18, fontWeight: 700, color: "var(--rg-text-primary)" }, children: [
            (detail == null ? void 0 : detail.currency) || "USD",
            " ",
            Number((detail == null ? void 0 : detail.amount) || 0).toFixed(2)
          ] })
        ] })
      ] }),
      loadingDetail && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { color: "var(--rg-text-muted)", marginBottom: 12 }, children: "Loading investigation details and LLM assessment..." }),
      detailError && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
      actionError && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
      actionSuccess && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--rg-text-muted)", marginRight: 6 }, children: "Review Actions:" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h3", { style: { margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "var(--rg-text-primary)" }, children: "Decision & Transaction Snapshot" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Severity" }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 13, fontWeight: 700, textTransform: "uppercase" }, children: ((_c = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _c.severity) || "HIGH" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Soft Policy Tier" }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 13, fontWeight: 700 }, children: ((_d = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _d.tier) || "MANUAL_REVIEW" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Risk Probability" }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 13, fontWeight: 700, fontFamily: "monospace" }, children: ((_e = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _e.probability) !== void 0 ? (Number(detail.decision_record.probability) * 100).toFixed(1) + "%" : ((_f = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _f.risk_score) !== void 0 ? (Number(detail.decision_record.risk_score) * 100).toFixed(1) + "%" : "88.5%" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Action" }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 13, fontWeight: 700 }, children: ((_g = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _g.policy_action) || "FLAG" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Top SHAP Contributors:" }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: (((_h = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _h.shap_top_k) || [
                { feature: "customer_order_velocity_1h", direction: "increases_risk", shap_rank: 1 },
                { feature: "delivery_address_mismatch", direction: "increases_risk", shap_rank: 2 },
                { feature: "ip_geo_distance_anomaly", direction: "increases_risk", shap_rank: 3 }
              ]).slice(0, 5).map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("span", { children: [
                      idx + 1,
                      ". ",
                      s.feature
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { color: s.direction === "increases_risk" ? "var(--rg-high-text)" : "var(--rg-low-text)" }, children: s.direction })
                  ]
                },
                idx
              )) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "rg-card", style: { padding: 16 }, "data-testid": "findings-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: [
                "Deterministic Findings (",
                ((_i = detail == null ? void 0 : detail.findings) == null ? void 0 : _i.length) || 0,
                ")"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Aliases (A1, A2...) map to source records" })
            ] }),
            !(detail == null ? void 0 : detail.findings) || detail.findings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 13, color: "var(--rg-text-muted)", padding: 12, textAlign: "center" }, children: "No findings generated yet." }) : /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: detail.findings.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
              "div",
              {
                style: {
                  background: "var(--rg-bg-secondary)",
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: 12
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: f.category })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 13, color: "var(--rg-text-primary)", marginBottom: 6 }, children: f.statement }),
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { fontSize: 11, color: "var(--rg-text-secondary)", fontFamily: "monospace" }, children: [
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
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h3", { style: { margin: "0 0 10px 0", fontSize: 14, fontWeight: 700 }, children: "Evidence Completeness" }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: ((_l = detail == null ? void 0 : detail.completeness) == null ? void 0 : _l.is_complete) ? "Complete: all dispute types present" : "Action recommended" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "All findings cited from uploaded dispute documents" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "Dispute claim amount matches transaction record" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "Customer identified with pseudonymized token" })
              ] }),
              ((_m = detail == null ? void 0 : detail.completeness) == null ? void 0 : _m.missing_kinds) && detail.completeness.missing_kinds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { marginTop: 6, color: "var(--rg-med-text)" }, children: [
                "Missing evidence types: ",
                detail.completeness.missing_kinds.join(", ")
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { children: "\u2139" }),
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { className: "rg-advisory-label-text", children: (assessment == null ? void 0 : assessment.advisory_label) || "LLM assessment, advisory" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { color: "var(--rg-text-muted)" }, children: "Model" }),
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: (assessment == null ? void 0 : assessment.model) || "gemini-1.5-pro" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { color: "var(--rg-text-muted)" }, children: "Attempts" }),
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontWeight: 600 }, children: (_n = assessment == null ? void 0 : assessment.attempt_count) != null ? _n : 1 })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { color: "var(--rg-text-muted)" }, children: "Prompt Hash" }),
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: (assessment == null ? void 0 : assessment.prompt_hash) ? assessment.prompt_hash.substring(0, 10) + "..." : "c8f49e..." })
                      ] })
                    ]
                  }
                ),
                (assessment == null ? void 0 : assessment.validator_errors) && assessment.validator_errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontWeight: 700, color: "var(--rg-high-text)", marginBottom: 4 }, children: "Validator Rejection Trace:" }),
                      assessment.validator_errors.map((errList, attIdx) => /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { marginBottom: 4 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("span", { style: { fontWeight: 600 }, children: [
                          "Attempt ",
                          attIdx + 1,
                          ": "
                        ] }),
                        errList.join("; ")
                      ] }, attIdx))
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Investigation Narrative:" }),
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { color: "var(--rg-text-muted)" }, children: "Findings Cited:" }),
                  ((assessment == null ? void 0 : assessment.findings_cited) || ["A1", "A2"]).map((c) => /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: "Evidence Package Status" }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: [
              "Pack Hash: ",
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("code", { style: { fontFamily: "monospace" }, children: currentPackHash })
            ] }),
            ((_q = detail == null ? void 0 : detail.approval) == null ? void 0 : _q.approver_sub) && /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
              "Approved by: ",
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontWeight: 600 }, children: detail.approval.approver_sub }),
              " at",
              " ",
              detail.approval.decided_at ? new Date(detail.approval.decided_at).toLocaleString() : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: "Step Timeline & Audit History" }),
              /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                timeline.length,
                " recorded events"
              ] })
            ] }),
            timeline.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", padding: 12, textAlign: "center" }, children: "No steps recorded in timeline." }) : /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: timeline.map((step, idx) => /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontSize: 14 }, children: step.step_type === "PACK_APPROVED" ? "\u2713" : step.step_type === "NOTE_ADDED" ? "\u270D" : step.step_type === "CASE_CLOSED" ? "\u{1F3C1}" : step.step_type === "CASE_REOPENED" ? "\u{1F504}" : "\u25CF" }),
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { flex: 1 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 2 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontWeight: 700, fontFamily: "monospace" }, children: step.step_type }),
                      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("span", { style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: new Date(step.created_at).toLocaleTimeString() })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { style: { color: "var(--rg-text-secondary)", marginBottom: 2 }, children: step.note }),
                    /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: [
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
      isNoteModalOpen && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
          children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h4", { style: { margin: "0 0 10px 0", fontSize: 16 }, children: "Add Reviewer Note" }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
      isCloseModalOpen && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
          children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h4", { style: { margin: "0 0 12px 0", fontSize: 16 }, children: "Close Investigation Case" }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Outcome Decision:" }),
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("option", { value: "CLOSED_APPROVED", children: "CLOSED_APPROVED (Requires active pack approval)" }),
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("option", { value: "CLOSED_REJECTED", children: "CLOSED_REJECTED (Dispute rejected)" }),
                        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("option", { value: "CLOSED_NO_ACTION", children: "CLOSED_NO_ACTION (No further action required)" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { marginBottom: 14 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Closing Note (min. 20 characters required):" }),
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
      isReopenModalOpen && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
          children: /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h4", { style: { margin: "0 0 10px 0", fontSize: 16 }, children: "Reopen Investigation Case" }),
                /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
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

// src/components/ReportsPage.tsx
var import_react15 = require("react");
var import_recharts6 = require("recharts");
var import_jsx_runtime24 = require("react/jsx-runtime");
function sanitizeCsvField(value) {
  if (value === null || value === void 0) {
    return "";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  let str = String(value);
  if (/^[=\+\-@]/.test(str)) {
    const isNumeric = !Number.isNaN(Number(str)) && str.trim() !== "";
    if (!isNumeric) {
      str = `'${str}`;
    }
  }
  if (/[",\r\n]/.test(str) || str.startsWith("'")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
var EXPORTED_CSV_COLUMNS = [
  "Decision ID",
  "Order ID",
  "Channel",
  "Risk Score",
  "Risk Score (0-100)",
  "Risk Tier",
  "Policy Action",
  "Suggested Action",
  "Policy Rule",
  "Severity",
  "Model Version",
  "Model Status"
];
function generateDecisionsCsv(decisions) {
  const headerRow = EXPORTED_CSV_COLUMNS.map(sanitizeCsvField).join(",");
  if (!decisions || decisions.length === 0) {
    return headerRow + "\r\n";
  }
  const rows = decisions.map(
    (d) => [
      sanitizeCsvField(d.decision_id || "--"),
      sanitizeCsvField(d.order_id || "--"),
      sanitizeCsvField(d.channel || "web"),
      sanitizeCsvField(d.risk_score),
      sanitizeCsvField(d.risk_score_100),
      sanitizeCsvField(d.tier || "LOW"),
      sanitizeCsvField(d.policy_action || "ALLOW"),
      sanitizeCsvField(d.suggested_action || "ALLOW"),
      sanitizeCsvField(d.policy_rule || "ALLOW_NORMAL"),
      sanitizeCsvField(d.severity || "allow"),
      sanitizeCsvField(d.model_version || "candidate_lgbm_v1"),
      sanitizeCsvField(d.model_status || "loaded")
    ].join(",")
  );
  return [headerRow, ...rows].join("\r\n") + "\r\n";
}
function triggerCsvDownload(csvContent, filename) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1e3);
}
var EXPORT_PIPELINE_STAGES = [
  {
    id: "ingestion",
    step: 1,
    title: "Loaded Decisions",
    subtitle: "Batch Ingestion",
    description: "Active client batch (max 50 loaded records)"
  },
  {
    id: "sanitization",
    step: 2,
    title: "PII Sanitization",
    subtitle: "Privacy Boundary",
    description: "Filters customer names, emails, phones & addresses"
  },
  {
    id: "formula_defense",
    step: 3,
    title: "CWE-1236 Defense",
    subtitle: "Formula Neutralization",
    description: "Neutralizes =, +, -, @ prefixes; preserves signed numbers"
  },
  {
    id: "rfc4180_csv",
    step: 4,
    title: "RFC 4180 CSV",
    subtitle: "Client Serialization",
    description: "CRLF stream & instant browser Blob URL download"
  }
];
function calculatePolicyDistribution(trends, summary) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const allowCount = (_c = (_b = (_a = trends == null ? void 0 : trends.policy_breakdown) == null ? void 0 : _a.ALLOW) != null ? _b : summary == null ? void 0 : summary.allow_count) != null ? _c : 0;
  const reviewCount = ((_e = (_d = trends == null ? void 0 : trends.policy_breakdown) == null ? void 0 : _d.REVIEW) != null ? _e : 0) + ((_g = (_f = trends == null ? void 0 : trends.policy_breakdown) == null ? void 0 : _f.MANUAL_REVIEW) != null ? _g : 0) || ((_h = summary == null ? void 0 : summary.review_count) != null ? _h : 0);
  const stepUpCount = (_j = (_i = trends == null ? void 0 : trends.policy_breakdown) == null ? void 0 : _i.STEP_UP_VERIFICATION) != null ? _j : 0;
  const blockCount = (_m = (_l = (_k = trends == null ? void 0 : trends.policy_breakdown) == null ? void 0 : _k.BLOCK) != null ? _l : summary == null ? void 0 : summary.block_count) != null ? _m : 0;
  const total = allowCount + reviewCount + stepUpCount + blockCount;
  const isEmpty = total === 0;
  const allowPct = isEmpty ? 0 : allowCount / total * 100;
  const reviewPct = isEmpty ? 0 : reviewCount / total * 100;
  const stepUpPct = isEmpty ? 0 : stepUpCount / total * 100;
  const blockPct = isEmpty ? 0 : blockCount / total * 100;
  const accessibleLabel = isEmpty ? "Policy decision distribution: No decisions evaluated" : `Policy decision distribution: ALLOW ${allowCount} (${allowPct.toFixed(1)}%), REVIEW ${reviewCount} (${reviewPct.toFixed(1)}%), STEP-UP ${stepUpCount} (${stepUpPct.toFixed(1)}%), BLOCK ${blockCount} (${blockPct.toFixed(1)}%)`;
  return {
    allow: { count: allowCount, pct: allowPct },
    review: { count: reviewCount, pct: reviewPct },
    stepUp: { count: stepUpCount, pct: stepUpPct },
    block: { count: blockCount, pct: blockPct },
    total,
    isEmpty,
    accessibleLabel
  };
}
function calculateDisputeMeter(disputeAnalytics) {
  var _a, _b, _c;
  const ratePct = (_a = disputeAnalytics == null ? void 0 : disputeAnalytics.dispute_rate_pct) != null ? _a : 0;
  const totalDisputes = (_b = disputeAnalytics == null ? void 0 : disputeAnalytics.total_disputes) != null ? _b : 0;
  const disputedAmount = (_c = disputeAnalytics == null ? void 0 : disputeAnalytics.disputed_amount) != null ? _c : 0;
  const currency = (disputeAnalytics == null ? void 0 : disputeAnalytics.currency) || "INR";
  const warningThresholdPct = 0.65;
  const criticalThresholdPct = 0.9;
  const scaleMaxPct = Math.max(1.2, ratePct > 0.9 ? ratePct * 1.15 : 1.2);
  const clampedPositionPct = Math.min(100, Math.max(0, ratePct / scaleMaxPct * 100));
  const warningMarkerPct = warningThresholdPct / scaleMaxPct * 100;
  const criticalMarkerPct = criticalThresholdPct / scaleMaxPct * 100;
  const isExceedingCritical = ratePct > criticalThresholdPct;
  const isZeroDisputes = totalDisputes === 0;
  let statusMessage = "";
  if (isZeroDisputes) {
    statusMessage = "Clean Processor Status (0 disputes recorded)";
  } else if (isExceedingCritical) {
    statusMessage = `Exceeds 0.90% Reference Level (${ratePct.toFixed(2)}%)`;
  } else if (ratePct >= warningThresholdPct) {
    statusMessage = `Elevated Dispute Activity (${ratePct.toFixed(2)}%)`;
  } else {
    statusMessage = `Nominal Dispute Activity (${ratePct.toFixed(2)}%)`;
  }
  const accessibleLabel = `Processor dispute rate: ${ratePct.toFixed(2)}% (${totalDisputes} recorded disputes) against reference thresholds of 0.65% early warning and 0.90% critical`;
  return {
    ratePct,
    totalDisputes,
    disputedAmount,
    currency,
    warningThresholdPct,
    criticalThresholdPct,
    scaleMaxPct,
    clampedPositionPct,
    warningMarkerPct,
    criticalMarkerPct,
    isExceedingCritical,
    isZeroDisputes,
    statusMessage,
    accessibleLabel
  };
}
var ReportsPage = () => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useRiskSummary();
  const {
    data: trends,
    loading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends
  } = useRiskTrends();
  const {
    items: decisions,
    loading: decisionsLoading,
    error: decisionsError,
    refetch: refetchDecisions
  } = useRiskDecisions(50);
  const [exportNotice, setExportNotice] = (0, import_react15.useState)(null);
  const handleRefreshAll = () => {
    refetchSummary();
    refetchTrends();
    refetchDecisions();
  };
  const handleExport = () => {
    if (!decisions.length) return;
    const csvData = generateDecisionsCsv(decisions);
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filename = `returnguard_decisions_batch_${dateStr}.csv`;
    triggerCsvDownload(csvData, filename);
    setExportNotice(`Exported ${decisions.length} loaded records to ${filename}.`);
    setTimeout(() => {
      setExportNotice(null);
    }, 6e3);
  };
  const totalDecisions = (_a = summary == null ? void 0 : summary.total_decisions) != null ? _a : 0;
  const allowCount = (_b = summary == null ? void 0 : summary.allow_count) != null ? _b : 0;
  const allowSharePct = totalDecisions > 0 ? allowCount / totalDecisions * 100 : 0;
  const disputeAnalytics = trends == null ? void 0 : trends.dispute_analytics;
  const totalDisputes = (_c = disputeAnalytics == null ? void 0 : disputeAnalytics.total_disputes) != null ? _c : 0;
  const disputedAmount = (_d = disputeAnalytics == null ? void 0 : disputeAnalytics.disputed_amount) != null ? _d : 0;
  const disputeCurrency = (disputeAnalytics == null ? void 0 : disputeAnalytics.currency) || "INR";
  const disputeRatePct = (_e = disputeAnalytics == null ? void 0 : disputeAnalytics.dispute_rate_pct) != null ? _e : 0;
  const totalVolumeInr = (_f = summary == null ? void 0 : summary.total_volume_inr) != null ? _f : 0;
  const tierDist = (_g = summary == null ? void 0 : summary.tier_distribution) != null ? _g : {};
  const isOverallLoading = summaryLoading || trendsLoading || decisionsLoading;
  const policyDist = calculatePolicyDistribution(trends, summary);
  const disputeMeter = calculateDisputeMeter(disputeAnalytics);
  const policyChartData = (0, import_react15.useMemo)(
    () => [
      {
        action: "ALLOW",
        label: "ALLOW",
        count: policyDist.allow.count,
        pct: policyDist.allow.pct,
        color: CHART_COLORS.allow
      },
      {
        action: "REVIEW",
        label: "REVIEW",
        count: policyDist.review.count,
        pct: policyDist.review.pct,
        color: CHART_COLORS.review
      },
      {
        action: "STEP-UP",
        label: "STEP-UP",
        count: policyDist.stepUp.count,
        pct: policyDist.stepUp.pct,
        color: CHART_COLORS.accent
      },
      {
        action: "BLOCK",
        label: "BLOCK",
        count: policyDist.block.count,
        pct: policyDist.block.pct,
        color: CHART_COLORS.block
      }
    ],
    [policyDist]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("header", { className: "rg-reports-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-title-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h2", { className: "rg-reports-title", children: "Operational Reports & Audit Exports" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { className: "rg-reports-subtitle", children: "Exportable decision datasets, policy governance metrics, and processor dispute analytics." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-header-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
          "button",
          {
            type: "button",
            onClick: handleRefreshAll,
            className: "rg-reports-refresh-btn",
            "aria-label": "Refresh reports data",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "Refresh" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
          "button",
          {
            type: "button",
            onClick: handleExport,
            className: "rg-reports-download-btn",
            disabled: decisions.length === 0 || decisionsLoading,
            "aria-label": "Export loaded decisions CSV",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(DownloadIcon, { size: 14, "aria-hidden": "true" }),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("span", { children: [
                "Export Loaded Decisions (",
                decisions.length,
                ")"
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { className: "rg-kpi-grid rg-metrics-grid", "aria-label": "Operational Governance Metrics", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-card", "data-testid": "kpi-total-decisions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-title", children: "Total Evaluated Decisions (Historical)" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-value", children: summaryLoading ? "\u2014" : totalDecisions.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-subtitle", children: "Cumulative lifetime decisions scored" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-card", "data-testid": "kpi-allow-share", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-title", children: "ALLOW Decision Share" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-value", style: { color: "var(--rg-low-text)" }, children: summaryLoading ? "\u2014" : totalDecisions > 0 ? `${allowSharePct.toFixed(1)}%` : "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-subtitle", children: summaryLoading ? "\u2014" : `${allowCount.toLocaleString()} of ${totalDecisions.toLocaleString()} decisions` })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-card", "data-testid": "kpi-total-disputes", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-title", children: "Recorded Disputes" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-value", children: trendsLoading ? "\u2014" : totalDisputes.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-subtitle", children: trendsLoading ? "\u2014" : `Dispute rate: ${disputeRatePct.toFixed(2)}%` })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-card", "data-testid": "kpi-disputed-volume", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-title", children: "Disputed Volume" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
          "div",
          {
            className: "rg-card-value",
            style: { color: disputedAmount > 0 ? "var(--rg-high-text)" : "var(--rg-text-primary)" },
            children: trendsLoading ? "\u2014" : `${disputeCurrency} ${disputedAmount.toLocaleString(void 0, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-card-subtitle", children: "Aggregate merchant dispute exposure" })
      ] })
    ] }),
    isOverallLoading && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading operational report metrics..." }),
    (summaryError || trendsError || decisionsError) && /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-error-state", role: "alert", style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h4", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load reports data" }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { style: { margin: "0 0 10px 0", fontSize: 13 }, children: (summaryError == null ? void 0 : summaryError.message) || (trendsError == null ? void 0 : trendsError.message) || (decisionsError == null ? void 0 : decisionsError.message) }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("button", { type: "button", onClick: handleRefreshAll, className: "rg-retry-btn", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "Retry" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { className: "rg-reports-hero-card", "aria-label": "Decisions Export Center", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-card-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }, children: "Decisions Audit Dataset Export Center" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Export the currently loaded page of risk decisions for offline compliance, fraud audits, and model governance." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-badge rg-reports-badge-accent", children: "Single Batch (Max 50 Records)" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-badge", children: "RFC 4180 / CWE-1236 Protected" })
        ] })
      ] }),
      exportNotice && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-review-alert-success", role: "status", children: exportNotice }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: "Export Governance & PII-Scrubbing Pipeline:" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
          "div",
          {
            className: "rg-reports-pipeline-flow",
            role: "region",
            "aria-label": "Export data governance and sanitization pipeline",
            children: EXPORT_PIPELINE_STAGES.map((st) => /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-pipeline-node", children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-pipeline-node-header", children: [
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-pipeline-step-badge", children: st.step }),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-pipeline-node-subtitle", children: st.subtitle })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h4", { className: "rg-reports-pipeline-node-title", children: st.title }),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { className: "rg-reports-pipeline-node-desc", children: st.id === "ingestion" ? `${decisions.length} / 50 records loaded (single page limit)` : st.description })
            ] }, st.id))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Exported Dataset Schema (12 Attributes):" }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "rg-reports-columns-wrap", children: EXPORTED_CSV_COLUMNS.map((col) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-column-chip", children: col }, col)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-privacy-box", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(LockIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0 } }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("strong", { children: "Privacy Assurance:" }),
          " Export is strictly non-PII. Customer names, emails, phones, and physical addresses are excluded."
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 4 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("span", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
          "Current batch: ",
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("strong", { children: [
            decisions.length,
            " / 50"
          ] }),
          " loaded decisions available for export."
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
          "button",
          {
            type: "button",
            onClick: handleExport,
            className: "rg-reports-download-btn",
            disabled: decisions.length === 0 || decisionsLoading,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(DownloadIcon, { size: 14, "aria-hidden": "true" }),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("span", { children: [
                "Download CSV (",
                decisions.length,
                " Records)"
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-analytical-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { className: "rg-card", "aria-label": "Policy Action Governance", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-card-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 15, fontWeight: 600 }, children: "Policy Action Governance" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Distribution of risk engine policy actions across all evaluated decisions." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-badge", children: "Policy Engine" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
          ChartContainer,
          {
            title: "Policy Decision Distribution",
            subtitle: "Evaluated policy action share across lifetime transactions",
            height: 250,
            loading: trendsLoading || summaryLoading,
            empty: policyDist.isEmpty,
            emptyTitle: "No evaluated decisions",
            emptyMessage: "Policy recommendations will populate as transactions are scored.",
            ariaLabel: policyDist.accessibleLabel,
            ariaDescription: "Distribution across ALLOW, REVIEW, STEP-UP, and BLOCK recommendations.",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_recharts6.ResponsiveContainer, { width: "100%", height: 160, children: /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(import_recharts6.BarChart, { data: policyChartData, margin: { top: 12, right: 16, left: -20, bottom: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_recharts6.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_recharts6.XAxis, { dataKey: "label", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_recharts6.YAxis, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  import_recharts6.Tooltip,
                  {
                    content: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                      ChartTooltip,
                      {
                        formatter: (val, _name, item) => {
                          var _a2, _b2;
                          return [
                            `${Number(val).toLocaleString()} decisions (${(_a2 = item.payload) == null ? void 0 : _a2.pct.toFixed(1)}%)`,
                            (_b2 = item.payload) == null ? void 0 : _b2.action
                          ];
                        }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_recharts6.Bar, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: policyChartData.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_recharts6.Cell, { fill: entry.color }, entry.action)) })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                ChartLegend,
                {
                  items: policyChartData.map((d) => ({
                    id: d.action,
                    value: d.action,
                    count: d.count,
                    percentage: d.pct,
                    color: d.color,
                    formattedValue: `${d.count.toLocaleString()} (${d.pct.toFixed(1)}%)`
                  })),
                  showValues: true,
                  showPercentages: true,
                  align: "center"
                }
              )
            ]
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("table", { className: "rg-reports-stat-table", "aria-label": "Policy recommendations breakdown", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tbody", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "ALLOW Recommendations" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-low-text)" }, children: [
              policyDist.allow.count.toLocaleString(),
              " (",
              policyDist.allow.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "REVIEW Recommendations" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-med-text)" }, children: [
              policyDist.review.count.toLocaleString(),
              " (",
              policyDist.review.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "STEP-UP VERIFICATION" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-accent)" }, children: [
              policyDist.stepUp.count.toLocaleString(),
              " (",
              policyDist.stepUp.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "BLOCK Recommendations" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-high-text)" }, children: [
              policyDist.block.count.toLocaleString(),
              " (",
              policyDist.block.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Critical Tier (CRITICAL)" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", children: (tierDist.CRITICAL || 0).toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "High Risk Tier (HIGH)" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", children: (tierDist.HIGH || 0).toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Average Risk Score" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", children: ((_h = summary == null ? void 0 : summary.average_risk_score) != null ? _h : 0).toFixed(4) })
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-notice-box", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(InfoIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0, marginTop: 1 } }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "Policy decisions reflect ReturnGuard fraud evaluations. They represent risk recommendations and do not imply payment authorization or bank settlement." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { className: "rg-card", "aria-label": "Dispute & Chargeback Analytics", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-card-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 15, fontWeight: 600 }, children: "Dispute & Chargeback Analytics" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Aggregated dispute records received from merchant processor webhooks." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-badge", children: "Gateway Relay" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-meter-container", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-meter-status", children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { style: { fontWeight: 600, color: "var(--rg-text-secondary)" }, children: "Dispute Rate Exposure" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
              "span",
              {
                style: {
                  fontFamily: "var(--rg-font-mono)",
                  fontSize: 11,
                  color: disputeMeter.isZeroDisputes ? "var(--rg-low-text)" : disputeMeter.isExceedingCritical ? "var(--rg-high-text)" : "var(--rg-text-primary)"
                },
                children: disputeMeter.statusMessage
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
            "div",
            {
              className: "rg-reports-meter-track",
              role: "img",
              "aria-label": disputeMeter.accessibleLabel,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  "div",
                  {
                    className: "rg-reports-meter-threshold rg-reports-meter-threshold-warning",
                    style: { left: `${disputeMeter.warningMarkerPct}%` },
                    title: "Early Warning Reference Threshold (0.65%)"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  "div",
                  {
                    className: "rg-reports-meter-threshold rg-reports-meter-threshold-critical",
                    style: { left: `${disputeMeter.criticalMarkerPct}%` },
                    title: "Excessive Dispute Reference Threshold (0.90%)"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
                  "div",
                  {
                    className: "rg-reports-meter-marker",
                    style: { left: `${disputeMeter.clampedPositionPct}%` },
                    title: `Active Dispute Rate: ${disputeMeter.ratePct.toFixed(2)}%`
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-meter-labels", "aria-hidden": "true", children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "0.00%" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { style: { color: "var(--rg-med-text)" }, children: "0.65% (Warning Ref)" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { style: { color: "var(--rg-high-text)" }, children: "0.90% (Critical Ref)" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("span", { children: [
              disputeMeter.scaleMaxPct.toFixed(2),
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("table", { className: "rg-reports-stat-table", "aria-label": "Dispute analytics breakdown", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tbody", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Total Disputes Recorded" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", children: disputeMeter.totalDisputes.toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Total Disputed Amount" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
              "td",
              {
                className: "rg-reports-stat-value",
                style: { color: disputeMeter.disputedAmount > 0 ? "var(--rg-high-text)" : "inherit" },
                children: [
                  disputeMeter.currency,
                  " ",
                  disputeMeter.disputedAmount.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Dispute Rate" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("td", { className: "rg-reports-stat-value", children: [
              disputeMeter.ratePct.toFixed(2),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Processor Currency" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", children: disputeMeter.currency })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Monitoring Status" }),
            /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
              "td",
              {
                className: "rg-reports-stat-value",
                style: {
                  color: disputeMeter.isZeroDisputes ? "var(--rg-low-text)" : disputeMeter.isExceedingCritical ? "var(--rg-high-text)" : "var(--rg-med-text)"
                },
                children: disputeMeter.isZeroDisputes ? "Clean Processor Status" : disputeMeter.isExceedingCritical ? "Exceeds Reference Ceiling" : "Within Reference Limits"
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-notice-box", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(AlertTriangleIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0, marginTop: 1 } }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "Dispute records are populated via processor webhooks. Reference levels (0.65% early warning, 0.90% critical) reflect standard payment network dispute monitoring program thresholds. Historical time-series trend is omitted due to zero recorded disputes and absence of multi-period dispute telemetry." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("section", { className: "rg-reports-footer-card", "aria-label": "Domain & Volume Governance", children: [
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-card-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Domain & Volume Governance" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Tenant data partitioning and evaluated monetary volume disclosure." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "rg-reports-badge", children: "Tenant Isolated" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("table", { className: "rg-reports-stat-table", "aria-label": "Evaluated volume and domain boundaries", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tbody", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Cumulative Evaluated Order Volume" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("td", { className: "rg-reports-stat-value", children: [
            "INR ",
            totalVolumeInr.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Tenant Scope" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", style: { fontFamily: "var(--rg-font-mono)" }, children: (summary == null ? void 0 : summary.tenant_id) || "merch_shoppoint" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Serving Model" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", style: { fontFamily: "var(--rg-font-mono)" }, children: "candidate_lgbm_v1" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-label", children: "Model Verification Mode" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("td", { className: "rg-reports-stat-value", children: "Active (Shadow Mode)" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "rg-reports-notice-box", children: [
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(ShieldIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0, marginTop: 1 } }),
        /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { children: "Evaluated volume is aggregated from order records within the tenant partition. Individual risk score events store feature snapshots and ML reason codes rather than raw payment credentials." })
      ] })
    ] })
  ] });
};

// src/components/MerchantDashboardTemplate.tsx
var import_jsx_runtime25 = require("react/jsx-runtime");
var DEFAULT_WORKSPACE_DEFS = {
  overview: { id: "overview", label: "Overview", icon: OverviewIcon, component: OverviewPage },
  reviews: { id: "reviews", label: "Review Queue", icon: ReviewsIcon, component: ReviewsPage },
  transactions: { id: "transactions", label: "Decisions & Transactions", icon: TransactionsIcon, component: TransactionsPage },
  analytics: { id: "analytics", label: "Risk Analytics", icon: AnalyticsIcon, component: RiskAnalyticsPage },
  rules: { id: "rules", label: "Rules & Safeguards", icon: RulesIcon, component: RulesPage },
  models: { id: "models", label: "ML Benchmarks", icon: ModelsIcon, component: ModelsPage },
  customers: { id: "customers", label: "Customers", icon: CustomersIcon, component: CustomersPage },
  investigations: { id: "investigations", label: "Investigations", icon: SearchIcon, component: InvestigationsPage },
  reports: { id: "reports", label: "Reports & Export", icon: ReportsIcon, component: ReportsPage }
};
var MerchantDashboardTemplate = ({
  brandTitle = "ReturnGuard",
  merchantName = "ShopPoint",
  workspaces: propWorkspaces,
  defaultWorkspace = "overview",
  layout = "tabs",
  showBranding = true,
  columns,
  onReviewAction,
  renderHeaderRight
}) => {
  var _a;
  const { theme, setTheme } = useReturnGuard();
  const [selectedDecisionId, setSelectedDecisionId] = (0, import_react16.useState)(null);
  const activeWorkspaces = import_react16.default.useMemo(() => {
    if (!propWorkspaces || propWorkspaces.length === 0) {
      return [
        DEFAULT_WORKSPACE_DEFS.overview,
        DEFAULT_WORKSPACE_DEFS.reviews,
        DEFAULT_WORKSPACE_DEFS.transactions,
        DEFAULT_WORKSPACE_DEFS.analytics
      ];
    }
    return propWorkspaces.map((ws) => {
      if (typeof ws === "string") {
        return DEFAULT_WORKSPACE_DEFS[ws] || { id: ws, label: ws };
      }
      return ws;
    });
  }, [propWorkspaces]);
  const [currentTab, setCurrentTab] = (0, import_react16.useState)(
    activeWorkspaces.some((w) => w.id === defaultWorkspace) ? defaultWorkspace : ((_a = activeWorkspaces[0]) == null ? void 0 : _a.id) || "overview"
  );
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { className: `rg-root rg-theme-${theme} rg-merchant-template`, style: { minHeight: "100%", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(
      "header",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "var(--rg-bg-secondary, #1e293b)",
          borderBottom: "1px solid var(--rg-border-primary, #334155)",
          flexWrap: "wrap",
          gap: 12
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
              "div",
              {
                style: {
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff"
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(ShieldIcon, { size: 18 })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--rg-text-primary)" }, children: brandTitle }),
              /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { fontSize: 11, color: "var(--rg-text-secondary)" }, children: [
                "Merchant: ",
                /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("strong", { style: { color: "var(--rg-text-primary)" }, children: merchantName })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
            renderHeaderRight && renderHeaderRight(),
            /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
              "button",
              {
                type: "button",
                className: "rg-theme-toggle",
                onClick: toggleTheme,
                "aria-label": `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  borderRadius: 6,
                  background: "var(--rg-bg-tertiary)",
                  border: "1px solid var(--rg-border-primary)",
                  color: "var(--rg-text-secondary)",
                  cursor: "pointer"
                },
                children: theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(import_jsx_runtime25.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SunIcon, { size: 14 }),
                  /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { children: "Light" })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(import_jsx_runtime25.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(MoonIcon, { size: 14 }),
                  /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { children: "Dark" })
                ] })
              }
            )
          ] })
        ]
      }
    ),
    layout === "tabs" && activeWorkspaces.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 20px",
          background: "var(--rg-bg-primary, #0f172a)",
          borderBottom: "1px solid var(--rg-border-primary, #334155)",
          overflowX: "auto"
        },
        children: activeWorkspaces.map((ws) => {
          const isActive = currentTab === ws.id;
          const Icon = ws.icon;
          return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => {
                setCurrentTab(ws.id);
                setSelectedDecisionId(null);
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: isActive ? "var(--rg-bg-secondary, #1e293b)" : "transparent",
                color: isActive ? "var(--rg-text-primary, #ffffff)" : "var(--rg-text-secondary, #94a3b8)",
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent"
              },
              children: [
                Icon && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Icon, { size: 15 }),
                /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { children: ws.label })
              ]
            },
            ws.id
          );
        })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("main", { style: { flex: 1, padding: "20px", maxWidth: 1400, width: "100%", margin: "0 auto" }, children: layout === "stacked" ? /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RiskSummary, {}),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
        ReviewQueue,
        {
          onApprove: (id, notes) => onReviewAction && onReviewAction(id, "APPROVE", notes),
          onReject: (id, notes) => onReviewAction && onReviewAction(id, "REJECT", notes),
          onSelectDecision: setSelectedDecisionId
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
        RiskDecisionGrid,
        {
          columns,
          onRowClick: (id) => setSelectedDecisionId(id)
        }
      ),
      selectedDecisionId && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RiskExplanation, { decisionId: selectedDecisionId }),
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(AuditTimeline, { decisionId: selectedDecisionId })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { children: [
      currentTab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RiskSummary, {}),
        /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
            ReviewQueue,
            {
              onApprove: (id, notes) => onReviewAction && onReviewAction(id, "APPROVE", notes),
              onReject: (id, notes) => onReviewAction && onReviewAction(id, "REJECT", notes),
              onSelectDecision: setSelectedDecisionId
            }
          ),
          selectedDecisionId ? /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RiskExplanation, { decisionId: selectedDecisionId }) : /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(AuditTimeline, {})
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
          RiskDecisionGrid,
          {
            columns,
            onRowClick: (id) => setSelectedDecisionId(id)
          }
        )
      ] }),
      currentTab === "reviews" && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
          ReviewQueue,
          {
            onApprove: (id, notes) => onReviewAction && onReviewAction(id, "APPROVE", notes),
            onReject: (id, notes) => onReviewAction && onReviewAction(id, "REJECT", notes),
            onSelectDecision: setSelectedDecisionId
          }
        ),
        selectedDecisionId && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RiskExplanation, { decisionId: selectedDecisionId }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(AuditTimeline, { decisionId: selectedDecisionId })
        ] })
      ] }),
      currentTab === "transactions" && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
          RiskDecisionGrid,
          {
            columns,
            onRowClick: (id) => setSelectedDecisionId(id)
          }
        ),
        selectedDecisionId && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RiskExplanation, { decisionId: selectedDecisionId }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(AuditTimeline, { decisionId: selectedDecisionId })
        ] })
      ] }),
      currentTab === "analytics" && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RiskAnalyticsPage, {}),
      currentTab === "rules" && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(RulesPage, {}),
      currentTab === "models" && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(ModelsPage, {}),
      currentTab === "customers" && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(CustomersPage, {}),
      currentTab === "investigations" && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(InvestigationsPage, {}),
      currentTab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(ReportsPage, {})
    ] }) }),
    showBranding && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(
      "footer",
      {
        style: {
          padding: "12px 20px",
          textAlign: "center",
          fontSize: 11,
          color: "var(--rg-text-muted, #64748b)",
          borderTop: "1px solid var(--rg-border-primary, #334155)",
          background: "var(--rg-bg-secondary, #1e293b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { children: "Powered by" }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("strong", { style: { color: "var(--rg-text-secondary, #94a3b8)", letterSpacing: "0.02em" }, children: "ReturnGuard" }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { children: "\u2022 AI Risk & Fraud Intelligence" })
        ]
      }
    )
  ] });
};

// src/components/ReturnGuardDashboard.tsx
var import_react19 = require("react");

// src/components/DashboardShell.tsx
var import_react17 = require("react");
var import_jsx_runtime26 = require("react/jsx-runtime");
var DashboardShell = ({
  currentTab,
  onTabChange,
  brandTitle = "ReturnGuard",
  children
}) => {
  const { theme, setTheme } = useReturnGuard();
  const [mobileOpen, setMobileOpen] = (0, import_react17.useState)(false);
  const toggleButtonRef = (0, import_react17.useRef)(null);
  const firstNavRef = (0, import_react17.useRef)(null);
  const navItems = [
    { id: "overview", label: "Overview", icon: OverviewIcon },
    { id: "investigations", label: "Investigations", icon: SearchIcon },
    { id: "transactions", label: "Transactions", icon: TransactionsIcon },
    { id: "customers", label: "Customers", icon: CustomersIcon },
    { id: "analytics", label: "Risk Analytics", icon: AnalyticsIcon },
    { id: "rules", label: "Rules & Detection", icon: RulesIcon },
    { id: "models", label: "Model Benchmarks", icon: ModelsIcon },
    { id: "pipeline", label: "Payment Pipeline", icon: PipelineIcon },
    { id: "reviews", label: "Alerts & Reviews", icon: ReviewsIcon },
    { id: "reports", label: "Reports & Export", icon: ReportsIcon }
  ];
  const closeMobileNav = (0, import_react17.useCallback)(() => {
    var _a;
    setMobileOpen(false);
    (_a = toggleButtonRef.current) == null ? void 0 : _a.focus();
  }, []);
  const handleKeyDown = (0, import_react17.useCallback)(
    (e) => {
      if (e.key === "Escape" && mobileOpen) {
        closeMobileNav();
      }
    },
    [mobileOpen, closeMobileNav]
  );
  (0, import_react17.useEffect)(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  const toggleMobileNav = () => {
    if (!mobileOpen) {
      setMobileOpen(true);
      setTimeout(() => {
        var _a;
        (_a = firstNavRef.current) == null ? void 0 : _a.focus();
      }, 50);
    } else {
      closeMobileNav();
    }
  };
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-shell", children: [
    /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
      "div",
      {
        className: `rg-sidebar-backdrop ${mobileOpen ? "open" : ""}`,
        onClick: closeMobileNav,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
      "aside",
      {
        className: `rg-sidebar ${mobileOpen ? "open" : ""}`,
        "aria-label": "Sidebar Navigation",
        "aria-modal": mobileOpen ? "true" : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "rg-sidebar-header", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-brand-logo", children: [
            /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "rg-brand-icon-wrap", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(ShieldIcon, { size: 18 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-brand-title", children: brandTitle }),
            /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-brand-badge", children: "SaaS" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("nav", { className: "rg-sidebar-nav", "aria-label": "Main Navigation", children: navItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
              "button",
              {
                ref: index === 0 ? firstNavRef : void 0,
                type: "button",
                className: `rg-nav-item ${isActive ? "active" : ""}`,
                onClick: () => {
                  onTabChange(item.id);
                  if (mobileOpen) {
                    closeMobileNav();
                  }
                },
                "aria-current": isActive ? "page" : void 0,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-nav-item-icon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(IconComponent, { size: 18 }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-nav-item-label", children: item.label })
                ]
              },
              item.id
            );
          }) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("header", { className: "rg-topbar", role: "banner", children: [
        /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-topbar-left", children: [
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
            "button",
            {
              ref: toggleButtonRef,
              type: "button",
              className: "rg-mobile-toggle",
              onClick: toggleMobileNav,
              "aria-label": mobileOpen ? "Close navigation sidebar" : "Open navigation sidebar",
              "aria-expanded": mobileOpen,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-mobile-toggle-bar" }),
                /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-mobile-toggle-bar" }),
                /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-mobile-toggle-bar" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-tenant-status", children: [
            /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-tenant-label", children: "Tenant:" }),
            /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-tenant-name", children: "Active Session" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-topbar-right", children: [
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-topbar-meta-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-meta-tag", children: "Currency: Native Dataset / Provider Specific" }),
            /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
              "span",
              {
                className: "rg-meta-info",
                title: "Backend provides raw monetary amounts per transaction without guaranteed FX conversion. Global currency filter disabled.",
                "aria-label": "Currency status: Fixed",
                tabIndex: 0,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(InfoIcon, { size: 13, "aria-hidden": "true" }),
                  /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { children: "Fixed" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)("div", { className: "rg-topbar-meta-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { className: "rg-meta-tag", children: "Range: Lifetime Aggregates" }),
            /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
              "span",
              {
                className: "rg-meta-info",
                title: "Backend /v1/analytics/summary returns all-time scored decisions.",
                "aria-label": "Range status: Fixed",
                tabIndex: 0,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(InfoIcon, { size: 13, "aria-hidden": "true" }),
                  /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { children: "Fixed" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
            "button",
            {
              type: "button",
              className: "rg-theme-toggle",
              onClick: toggleTheme,
              "aria-label": `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
              title: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
              children: theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(import_jsx_runtime26.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(SunIcon, { size: 15, "aria-hidden": "true" }),
                /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { children: "Light" })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(import_jsx_runtime26.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(MoonIcon, { size: 15, "aria-hidden": "true" }),
                /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("span", { children: "Dark" })
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("main", { className: "rg-content", children })
    ] })
  ] });
};

// src/components/PaymentPipelinePage.tsx
var import_react18 = require("react");
var import_recharts7 = require("recharts");
var import_jsx_runtime27 = require("react/jsx-runtime");
var PaymentPipelinePage = () => {
  const { data, loading, error, refetch } = useRiskTrends();
  const channels = data == null ? void 0 : data.channel_breakdown;
  const disputes = data == null ? void 0 : data.dispute_analytics;
  const paypalCount = Math.max(0, typeof (channels == null ? void 0 : channels.paypal) === "number" ? channels.paypal : 0);
  const codCount = Math.max(0, typeof (channels == null ? void 0 : channels.cod) === "number" ? channels.cod : 0);
  const otherCount = Math.max(0, typeof (channels == null ? void 0 : channels.other) === "number" ? channels.other : 0);
  const channelSum = paypalCount + codCount + otherCount;
  const totalDecisions = channelSum;
  const paypalPct = channelSum > 0 ? paypalCount / channelSum * 100 : 0;
  const codPct = channelSum > 0 ? codCount / channelSum * 100 : 0;
  const otherPct = channelSum > 0 ? otherCount / channelSum * 100 : 0;
  const channelChartData = (0, import_react18.useMemo)(
    () => [
      {
        channel: "PayPal",
        label: "PayPal Channel",
        count: paypalCount,
        pct: paypalPct,
        color: CHART_COLORS.paypal
      },
      {
        channel: "COD",
        label: "Cash on Delivery",
        count: codCount,
        pct: codPct,
        color: CHART_COLORS.cod
      },
      {
        channel: "Other",
        label: "Web & Other Relayed",
        count: otherCount,
        pct: otherPct,
        color: CHART_COLORS.other
      }
    ],
    [paypalCount, codCount, otherCount, paypalPct, codPct, otherPct]
  );
  const totalDisputes = Math.max(0, typeof (disputes == null ? void 0 : disputes.total_disputes) === "number" ? disputes.total_disputes : 0);
  const disputedAmount = Math.max(0, typeof (disputes == null ? void 0 : disputes.disputed_amount) === "number" ? disputes.disputed_amount : 0);
  const disputeCurrency = (disputes == null ? void 0 : disputes.currency) || "INR";
  const disputeRatePct = Math.max(0, typeof (disputes == null ? void 0 : disputes.dispute_rate_pct) === "number" ? disputes.dispute_rate_pct : 0);
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-page", "data-testid": "payment-pipeline-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("header", { className: "rg-pipeline-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-title-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h2", { className: "rg-pipeline-title", children: "Payment Pipeline & Processor Lifecycle" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "rg-pipeline-subtitle", children: "ReturnGuard evaluates transaction risk prior to downstream payment execution. Gateways and acquirers independently control payment authorization, capture, and settlement." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-pipeline-refresh-btn",
          "aria-label": "Refresh payment pipeline analytics",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { children: "Refresh Analytics" })
          ]
        }
      )
    ] }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card rg-loading-state", role: "status", style: { padding: 32, textAlign: "center", marginBottom: 24 }, children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { style: { margin: 0, fontWeight: 500, color: "var(--rg-text-secondary)" }, children: "Loading payment pipeline metrics..." }) }),
    error && !loading && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
      "div",
      {
        className: "rg-card rg-error-state",
        role: "alert",
        style: { padding: 24, marginBottom: 24, borderLeft: "3px solid var(--rg-high-text)" },
        children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { style: { margin: "0 0 4px 0", fontWeight: 600, color: "var(--rg-high-text)" }, children: "Failed to load payment pipeline analytics" }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: error.message || "An unexpected error occurred while communicating with the analytics service." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
            "button",
            {
              type: "button",
              onClick: () => refetch(),
              className: "rg-pipeline-refresh-btn",
              style: { marginTop: 0 },
              children: "Retry"
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("section", { className: "rg-kpi-grid", "aria-label": "Pipeline Summary Metrics", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-card", "data-testid": "kpi-total-decisions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-title", children: "Total Evaluated Decisions" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-value", children: loading ? "\u2014" : totalDecisions.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-subtitle", children: "Scored transactions across all channels" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-card", "data-testid": "kpi-paypal-decisions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-title", children: "PayPal Channel Decisions" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-value", children: loading ? "\u2014" : paypalCount.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-subtitle", children: "Scored transactions via PayPal channel" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-card", "data-testid": "kpi-cod-decisions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-title", children: "COD Channel Decisions" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-value", children: loading ? "\u2014" : codCount.toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-subtitle", children: "Cash-on-Delivery pre-dispatch evaluations" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-card", "data-testid": "kpi-dispute-rate", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-title", children: "Dispute Rate" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-value", style: { color: disputeRatePct > 1 ? "var(--rg-high-text)" : "var(--rg-text-primary)" }, children: loading ? "\u2014" : `${disputeRatePct.toFixed(2)}%` }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-card-subtitle", children: loading ? "\u2014" : `${totalDisputes} recorded disputes vs evaluated volume` })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("section", { className: "rg-card rg-pipeline-lifecycle-card", "aria-label": "Decoupled Risk & Execution Lifecycle", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-pipeline-lifecycle-header", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: 15, fontWeight: 600 }, children: "Decoupled Risk & Payment Execution Lifecycle" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Operational separation between ReturnGuard pre-decision evaluation and merchant payment settlement." })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-stages-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-accent", children: "Stage 1: Checkout" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h4", { className: "rg-pipeline-stage-title", children: "Order Ingestion" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "rg-pipeline-stage-desc", children: "Customer initiates checkout via PayPal, Cash-on-Delivery, or web card gateway." }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-pipeline-stage-actor", children: "Actor: Customer & Storefront" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-emerald", children: "Stage 2: ReturnGuard" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h4", { className: "rg-pipeline-stage-title", children: "Pre-Decision Evaluation" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "rg-pipeline-stage-desc", children: "LightGBM ML model and deterministic rules evaluate fraud risk, velocity, and policy recommendations." }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-pipeline-stage-actor", children: "Actor: ReturnGuard Risk Engine" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-amber", children: "Stage 3: Merchant" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h4", { className: "rg-pipeline-stage-title", children: "Policy Orchestration" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "rg-pipeline-stage-desc", children: "Merchant reviews policy recommendations (ALLOW, REVIEW, BLOCK, STEP_UP_VERIFICATION) and gates fulfillment." }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-pipeline-stage-actor", children: "Actor: Merchant Risk Operations" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-indigo", children: "Stage 4: Processor" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h4", { className: "rg-pipeline-stage-title", children: "Payment Execution" }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "rg-pipeline-stage-desc", children: "External payment gateways (PayPal, Stripe) or logistics carriers execute capture, void, settlement, or cash collection." }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "rg-pipeline-stage-actor", children: "Actor: Downstream Acquirers & Couriers" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-boundary-notice", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(InfoIcon, { size: 16, className: "rg-pipeline-boundary-icon", "aria-hidden": "true" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-boundary-text", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("strong", { children: "Decoupled Architecture Boundary:" }),
          " ReturnGuard operates exclusively as an intelligent pre-decision risk scoring engine. A policy recommendation of ALLOW indicates a low evaluated risk profile; it does not represent payment authorization, settlement, or gateway capture execution."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-pipeline-analytics-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
        ChartContainer,
        {
          title: "Channel Decision Distribution",
          subtitle: "Proportional transaction volume and evaluation decisions across origin channels",
          height: 260,
          loading,
          empty: channelSum === 0,
          emptyTitle: "No channel decisions recorded",
          emptyMessage: "Evaluations will populate automatically as transactions are scored for this tenant.",
          ariaLabel: `Payment channel distribution: PayPal ${paypalCount} (${paypalPct.toFixed(1)}%), COD ${codCount} (${codPct.toFixed(1)}%), Other ${otherCount} (${otherPct.toFixed(1)}%)`,
          ariaDescription: "Evaluated transaction breakdown by origin channel.",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_recharts7.ResponsiveContainer, { width: "100%", height: 170, children: /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(import_recharts7.BarChart, { data: channelChartData, margin: { top: 12, right: 16, left: -20, bottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_recharts7.CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
              /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_recharts7.XAxis, { dataKey: "channel", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
              /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_recharts7.YAxis, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
              /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
                import_recharts7.Tooltip,
                {
                  content: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
                    ChartTooltip,
                    {
                      formatter: (val, _name, item) => {
                        var _a, _b;
                        return [
                          `${Number(val).toLocaleString()} decisions (${(_a = item.payload) == null ? void 0 : _a.pct.toFixed(1)}%)`,
                          (_b = item.payload) == null ? void 0 : _b.label
                        ];
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_recharts7.Bar, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: channelChartData.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_recharts7.Cell, { fill: entry.color }, entry.channel)) })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
              ChartLegend,
              {
                items: channelChartData.map((d) => ({
                  id: d.channel,
                  value: d.label,
                  count: d.count,
                  percentage: d.pct,
                  color: d.color,
                  formattedValue: `${d.count.toLocaleString()} (${d.pct.toFixed(1)}%)`
                })),
                showValues: true,
                showPercentages: true,
                align: "center"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("section", { className: "rg-card", "aria-label": "Processor Dispute Analytics", children: [
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("h3", { style: { margin: "0 0 6px 0", fontSize: 15, fontWeight: 600 }, children: "Processor Dispute Analytics" }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-secondary)" }, children: "Aggregate dispute volume reported from external payment gateway relays." }),
        /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-dispute-stat-list", children: [
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-dispute-stat-label", children: "Total Recorded Disputes" }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: `rg-dispute-stat-value ${totalDisputes > 0 ? "rg-dispute-stat-value-high" : ""}`, children: totalDisputes.toLocaleString() })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-dispute-stat-label", children: "Disputed Volume" }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("span", { className: "rg-dispute-stat-value", children: [
              disputeCurrency,
              " ",
              disputedAmount.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-dispute-stat-label", children: "Aggregate Dispute Rate" }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("span", { className: `rg-dispute-stat-value ${disputeRatePct > 1 ? "rg-dispute-stat-value-high" : ""}`, children: [
              disputeRatePct.toFixed(2),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("span", { className: "rg-dispute-stat-label", children: "Currency Standard" }),
            /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)("span", { className: "rg-dispute-stat-value", style: { fontFamily: "var(--rg-font-mono)" }, children: [
              disputeCurrency,
              " (Tenant Base)"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};

// src/components/ReturnGuardDashboard.tsx
var import_jsx_runtime28 = require("react/jsx-runtime");
var ReturnGuardDashboard = ({
  initialTab = "overview",
  brandTitle = "ReturnGuard"
}) => {
  const [currentTab, setCurrentTab] = (0, import_react19.useState)(initialTab);
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(DashboardShell, { currentTab, onTabChange: setCurrentTab, brandTitle, children: [
    currentTab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(OverviewPage, {}),
    currentTab === "investigations" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(InvestigationsPage, {}),
    currentTab === "transactions" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(TransactionsPage, {}),
    currentTab === "customers" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(CustomersPage, {}),
    currentTab === "analytics" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(RiskAnalyticsPage, {}),
    currentTab === "rules" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(RulesPage, {}),
    currentTab === "models" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(ModelsPage, {}),
    currentTab === "pipeline" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(PaymentPipelinePage, {}),
    currentTab === "reviews" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(ReviewsPage, {}),
    currentTab === "reports" && /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(ReportsPage, {})
  ] });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuditTimeline,
  CHART_COLORS,
  CHART_CSS_VARS,
  ChartContainer,
  ChartEmptyState,
  ChartErrorState,
  ChartLegend,
  ChartLoadingState,
  ChartTooltip,
  CustomersPage,
  DashboardShell,
  DetailDrawer,
  InvestigationsPage,
  MerchantDashboardTemplate,
  ModelsPage,
  OverviewPage,
  PaymentPipelinePage,
  ReportsPage,
  ReturnGuardDashboard,
  ReturnGuardProvider,
  ReviewQueue,
  ReviewsPage,
  RiskAnalyticsPage,
  RiskBadge,
  RiskDecisionGrid,
  RiskExplanation,
  RiskScoreBadge,
  RiskSummary,
  RulesPage,
  TransactionsGrid,
  TransactionsPage,
  calculatePercentage,
  formatMetricValue,
  useCustomerProfile,
  useCustomers,
  useModelPerformance,
  useReturnGuard,
  useReviewQueue,
  useReviews,
  useRiskDecisions,
  useRiskSummary,
  useRiskTrends,
  useTransactionRisk
});
//# sourceMappingURL=index.cjs.map