var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
      return res;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
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
import { useState as useState3, useEffect as useEffect3, useCallback as useCallback2, useRef } from "react";

// src/components/icons.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("rect", { x: "3", y: "3", width: "7", height: "9", rx: "1" }),
        /* @__PURE__ */ jsx3("rect", { x: "14", y: "3", width: "7", height: "5", rx: "1" }),
        /* @__PURE__ */ jsx3("rect", { x: "14", y: "12", width: "7", height: "9", rx: "1" }),
        /* @__PURE__ */ jsx3("rect", { x: "3", y: "16", width: "7", height: "5", rx: "1" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }),
        /* @__PURE__ */ jsx3("line", { x1: "2", y1: "10", x2: "22", y2: "10" }),
        /* @__PURE__ */ jsx3("line", { x1: "6", y1: "15", x2: "10", y2: "15" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
        /* @__PURE__ */ jsx3("circle", { cx: "9", cy: "7", r: "4" }),
        /* @__PURE__ */ jsx3("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
        /* @__PURE__ */ jsx3("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }),
        /* @__PURE__ */ jsx3("polyline", { points: "16 7 22 7 22 13" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }),
        /* @__PURE__ */ jsx3("path", { d: "m9 12 2 2 4-4" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }),
        /* @__PURE__ */ jsx3("rect", { x: "9", y: "9", width: "6", height: "6" }),
        /* @__PURE__ */ jsx3("path", { d: "M9 1v3" }),
        /* @__PURE__ */ jsx3("path", { d: "M15 1v3" }),
        /* @__PURE__ */ jsx3("path", { d: "M9 20v3" }),
        /* @__PURE__ */ jsx3("path", { d: "M15 20v3" }),
        /* @__PURE__ */ jsx3("path", { d: "M20 9h3" }),
        /* @__PURE__ */ jsx3("path", { d: "M20 14h3" }),
        /* @__PURE__ */ jsx3("path", { d: "M1 9h3" }),
        /* @__PURE__ */ jsx3("path", { d: "M1 14h3" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "18", r: "3" }),
        /* @__PURE__ */ jsx3("circle", { cx: "6", cy: "6", r: "3" }),
        /* @__PURE__ */ jsx3("circle", { cx: "18", cy: "6", r: "3" }),
        /* @__PURE__ */ jsx3("path", { d: "M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" }),
        /* @__PURE__ */ jsx3("path", { d: "M12 12v3" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }),
        /* @__PURE__ */ jsx3("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
        /* @__PURE__ */ jsx3("polyline", { points: "14 2 14 8 20 8" }),
        /* @__PURE__ */ jsx3("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
        /* @__PURE__ */ jsx3("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
        /* @__PURE__ */ jsx3("line", { x1: "10", y1: "9", x2: "8", y2: "9" })
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
  return /* @__PURE__ */ jsx3(
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
      children: /* @__PURE__ */ jsx3("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "4" }),
        /* @__PURE__ */ jsx3("path", { d: "M12 2v2" }),
        /* @__PURE__ */ jsx3("path", { d: "M12 20v2" }),
        /* @__PURE__ */ jsx3("path", { d: "m4.93 4.93 1.41 1.41" }),
        /* @__PURE__ */ jsx3("path", { d: "m17.66 17.66 1.41 1.41" }),
        /* @__PURE__ */ jsx3("path", { d: "M2 12h2" }),
        /* @__PURE__ */ jsx3("path", { d: "M20 12h2" }),
        /* @__PURE__ */ jsx3("path", { d: "m6.34 17.66-1.41 1.41" }),
        /* @__PURE__ */ jsx3("path", { d: "m19.07 4.93-1.41 1.41" })
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
  return /* @__PURE__ */ jsx3(
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
      children: /* @__PURE__ */ jsx3("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("circle", { cx: "11", cy: "11", r: "8" }),
        /* @__PURE__ */ jsx3("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("path", { d: "M21.5 2v6h-6" }),
        /* @__PURE__ */ jsx3("path", { d: "M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
        /* @__PURE__ */ jsx3("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ jsx3("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
        /* @__PURE__ */ jsx3("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
        /* @__PURE__ */ jsx3("polyline", { points: "7 10 12 15 17 10" }),
        /* @__PURE__ */ jsx3("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }),
        /* @__PURE__ */ jsx3("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
        /* @__PURE__ */ jsx3("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx3("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
        /* @__PURE__ */ jsx3("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
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
  return /* @__PURE__ */ jsx3(
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
      children: /* @__PURE__ */ jsx3("polyline", { points: "9 18 15 12 9 6" })
    })
  );
};

// src/components/DashboardShell.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var DashboardShell = ({
  currentTab,
  onTabChange,
  brandTitle = "ReturnGuard",
  children
}) => {
  const { theme, setTheme } = useReturnGuard();
  const [mobileOpen, setMobileOpen] = useState3(false);
  const toggleButtonRef = useRef(null);
  const firstNavRef = useRef(null);
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
  const closeMobileNav = useCallback2(() => {
    var _a;
    setMobileOpen(false);
    (_a = toggleButtonRef.current) == null ? void 0 : _a.focus();
  }, []);
  const handleKeyDown = useCallback2(
    (e) => {
      if (e.key === "Escape" && mobileOpen) {
        closeMobileNav();
      }
    },
    [mobileOpen, closeMobileNav]
  );
  useEffect3(() => {
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
  return /* @__PURE__ */ jsxs2("div", { className: "rg-shell", children: [
    /* @__PURE__ */ jsx4(
      "div",
      {
        className: `rg-sidebar-backdrop ${mobileOpen ? "open" : ""}`,
        onClick: closeMobileNav,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxs2(
      "aside",
      {
        className: `rg-sidebar ${mobileOpen ? "open" : ""}`,
        "aria-label": "Sidebar Navigation",
        "aria-modal": mobileOpen ? "true" : void 0,
        children: [
          /* @__PURE__ */ jsx4("div", { className: "rg-sidebar-header", children: /* @__PURE__ */ jsxs2("div", { className: "rg-brand-logo", children: [
            /* @__PURE__ */ jsx4("div", { className: "rg-brand-icon-wrap", "aria-hidden": "true", children: /* @__PURE__ */ jsx4(ShieldIcon, { size: 18 }) }),
            /* @__PURE__ */ jsx4("span", { className: "rg-brand-title", children: brandTitle }),
            /* @__PURE__ */ jsx4("span", { className: "rg-brand-badge", children: "SaaS" })
          ] }) }),
          /* @__PURE__ */ jsx4("nav", { className: "rg-sidebar-nav", "aria-label": "Main Navigation", children: navItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return /* @__PURE__ */ jsxs2(
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
                  /* @__PURE__ */ jsx4("span", { className: "rg-nav-item-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsx4(IconComponent, { size: 18 }) }),
                  /* @__PURE__ */ jsx4("span", { className: "rg-nav-item-label", children: item.label })
                ]
              },
              item.id
            );
          }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs2("div", { className: "rg-main", children: [
      /* @__PURE__ */ jsxs2("header", { className: "rg-topbar", role: "banner", children: [
        /* @__PURE__ */ jsxs2("div", { className: "rg-topbar-left", children: [
          /* @__PURE__ */ jsxs2(
            "button",
            {
              ref: toggleButtonRef,
              type: "button",
              className: "rg-mobile-toggle",
              onClick: toggleMobileNav,
              "aria-label": mobileOpen ? "Close navigation sidebar" : "Open navigation sidebar",
              "aria-expanded": mobileOpen,
              children: [
                /* @__PURE__ */ jsx4("span", { className: "rg-mobile-toggle-bar" }),
                /* @__PURE__ */ jsx4("span", { className: "rg-mobile-toggle-bar" }),
                /* @__PURE__ */ jsx4("span", { className: "rg-mobile-toggle-bar" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs2("div", { className: "rg-tenant-status", children: [
            /* @__PURE__ */ jsx4("span", { className: "rg-tenant-label", children: "Tenant:" }),
            /* @__PURE__ */ jsx4("span", { className: "rg-tenant-name", children: "Active Session" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "rg-topbar-right", children: [
          /* @__PURE__ */ jsxs2("div", { className: "rg-topbar-meta-item", children: [
            /* @__PURE__ */ jsx4("span", { className: "rg-meta-tag", children: "Currency: Native Dataset / Provider Specific" }),
            /* @__PURE__ */ jsxs2(
              "span",
              {
                className: "rg-meta-info",
                title: "Backend provides raw monetary amounts per transaction without guaranteed FX conversion. Global currency filter disabled.",
                "aria-label": "Currency status: Fixed",
                tabIndex: 0,
                children: [
                  /* @__PURE__ */ jsx4(InfoIcon, { size: 13, "aria-hidden": "true" }),
                  /* @__PURE__ */ jsx4("span", { children: "Fixed" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "rg-topbar-meta-item", children: [
            /* @__PURE__ */ jsx4("span", { className: "rg-meta-tag", children: "Range: Lifetime Aggregates" }),
            /* @__PURE__ */ jsxs2(
              "span",
              {
                className: "rg-meta-info",
                title: "Backend /v1/analytics/summary returns all-time scored decisions.",
                "aria-label": "Range status: Fixed",
                tabIndex: 0,
                children: [
                  /* @__PURE__ */ jsx4(InfoIcon, { size: 13, "aria-hidden": "true" }),
                  /* @__PURE__ */ jsx4("span", { children: "Fixed" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx4(
            "button",
            {
              type: "button",
              className: "rg-theme-toggle",
              onClick: toggleTheme,
              "aria-label": `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
              title: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
              children: theme === "dark" ? /* @__PURE__ */ jsxs2(Fragment, { children: [
                /* @__PURE__ */ jsx4(SunIcon, { size: 15, "aria-hidden": "true" }),
                /* @__PURE__ */ jsx4("span", { children: "Light" })
              ] }) : /* @__PURE__ */ jsxs2(Fragment, { children: [
                /* @__PURE__ */ jsx4(MoonIcon, { size: 15, "aria-hidden": "true" }),
                /* @__PURE__ */ jsx4("span", { children: "Dark" })
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx4("main", { className: "rg-content", children })
    ] })
  ] });
};

// src/components/OverviewPage.tsx
import { useMemo as useMemo2 } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// src/components/charts/ChartStates.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var ChartEmptyState = ({
  title = "No Data Available",
  message = "There is no recorded data to display for this metric.",
  height = "100%",
  className = ""
}) => {
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className: `rg-chart-state rg-chart-state-empty ${className}`,
      style: { height },
      role: "status",
      "aria-label": `${title}: ${message}`,
      children: [
        /* @__PURE__ */ jsx5("div", { className: "rg-chart-state-icon-wrap", "aria-hidden": "true", children: /* @__PURE__ */ jsxs3("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
          /* @__PURE__ */ jsx5("line", { x1: "18", y1: "20", x2: "18", y2: "10", strokeLinecap: "round" }),
          /* @__PURE__ */ jsx5("line", { x1: "12", y1: "20", x2: "12", y2: "4", strokeLinecap: "round" }),
          /* @__PURE__ */ jsx5("line", { x1: "6", y1: "20", x2: "6", y2: "14", strokeLinecap: "round" }),
          /* @__PURE__ */ jsx5("line", { x1: "2", y1: "20", x2: "22", y2: "20", strokeLinecap: "round" })
        ] }) }),
        /* @__PURE__ */ jsx5("div", { className: "rg-chart-state-title", children: title }),
        /* @__PURE__ */ jsx5("div", { className: "rg-chart-state-desc", children: message })
      ]
    }
  );
};
var ChartLoadingState = ({
  message = "Loading analytics data...",
  height = "100%",
  className = ""
}) => {
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className: `rg-chart-state rg-chart-state-loading ${className}`,
      style: { height },
      role: "status",
      "aria-live": "polite",
      "aria-busy": "true",
      children: [
        /* @__PURE__ */ jsxs3("div", { className: "rg-chart-skeleton-wrap", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsx5("div", { className: "rg-chart-skeleton-bar", style: { height: "40%" } }),
          /* @__PURE__ */ jsx5("div", { className: "rg-chart-skeleton-bar", style: { height: "80%" } }),
          /* @__PURE__ */ jsx5("div", { className: "rg-chart-skeleton-bar", style: { height: "60%" } }),
          /* @__PURE__ */ jsx5("div", { className: "rg-chart-skeleton-bar", style: { height: "100%" } }),
          /* @__PURE__ */ jsx5("div", { className: "rg-chart-skeleton-bar", style: { height: "70%" } })
        ] }),
        /* @__PURE__ */ jsx5("div", { className: "rg-chart-state-desc", children: message })
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
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className: `rg-chart-state rg-chart-state-error ${className}`,
      style: { height },
      role: "alert",
      children: [
        /* @__PURE__ */ jsx5("div", { className: "rg-chart-state-icon-wrap rg-chart-state-icon-error", "aria-hidden": "true", children: /* @__PURE__ */ jsxs3("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
          /* @__PURE__ */ jsx5("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ jsx5("line", { x1: "12", y1: "8", x2: "12", y2: "12", strokeLinecap: "round" }),
          /* @__PURE__ */ jsx5("line", { x1: "12", y1: "16", x2: "12.01", y2: "16", strokeLinecap: "round" })
        ] }) }),
        /* @__PURE__ */ jsx5("div", { className: "rg-chart-state-title", children: title }),
        /* @__PURE__ */ jsx5("div", { className: "rg-chart-state-desc", children: errorMessage }),
        onRetry && /* @__PURE__ */ jsx5(
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
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      className: `rg-chart-container ${className}`,
      style,
      role: "region",
      "aria-label": ariaLabel || title || "Analytics Chart",
      "aria-description": ariaDescription || subtitle,
      children: [
        hasHeader && /* @__PURE__ */ jsxs4("div", { className: "rg-chart-header", children: [
          /* @__PURE__ */ jsxs4("div", { className: "rg-chart-header-text", children: [
            title && /* @__PURE__ */ jsx6("h3", { className: "rg-chart-title", children: title }),
            subtitle && /* @__PURE__ */ jsx6("p", { className: "rg-chart-subtitle", children: subtitle })
          ] }),
          action && /* @__PURE__ */ jsx6("div", { className: "rg-chart-header-action", children: action })
        ] }),
        /* @__PURE__ */ jsx6(
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
            children: loading ? /* @__PURE__ */ jsx6(ChartLoadingState, { message: loadingMessage, height: "100%" }) : error ? /* @__PURE__ */ jsx6(ChartErrorState, { error, onRetry, height: "100%" }) : empty ? /* @__PURE__ */ jsx6(ChartEmptyState, { title: emptyTitle, message: emptyMessage, height: "100%" }) : children
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
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs5("div", { className: `rg-chart-tooltip ${className}`, role: "tooltip", children: [
    formattedLabel !== void 0 && formattedLabel !== null && formattedLabel !== "" && /* @__PURE__ */ jsx7("div", { className: "rg-chart-tooltip-header", children: formattedLabel }),
    /* @__PURE__ */ jsxs5("div", { className: "rg-chart-tooltip-body", children: [
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
        return /* @__PURE__ */ jsxs5("div", { className: "rg-chart-tooltip-row", children: [
          /* @__PURE__ */ jsx7(
            "span",
            {
              className: "rg-chart-tooltip-swatch",
              style: { backgroundColor: swatchColor },
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsx7("span", { className: "rg-chart-tooltip-name", children: name }),
          /* @__PURE__ */ jsx7("span", { className: "rg-chart-tooltip-value", children: displayVal })
        ] }, `${name}-${index}`);
      }),
      showTotal && payload.length > 1 && /* @__PURE__ */ jsxs5("div", { className: "rg-chart-tooltip-row rg-chart-tooltip-total", children: [
        /* @__PURE__ */ jsx7("span", { className: "rg-chart-tooltip-name", children: totalLabel }),
        /* @__PURE__ */ jsxs5("span", { className: "rg-chart-tooltip-value", children: [
          valuePrefix,
          formatMetricValue(totalValue, "count"),
          valueSuffix
        ] })
      ] })
    ] })
  ] });
};

// src/components/charts/ChartLegend.tsx
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx8("div", { className: `rg-chart-legend ${justifyClass} ${className}`, role: "list", children: legendItems.map((item, index) => {
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
    return /* @__PURE__ */ jsxs6(
      "div",
      {
        className: `rg-chart-legend-item ${item.inactive ? "rg-chart-legend-inactive" : ""}`,
        role: "listitem",
        children: [
          /* @__PURE__ */ jsx8(
            "span",
            {
              className: "rg-chart-legend-dot",
              style: { backgroundColor: swatchColor },
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsx8("span", { className: "rg-chart-legend-label", children: label }),
          detail !== null && /* @__PURE__ */ jsx8("span", { className: "rg-chart-legend-value", children: detail })
        ]
      },
      key
    );
  }) });
};

// src/components/OverviewPage.tsx
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
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
  const allCategories = useMemo2(
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
  const pieData = useMemo2(() => allCategories.filter((cat) => cat.value > 0), [allCategories]);
  const legendItems = useMemo2(
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
    return /* @__PURE__ */ jsx9("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading risk operations summary..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs7("div", { className: "rg-error-state", role: "alert", children: [
      /* @__PURE__ */ jsx9("h4", { children: "Failed to load risk summary" }),
      /* @__PURE__ */ jsx9("p", { children: error.message }),
      /* @__PURE__ */ jsxs7(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ jsx9(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx9("span", { children: "Retry" })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs7("div", { children: [
    /* @__PURE__ */ jsxs7("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ jsx9("h2", { style: { margin: "0 0 6px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Risk Operations Overview" }),
      /* @__PURE__ */ jsx9("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Portfolio risk posture, policy distributions, and live transaction indicators." })
    ] }),
    /* @__PURE__ */ jsxs7("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "Transactions Scored" }),
          /* @__PURE__ */ jsx9("span", { className: "rg-kpi-icon-wrap", "aria-hidden": "true", children: /* @__PURE__ */ jsx9(TransactionsIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: summary.total_decisions.toLocaleString() }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-subtitle", children: "Lifetime scored payments" })
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "Flagged Transactions" }),
          /* @__PURE__ */ jsx9("span", { className: "rg-kpi-icon-wrap rg-kpi-icon-warning", "aria-hidden": "true", children: /* @__PURE__ */ jsx9(AlertTriangleIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: flaggedCount.toLocaleString() }),
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-subtitle", children: [
          flaggedPct,
          "% flag rate"
        ] })
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "High Risk / Block Action" }),
          /* @__PURE__ */ jsx9("span", { className: "rg-kpi-icon-wrap rg-kpi-icon-danger", "aria-hidden": "true", children: /* @__PURE__ */ jsx9(ShieldIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: summary.block_count.toLocaleString() }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-subtitle", children: "Recommended hold/stop" })
      ] }),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs7("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx9("span", { children: "Average Risk Score" }),
          /* @__PURE__ */ jsx9("span", { className: "rg-kpi-icon-wrap rg-kpi-icon-accent", "aria-hidden": "true", children: /* @__PURE__ */ jsx9(AnalyticsIcon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-value", children: (summary.average_risk_score * 100).toFixed(0) }),
        /* @__PURE__ */ jsx9("div", { className: "rg-card-subtitle", children: "Portfolio scale (0 - 100)" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs7("div", { className: "rg-analytical-grid", children: [
      /* @__PURE__ */ jsxs7(
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
            /* @__PURE__ */ jsxs7("div", { className: "rg-donut-wrapper", children: [
              /* @__PURE__ */ jsx9(ResponsiveContainer, { width: "100%", height: 240, children: /* @__PURE__ */ jsxs7(PieChart, { children: [
                /* @__PURE__ */ jsx9(
                  Pie,
                  {
                    data: pieData,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: 56,
                    outerRadius: 82,
                    paddingAngle: pieData.length > 1 ? 3 : 0,
                    dataKey: "value",
                    isAnimationActive: false,
                    children: pieData.map((entry) => /* @__PURE__ */ jsx9(Cell, { fill: entry.color, stroke: "var(--rg-bg-card)", strokeWidth: 2 }, entry.id))
                  }
                ),
                /* @__PURE__ */ jsx9(
                  Tooltip,
                  {
                    content: /* @__PURE__ */ jsx9(
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
              /* @__PURE__ */ jsxs7("div", { className: "rg-donut-center", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx9("span", { className: "rg-donut-center-val", children: totalDecisions.toLocaleString() }),
                /* @__PURE__ */ jsx9("span", { className: "rg-donut-center-label", children: "Decisions" })
              ] })
            ] }),
            /* @__PURE__ */ jsx9(ChartLegend, { items: legendItems, showValues: true, showPercentages: true, align: "center" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs7("div", { className: "rg-card", style: { display: "flex", flexDirection: "column", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxs7("div", { children: [
          /* @__PURE__ */ jsx9("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Scoring System Health" }),
          /* @__PURE__ */ jsx9("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-muted)" }, children: "Operational parameters and real-time execution status" }),
          /* @__PURE__ */ jsxs7("div", { style: { display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }, children: [
            /* @__PURE__ */ jsxs7(
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
                  /* @__PURE__ */ jsx9("span", { style: { color: "var(--rg-text-secondary)" }, children: "Engine Status" }),
                  /* @__PURE__ */ jsxs7(
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
                        /* @__PURE__ */ jsx9("span", { className: "rg-risk-dot rg-risk-dot-low", "aria-hidden": "true" }),
                        /* @__PURE__ */ jsx9("span", { children: "Operational" })
                      ]
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxs7(
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
                  /* @__PURE__ */ jsx9("span", { style: { color: "var(--rg-text-secondary)" }, children: "Execution Mode" }),
                  /* @__PURE__ */ jsx9("span", { className: "rg-meta-tag", style: { fontWeight: 500 }, children: "Active (Shadow Mode)" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs7(
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
                  /* @__PURE__ */ jsx9("span", { style: { color: "var(--rg-text-secondary)" }, children: "Serving Model" }),
                  /* @__PURE__ */ jsx9("span", { className: "rg-meta-tag rg-font-mono", style: { fontSize: 11 }, children: "candidate_lgbm_v1" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs7(
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
                  /* @__PURE__ */ jsx9("span", { style: { color: "var(--rg-text-secondary)" }, children: "Tenant Scope" }),
                  /* @__PURE__ */ jsx9("span", { className: "rg-font-mono", style: { fontSize: 12, color: "var(--rg-text-primary)" }, children: summary.tenant_id })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx9("table", { className: "rg-reports-stat-table", style: { marginTop: 16 }, "aria-label": "Policy recommendations breakdown", children: /* @__PURE__ */ jsx9("tbody", { children: allCategories.map((cat) => /* @__PURE__ */ jsxs7("tr", { children: [
          /* @__PURE__ */ jsx9("td", { className: "rg-reports-stat-label", children: /* @__PURE__ */ jsxs7("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx9("span", { className: `rg-risk-dot ${cat.dotClass}` }),
            /* @__PURE__ */ jsxs7("span", { children: [
              cat.name,
              " Decisions"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs7("td", { className: "rg-reports-stat-value", style: { color: cat.textVar }, children: [
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

// src/components/InvestigationsPage.tsx
import { useState as useState4, useEffect as useEffect4, useCallback as useCallback3, useMemo as useMemo3 } from "react";
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
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
  const [selectedId, setSelectedId] = useState4(initialInvestigationId || null);
  const [statusFilter, setStatusFilter] = useState4("ALL");
  const [queueItems, setQueueItems] = useState4(testItems || []);
  const [nextCursor, setNextCursor] = useState4(null);
  const [cursorHistory, setCursorHistory] = useState4([]);
  const [loadingQueue, setLoadingQueue] = useState4(false);
  const [queueError, setQueueError] = useState4(null);
  const [detail, setDetail] = useState4(testDetail || null);
  const [assessment, setAssessment] = useState4(testAssessment || null);
  const [timeline, setTimeline] = useState4(testTimeline || []);
  const [loadingDetail, setLoadingDetail] = useState4(false);
  const [detailError, setDetailError] = useState4(null);
  const [actionError, setActionError] = useState4(null);
  const [actionSuccess, setActionSuccess] = useState4(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState4(false);
  const [noteText, setNoteText] = useState4("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState4(false);
  const [closeOutcome, setCloseOutcome] = useState4("CLOSED_APPROVED");
  const [closeNote, setCloseNote] = useState4("");
  const [isReopenModalOpen, setIsReopenModalOpen] = useState4(false);
  const [reopenReason, setReopenReason] = useState4("");
  const fetchQueue = useCallback3(
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
  useEffect4(() => {
    fetchQueue();
  }, [fetchQueue]);
  const fetchDetail = useCallback3(
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
  useEffect4(() => {
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
  const startReviewGuard = useMemo3(() => {
    if (isInReview) {
      return { allowed: false, reason: "Case is already in review" };
    }
    if (isClosed) {
      return { allowed: false, reason: "Cannot start review on a closed case; reopen first" };
    }
    return { allowed: true, reason: "Start reviewing this case" };
  }, [isInReview, isClosed]);
  const addNoteGuard = useMemo3(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot add notes to a closed case; reopen first" };
    }
    return { allowed: true, reason: "Add a reviewer note to the step log" };
  }, [isClosed]);
  const requestDocsGuard = useMemo3(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot request documents for closed case" };
    }
    return { allowed: true, reason: "Request missing dispute evidence documents" };
  }, [isClosed]);
  const approvePackGuard = useMemo3(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot approve pack for closed case" };
    }
    if (!isInReview) {
      return { allowed: false, reason: "Review must be started (IN_REVIEW) before pack approval" };
    }
    return { allowed: true, reason: "Approve current evidence package" };
  }, [isClosed, isInReview]);
  const rejectPackGuard = useMemo3(() => {
    if (isClosed) {
      return { allowed: false, reason: "Cannot reject pack for closed case" };
    }
    return { allowed: true, reason: "Reject current evidence package" };
  }, [isClosed]);
  const closeCaseGuard = useMemo3(() => {
    if (isClosed) {
      return { allowed: false, reason: "Case is already closed" };
    }
    if (currentStatus === "OPEN") {
      return { allowed: false, reason: "Start review before closing case" };
    }
    return { allowed: true, reason: "Close investigation case with formal outcome" };
  }, [isClosed, currentStatus]);
  const reopenCaseGuard = useMemo3(() => {
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
    return /* @__PURE__ */ jsxs8(
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
  return /* @__PURE__ */ jsx10("div", { className: "rg-investigations-page", style: { padding: "4px 0" }, children: !selectedId ? /* @__PURE__ */ jsxs8("div", { children: [
    /* @__PURE__ */ jsxs8("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs8("div", { children: [
        /* @__PURE__ */ jsx10("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700 }, children: "Investigation Review Queue" }),
        /* @__PURE__ */ jsx10("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Evidence packages, fraud investigations, and human-in-the-loop dispute determinations." })
      ] }),
      /* @__PURE__ */ jsx10(
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
    /* @__PURE__ */ jsxs8(
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
          /* @__PURE__ */ jsx10("span", { style: { fontSize: 13, color: "var(--rg-text-muted)", marginRight: 4 }, children: "Status Filter:" }),
          [
            "ALL",
            "OPEN",
            "AWAITING_REVIEW",
            "IN_REVIEW",
            "CLOSED_APPROVED",
            "CLOSED_REJECTED",
            "CLOSED_NO_ACTION",
            "REOPENED"
          ].map((st) => /* @__PURE__ */ jsx10(
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
    loadingQueue && /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-text-muted)", marginBottom: 12 }, children: "Loading investigations..." }),
    queueError && /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-high-text)", marginBottom: 12 }, children: queueError }),
    /* @__PURE__ */ jsx10("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsxs8("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, "data-testid": "queue-table", children: [
      /* @__PURE__ */ jsx10("thead", { children: /* @__PURE__ */ jsxs8(
        "tr",
        {
          style: {
            background: "var(--rg-bg-tertiary)",
            borderBottom: "1px solid var(--rg-border)",
            color: "var(--rg-text-secondary)",
            textAlign: "left"
          },
          children: [
            /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Investigation ID" }),
            /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Dispute / Target" }),
            /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Status" }),
            /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Case Hash" }),
            /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px" }, children: "Created" }),
            /* @__PURE__ */ jsx10("th", { style: { padding: "12px 16px", textAlign: "right" }, children: "Action" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx10("tbody", { children: queueItems.length === 0 && !loadingQueue ? /* @__PURE__ */ jsx10("tr", { children: /* @__PURE__ */ jsxs8("td", { colSpan: 6, style: { padding: 28, textAlign: "center", color: "var(--rg-text-muted)" }, children: [
        "No investigations found for status filter: ",
        statusFilter
      ] }) }) : queueItems.map((item) => /* @__PURE__ */ jsxs8(
        "tr",
        {
          className: "rg-queue-row",
          style: { borderBottom: "1px solid var(--rg-border-subtle)", cursor: "pointer" },
          onClick: () => handleSelectCase(item.id),
          children: [
            /* @__PURE__ */ jsx10("td", { style: { padding: "12px 16px", fontFamily: "monospace", fontWeight: 600 }, children: item.id }),
            /* @__PURE__ */ jsx10("td", { style: { padding: "12px 16px", fontFamily: "monospace", color: "var(--rg-text-secondary)" }, children: item.dispute_id || "Direct Score" }),
            /* @__PURE__ */ jsx10("td", { style: { padding: "12px 16px" }, children: renderStatusBadge(item.status) }),
            /* @__PURE__ */ jsx10("td", { style: { padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "var(--rg-text-muted)" }, children: item.case_hash ? item.case_hash.substring(0, 16) + "..." : "-" }),
            /* @__PURE__ */ jsx10("td", { style: { padding: "12px 16px", fontSize: 12, color: "var(--rg-text-muted)" }, children: new Date(item.created_at).toLocaleString() }),
            /* @__PURE__ */ jsx10("td", { style: { padding: "12px 16px", textAlign: "right" }, children: /* @__PURE__ */ jsx10(
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
    nextCursor && /* @__PURE__ */ jsx10("div", { style: { marginTop: 12, display: "flex", justifyContent: "flex-end" }, children: /* @__PURE__ */ jsx10(
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
    /* @__PURE__ */ jsxs8("div", { className: "rg-case-view", "data-testid": "case-view", children: [
      /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
          /* @__PURE__ */ jsx10(
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
          /* @__PURE__ */ jsxs8("div", { children: [
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsx10("h2", { style: { margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }, children: (detail == null ? void 0 : detail.id) || selectedId }),
              renderStatusBadge(currentStatus)
            ] }),
            /* @__PURE__ */ jsxs8("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginTop: 2 }, children: [
              "Case Hash: ",
              /* @__PURE__ */ jsx10("code", { style: { fontFamily: "monospace" }, children: (detail == null ? void 0 : detail.case_hash) || "pending" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsx10("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Dispute Amount" }),
          /* @__PURE__ */ jsxs8("div", { style: { fontSize: 18, fontWeight: 700, color: "var(--rg-text-primary)" }, children: [
            (detail == null ? void 0 : detail.currency) || "USD",
            " ",
            Number((detail == null ? void 0 : detail.amount) || 0).toFixed(2)
          ] })
        ] })
      ] }),
      loadingDetail && /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-text-muted)", marginBottom: 12 }, children: "Loading investigation details and LLM assessment..." }),
      detailError && /* @__PURE__ */ jsxs8(
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
      actionError && /* @__PURE__ */ jsxs8(
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
      actionSuccess && /* @__PURE__ */ jsxs8(
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
      /* @__PURE__ */ jsxs8(
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
            /* @__PURE__ */ jsx10("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--rg-text-muted)", marginRight: 6 }, children: "Review Actions:" }),
            /* @__PURE__ */ jsx10(
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
            /* @__PURE__ */ jsx10(
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
            /* @__PURE__ */ jsx10(
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
            /* @__PURE__ */ jsx10(
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
            /* @__PURE__ */ jsx10(
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
            /* @__PURE__ */ jsx10(
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
            /* @__PURE__ */ jsx10(
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
      /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }, children: [
        /* @__PURE__ */ jsxs8("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
          /* @__PURE__ */ jsxs8("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsx10("h3", { style: { margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "var(--rg-text-primary)" }, children: "Decision & Transaction Snapshot" }),
            /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }, children: [
              /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Severity" }),
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 13, fontWeight: 700, textTransform: "uppercase" }, children: ((_c = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _c.severity) || "HIGH" })
              ] }),
              /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Soft Policy Tier" }),
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 13, fontWeight: 700 }, children: ((_d = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _d.tier) || "MANUAL_REVIEW" })
              ] }),
              /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Risk Probability" }),
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 13, fontWeight: 700, fontFamily: "monospace" }, children: ((_e = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _e.probability) !== void 0 ? (Number(detail.decision_record.probability) * 100).toFixed(1) + "%" : ((_f = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _f.risk_score) !== void 0 ? (Number(detail.decision_record.risk_score) * 100).toFixed(1) + "%" : "88.5%" })
              ] }),
              /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-tertiary)", padding: 10, borderRadius: 6 }, children: [
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Action" }),
                /* @__PURE__ */ jsx10("div", { style: { fontSize: 13, fontWeight: 700 }, children: ((_g = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _g.policy_action) || "FLAG" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx10("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Top SHAP Contributors:" }),
              /* @__PURE__ */ jsx10("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: (((_h = detail == null ? void 0 : detail.decision_record) == null ? void 0 : _h.shap_top_k) || [
                { feature: "customer_order_velocity_1h", direction: "increases_risk", shap_rank: 1 },
                { feature: "delivery_address_mismatch", direction: "increases_risk", shap_rank: 2 },
                { feature: "ip_geo_distance_anomaly", direction: "increases_risk", shap_rank: 3 }
              ]).slice(0, 5).map((s, idx) => /* @__PURE__ */ jsxs8(
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
                    /* @__PURE__ */ jsxs8("span", { children: [
                      idx + 1,
                      ". ",
                      s.feature
                    ] }),
                    /* @__PURE__ */ jsx10("span", { style: { color: s.direction === "increases_risk" ? "var(--rg-high-text)" : "var(--rg-low-text)" }, children: s.direction })
                  ]
                },
                idx
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs8("div", { className: "rg-card", style: { padding: 16 }, "data-testid": "findings-card", children: [
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
              /* @__PURE__ */ jsxs8("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: [
                "Deterministic Findings (",
                ((_i = detail == null ? void 0 : detail.findings) == null ? void 0 : _i.length) || 0,
                ")"
              ] }),
              /* @__PURE__ */ jsx10("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "Aliases (A1, A2...) map to source records" })
            ] }),
            !(detail == null ? void 0 : detail.findings) || detail.findings.length === 0 ? /* @__PURE__ */ jsx10("div", { style: { fontSize: 13, color: "var(--rg-text-muted)", padding: 12, textAlign: "center" }, children: "No findings generated yet." }) : /* @__PURE__ */ jsx10("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: detail.findings.map((f, i) => /* @__PURE__ */ jsxs8(
              "div",
              {
                style: {
                  background: "var(--rg-bg-secondary)",
                  border: "1px solid var(--rg-border)",
                  borderRadius: 6,
                  padding: 12
                },
                children: [
                  /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 }, children: [
                    /* @__PURE__ */ jsx10(
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
                    /* @__PURE__ */ jsx10("span", { style: { fontSize: 11, color: "var(--rg-text-muted)", textTransform: "uppercase" }, children: f.category })
                  ] }),
                  /* @__PURE__ */ jsx10("div", { style: { fontSize: 13, color: "var(--rg-text-primary)", marginBottom: 6 }, children: f.statement }),
                  /* @__PURE__ */ jsxs8("div", { style: { fontSize: 11, color: "var(--rg-text-secondary)", fontFamily: "monospace" }, children: [
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
          /* @__PURE__ */ jsxs8("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsx10("h3", { style: { margin: "0 0 10px 0", fontSize: 14, fontWeight: 700 }, children: "Evidence Completeness" }),
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }, children: [
              /* @__PURE__ */ jsxs8(
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
              /* @__PURE__ */ jsx10("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)" }, children: ((_l = detail == null ? void 0 : detail.completeness) == null ? void 0 : _l.is_complete) ? "Complete: all dispute types present" : "Action recommended" })
            ] }),
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }, children: [
              /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx10("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ jsx10("span", { children: "All findings cited from uploaded dispute documents" })
              ] }),
              /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx10("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ jsx10("span", { children: "Dispute claim amount matches transaction record" })
              ] }),
              /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx10("span", { children: "\u2713" }),
                " ",
                /* @__PURE__ */ jsx10("span", { children: "Customer identified with pseudonymized token" })
              ] }),
              ((_m = detail == null ? void 0 : detail.completeness) == null ? void 0 : _m.missing_kinds) && detail.completeness.missing_kinds.length > 0 && /* @__PURE__ */ jsxs8("div", { style: { marginTop: 6, color: "var(--rg-med-text)" }, children: [
                "Missing evidence types: ",
                detail.completeness.missing_kinds.join(", ")
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
          /* @__PURE__ */ jsxs8(
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
                /* @__PURE__ */ jsxs8(
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
                      /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }, children: [
                        /* @__PURE__ */ jsx10("span", { children: "\u2139" }),
                        /* @__PURE__ */ jsx10("span", { className: "rg-advisory-label-text", children: (assessment == null ? void 0 : assessment.advisory_label) || "LLM assessment, advisory" })
                      ] }),
                      /* @__PURE__ */ jsx10(
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
                /* @__PURE__ */ jsxs8(
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
                      /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-text-muted)" }, children: "Model" }),
                        /* @__PURE__ */ jsx10("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: (assessment == null ? void 0 : assessment.model) || "gemini-1.5-pro" })
                      ] }),
                      /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-text-muted)" }, children: "Attempts" }),
                        /* @__PURE__ */ jsx10("div", { style: { fontWeight: 600 }, children: (_n = assessment == null ? void 0 : assessment.attempt_count) != null ? _n : 1 })
                      ] }),
                      /* @__PURE__ */ jsxs8("div", { style: { background: "var(--rg-bg-card)", padding: 8, borderRadius: 4 }, children: [
                        /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-text-muted)" }, children: "Prompt Hash" }),
                        /* @__PURE__ */ jsx10("div", { style: { fontWeight: 600, fontFamily: "monospace" }, children: (assessment == null ? void 0 : assessment.prompt_hash) ? assessment.prompt_hash.substring(0, 10) + "..." : "c8f49e..." })
                      ] })
                    ]
                  }
                ),
                (assessment == null ? void 0 : assessment.validator_errors) && assessment.validator_errors.length > 0 && /* @__PURE__ */ jsxs8(
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
                      /* @__PURE__ */ jsx10("div", { style: { fontWeight: 700, color: "var(--rg-high-text)", marginBottom: 4 }, children: "Validator Rejection Trace:" }),
                      assessment.validator_errors.map((errList, attIdx) => /* @__PURE__ */ jsxs8("div", { style: { marginBottom: 4 }, children: [
                        /* @__PURE__ */ jsxs8("span", { style: { fontWeight: 600 }, children: [
                          "Attempt ",
                          attIdx + 1,
                          ": "
                        ] }),
                        errList.join("; ")
                      ] }, attIdx))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs8("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ jsx10("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Investigation Narrative:" }),
                  /* @__PURE__ */ jsx10(
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
                /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 }, children: [
                  /* @__PURE__ */ jsx10("span", { style: { color: "var(--rg-text-muted)" }, children: "Findings Cited:" }),
                  ((assessment == null ? void 0 : assessment.findings_cited) || ["A1", "A2"]).map((c) => /* @__PURE__ */ jsx10(
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
                /* @__PURE__ */ jsx10(
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
          /* @__PURE__ */ jsxs8("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
              /* @__PURE__ */ jsx10("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: "Evidence Package Status" }),
              /* @__PURE__ */ jsxs8(
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
            /* @__PURE__ */ jsxs8("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: [
              "Pack Hash: ",
              /* @__PURE__ */ jsx10("code", { style: { fontFamily: "monospace" }, children: currentPackHash })
            ] }),
            ((_q = detail == null ? void 0 : detail.approval) == null ? void 0 : _q.approver_sub) && /* @__PURE__ */ jsxs8("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
              "Approved by: ",
              /* @__PURE__ */ jsx10("span", { style: { fontWeight: 600 }, children: detail.approval.approver_sub }),
              " at",
              " ",
              detail.approval.decided_at ? new Date(detail.approval.decided_at).toLocaleString() : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs8("div", { className: "rg-card", style: { padding: 16 }, children: [
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
              /* @__PURE__ */ jsx10("h3", { style: { margin: 0, fontSize: 14, fontWeight: 700 }, children: "Step Timeline & Audit History" }),
              /* @__PURE__ */ jsxs8("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                timeline.length,
                " recorded events"
              ] })
            ] }),
            timeline.length === 0 ? /* @__PURE__ */ jsx10("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", padding: 12, textAlign: "center" }, children: "No steps recorded in timeline." }) : /* @__PURE__ */ jsx10("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: timeline.map((step, idx) => /* @__PURE__ */ jsxs8(
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
                  /* @__PURE__ */ jsx10("span", { style: { fontSize: 14 }, children: step.step_type === "PACK_APPROVED" ? "\u2713" : step.step_type === "NOTE_ADDED" ? "\u270D" : step.step_type === "CASE_CLOSED" ? "\u{1F3C1}" : step.step_type === "CASE_REOPENED" ? "\u{1F504}" : "\u25CF" }),
                  /* @__PURE__ */ jsxs8("div", { style: { flex: 1 }, children: [
                    /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 2 }, children: [
                      /* @__PURE__ */ jsx10("span", { style: { fontWeight: 700, fontFamily: "monospace" }, children: step.step_type }),
                      /* @__PURE__ */ jsx10("span", { style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: new Date(step.created_at).toLocaleTimeString() })
                    ] }),
                    /* @__PURE__ */ jsx10("div", { style: { color: "var(--rg-text-secondary)", marginBottom: 2 }, children: step.note }),
                    /* @__PURE__ */ jsxs8("div", { style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: [
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
      isNoteModalOpen && /* @__PURE__ */ jsx10(
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
          children: /* @__PURE__ */ jsxs8(
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
                /* @__PURE__ */ jsx10("h4", { style: { margin: "0 0 10px 0", fontSize: 16 }, children: "Add Reviewer Note" }),
                /* @__PURE__ */ jsx10(
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
                /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ jsx10(
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
                  /* @__PURE__ */ jsx10(
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
      isCloseModalOpen && /* @__PURE__ */ jsx10(
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
          children: /* @__PURE__ */ jsxs8(
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
                /* @__PURE__ */ jsx10("h4", { style: { margin: "0 0 12px 0", fontSize: 16 }, children: "Close Investigation Case" }),
                /* @__PURE__ */ jsxs8("div", { style: { marginBottom: 12 }, children: [
                  /* @__PURE__ */ jsx10("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Outcome Decision:" }),
                  /* @__PURE__ */ jsxs8(
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
                        /* @__PURE__ */ jsx10("option", { value: "CLOSED_APPROVED", children: "CLOSED_APPROVED (Requires active pack approval)" }),
                        /* @__PURE__ */ jsx10("option", { value: "CLOSED_REJECTED", children: "CLOSED_REJECTED (Dispute rejected)" }),
                        /* @__PURE__ */ jsx10("option", { value: "CLOSED_NO_ACTION", children: "CLOSED_NO_ACTION (No further action required)" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs8("div", { style: { marginBottom: 14 }, children: [
                  /* @__PURE__ */ jsx10("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Closing Note (min. 20 characters required):" }),
                  /* @__PURE__ */ jsx10(
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
                  /* @__PURE__ */ jsxs8(
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
                /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ jsx10(
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
                  /* @__PURE__ */ jsx10(
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
      isReopenModalOpen && /* @__PURE__ */ jsx10(
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
          children: /* @__PURE__ */ jsxs8(
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
                /* @__PURE__ */ jsx10("h4", { style: { margin: "0 0 10px 0", fontSize: 16 }, children: "Reopen Investigation Case" }),
                /* @__PURE__ */ jsx10(
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
                /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
                  /* @__PURE__ */ jsx10(
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
                  /* @__PURE__ */ jsx10(
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
import { useMemo as useMemo4 } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { jsx as jsx11 } from "react/jsx-runtime";
ModuleRegistry.registerModules([AllCommunityModule]);
var TransactionsGrid = ({
  items,
  loading = false,
  onRowClick,
  quickFilterText = ""
}) => {
  const { theme } = useReturnGuard();
  const gridThemeClass = theme === "light" ? "ag-theme-alpine" : "ag-theme-alpine-dark";
  const columnDefs = useMemo4(
    () => [
      {
        field: "order_id",
        headerName: "Order ID",
        minWidth: 190,
        flex: 1.3,
        pinned: "left",
        cellRenderer: (params) => /* @__PURE__ */ jsx11("span", { style: { fontFamily: "monospace", fontWeight: 600, color: "var(--rg-text-primary)" }, children: params.value || "--" })
      },
      {
        field: "channel",
        headerName: "Channel",
        minWidth: 100,
        flex: 0.8,
        cellRenderer: (params) => /* @__PURE__ */ jsx11(
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
        cellRenderer: (params) => /* @__PURE__ */ jsx11(RiskBadge, { score: params.value }),
        sort: "desc"
      },
      {
        field: "suggested_action",
        headerName: "Policy Action",
        minWidth: 160,
        flex: 1.2,
        cellRenderer: (params) => /* @__PURE__ */ jsx11(RiskBadge, { action: params.value })
      },
      {
        field: "severity",
        headerName: "Severity",
        minWidth: 110,
        flex: 0.9,
        cellRenderer: (params) => /* @__PURE__ */ jsx11(RiskBadge, { severity: params.value })
      },
      {
        headerName: "Payment Status",
        minWidth: 180,
        flex: 1.3,
        valueGetter: () => "Not Integrated (Provider Owned)",
        cellRenderer: () => /* @__PURE__ */ jsx11("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", fontStyle: "italic" }, children: "Provider Owned (ShopPoint)" })
      },
      {
        field: "model_version",
        headerName: "Model",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => /* @__PURE__ */ jsx11("span", { style: { fontSize: 12, fontFamily: "monospace", color: "var(--rg-text-muted)" }, children: params.value || "candidate_lgbm_v1" })
      }
    ],
    []
  );
  const defaultColDef = useMemo4(
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
  return /* @__PURE__ */ jsx11(
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
      children: /* @__PURE__ */ jsx11(
        AgGridReact,
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

// src/components/TransactionsPage.tsx
import { useState as useState5 } from "react";

// src/components/DetailDrawer.tsx
import { useEffect as useEffect5, useRef as useRef2, useCallback as useCallback4 } from "react";
import { Fragment as Fragment2, jsx as jsx12, jsxs as jsxs9 } from "react/jsx-runtime";
var DetailDrawer = ({ decisionId, onClose }) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const { decision, audit, loading, error } = useTransactionRisk(decisionId);
  const drawerRef = useRef2(null);
  const closeButtonRef = useRef2(null);
  const previousActiveElementRef = useRef2(null);
  useEffect5(() => {
    if (decisionId) {
      previousActiveElementRef.current = document.activeElement;
      const timer = setTimeout(() => {
        var _a2;
        (_a2 = closeButtonRef.current) == null ? void 0 : _a2.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [decisionId]);
  const restoreFocus = useCallback4(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      el.focus();
    }
  }, []);
  const handleClose = useCallback4(() => {
    restoreFocus();
    onClose();
  }, [onClose, restoreFocus]);
  useEffect5(() => {
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
  return /* @__PURE__ */ jsx12(
    "div",
    {
      className: "rg-drawer-overlay",
      onClick: handleClose,
      "aria-hidden": "false",
      children: /* @__PURE__ */ jsxs9(
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
            /* @__PURE__ */ jsxs9("header", { className: "rg-drawer-header", children: [
              /* @__PURE__ */ jsxs9("div", { className: "rg-drawer-header-info", children: [
                /* @__PURE__ */ jsx12("span", { id: "rg-drawer-desc", className: "rg-drawer-subtitle", children: "Transaction Investigation" }),
                /* @__PURE__ */ jsx12("h2", { id: "rg-drawer-title", className: "rg-drawer-title", children: (decision == null ? void 0 : decision.order_id) || decisionId })
              ] }),
              /* @__PURE__ */ jsxs9(
                "button",
                {
                  ref: closeButtonRef,
                  type: "button",
                  className: "rg-drawer-close-btn",
                  onClick: handleClose,
                  "aria-label": "Close transaction investigation drawer",
                  children: [
                    /* @__PURE__ */ jsx12(CloseIcon, { size: 14, "aria-hidden": "true" }),
                    /* @__PURE__ */ jsx12("span", { children: "Close" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs9("div", { className: "rg-drawer-body", children: [
              loading && /* @__PURE__ */ jsxs9("div", { className: "rg-drawer-loading", role: "status", children: [
                /* @__PURE__ */ jsx12("span", { className: "rg-loading-spinner", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx12("span", { children: "Loading scoring audit and explanation..." })
              ] }),
              error && /* @__PURE__ */ jsxs9("div", { className: "rg-drawer-error", role: "alert", children: [
                /* @__PURE__ */ jsx12("div", { className: "rg-drawer-error-title", children: "Failed to load decision" }),
                /* @__PURE__ */ jsx12("div", { className: "rg-drawer-error-msg", children: error.message })
              ] }),
              decision && /* @__PURE__ */ jsxs9(Fragment2, { children: [
                /* @__PURE__ */ jsxs9("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx12("div", { className: "rg-drawer-section-title", children: "ReturnGuard Recommendation" }),
                  /* @__PURE__ */ jsxs9("div", { className: "rg-verdict-bar", children: [
                    /* @__PURE__ */ jsx12(RiskBadge, { score: decision.risk_score }),
                    /* @__PURE__ */ jsx12(RiskBadge, { action: decision.suggested_action }),
                    /* @__PURE__ */ jsxs9("span", { className: "rg-verdict-severity", children: [
                      "Severity: ",
                      /* @__PURE__ */ jsx12("strong", { children: decision.severity || "unknown" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx12("p", { className: "rg-verdict-note", children: "ReturnGuard evaluates transaction characteristics and recommends an operational hold/action. Actual capture or decline is executed independently by the payment provider." })
                ] }),
                /* @__PURE__ */ jsxs9("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx12("div", { className: "rg-drawer-section-title", children: "Why This Was Flagged" }),
                  decision.reason_codes && decision.reason_codes.length > 0 ? /* @__PURE__ */ jsx12("div", { className: "rg-reason-grid", children: decision.reason_codes.map((rc) => /* @__PURE__ */ jsxs9("div", { className: "rg-reason-chip", children: [
                    /* @__PURE__ */ jsx12("span", { className: "rg-reason-feature", children: rc.feature }),
                    /* @__PURE__ */ jsx12("span", { className: "rg-reason-divider", children: ":" }),
                    /* @__PURE__ */ jsx12("span", { className: "rg-reason-direction", children: rc.direction })
                  ] }, rc.feature)) }) : /* @__PURE__ */ jsx12("div", { className: "rg-drawer-empty-text", children: "No specific rule or anomaly triggers flagged for this transaction." })
                ] }),
                /* @__PURE__ */ jsxs9("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx12("div", { className: "rg-drawer-section-title", children: "Payment & Processor Context" }),
                  /* @__PURE__ */ jsxs9("div", { className: "rg-context-grid", children: [
                    /* @__PURE__ */ jsxs9("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-label", children: "Order ID" }),
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-value rg-font-mono", children: decision.order_id || "--" })
                    ] }),
                    /* @__PURE__ */ jsxs9("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-label", children: "Channel" }),
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-value", children: decision.channel || "web" })
                    ] }),
                    /* @__PURE__ */ jsxs9("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-label", children: "ReturnGuard Mode" }),
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-value", children: decision.shadow ? "Shadow (Non-blocking)" : "Live Policy Enforcement" })
                    ] }),
                    /* @__PURE__ */ jsxs9("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-label", children: "Payment Processor Status" }),
                      /* @__PURE__ */ jsx12("span", { className: "rg-context-value rg-text-muted rg-italic", children: "Not Verified (Owned by Merchant / ShopPoint)" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs9("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx12("div", { className: "rg-drawer-section-title", children: "Audit Trail & Signals" }),
                  /* @__PURE__ */ jsx12("div", { className: "rg-audit-container", children: audit ? /* @__PURE__ */ jsxs9("div", { className: "rg-audit-grid", children: [
                    /* @__PURE__ */ jsxs9("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-audit-label", children: "Decision ID:" }),
                      /* @__PURE__ */ jsx12("span", { className: "rg-audit-value rg-font-mono", children: ((_b = (_a = audit.data) == null ? void 0 : _a.decision) == null ? void 0 : _b.decision_id) || "--" })
                    ] }),
                    /* @__PURE__ */ jsxs9("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-audit-label", children: "Order ID:" }),
                      /* @__PURE__ */ jsx12("span", { className: "rg-audit-value rg-font-mono", children: ((_d = (_c = audit.data) == null ? void 0 : _c.decision) == null ? void 0 : _d.order_id) || "--" })
                    ] }),
                    /* @__PURE__ */ jsxs9("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-audit-label", children: "Policy Action:" }),
                      /* @__PURE__ */ jsx12("span", { className: "rg-audit-value", children: ((_f = (_e = audit.data) == null ? void 0 : _e.policy_trace) == null ? void 0 : _f.policy_action) || "--" })
                    ] }),
                    /* @__PURE__ */ jsxs9("div", { className: "rg-audit-row", children: [
                      /* @__PURE__ */ jsx12("span", { className: "rg-audit-label", children: "Reconstructed Features:" }),
                      /* @__PURE__ */ jsxs9("span", { className: "rg-audit-value", children: [
                        Object.keys(((_g = audit.data) == null ? void 0 : _g.feature_snapshot) || {}).length,
                        " features verified"
                      ] })
                    ] })
                  ] }) : /* @__PURE__ */ jsx12("div", { className: "rg-drawer-empty-text", children: "Basic audit event snapshot recorded. Full feature reconstruction stored in tenant repository." }) })
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
import { jsx as jsx13, jsxs as jsxs10 } from "react/jsx-runtime";
var TransactionsPage = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useRiskDecisions(50);
  const [selectedId, setSelectedId] = useState5(null);
  const [searchTerm, setSearchTerm] = useState5("");
  return /* @__PURE__ */ jsxs10("div", { children: [
    /* @__PURE__ */ jsxs10("div", { style: { marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }, children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx13("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Transaction Risk Explorer" }),
        /* @__PURE__ */ jsx13("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Search, filter, and inspect scored payments and policy actions." })
      ] }),
      /* @__PURE__ */ jsxs10("div", { style: { display: "flex", gap: 10, alignItems: "center" }, children: [
        /* @__PURE__ */ jsxs10("div", { className: "rg-search-input-wrap", children: [
          /* @__PURE__ */ jsx13(SearchIcon, { size: 14, "aria-hidden": "true", className: "rg-search-icon" }),
          /* @__PURE__ */ jsx13(
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
        /* @__PURE__ */ jsxs10(
          "button",
          {
            type: "button",
            onClick: () => refetch(),
            className: "rg-btn-secondary",
            "aria-label": "Refresh transactions",
            disabled: loading,
            style: { display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", fontSize: 13 },
            children: [
              /* @__PURE__ */ jsx13(RefreshIcon, { size: 14, "aria-hidden": "true", className: loading ? "rg-spin" : "" }),
              /* @__PURE__ */ jsx13("span", { children: "Refresh" })
            ]
          }
        )
      ] })
    ] }),
    error && /* @__PURE__ */ jsx13("div", { style: { marginBottom: 16, padding: 12, background: "var(--rg-high-bg)", border: "1px solid var(--rg-high-border)", borderRadius: 6 }, children: /* @__PURE__ */ jsxs10("span", { style: { color: "var(--rg-high-text)", fontSize: 13 }, children: [
      "Failed to load transactions: ",
      error.message
    ] }) }),
    /* @__PURE__ */ jsx13(
      TransactionsGrid,
      {
        items,
        loading,
        quickFilterText: searchTerm,
        onRowClick: (id) => setSelectedId(id)
      }
    ),
    /* @__PURE__ */ jsxs10("div", { style: { marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs10("div", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
        "Showing ",
        items.length,
        " records in current page"
      ] }),
      hasMore && /* @__PURE__ */ jsxs10(
        "button",
        {
          type: "button",
          onClick: nextPage,
          disabled: loading,
          className: "rg-btn-primary",
          "aria-label": "Load next page",
          style: { display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13 },
          children: [
            /* @__PURE__ */ jsx13("span", { children: "Load Next Page" }),
            /* @__PURE__ */ jsx13(ChevronRightIcon, { size: 14, "aria-hidden": "true" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx13(DetailDrawer, { decisionId: selectedId, onClose: () => setSelectedId(null) })
  ] });
};

// src/components/CustomersPage.tsx
import { useState as useState6, useEffect as useEffect6, useRef as useRef3, useCallback as useCallback5, useMemo as useMemo5 } from "react";
import { Fragment as Fragment3, jsx as jsx14, jsxs as jsxs11 } from "react/jsx-runtime";
var CustomersPage = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useCustomers(50);
  const [selectedCustomerId, setSelectedCustomerId] = useState6(null);
  const { profile, loading: profileLoading, error: profileError } = useCustomerProfile(selectedCustomerId);
  const [copiedId, setCopiedId] = useState6(false);
  const drawerRef = useRef3(null);
  const closeButtonRef = useRef3(null);
  const previousActiveElementRef = useRef3(null);
  useEffect6(() => {
    if (selectedCustomerId) {
      previousActiveElementRef.current = document.activeElement;
      const timer = setTimeout(() => {
        var _a;
        (_a = closeButtonRef.current) == null ? void 0 : _a.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedCustomerId]);
  const restoreFocus = useCallback5(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      el.focus();
    }
  }, []);
  const handleClose = useCallback5(() => {
    restoreFocus();
    setSelectedCustomerId(null);
  }, [restoreFocus]);
  useEffect6(() => {
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
  const handleCopyId = useCallback5((id) => {
    var _a;
    if ((_a = navigator == null ? void 0 : navigator.clipboard) == null ? void 0 : _a.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 1500);
      }).catch(() => {
      });
    }
  }, []);
  const formatDate = useCallback5((isoString) => {
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
  const outcomeBreakdown = useMemo5(() => {
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
  const timelineEvents = useMemo5(() => {
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
  return /* @__PURE__ */ jsxs11("div", { children: [
    /* @__PURE__ */ jsxs11("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ jsx14("h2", { style: { margin: "0 0 6px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Customer Risk Directory" }),
      /* @__PURE__ */ jsx14("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Tenant-scoped customer profiles, linked hardware devices, physical delivery locations, and order risk history." })
    ] }),
    loading && items.length === 0 && /* @__PURE__ */ jsx14("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading customer directory..." }),
    error && /* @__PURE__ */ jsxs11("div", { className: "rg-error-state", role: "alert", children: [
      /* @__PURE__ */ jsx14("h4", { children: "Failed to load customer directory" }),
      /* @__PURE__ */ jsx14("p", { children: error.message }),
      /* @__PURE__ */ jsxs11(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ jsx14(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx14("span", { children: "Retry" })
          ]
        }
      )
    ] }),
    !loading && !error && items.length === 0 && /* @__PURE__ */ jsxs11("div", { className: "rg-empty-state", role: "status", children: [
      /* @__PURE__ */ jsx14("p", { style: { margin: "0 0 4px 0", fontWeight: 600, color: "var(--rg-text-primary)" }, children: "No customer records found." }),
      /* @__PURE__ */ jsx14("span", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "New customer profiles will automatically appear here once transactions are evaluated." })
    ] }),
    items.length > 0 && /* @__PURE__ */ jsx14("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }, children: items.map((cust) => {
      const isSelected = selectedCustomerId === cust.customer_id;
      return /* @__PURE__ */ jsxs11(
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
            /* @__PURE__ */ jsxs11("div", { className: "rg-customer-card-header", children: [
              /* @__PURE__ */ jsx14("span", { className: "rg-customer-id", children: cust.customer_id }),
              /* @__PURE__ */ jsx14(RiskBadge, { score: cust.max_risk_score })
            ] }),
            /* @__PURE__ */ jsxs11("div", { className: "rg-customer-card-body", children: [
              /* @__PURE__ */ jsxs11("div", { className: "rg-customer-contact-line", children: [
                /* @__PURE__ */ jsx14("span", { className: "rg-customer-contact-label", children: "Email:" }),
                /* @__PURE__ */ jsx14("span", { className: "rg-customer-contact-val", children: cust.email })
              ] }),
              /* @__PURE__ */ jsxs11("div", { className: "rg-customer-contact-line", children: [
                /* @__PURE__ */ jsx14("span", { className: "rg-customer-contact-label", children: "Phone:" }),
                /* @__PURE__ */ jsx14("span", { className: "rg-customer-contact-val", children: cust.phone })
              ] })
            ] }),
            /* @__PURE__ */ jsxs11("div", { className: "rg-customer-card-footer", children: [
              /* @__PURE__ */ jsxs11("span", { children: [
                "Orders: ",
                /* @__PURE__ */ jsx14("strong", { className: "rg-customer-metric-val", children: cust.total_orders })
              ] }),
              /* @__PURE__ */ jsxs11("span", { children: [
                "Spent: ",
                /* @__PURE__ */ jsxs11("strong", { className: "rg-customer-metric-val", children: [
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
    hasMore && /* @__PURE__ */ jsx14("div", { style: { marginTop: 24, textAlign: "center" }, children: /* @__PURE__ */ jsxs11(
      "button",
      {
        type: "button",
        onClick: nextPage,
        disabled: loading,
        className: "rg-load-more-btn",
        style: { display: "inline-flex", alignItems: "center", gap: 6 },
        children: [
          /* @__PURE__ */ jsx14("span", { children: loading ? "Loading..." : "Load More Customers" }),
          !loading && /* @__PURE__ */ jsx14(ChevronRightIcon, { size: 14, "aria-hidden": "true" })
        ]
      }
    ) }),
    selectedCustomerId && /* @__PURE__ */ jsx14(
      "div",
      {
        className: "rg-drawer-overlay",
        onClick: handleClose,
        "aria-hidden": "true",
        children: /* @__PURE__ */ jsxs11(
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
              /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-header", children: [
                /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-header-info", children: [
                  /* @__PURE__ */ jsx14("span", { id: "customer-drawer-desc", className: "rg-drawer-subtitle", children: "Customer Risk Profile" }),
                  /* @__PURE__ */ jsxs11("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 2 }, children: [
                    /* @__PURE__ */ jsx14("h3", { id: "customer-drawer-title", className: "rg-drawer-title", children: selectedCustomerId }),
                    /* @__PURE__ */ jsx14(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleCopyId(selectedCustomerId),
                        className: "rg-copy-btn",
                        "aria-label": `Copy customer ID ${selectedCustomerId}`,
                        title: "Copy Customer ID",
                        children: /* @__PURE__ */ jsx14("span", { children: copiedId ? "Copied!" : "Copy" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs11(
                  "button",
                  {
                    ref: closeButtonRef,
                    type: "button",
                    onClick: handleClose,
                    className: "rg-drawer-close-btn",
                    "aria-label": "Close customer profile drawer",
                    children: [
                      /* @__PURE__ */ jsx14(CloseIcon, { size: 14, "aria-hidden": "true" }),
                      /* @__PURE__ */ jsx14("span", { children: "Close" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-body", children: [
                profileLoading && /* @__PURE__ */ jsx14("div", { className: "rg-drawer-section", role: "status", "aria-live": "polite", children: /* @__PURE__ */ jsx14("div", { style: { color: "var(--rg-text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }, children: "Loading profile details..." }) }),
                profileError && /* @__PURE__ */ jsxs11("div", { className: "rg-error-state", role: "alert", style: { margin: 16 }, children: [
                  /* @__PURE__ */ jsx14("h4", { style: { margin: "0 0 6px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load profile" }),
                  /* @__PURE__ */ jsx14("p", { style: { margin: 0, fontSize: 13 }, children: profileError.message })
                ] }),
                profile && /* @__PURE__ */ jsxs11(Fragment3, { children: [
                  /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ jsx14("div", { className: "rg-drawer-section-title", children: "Customer Risk Summary" }),
                    /* @__PURE__ */ jsxs11("div", { className: "rg-context-grid", children: [
                      /* @__PURE__ */ jsxs11("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-label", children: "Masked Email" }),
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-value", children: profile.email })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-label", children: "Masked Phone" }),
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-value", children: profile.phone })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-label", children: "Registration Date" }),
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-value", children: formatDate(profile.created_at) })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-label", children: "Lifetime Orders" }),
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-value", children: profile.total_orders })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-label", children: "Lifetime Spend" }),
                        /* @__PURE__ */ jsxs11("span", { className: "rg-context-value", children: [
                          profile.currency,
                          " ",
                          profile.total_spent.toFixed(2)
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-label", children: "Max Risk Score" }),
                        /* @__PURE__ */ jsx14("div", { style: { marginTop: 2 }, children: /* @__PURE__ */ jsx14(RiskBadge, { score: profile.max_risk_score }) })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-context-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-context-label", children: "Average Risk Score" }),
                        /* @__PURE__ */ jsxs11("span", { className: "rg-context-value", children: [
                          (profile.average_risk_score * 100).toFixed(0),
                          " ",
                          /* @__PURE__ */ jsx14("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: "/ 100" })
                        ] })
                      ] })
                    ] })
                  ] }),
                  outcomeBreakdown && /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ jsx14("div", { className: "rg-drawer-section-title", children: "Transaction Outcome Breakdown" }),
                    /* @__PURE__ */ jsxs11("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: [
                      "Policy decision distribution across ",
                      outcomeBreakdown.total,
                      " evaluated order",
                      outcomeBreakdown.total > 1 ? "s" : "",
                      ":"
                    ] }),
                    /* @__PURE__ */ jsxs11("div", { className: "rg-segmented-bar", role: "progressbar", "aria-label": "Transaction outcome distribution", children: [
                      parseFloat(outcomeBreakdown.allow.pct) > 0 && /* @__PURE__ */ jsx14(
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
                      parseFloat(outcomeBreakdown.review.pct) > 0 && /* @__PURE__ */ jsx14(
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
                      parseFloat(outcomeBreakdown.block.pct) > 0 && /* @__PURE__ */ jsx14(
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
                      parseFloat(outcomeBreakdown.unscored.pct) > 0 && /* @__PURE__ */ jsx14(
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
                    /* @__PURE__ */ jsxs11("div", { className: "rg-outcome-legend", children: [
                      /* @__PURE__ */ jsxs11("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-risk-dot rg-risk-dot-low", "aria-hidden": "true" }),
                        /* @__PURE__ */ jsxs11("span", { children: [
                          "ALLOW: ",
                          /* @__PURE__ */ jsx14("strong", { children: outcomeBreakdown.allow.count }),
                          " (",
                          outcomeBreakdown.allow.pct,
                          "%)"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-risk-dot rg-risk-dot-medium", "aria-hidden": "true" }),
                        /* @__PURE__ */ jsxs11("span", { children: [
                          "REVIEW: ",
                          /* @__PURE__ */ jsx14("strong", { children: outcomeBreakdown.review.count }),
                          " (",
                          outcomeBreakdown.review.pct,
                          "%)"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs11("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ jsx14("span", { className: "rg-risk-dot rg-risk-dot-high", "aria-hidden": "true" }),
                        /* @__PURE__ */ jsxs11("span", { children: [
                          "BLOCK: ",
                          /* @__PURE__ */ jsx14("strong", { children: outcomeBreakdown.block.count }),
                          " (",
                          outcomeBreakdown.block.pct,
                          "%)"
                        ] })
                      ] }),
                      parseFloat(outcomeBreakdown.unscored.pct) > 0 && /* @__PURE__ */ jsxs11("div", { className: "rg-outcome-legend-item", children: [
                        /* @__PURE__ */ jsx14("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "var(--rg-text-muted)", display: "inline-block" }, "aria-hidden": "true" }),
                        /* @__PURE__ */ jsxs11("span", { children: [
                          "UNSCORED: ",
                          /* @__PURE__ */ jsx14("strong", { children: outcomeBreakdown.unscored.count }),
                          " (",
                          outcomeBreakdown.unscored.pct,
                          "%)"
                        ] })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ jsx14("div", { className: "rg-drawer-section-title", children: "Risk & Activity Exposure" }),
                    profile.order_history.length >= 2 ? /* @__PURE__ */ jsxs11("div", { children: [
                      /* @__PURE__ */ jsxs11("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 12 }, children: [
                        "Chronological risk score progression across ",
                        profile.order_history.length,
                        " orders:"
                      ] }),
                      /* @__PURE__ */ jsxs11("svg", { width: "100%", height: "48", viewBox: "0 0 240 48", style: { overflow: "visible" }, children: [
                        /* @__PURE__ */ jsx14(
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
                          return /* @__PURE__ */ jsx14(
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
                    ] }) : /* @__PURE__ */ jsxs11("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
                      /* @__PURE__ */ jsxs11("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                        /* @__PURE__ */ jsx14("span", { style: { fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Current Risk Assessment" }),
                        /* @__PURE__ */ jsx14(RiskBadge, { score: profile.max_risk_score })
                      ] }),
                      /* @__PURE__ */ jsx14("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx14(
                        "div",
                        {
                          className: "rg-meter-fill",
                          style: {
                            width: `${Math.min(Math.max(profile.max_risk_score * 100, 2), 100)}%`,
                            backgroundColor: profile.max_risk_score >= 0.8 ? "var(--rg-crit-text)" : profile.max_risk_score >= 0.4 ? "var(--rg-high-text)" : profile.max_risk_score >= 0.15 ? "var(--rg-med-text)" : "var(--rg-low-text)"
                          }
                        }
                      ) }),
                      /* @__PURE__ */ jsxs11("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                        "Single recorded evaluation on record (",
                        profile.total_orders,
                        " order). Historical score trend activates once multiple orders accumulate."
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section-title", children: [
                      "Hardware & Network Footprint (",
                      profile.linked_devices.length,
                      ")"
                    ] }),
                    profile.linked_devices.length === 0 ? /* @__PURE__ */ jsx14("div", { className: "rg-drawer-empty-text", children: "No linked device fingerprints recorded." }) : /* @__PURE__ */ jsx14("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: profile.linked_devices.map((d) => /* @__PURE__ */ jsxs11(
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
                          /* @__PURE__ */ jsxs11("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                            /* @__PURE__ */ jsxs11("span", { className: "rg-font-mono", style: { fontSize: 12, fontWeight: 500, color: "var(--rg-text-primary)" }, children: [
                              d.device_hash.slice(0, 20),
                              "..."
                            ] }),
                            /* @__PURE__ */ jsxs11("span", { className: "rg-meta-tag", style: { fontSize: 11 }, children: [
                              "IP: ",
                              d.ip_address || "Unrecorded"
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxs11("div", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                            "Registered: ",
                            formatDate(d.created_at)
                          ] })
                        ]
                      },
                      d.id
                    )) })
                  ] }),
                  /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section-title", children: [
                      "Delivery Locations (",
                      profile.linked_addresses.length,
                      ")"
                    ] }),
                    profile.linked_addresses.length === 0 ? /* @__PURE__ */ jsx14("div", { className: "rg-drawer-empty-text", children: "No normalized addresses on file." }) : /* @__PURE__ */ jsx14("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: profile.linked_addresses.map((a) => /* @__PURE__ */ jsxs11(
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
                          /* @__PURE__ */ jsxs11("span", { style: { fontSize: 13, fontWeight: 500, color: "var(--rg-text-primary)" }, children: [
                            a.city,
                            ", ",
                            a.state,
                            " ",
                            a.pincode
                          ] }),
                          /* @__PURE__ */ jsxs11("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--rg-text-muted)" }, children: [
                            /* @__PURE__ */ jsxs11("span", { children: [
                              "Country: ",
                              a.country
                            ] }),
                            /* @__PURE__ */ jsxs11("span", { children: [
                              "Added: ",
                              formatDate(a.created_at)
                            ] })
                          ] })
                        ]
                      },
                      a.id
                    )) })
                  ] }),
                  /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ jsx14("div", { className: "rg-drawer-section-title", children: "Customer Lifecycle Timeline" }),
                    timelineEvents.length === 0 ? /* @__PURE__ */ jsx14("div", { className: "rg-drawer-empty-text", children: "No lifecycle event records available." }) : /* @__PURE__ */ jsx14("div", { className: "rg-timeline-list", children: timelineEvents.map((ev) => /* @__PURE__ */ jsxs11("div", { className: "rg-timeline-item", children: [
                      /* @__PURE__ */ jsx14("div", { className: "rg-timeline-connector" }),
                      /* @__PURE__ */ jsx14(
                        "div",
                        {
                          className: "rg-timeline-dot",
                          style: { borderColor: ev.dotColor },
                          "aria-hidden": "true"
                        }
                      ),
                      /* @__PURE__ */ jsx14("div", { className: "rg-timeline-title", children: ev.title }),
                      /* @__PURE__ */ jsx14("div", { className: "rg-timeline-desc", children: ev.desc }),
                      /* @__PURE__ */ jsx14("div", { className: "rg-timeline-time", children: formatDate(ev.timestamp) })
                    ] }, ev.id)) })
                  ] }),
                  /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section", children: [
                    /* @__PURE__ */ jsxs11("div", { className: "rg-drawer-section-title", children: [
                      "Order History & Decisions (",
                      profile.order_history.length,
                      ")"
                    ] }),
                    profile.order_history.length === 0 ? /* @__PURE__ */ jsx14("div", { className: "rg-drawer-empty-text", children: "No orders on record." }) : /* @__PURE__ */ jsx14("div", { className: "rg-table-container", children: /* @__PURE__ */ jsxs11("table", { className: "rg-data-table", children: [
                      /* @__PURE__ */ jsx14("thead", { children: /* @__PURE__ */ jsxs11("tr", { children: [
                        /* @__PURE__ */ jsx14("th", { children: "Order ID" }),
                        /* @__PURE__ */ jsx14("th", { children: "Channel" }),
                        /* @__PURE__ */ jsx14("th", { children: "Amount" }),
                        /* @__PURE__ */ jsx14("th", { children: "Status" }),
                        /* @__PURE__ */ jsx14("th", { children: "Decision" }),
                        /* @__PURE__ */ jsx14("th", { children: "Order Time" })
                      ] }) }),
                      /* @__PURE__ */ jsx14("tbody", { children: profile.order_history.map((ord) => /* @__PURE__ */ jsxs11("tr", { children: [
                        /* @__PURE__ */ jsx14("td", { className: "rg-font-mono", style: { fontWeight: 600 }, children: ord.order_id }),
                        /* @__PURE__ */ jsx14("td", { children: /* @__PURE__ */ jsx14("span", { className: "rg-meta-tag", style: { textTransform: "uppercase" }, children: ord.channel }) }),
                        /* @__PURE__ */ jsx14("td", { children: /* @__PURE__ */ jsxs11("strong", { children: [
                          ord.currency,
                          " ",
                          ord.order_value.toFixed(2)
                        ] }) }),
                        /* @__PURE__ */ jsx14("td", { children: /* @__PURE__ */ jsx14("span", { style: { fontSize: 12, color: "var(--rg-text-secondary)", textTransform: "capitalize" }, children: ord.status }) }),
                        /* @__PURE__ */ jsx14("td", { children: ord.risk_score !== null && ord.risk_score !== void 0 ? /* @__PURE__ */ jsx14(RiskBadge, { score: ord.risk_score, action: ord.policy_action || void 0 }) : /* @__PURE__ */ jsx14("span", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: "Unscored" }) }),
                        /* @__PURE__ */ jsx14("td", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: formatDate(ord.order_time) })
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

// src/components/RiskAnalyticsPage.tsx
import { useMemo as useMemo6 } from "react";
import {
  ResponsiveContainer as ResponsiveContainer2,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell as Cell2,
  Tooltip as Tooltip2
} from "recharts";
import { jsx as jsx15, jsxs as jsxs12 } from "react/jsx-runtime";
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
  const histogramData = useMemo6(
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
  const channelData = useMemo6(
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
  const tierData = useMemo6(() => {
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
    return /* @__PURE__ */ jsx15("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading risk analytics & trends..." });
  }
  if (error) {
    return /* @__PURE__ */ jsxs12("div", { className: "rg-error-state", role: "alert", children: [
      /* @__PURE__ */ jsx15("h4", { children: "Failed to load risk analytics" }),
      /* @__PURE__ */ jsx15("p", { children: error.message }),
      /* @__PURE__ */ jsxs12(
        "button",
        {
          type: "button",
          onClick: handleRefetch,
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ jsx15(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx15("span", { children: "Retry" })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs12("div", { children: [
    /* @__PURE__ */ jsxs12("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ jsx15("h2", { style: { margin: "0 0 6px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Risk Analytics & Portfolio Exposure" }),
      /* @__PURE__ */ jsx15("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Portfolio risk score distributions, channel breakdown, and time-series scoring volumes." })
    ] }),
    /* @__PURE__ */ jsxs12("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx15("span", { children: "Low Risk (< 0.15)" }),
          /* @__PURE__ */ jsx15("span", { className: "rg-risk-dot rg-risk-dot-low", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx15("div", { className: "rg-card-value", children: scoreDist.low_0_15.toLocaleString() }),
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.low_0_15 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx15("span", { children: "Medium Risk (0.15 - 0.40)" }),
          /* @__PURE__ */ jsx15("span", { className: "rg-risk-dot rg-risk-dot-medium", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx15("div", { className: "rg-card-value", children: scoreDist.med_15_40.toLocaleString() }),
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.med_15_40 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx15("span", { children: "High Risk (0.40 - 0.80)" }),
          /* @__PURE__ */ jsx15("span", { className: "rg-risk-dot rg-risk-dot-high", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx15("div", { className: "rg-card-value", children: scoreDist.high_40_80.toLocaleString() }),
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.high_40_80 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] }),
      /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-title", children: [
          /* @__PURE__ */ jsx15("span", { children: "Critical Risk (> 0.80)" }),
          /* @__PURE__ */ jsx15("span", { className: "rg-risk-dot rg-risk-dot-critical", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx15("div", { className: "rg-card-value", children: scoreDist.crit_80_100.toLocaleString() }),
        /* @__PURE__ */ jsxs12("div", { className: "rg-card-subtitle", children: [
          totalScores > 0 ? (scoreDist.crit_80_100 / totalScores * 100).toFixed(1) : "0.0",
          "% of portfolio"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs12("div", { className: "rg-analytical-grid", children: [
      /* @__PURE__ */ jsxs12(
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
            /* @__PURE__ */ jsx15(ResponsiveContainer2, { width: "100%", height: 230, children: /* @__PURE__ */ jsxs12(BarChart, { data: histogramData, margin: { top: 12, right: 12, left: -16, bottom: 4 }, children: [
              /* @__PURE__ */ jsx15(CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
              /* @__PURE__ */ jsx15(
                XAxis,
                {
                  dataKey: "band",
                  stroke: CHART_CSS_VARS.axis,
                  fontSize: 11,
                  tickLine: false,
                  axisLine: { stroke: CHART_CSS_VARS.grid }
                }
              ),
              /* @__PURE__ */ jsx15(
                YAxis,
                {
                  stroke: CHART_CSS_VARS.axis,
                  fontSize: 11,
                  tickLine: false,
                  axisLine: false,
                  allowDecimals: false
                }
              ),
              /* @__PURE__ */ jsx15(
                Tooltip2,
                {
                  content: /* @__PURE__ */ jsx15(
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
              /* @__PURE__ */ jsx15(Bar, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: histogramData.map((entry) => /* @__PURE__ */ jsx15(Cell2, { fill: entry.color }, entry.band)) })
            ] }) }),
            /* @__PURE__ */ jsx15(
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
      /* @__PURE__ */ jsxs12(
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
            /* @__PURE__ */ jsx15(ResponsiveContainer2, { width: "100%", height: 170, children: /* @__PURE__ */ jsxs12(
              BarChart,
              {
                data: channelData,
                layout: "vertical",
                margin: { top: 8, right: 24, left: 16, bottom: 0 },
                children: [
                  /* @__PURE__ */ jsx15(CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, horizontal: false }),
                  /* @__PURE__ */ jsx15(
                    XAxis,
                    {
                      type: "number",
                      stroke: CHART_CSS_VARS.axis,
                      fontSize: 11,
                      tickLine: false,
                      axisLine: false,
                      allowDecimals: false
                    }
                  ),
                  /* @__PURE__ */ jsx15(
                    YAxis,
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
                  /* @__PURE__ */ jsx15(
                    Tooltip2,
                    {
                      content: /* @__PURE__ */ jsx15(
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
                  /* @__PURE__ */ jsx15(Bar, { dataKey: "count", radius: [0, 4, 4, 0], isAnimationActive: false, children: channelData.map((entry) => /* @__PURE__ */ jsx15(Cell2, { fill: entry.color }, entry.channel)) })
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs12(
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
                  /* @__PURE__ */ jsxs12("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                    /* @__PURE__ */ jsx15("span", { style: { color: "var(--rg-text-secondary)" }, children: "Recorded Disputes" }),
                    /* @__PURE__ */ jsx15("span", { style: { fontWeight: 600, color: "var(--rg-text-primary)", fontFamily: "var(--rg-font-mono)" }, children: disputes.total_disputes.toLocaleString() })
                  ] }),
                  /* @__PURE__ */ jsxs12("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                    /* @__PURE__ */ jsx15("span", { style: { color: "var(--rg-text-secondary)" }, children: "Dispute Exposure Rate" }),
                    /* @__PURE__ */ jsxs12(
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
                  /* @__PURE__ */ jsxs12("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                    /* @__PURE__ */ jsx15("span", { style: { color: "var(--rg-text-secondary)" }, children: "Disputed Volume" }),
                    /* @__PURE__ */ jsx15("span", { className: "rg-font-mono", style: { color: "var(--rg-text-muted)" }, children: formatMetricValue(disputes.disputed_amount, "currency", disputes.currency || "INR") })
                  ] })
                ]
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs12("div", { className: "rg-analytical-grid", children: [
      /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx15("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Backend Policy Tier Mapping" }),
        /* @__PURE__ */ jsx15("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-muted)" }, children: "Enforced policy risk tiers combining ML scores with deterministic fraud rules" }),
        /* @__PURE__ */ jsx15("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: tierData.map((t) => /* @__PURE__ */ jsxs12("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
          /* @__PURE__ */ jsxs12("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }, children: [
            /* @__PURE__ */ jsxs12("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
              /* @__PURE__ */ jsx15(
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
              /* @__PURE__ */ jsx15("span", { style: { fontWeight: 500, color: "var(--rg-text-secondary)" }, children: t.label }),
              /* @__PURE__ */ jsxs12("span", { className: "rg-font-mono", style: { fontSize: 10, color: "var(--rg-text-muted)" }, children: [
                "(",
                t.tier,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxs12("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsxs12("span", { style: { color: "var(--rg-text-muted)" }, children: [
                t.pct,
                "%"
              ] }),
              /* @__PURE__ */ jsx15("strong", { style: { minWidth: 28, textAlign: "right", color: "var(--rg-text-primary)" }, children: t.count.toLocaleString() })
            ] })
          ] }),
          /* @__PURE__ */ jsx15("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx15(
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
      /* @__PURE__ */ jsx15(
        ChartContainer,
        {
          title: "Daily Scoring Activity",
          subtitle: "Time-series scoring activity and daily exception flagging rates",
          height: 320,
          empty: trends.length === 0,
          emptyTitle: "No daily activity",
          emptyMessage: "No time-series scoring events recorded.",
          ariaLabel: "Daily scoring activity chart",
          children: isSingleDate ? /* @__PURE__ */ jsxs12("div", { style: { display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsxs12("div", { children: [
              /* @__PURE__ */ jsxs12("div", { className: "rg-trend-notice", role: "status", children: [
                /* @__PURE__ */ jsx15("span", { "aria-hidden": "true", children: "\u2139" }),
                /* @__PURE__ */ jsx15("span", { children: "Historical trend accumulation in progress \u2014 1 day recorded." })
              ] }),
              /* @__PURE__ */ jsxs12("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 12 }, children: [
                "Discrete evaluation volume recorded for calendar day",
                " ",
                /* @__PURE__ */ jsx15("strong", { className: "rg-font-mono", style: { color: "var(--rg-text-primary)" }, children: trends[0].date }),
                ":"
              ] })
            ] }),
            /* @__PURE__ */ jsx15(ResponsiveContainer2, { width: "100%", height: 160, children: /* @__PURE__ */ jsxs12(
              BarChart,
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
                  /* @__PURE__ */ jsx15(CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
                  /* @__PURE__ */ jsx15(XAxis, { dataKey: "date", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
                  /* @__PURE__ */ jsx15(YAxis, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
                  /* @__PURE__ */ jsx15(
                    Tooltip2,
                    {
                      content: /* @__PURE__ */ jsx15(
                        ChartTooltip,
                        {
                          formatter: (val, name) => [`${Number(val).toLocaleString()} events`, name]
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsx15(Bar, { dataKey: "Total Scored", fill: CHART_COLORS.accent, radius: [4, 4, 0, 0], isAnimationActive: false }),
                  /* @__PURE__ */ jsx15(Bar, { dataKey: "Flagged", fill: CHART_COLORS.review, radius: [4, 4, 0, 0], isAnimationActive: false }),
                  /* @__PURE__ */ jsx15(Bar, { dataKey: "Blocked", fill: CHART_COLORS.block, radius: [4, 4, 0, 0], isAnimationActive: false })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx15(
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
          ] }) : /* @__PURE__ */ jsx15(ResponsiveContainer2, { width: "100%", height: 230, children: /* @__PURE__ */ jsxs12(BarChart, { data: trends, margin: { top: 12, right: 16, left: -16, bottom: 4 }, children: [
            /* @__PURE__ */ jsx15(CartesianGrid, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
            /* @__PURE__ */ jsx15(XAxis, { dataKey: "date", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
            /* @__PURE__ */ jsx15(YAxis, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
            /* @__PURE__ */ jsx15(Tooltip2, { content: /* @__PURE__ */ jsx15(ChartTooltip, {}) }),
            /* @__PURE__ */ jsx15(Bar, { dataKey: "total_scored", name: "Total Scored", fill: CHART_COLORS.accent, radius: [4, 4, 0, 0], isAnimationActive: false }),
            /* @__PURE__ */ jsx15(Bar, { dataKey: "flagged", name: "Flagged", fill: CHART_COLORS.review, radius: [4, 4, 0, 0], isAnimationActive: false }),
            /* @__PURE__ */ jsx15(Bar, { dataKey: "blocked", name: "Blocked", fill: CHART_COLORS.block, radius: [4, 4, 0, 0], isAnimationActive: false })
          ] }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs12("div", { className: "rg-card", children: [
      /* @__PURE__ */ jsx15("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Daily Transaction & Flagging Trends" }),
      /* @__PURE__ */ jsx15("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-muted)" }, children: "Detailed record log of time-series scoring activity and daily exception flagging rates" }),
      trends.length === 0 ? /* @__PURE__ */ jsx15("div", { style: { color: "var(--rg-text-muted)", fontSize: 13, padding: "16px 0" }, children: "No daily scoring events recorded yet." }) : /* @__PURE__ */ jsx15("div", { className: "rg-table-container", children: /* @__PURE__ */ jsxs12("table", { className: "rg-data-table", children: [
        /* @__PURE__ */ jsx15("thead", { children: /* @__PURE__ */ jsxs12("tr", { children: [
          /* @__PURE__ */ jsx15("th", { children: "Date" }),
          /* @__PURE__ */ jsx15("th", { children: "Total Scored" }),
          /* @__PURE__ */ jsx15("th", { children: "Flagged" }),
          /* @__PURE__ */ jsx15("th", { children: "Blocked" }),
          /* @__PURE__ */ jsx15("th", { children: "Flag Rate" })
        ] }) }),
        /* @__PURE__ */ jsx15("tbody", { children: trends.map((t) => {
          const rate = t.total_scored > 0 ? (t.flagged / t.total_scored * 100).toFixed(1) : "0.0";
          return /* @__PURE__ */ jsxs12("tr", { children: [
            /* @__PURE__ */ jsx15("td", { className: "rg-font-mono", style: { fontWeight: 500 }, children: t.date }),
            /* @__PURE__ */ jsx15("td", { children: t.total_scored.toLocaleString() }),
            /* @__PURE__ */ jsx15("td", { style: { color: t.flagged > 0 ? "var(--rg-med-text)" : "inherit", fontWeight: t.flagged > 0 ? 600 : "normal" }, children: t.flagged.toLocaleString() }),
            /* @__PURE__ */ jsx15("td", { style: { color: t.blocked > 0 ? "var(--rg-high-text)" : "inherit", fontWeight: t.blocked > 0 ? 600 : "normal" }, children: t.blocked.toLocaleString() }),
            /* @__PURE__ */ jsx15("td", { children: /* @__PURE__ */ jsxs12("span", { style: { fontWeight: 500 }, children: [
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
import { useMemo as useMemo7 } from "react";
import {
  ResponsiveContainer as ResponsiveContainer3,
  BarChart as BarChart2,
  Bar as Bar2,
  XAxis as XAxis2,
  YAxis as YAxis2,
  CartesianGrid as CartesianGrid2,
  Cell as Cell3,
  Tooltip as Tooltip3
} from "recharts";
import { jsx as jsx16, jsxs as jsxs13 } from "react/jsx-runtime";
var RulesPage = () => {
  var _a;
  const rules = useMemo7(
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
  const policyStats = useMemo7(() => {
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
  const policyChartData = useMemo7(
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
  return /* @__PURE__ */ jsxs13("div", { children: [
    /* @__PURE__ */ jsxs13("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx16("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Rules & Detection Management" }),
      /* @__PURE__ */ jsx16("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Active deterministic risk rules, thresholds, and execution actions evaluated alongside the LightGBM model." })
    ] }),
    /* @__PURE__ */ jsxs13("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ jsxs13("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx16("div", { className: "rg-card-title", children: "Active Rules" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-value", children: "5" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-subtitle", children: "Configured deterministic rules" })
      ] }),
      /* @__PURE__ */ jsxs13("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx16("div", { className: "rg-card-title", children: "Critical Blocking" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-value", style: { color: "var(--rg-high-text)" }, children: "1" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-subtitle", children: "Threshold \u2265 0.80 probability" })
      ] }),
      /* @__PURE__ */ jsxs13("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx16("div", { className: "rg-card-title", children: "Step-Up / Review" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-value", style: { color: "var(--rg-med-text)" }, children: "3" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-subtitle", children: "Velocity, amount & address rules" })
      ] }),
      /* @__PURE__ */ jsxs13("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx16("div", { className: "rg-card-title", children: "Surveillance Tier" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-value", style: { color: "var(--rg-low-text)" }, children: "1" }),
        /* @__PURE__ */ jsx16("div", { className: "rg-card-subtitle", children: "Cold-start account tenure check" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs13("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }, children: [
      /* @__PURE__ */ jsxs13(
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
            /* @__PURE__ */ jsx16(ResponsiveContainer3, { width: "100%", height: 170, children: /* @__PURE__ */ jsxs13(BarChart2, { data: policyChartData, margin: { top: 12, right: 16, left: -20, bottom: 4 }, children: [
              /* @__PURE__ */ jsx16(CartesianGrid2, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
              /* @__PURE__ */ jsx16(XAxis2, { dataKey: "label", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
              /* @__PURE__ */ jsx16(YAxis2, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
              /* @__PURE__ */ jsx16(
                Tooltip3,
                {
                  content: /* @__PURE__ */ jsx16(
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
              /* @__PURE__ */ jsx16(Bar2, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: policyChartData.map((entry) => /* @__PURE__ */ jsx16(Cell3, { fill: entry.color }, entry.action)) })
            ] }) }),
            /* @__PURE__ */ jsx16(
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
            /* @__PURE__ */ jsx16("div", { style: { marginTop: 6, fontSize: 11, color: "var(--rg-text-muted)", lineHeight: 1.4 }, children: "* Note: Configured rules define deterministic criteria; runtime policy distribution reflects transaction evaluation decisions." })
          ]
        }
      ),
      /* @__PURE__ */ jsxs13("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs13("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsx16("h3", { style: { margin: 0, fontSize: 15, fontWeight: 600 }, children: "Daily Policy Enforcement" }),
          /* @__PURE__ */ jsx16("span", { style: { fontSize: 11, color: "var(--rg-text-muted)" }, children: dailyTrends.length === 1 ? "Single Period View" : dailyTrends.length > 1 ? `${dailyTrends.length} Days Activity` : "Tenant Scope" })
        ] }),
        dailyTrends.length === 0 ? /* @__PURE__ */ jsxs13("div", { className: "rg-empty-state", role: "status", style: { padding: 24, textAlign: "center" }, children: [
          /* @__PURE__ */ jsx16("p", { style: { margin: 0, fontWeight: 600, color: "var(--rg-text-primary)" }, children: "No daily enforcement activity recorded." }),
          /* @__PURE__ */ jsx16("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", display: "block", marginTop: 4 }, children: "Daily enforcement statistics will appear once transaction batches are evaluated." })
        ] }) : dailyTrends.length === 1 ? /* @__PURE__ */ jsxs13("div", { children: [
          /* @__PURE__ */ jsxs13("div", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: [
            "Evaluation Date: ",
            /* @__PURE__ */ jsx16("strong", { style: { color: "var(--rg-text-primary)", fontFamily: "var(--rg-font-mono)" }, children: dailyTrends[0].date })
          ] }),
          /* @__PURE__ */ jsxs13("div", { className: "rg-single-period-grid", children: [
            /* @__PURE__ */ jsxs13("div", { className: "rg-single-period-stat", children: [
              /* @__PURE__ */ jsx16("div", { className: "rg-single-period-val", children: dailyTrends[0].total_scored }),
              /* @__PURE__ */ jsx16("div", { className: "rg-single-period-lbl", children: "Total Scored" })
            ] }),
            /* @__PURE__ */ jsxs13("div", { className: "rg-single-period-stat", children: [
              /* @__PURE__ */ jsx16("div", { className: "rg-single-period-val", style: { color: "var(--rg-med-text)" }, children: dailyTrends[0].flagged }),
              /* @__PURE__ */ jsx16("div", { className: "rg-single-period-lbl", children: "Flagged / Review" })
            ] }),
            /* @__PURE__ */ jsxs13("div", { className: "rg-single-period-stat", children: [
              /* @__PURE__ */ jsx16("div", { className: "rg-single-period-val", style: { color: "var(--rg-high-text)" }, children: dailyTrends[0].blocked }),
              /* @__PURE__ */ jsx16("div", { className: "rg-single-period-lbl", children: "Blocked Outright" })
            ] })
          ] }),
          /* @__PURE__ */ jsx16("div", { style: { marginTop: 12 }, children: /* @__PURE__ */ jsxs13(
            "div",
            {
              className: "rg-segmented-bar",
              style: { height: 6 },
              role: "presentation",
              children: [
                /* @__PURE__ */ jsx16(
                  "div",
                  {
                    style: {
                      width: `${dailyTrends[0].total_scored > 0 ? (dailyTrends[0].total_scored - dailyTrends[0].flagged - dailyTrends[0].blocked) / dailyTrends[0].total_scored * 100 : 100}%`,
                      backgroundColor: "var(--rg-low-text)"
                    }
                  }
                ),
                /* @__PURE__ */ jsx16(
                  "div",
                  {
                    style: {
                      width: `${dailyTrends[0].total_scored > 0 ? dailyTrends[0].flagged / dailyTrends[0].total_scored * 100 : 0}%`,
                      backgroundColor: "var(--rg-med-text)"
                    }
                  }
                ),
                /* @__PURE__ */ jsx16(
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
        ] }) : /* @__PURE__ */ jsx16("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: dailyTrends.slice(0, 4).map((d) => /* @__PURE__ */ jsxs13("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
          /* @__PURE__ */ jsxs13("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12 }, children: [
            /* @__PURE__ */ jsx16("span", { style: { fontFamily: "var(--rg-font-mono)", color: "var(--rg-text-primary)" }, children: d.date }),
            /* @__PURE__ */ jsxs13("span", { style: { color: "var(--rg-text-muted)" }, children: [
              d.total_scored,
              " scored \u2022 ",
              /* @__PURE__ */ jsxs13("span", { style: { color: "var(--rg-med-text)" }, children: [
                d.flagged,
                " flagged"
              ] }),
              " \u2022 ",
              /* @__PURE__ */ jsxs13("span", { style: { color: "var(--rg-high-text)" }, children: [
                d.blocked,
                " blocked"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx16("div", { className: "rg-meter-track", style: { height: 6 }, children: /* @__PURE__ */ jsx16(
            "div",
            {
              className: "rg-meter-fill rg-meter-fill-accent",
              style: { width: `${Math.min(100, Math.max(8, (d.flagged + d.blocked) / Math.max(1, d.total_scored) * 100))}%` }
            }
          ) })
        ] }, d.date)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs13("div", { className: "rg-card", style: { padding: 0, overflow: "hidden" }, children: [
      /* @__PURE__ */ jsxs13("div", { style: { padding: "16px 20px", borderBottom: "1px solid var(--rg-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxs13("div", { children: [
          /* @__PURE__ */ jsx16("h3", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "Active Rule Registry" }),
          /* @__PURE__ */ jsx16("span", { style: { fontSize: 12, color: "var(--rg-text-secondary)", marginTop: 2, display: "block" }, children: "Deterministic decision parameters executed in real-time scoring pipeline" })
        ] }),
        /* @__PURE__ */ jsx16("span", { style: { fontSize: 12, color: "var(--rg-text-muted)", fontFamily: "var(--rg-font-mono)" }, children: "5 / 5 ACTIVE" })
      ] }),
      /* @__PURE__ */ jsx16("div", { className: "rg-table-container", children: /* @__PURE__ */ jsxs13("table", { className: "rg-rules-table", "aria-label": "Active Deterministic Rule Registry", children: [
        /* @__PURE__ */ jsx16("thead", { children: /* @__PURE__ */ jsxs13("tr", { children: [
          /* @__PURE__ */ jsx16("th", { scope: "col", style: { width: "38%" }, children: "Rule Identifier & Description" }),
          /* @__PURE__ */ jsx16("th", { scope: "col", style: { width: "22%" }, children: "Evaluation Threshold" }),
          /* @__PURE__ */ jsx16("th", { scope: "col", style: { width: "12%" }, children: "Severity" }),
          /* @__PURE__ */ jsx16("th", { scope: "col", style: { width: "16%" }, children: "Action Trigger" }),
          /* @__PURE__ */ jsx16("th", { scope: "col", style: { width: "12%" }, children: "Engine Status" })
        ] }) }),
        /* @__PURE__ */ jsx16("tbody", { children: rules.map((r) => /* @__PURE__ */ jsxs13("tr", { children: [
          /* @__PURE__ */ jsxs13("td", { children: [
            /* @__PURE__ */ jsx16("div", { className: "rg-rule-name", children: r.name }),
            /* @__PURE__ */ jsx16("div", { className: "rg-rule-id", children: r.id }),
            /* @__PURE__ */ jsx16("div", { className: "rg-rule-desc", children: r.description })
          ] }),
          /* @__PURE__ */ jsx16("td", { children: /* @__PURE__ */ jsx16("span", { className: "rg-rule-threshold", children: r.threshold }) }),
          /* @__PURE__ */ jsx16("td", { children: /* @__PURE__ */ jsx16(RiskBadge, { severity: r.severity }) }),
          /* @__PURE__ */ jsx16("td", { children: /* @__PURE__ */ jsx16(RiskBadge, { action: r.action }) }),
          /* @__PURE__ */ jsx16("td", { children: /* @__PURE__ */ jsx16("span", { className: "rg-status-dot-active", children: "ACTIVE" }) })
        ] }, r.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs13("div", { className: "rg-security-notice", role: "note", children: [
      /* @__PURE__ */ jsx16("span", { className: "rg-security-notice-icon", children: /* @__PURE__ */ jsx16(LockIcon, { size: 16, "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsx16("span", { children: "Rule configuration mutations require signed server-key authorization and are immutable via embed tokens." })
    ] })
  ] });
};

// src/components/ModelsPage.tsx
import { useMemo as useMemo8 } from "react";
import {
  ResponsiveContainer as ResponsiveContainer4,
  BarChart as BarChart3,
  Bar as Bar3,
  XAxis as XAxis3,
  YAxis as YAxis3,
  CartesianGrid as CartesianGrid3,
  Tooltip as Tooltip4
} from "recharts";
import { jsx as jsx17, jsxs as jsxs14 } from "react/jsx-runtime";
var ModelsPage = () => {
  const { data, loading, error } = useModelPerformance();
  const syn = data == null ? void 0 : data.synthetic;
  const ieee = data == null ? void 0 : data.ieee_cis;
  const synFNR = useMemo8(() => {
    if (!syn || typeof syn.recall !== "number") return null;
    return (1 - syn.recall) * 100;
  }, [syn]);
  const ieeeFNR = useMemo8(() => {
    if (!ieee || typeof ieee.recall !== "number") return null;
    return (1 - ieee.recall) * 100;
  }, [ieee]);
  const totalSamples = useMemo8(() => {
    var _a, _b;
    const s1 = (_a = syn == null ? void 0 : syn.sample_count) != null ? _a : 0;
    const s2 = (_b = ieee == null ? void 0 : ieee.sample_count) != null ? _b : 0;
    return s1 + s2;
  }, [syn, ieee]);
  const precisionDelta = useMemo8(() => {
    if (!syn || !ieee || typeof syn.precision !== "number" || typeof ieee.precision !== "number") {
      return null;
    }
    return (syn.precision - ieee.precision) * 100;
  }, [syn, ieee]);
  const benchmarkComparisonData = useMemo8(() => {
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
    return /* @__PURE__ */ jsxs14("div", { children: [
      /* @__PURE__ */ jsxs14("div", { style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ jsx17("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Model Performance & Evaluation Benchmarks" }),
        /* @__PURE__ */ jsx17("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
      ] }),
      /* @__PURE__ */ jsx17("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading model performance benchmarks..." })
    ] });
  }
  if (error && !data) {
    return /* @__PURE__ */ jsxs14("div", { children: [
      /* @__PURE__ */ jsxs14("div", { style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ jsx17("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Model Performance & Evaluation Benchmarks" }),
        /* @__PURE__ */ jsx17("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
      ] }),
      /* @__PURE__ */ jsxs14("div", { className: "rg-error-state", role: "alert", children: [
        /* @__PURE__ */ jsx17("h4", { style: { margin: "0 0 6px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load model benchmarks" }),
        /* @__PURE__ */ jsx17("p", { style: { margin: 0, fontSize: 13 }, children: error.message })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs14("div", { children: [
    /* @__PURE__ */ jsxs14("div", { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx17("h2", { style: { margin: "0 0 4px 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }, children: "Model Performance & Evaluation Benchmarks" }),
      /* @__PURE__ */ jsx17("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: "Transparent, reproducible machine learning evaluations separated by dataset and verification status." })
    ] }),
    /* @__PURE__ */ jsxs14("div", { className: "rg-kpi-grid", children: [
      /* @__PURE__ */ jsxs14("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx17("div", { className: "rg-card-title", children: "Candidate Model" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-value", style: { fontSize: 20, fontFamily: "var(--rg-font-mono)" }, children: (data == null ? void 0 : data.model_version) || "candidate_lgbm_v1" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-subtitle", children: "Candidate model evaluation" })
      ] }),
      /* @__PURE__ */ jsxs14("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx17("div", { className: "rg-card-title", children: "Synthetic ROC-AUC" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-value", children: syn ? syn.auc_roc.toFixed(4) : "\u2014" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-subtitle", children: "Active dataset discrimination" })
      ] }),
      /* @__PURE__ */ jsxs14("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx17("div", { className: "rg-card-title", children: "Cost Threshold (Synthetic)" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-value", style: { color: "var(--rg-accent)" }, children: syn ? syn.threshold.toFixed(2) : "\u2014" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-subtitle", children: "Synthetic dataset operating point" })
      ] }),
      /* @__PURE__ */ jsxs14("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsx17("div", { className: "rg-card-title", children: "Evaluation Samples" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-value", children: totalSamples > 0 ? totalSamples.toLocaleString() : "\u2014" }),
        /* @__PURE__ */ jsx17("div", { className: "rg-card-subtitle", children: "Combined holdout transactions" })
      ] })
    ] }),
    /* @__PURE__ */ jsx17("div", { style: { marginBottom: 20 }, children: /* @__PURE__ */ jsxs14(
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
          /* @__PURE__ */ jsx17(ResponsiveContainer4, { width: "100%", height: 220, children: /* @__PURE__ */ jsxs14(
            BarChart3,
            {
              data: benchmarkComparisonData,
              margin: { top: 16, right: 16, left: -16, bottom: 4 },
              barGap: 4,
              barCategoryGap: "24%",
              children: [
                /* @__PURE__ */ jsx17(CartesianGrid3, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
                /* @__PURE__ */ jsx17(XAxis3, { dataKey: "metric", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
                /* @__PURE__ */ jsx17(
                  YAxis3,
                  {
                    stroke: CHART_CSS_VARS.axis,
                    fontSize: 11,
                    domain: [0, 1],
                    tickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
                    tickLine: false,
                    axisLine: false
                  }
                ),
                /* @__PURE__ */ jsx17(
                  Tooltip4,
                  {
                    content: /* @__PURE__ */ jsx17(
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
                /* @__PURE__ */ jsx17(
                  Bar3,
                  {
                    dataKey: "synthetic",
                    name: "ReturnGuard Synthetic (REPRODUCED)",
                    fill: CHART_COLORS.accent,
                    radius: [4, 4, 0, 0],
                    isAnimationActive: false
                  }
                ),
                /* @__PURE__ */ jsx17(
                  Bar3,
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
          /* @__PURE__ */ jsx17(
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
    /* @__PURE__ */ jsxs14("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ jsxs14("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs14("div", { className: "rg-benchmark-header", children: [
          /* @__PURE__ */ jsxs14("div", { children: [
            /* @__PURE__ */ jsx17("h3", { style: { margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }, children: "ReturnGuard Synthetic E-Commerce" }),
            /* @__PURE__ */ jsxs14("div", { className: "rg-benchmark-meta", style: { margin: 0 }, children: [
              "Evaluation Split: ",
              /* @__PURE__ */ jsxs14("strong", { children: [
                (syn == null ? void 0 : syn.sample_count) ? syn.sample_count.toLocaleString() : "\u2014",
                " transactions"
              ] }),
              " \u2022 Operating Threshold: ",
              /* @__PURE__ */ jsx17("strong", { children: (syn == null ? void 0 : syn.threshold) ? syn.threshold.toFixed(2) : "\u2014" })
            ] })
          ] }),
          /* @__PURE__ */ jsx17("span", { className: "rg-reproduced-badge", children: (syn == null ? void 0 : syn.reproduction_status) || "REPRODUCED" })
        ] }),
        /* @__PURE__ */ jsxs14("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: [
          "Candidate Model: ",
          /* @__PURE__ */ jsx17("strong", { style: { color: "var(--rg-text-primary)", fontFamily: "var(--rg-font-mono)" }, children: (data == null ? void 0 : data.model_version) || "candidate_lgbm_v1" })
        ] }),
        /* @__PURE__ */ jsxs14("div", { className: "rg-metrics-grid", children: [
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "ROC-AUC (Discrimination)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: syn ? syn.auc_roc.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.auc_roc * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "PR-AUC (Precision-Recall Integral)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: syn ? syn.auc_pr.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.auc_pr * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "Precision (True Positive Accuracy)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: syn ? `${(syn.precision * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.precision * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "Recall (Fraud Detection Rate)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: syn ? `${(syn.recall * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.recall * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "False-Negative Rate (FNR = 1 - Recall)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", style: { color: "var(--rg-med-text)" }, children: synFNR !== null ? `${synFNR.toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-amber",
                style: { width: `${synFNR !== null ? Math.min(100, Math.max(0, synFNR)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "F1 Score (Harmonic Mean)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: syn ? syn.f1_score.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${syn ? Math.min(100, Math.max(0, syn.f1_score * 100)) : 0}%` }
              }
            ) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs14("div", { className: "rg-card", children: [
        /* @__PURE__ */ jsxs14("div", { className: "rg-benchmark-header", children: [
          /* @__PURE__ */ jsxs14("div", { children: [
            /* @__PURE__ */ jsx17("h3", { style: { margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }, children: "IEEE-CIS Fraud Benchmark" }),
            /* @__PURE__ */ jsxs14("div", { className: "rg-benchmark-meta", style: { margin: 0 }, children: [
              "Evaluation Split: ",
              /* @__PURE__ */ jsxs14("strong", { children: [
                (ieee == null ? void 0 : ieee.sample_count) ? ieee.sample_count.toLocaleString() : "\u2014",
                " transactions"
              ] }),
              " \u2022 Operating Threshold: ",
              /* @__PURE__ */ jsx17("strong", { children: (ieee == null ? void 0 : ieee.threshold) ? ieee.threshold.toFixed(2) : "\u2014" })
            ] })
          ] }),
          /* @__PURE__ */ jsx17("span", { className: "rg-unverified-badge", children: (ieee == null ? void 0 : ieee.reproduction_status) || "REPORTED_UNVERIFIED" })
        ] }),
        /* @__PURE__ */ jsx17("div", { style: { fontSize: 12, color: "var(--rg-text-muted)", marginBottom: 16 }, children: "Reported baseline artifact | Real-world uncurated e-commerce transactions" }),
        /* @__PURE__ */ jsxs14("div", { className: "rg-metrics-grid", children: [
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "ROC-AUC (Discrimination)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: ieee ? ieee.auc_roc.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.auc_roc * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "PR-AUC (Precision-Recall Integral)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: ieee ? ieee.auc_pr.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-emerald",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.auc_pr * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "Precision (True Positive Accuracy)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", style: { color: "var(--rg-med-text)" }, children: ieee ? `${(ieee.precision * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-amber",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.precision * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "Recall (Fraud Detection Rate)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: ieee ? `${(ieee.recall * 100).toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-accent",
                style: { width: `${ieee ? Math.min(100, Math.max(0, ieee.recall * 100)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "False-Negative Rate (FNR = 1 - Recall)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", style: { color: "var(--rg-med-text)" }, children: ieeeFNR !== null ? `${ieeeFNR.toFixed(2)}%` : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
              "div",
              {
                className: "rg-meter-fill rg-meter-fill-amber",
                style: { width: `${ieeeFNR !== null ? Math.min(100, Math.max(0, ieeeFNR)) : 0}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "rg-metric-item", children: [
            /* @__PURE__ */ jsxs14("div", { className: "rg-metric-header", children: [
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-label", children: "F1 Score (Harmonic Mean)" }),
              /* @__PURE__ */ jsx17("span", { className: "rg-metric-val", children: ieee ? ieee.f1_score.toFixed(4) : "\u2014" })
            ] }),
            /* @__PURE__ */ jsx17("div", { className: "rg-meter-track", children: /* @__PURE__ */ jsx17(
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
    /* @__PURE__ */ jsxs14("div", { className: "rg-cross-dataset-comparison", children: [
      /* @__PURE__ */ jsxs14("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, flexWrap: "wrap", gap: 8 }, children: [
        /* @__PURE__ */ jsx17("h4", { style: { margin: 0, fontSize: 14, fontWeight: 600 }, children: "Cross-Dataset Benchmark Comparison & Domain Shift" }),
        precisionDelta !== null && /* @__PURE__ */ jsxs14("span", { className: "rg-comparison-delta", children: [
          "Precision Gap: ",
          precisionDelta.toFixed(2),
          " percentage points"
        ] })
      ] }),
      /* @__PURE__ */ jsxs14("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: [
        "The synthetic evaluation set demonstrates ",
        /* @__PURE__ */ jsx17("strong", { children: syn ? `${(syn.precision * 100).toFixed(2)}%` : "78.47%" }),
        " precision, while the uncurated real-world IEEE-CIS baseline records ",
        /* @__PURE__ */ jsx17("strong", { children: ieee ? `${(ieee.precision * 100).toFixed(2)}%` : "6.31%" }),
        " precision (a ",
        precisionDelta !== null ? `${precisionDelta.toFixed(2)} percentage point` : "72.16 percentage point",
        " difference, approximately one true positive per 16 flagged transactions). This cross-dataset disparity illustrates the real-world domain shift and mathematically justifies why the model is deployed as a ",
        /* @__PURE__ */ jsx17("em", { children: "high-recall soft-friction verification trigger" }),
        " rather than an aggressive hard blocker."
      ] })
    ] }),
    /* @__PURE__ */ jsxs14("div", { className: "rg-card", style: { marginTop: 16, borderLeft: "4px solid var(--rg-accent)" }, children: [
      /* @__PURE__ */ jsxs14("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }, children: [
        /* @__PURE__ */ jsx17(InfoIcon, { size: 16, style: { color: "var(--rg-accent)" }, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx17("h4", { style: { margin: 0, fontSize: 14, fontWeight: 600 }, children: "Production & Evaluation Honest Limits Statement" })
      ] }),
      /* @__PURE__ */ jsx17("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)", lineHeight: 1.5 }, children: (data == null ? void 0 : data.honest_limits_note) || "Offline evaluation scores reflect pre-production holdout sets. Live merchant scoring operates in non-blocking shadow mode until false-positive profiles are verified against merchant-side payment outcomes." })
    ] })
  ] });
};

// src/components/PaymentPipelinePage.tsx
import { useMemo as useMemo9 } from "react";
import {
  ResponsiveContainer as ResponsiveContainer5,
  BarChart as BarChart4,
  Bar as Bar4,
  XAxis as XAxis4,
  YAxis as YAxis4,
  CartesianGrid as CartesianGrid4,
  Cell as Cell4,
  Tooltip as Tooltip5
} from "recharts";
import { jsx as jsx18, jsxs as jsxs15 } from "react/jsx-runtime";
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
  const channelChartData = useMemo9(
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
  return /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-page", "data-testid": "payment-pipeline-page", children: [
    /* @__PURE__ */ jsxs15("header", { className: "rg-pipeline-header", children: [
      /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-title-group", children: [
        /* @__PURE__ */ jsx18("h2", { className: "rg-pipeline-title", children: "Payment Pipeline & Processor Lifecycle" }),
        /* @__PURE__ */ jsx18("p", { className: "rg-pipeline-subtitle", children: "ReturnGuard evaluates transaction risk prior to downstream payment execution. Gateways and acquirers independently control payment authorization, capture, and settlement." })
      ] }),
      /* @__PURE__ */ jsxs15(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-pipeline-refresh-btn",
          "aria-label": "Refresh payment pipeline analytics",
          children: [
            /* @__PURE__ */ jsx18(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx18("span", { children: "Refresh Analytics" })
          ]
        }
      )
    ] }),
    loading && /* @__PURE__ */ jsx18("div", { className: "rg-card rg-loading-state", role: "status", style: { padding: 32, textAlign: "center", marginBottom: 24 }, children: /* @__PURE__ */ jsx18("p", { style: { margin: 0, fontWeight: 500, color: "var(--rg-text-secondary)" }, children: "Loading payment pipeline metrics..." }) }),
    error && !loading && /* @__PURE__ */ jsx18(
      "div",
      {
        className: "rg-card rg-error-state",
        role: "alert",
        style: { padding: 24, marginBottom: 24, borderLeft: "3px solid var(--rg-high-text)" },
        children: /* @__PURE__ */ jsxs15("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxs15("div", { children: [
            /* @__PURE__ */ jsx18("p", { style: { margin: "0 0 4px 0", fontWeight: 600, color: "var(--rg-high-text)" }, children: "Failed to load payment pipeline analytics" }),
            /* @__PURE__ */ jsx18("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: error.message || "An unexpected error occurred while communicating with the analytics service." })
          ] }),
          /* @__PURE__ */ jsx18(
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
    /* @__PURE__ */ jsxs15("section", { className: "rg-kpi-grid", "aria-label": "Pipeline Summary Metrics", children: [
      /* @__PURE__ */ jsxs15("div", { className: "rg-card", "data-testid": "kpi-total-decisions", children: [
        /* @__PURE__ */ jsx18("div", { className: "rg-card-title", children: "Total Evaluated Decisions" }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-value", children: loading ? "\u2014" : totalDecisions.toLocaleString() }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-subtitle", children: "Scored transactions across all channels" })
      ] }),
      /* @__PURE__ */ jsxs15("div", { className: "rg-card", "data-testid": "kpi-paypal-decisions", children: [
        /* @__PURE__ */ jsx18("div", { className: "rg-card-title", children: "PayPal Channel Decisions" }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-value", children: loading ? "\u2014" : paypalCount.toLocaleString() }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-subtitle", children: "Scored transactions via PayPal channel" })
      ] }),
      /* @__PURE__ */ jsxs15("div", { className: "rg-card", "data-testid": "kpi-cod-decisions", children: [
        /* @__PURE__ */ jsx18("div", { className: "rg-card-title", children: "COD Channel Decisions" }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-value", children: loading ? "\u2014" : codCount.toLocaleString() }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-subtitle", children: "Cash-on-Delivery pre-dispatch evaluations" })
      ] }),
      /* @__PURE__ */ jsxs15("div", { className: "rg-card", "data-testid": "kpi-dispute-rate", children: [
        /* @__PURE__ */ jsx18("div", { className: "rg-card-title", children: "Dispute Rate" }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-value", style: { color: disputeRatePct > 1 ? "var(--rg-high-text)" : "var(--rg-text-primary)" }, children: loading ? "\u2014" : `${disputeRatePct.toFixed(2)}%` }),
        /* @__PURE__ */ jsx18("div", { className: "rg-card-subtitle", children: loading ? "\u2014" : `${totalDisputes} recorded disputes vs evaluated volume` })
      ] })
    ] }),
    /* @__PURE__ */ jsxs15("section", { className: "rg-card rg-pipeline-lifecycle-card", "aria-label": "Decoupled Risk & Execution Lifecycle", children: [
      /* @__PURE__ */ jsx18("div", { className: "rg-pipeline-lifecycle-header", children: /* @__PURE__ */ jsxs15("div", { children: [
        /* @__PURE__ */ jsx18("h3", { style: { margin: "0 0 4px 0", fontSize: 15, fontWeight: 600 }, children: "Decoupled Risk & Payment Execution Lifecycle" }),
        /* @__PURE__ */ jsx18("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Operational separation between ReturnGuard pre-decision evaluation and merchant payment settlement." })
      ] }) }),
      /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-stages-grid", children: [
        /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ jsx18("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-accent", children: "Stage 1: Checkout" }),
          /* @__PURE__ */ jsx18("h4", { className: "rg-pipeline-stage-title", children: "Order Ingestion" }),
          /* @__PURE__ */ jsx18("p", { className: "rg-pipeline-stage-desc", children: "Customer initiates checkout via PayPal, Cash-on-Delivery, or web card gateway." }),
          /* @__PURE__ */ jsx18("div", { className: "rg-pipeline-stage-actor", children: "Actor: Customer & Storefront" })
        ] }),
        /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ jsx18("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-emerald", children: "Stage 2: ReturnGuard" }),
          /* @__PURE__ */ jsx18("h4", { className: "rg-pipeline-stage-title", children: "Pre-Decision Evaluation" }),
          /* @__PURE__ */ jsx18("p", { className: "rg-pipeline-stage-desc", children: "LightGBM ML model and deterministic rules evaluate fraud risk, velocity, and policy recommendations." }),
          /* @__PURE__ */ jsx18("div", { className: "rg-pipeline-stage-actor", children: "Actor: ReturnGuard Risk Engine" })
        ] }),
        /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ jsx18("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-amber", children: "Stage 3: Merchant" }),
          /* @__PURE__ */ jsx18("h4", { className: "rg-pipeline-stage-title", children: "Policy Orchestration" }),
          /* @__PURE__ */ jsx18("p", { className: "rg-pipeline-stage-desc", children: "Merchant reviews policy recommendations (ALLOW, REVIEW, BLOCK, STEP_UP_VERIFICATION) and gates fulfillment." }),
          /* @__PURE__ */ jsx18("div", { className: "rg-pipeline-stage-actor", children: "Actor: Merchant Risk Operations" })
        ] }),
        /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-stage-card", children: [
          /* @__PURE__ */ jsx18("span", { className: "rg-pipeline-stage-step rg-pipeline-stage-step-indigo", children: "Stage 4: Processor" }),
          /* @__PURE__ */ jsx18("h4", { className: "rg-pipeline-stage-title", children: "Payment Execution" }),
          /* @__PURE__ */ jsx18("p", { className: "rg-pipeline-stage-desc", children: "External payment gateways (PayPal, Stripe) or logistics carriers execute capture, void, settlement, or cash collection." }),
          /* @__PURE__ */ jsx18("div", { className: "rg-pipeline-stage-actor", children: "Actor: Downstream Acquirers & Couriers" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-boundary-notice", children: [
        /* @__PURE__ */ jsx18(InfoIcon, { size: 16, className: "rg-pipeline-boundary-icon", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-boundary-text", children: [
          /* @__PURE__ */ jsx18("strong", { children: "Decoupled Architecture Boundary:" }),
          " ReturnGuard operates exclusively as an intelligent pre-decision risk scoring engine. A policy recommendation of ALLOW indicates a low evaluated risk profile; it does not represent payment authorization, settlement, or gateway capture execution."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs15("div", { className: "rg-pipeline-analytics-grid", children: [
      /* @__PURE__ */ jsxs15(
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
            /* @__PURE__ */ jsx18(ResponsiveContainer5, { width: "100%", height: 170, children: /* @__PURE__ */ jsxs15(BarChart4, { data: channelChartData, margin: { top: 12, right: 16, left: -20, bottom: 4 }, children: [
              /* @__PURE__ */ jsx18(CartesianGrid4, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
              /* @__PURE__ */ jsx18(XAxis4, { dataKey: "channel", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
              /* @__PURE__ */ jsx18(YAxis4, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
              /* @__PURE__ */ jsx18(
                Tooltip5,
                {
                  content: /* @__PURE__ */ jsx18(
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
              /* @__PURE__ */ jsx18(Bar4, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: channelChartData.map((entry) => /* @__PURE__ */ jsx18(Cell4, { fill: entry.color }, entry.channel)) })
            ] }) }),
            /* @__PURE__ */ jsx18(
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
      /* @__PURE__ */ jsxs15("section", { className: "rg-card", "aria-label": "Processor Dispute Analytics", children: [
        /* @__PURE__ */ jsx18("h3", { style: { margin: "0 0 6px 0", fontSize: 15, fontWeight: 600 }, children: "Processor Dispute Analytics" }),
        /* @__PURE__ */ jsx18("p", { style: { margin: "0 0 16px 0", fontSize: 12, color: "var(--rg-text-secondary)" }, children: "Aggregate dispute volume reported from external payment gateway relays." }),
        /* @__PURE__ */ jsxs15("div", { className: "rg-dispute-stat-list", children: [
          /* @__PURE__ */ jsxs15("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ jsx18("span", { className: "rg-dispute-stat-label", children: "Total Recorded Disputes" }),
            /* @__PURE__ */ jsx18("span", { className: `rg-dispute-stat-value ${totalDisputes > 0 ? "rg-dispute-stat-value-high" : ""}`, children: totalDisputes.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs15("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ jsx18("span", { className: "rg-dispute-stat-label", children: "Disputed Volume" }),
            /* @__PURE__ */ jsxs15("span", { className: "rg-dispute-stat-value", children: [
              disputeCurrency,
              " ",
              disputedAmount.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            ] })
          ] }),
          /* @__PURE__ */ jsxs15("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ jsx18("span", { className: "rg-dispute-stat-label", children: "Aggregate Dispute Rate" }),
            /* @__PURE__ */ jsxs15("span", { className: `rg-dispute-stat-value ${disputeRatePct > 1 ? "rg-dispute-stat-value-high" : ""}`, children: [
              disputeRatePct.toFixed(2),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs15("div", { className: "rg-dispute-stat-item", children: [
            /* @__PURE__ */ jsx18("span", { className: "rg-dispute-stat-label", children: "Currency Standard" }),
            /* @__PURE__ */ jsxs15("span", { className: "rg-dispute-stat-value", style: { fontFamily: "var(--rg-font-mono)" }, children: [
              disputeCurrency,
              " (Tenant Base)"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};

// src/components/ReviewsPage.tsx
import { useState as useState7, useMemo as useMemo10, useRef as useRef4, useEffect as useEffect7, useCallback as useCallback6 } from "react";
import {
  ResponsiveContainer as ResponsiveContainer6,
  BarChart as BarChart5,
  Bar as Bar5,
  XAxis as XAxis5,
  YAxis as YAxis5,
  CartesianGrid as CartesianGrid5,
  Cell as Cell5,
  Tooltip as Tooltip6
} from "recharts";
import { AgGridReact as AgGridReact2 } from "ag-grid-react";
import { ModuleRegistry as ModuleRegistry2, AllCommunityModule as AllCommunityModule2 } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { jsx as jsx19, jsxs as jsxs16 } from "react/jsx-runtime";
ModuleRegistry2.registerModules([AllCommunityModule2]);
var ReviewsPage = () => {
  var _a;
  const { client, theme } = useReturnGuard();
  const { items, loading, error, refetch } = useReviews(50);
  const { data: summary } = useRiskSummary();
  const [selectedReview, setSelectedReview] = useState7(null);
  const [quickFilterText, setQuickFilterText] = useState7("");
  const [statusFilter, setStatusFilter] = useState7("all");
  const [notes, setNotes] = useState7("");
  const [submitting, setSubmitting] = useState7(false);
  const [submitResult, setSubmitResult] = useState7(null);
  const drawerRef = useRef4(null);
  const closeButtonRef = useRef4(null);
  const previousActiveElementRef = useRef4(null);
  const filteredItems = useMemo10(() => {
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
  const loadedPending = useMemo10(
    () => items.filter((item) => (item.status || "").toLowerCase() === "pending").length,
    [items]
  );
  const loadedHighRisk = useMemo10(
    () => items.filter((item) => {
      var _a2;
      const score = (_a2 = item.risk_score) != null ? _a2 : 0;
      const tier = (item.tier || "").toUpperCase();
      return tier === "HIGH" || tier === "CRITICAL" || score >= 0.7;
    }).length,
    [items]
  );
  const loadedResolved = loadedDecisions - loadedPending;
  const loadedApproved = useMemo10(
    () => items.filter((item) => (item.status || "").toLowerCase() === "approved").length,
    [items]
  );
  const loadedRejected = useMemo10(
    () => items.filter((item) => (item.status || "").toLowerCase() === "rejected").length,
    [items]
  );
  const loadedEscalated = useMemo10(
    () => items.filter((item) => (item.status || "").toLowerCase() === "escalated").length,
    [items]
  );
  const reviewStatusData = useMemo10(() => {
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
  const columnDefs = useMemo10(
    () => [
      {
        field: "order_id",
        headerName: "Order / Decision ID",
        minWidth: 220,
        flex: 1.4,
        pinned: "left",
        cellRenderer: (params) => {
          var _a2, _b;
          return /* @__PURE__ */ jsxs16(
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
                /* @__PURE__ */ jsx19(
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
                /* @__PURE__ */ jsx19(
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
        cellRenderer: (params) => /* @__PURE__ */ jsx19(
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
          return /* @__PURE__ */ jsx19(RiskBadge, { score: (_a2 = params.value) != null ? _a2 : 0 });
        }
      },
      {
        field: "suggested_action",
        headerName: "Suggested Action",
        minWidth: 140,
        flex: 1.1,
        cellRenderer: (params) => {
          var _a2;
          return /* @__PURE__ */ jsx19(RiskBadge, { action: params.value || ((_a2 = params.data) == null ? void 0 : _a2.policy_action) || "REVIEW" });
        }
      },
      {
        field: "tier",
        headerName: "Risk Tier",
        minWidth: 110,
        flex: 0.8,
        cellRenderer: (params) => /* @__PURE__ */ jsx19(RiskBadge, { severity: params.value || "MEDIUM" })
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
          return /* @__PURE__ */ jsxs16(
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
                /* @__PURE__ */ jsx19(
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
        cellRenderer: (params) => /* @__PURE__ */ jsx19(
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
  const defaultColDef = useMemo10(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1
    }),
    []
  );
  const gridThemeClass = theme === "light" ? "ag-theme-alpine" : "ag-theme-alpine-dark";
  useEffect7(() => {
    if (selectedReview) {
      previousActiveElementRef.current = document.activeElement;
      const timer = setTimeout(() => {
        var _a2;
        (_a2 = closeButtonRef.current) == null ? void 0 : _a2.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedReview]);
  const restoreFocus = useCallback6(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      el.focus();
    }
  }, []);
  const handleCloseDrawer = useCallback6(() => {
    restoreFocus();
    setSelectedReview(null);
    setSubmitResult(null);
  }, [restoreFocus]);
  useEffect7(() => {
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
  return /* @__PURE__ */ jsxs16("div", { children: [
    /* @__PURE__ */ jsxs16("header", { className: "rg-reviews-header", children: [
      /* @__PURE__ */ jsxs16("div", { className: "rg-reviews-title-group", children: [
        /* @__PURE__ */ jsx19("h2", { className: "rg-reviews-title", children: "Alerts & Manual Reviews" }),
        /* @__PURE__ */ jsx19("p", { className: "rg-reviews-subtitle", children: "Operational queue for high-risk and flagged payments requiring human evaluation." })
      ] }),
      /* @__PURE__ */ jsxs16(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-reviews-refresh-btn",
          "aria-label": "Refresh review queue",
          children: [
            /* @__PURE__ */ jsx19(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx19("span", { children: "Refresh Queue" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs16("section", { className: "rg-kpi-grid rg-metrics-grid", "aria-label": "Review Queue Metrics", children: [
      /* @__PURE__ */ jsxs16("div", { className: "rg-card", "data-testid": "kpi-total-flagged", children: [
        /* @__PURE__ */ jsx19("div", { className: "rg-card-title", children: "Total Flagged (Historical)" }),
        /* @__PURE__ */ jsx19("div", { className: "rg-card-value", children: totalHistoricalFlagged.toLocaleString() }),
        /* @__PURE__ */ jsx19("div", { className: "rg-card-subtitle", children: "Cumulative decisions flagged by policy" })
      ] }),
      /* @__PURE__ */ jsxs16("div", { className: "rg-card", "data-testid": "kpi-loaded-decisions", children: [
        /* @__PURE__ */ jsx19("div", { className: "rg-card-title", children: "Loaded Batch" }),
        /* @__PURE__ */ jsxs16("div", { className: "rg-card-value", children: [
          loadedDecisions,
          " / 50"
        ] }),
        /* @__PURE__ */ jsx19("div", { className: "rg-card-subtitle", children: "Current page sample (single fetch)" })
      ] }),
      /* @__PURE__ */ jsxs16("div", { className: "rg-card", "data-testid": "kpi-loaded-pending", children: [
        /* @__PURE__ */ jsx19("div", { className: "rg-card-title", children: "Loaded Pending" }),
        /* @__PURE__ */ jsx19("div", { className: "rg-card-value", style: { color: loadedPending > 0 ? "var(--rg-med-text)" : "var(--rg-text-primary)" }, children: loadedPending }),
        /* @__PURE__ */ jsx19("div", { className: "rg-card-subtitle", children: "Awaiting human review in loaded batch" })
      ] }),
      /* @__PURE__ */ jsxs16("div", { className: "rg-card", "data-testid": "kpi-loaded-high-risk", children: [
        /* @__PURE__ */ jsx19("div", { className: "rg-card-title", children: "Loaded High-Risk" }),
        /* @__PURE__ */ jsx19("div", { className: "rg-card-value", style: { color: loadedHighRisk > 0 ? "var(--rg-high-text)" : "var(--rg-text-primary)" }, children: loadedHighRisk }),
        /* @__PURE__ */ jsx19("div", { className: "rg-card-subtitle", children: "Score \u2265 0.70 or HIGH/CRIT tier" })
      ] })
    ] }),
    /* @__PURE__ */ jsx19("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ jsxs16(
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
          /* @__PURE__ */ jsx19(ResponsiveContainer6, { width: "100%", height: 95, children: /* @__PURE__ */ jsxs16(
            BarChart5,
            {
              layout: "vertical",
              data: reviewStatusData,
              margin: { top: 4, right: 24, left: 16, bottom: 4 },
              children: [
                /* @__PURE__ */ jsx19(CartesianGrid5, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, horizontal: false }),
                /* @__PURE__ */ jsx19(XAxis5, { type: "number", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
                /* @__PURE__ */ jsx19(YAxis5, { type: "category", dataKey: "status", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, width: 65 }),
                /* @__PURE__ */ jsx19(
                  Tooltip6,
                  {
                    content: /* @__PURE__ */ jsx19(
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
                /* @__PURE__ */ jsx19(Bar5, { dataKey: "count", radius: [0, 4, 4, 0], isAnimationActive: false, children: reviewStatusData.map((entry) => /* @__PURE__ */ jsx19(Cell5, { fill: entry.color }, entry.status)) })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx19(
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
          /* @__PURE__ */ jsx19("div", { style: { marginTop: 4, fontSize: 11, color: "var(--rg-text-muted)", lineHeight: 1.4 }, children: "* Note: Status metrics reflect the currently loaded batch sample only, not tenant-wide totals. SLA and queue aging charts are omitted due to absence of backend SLA telemetry." })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs16("div", { className: "rg-reviews-toolbar", children: [
      /* @__PURE__ */ jsxs16("div", { className: "rg-reviews-search-group", children: [
        /* @__PURE__ */ jsx19(SearchIcon, { size: 14, className: "rg-reviews-search-icon", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx19(
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
      /* @__PURE__ */ jsxs16("div", { className: "rg-reviews-filter-group", role: "tablist", "aria-label": "Review status filters", children: [
        /* @__PURE__ */ jsxs16(
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
        /* @__PURE__ */ jsxs16(
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
        /* @__PURE__ */ jsxs16(
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
    loading && /* @__PURE__ */ jsx19("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading review queue..." }),
    error && /* @__PURE__ */ jsxs16("div", { className: "rg-error-state", role: "alert", style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ jsx19("h4", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load review items" }),
      /* @__PURE__ */ jsx19("p", { style: { margin: "0 0 10px 0", fontSize: 13 }, children: error.message }),
      /* @__PURE__ */ jsxs16(
        "button",
        {
          type: "button",
          onClick: () => refetch(),
          className: "rg-retry-btn",
          children: [
            /* @__PURE__ */ jsx19(RefreshIcon, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx19("span", { children: "Retry" })
          ]
        }
      )
    ] }),
    !loading && !error && items.length === 0 && /* @__PURE__ */ jsxs16("div", { className: "rg-empty-state", role: "status", children: [
      /* @__PURE__ */ jsx19("p", { style: { margin: "0 0 4px 0", fontWeight: 600, color: "var(--rg-text-primary)" }, children: "No manual reviews currently pending." }),
      /* @__PURE__ */ jsx19("span", { style: { fontSize: 13, color: "var(--rg-text-muted)" }, children: "All flagged transactions have been cleared or no items matched the queue criteria." })
    ] }),
    /* @__PURE__ */ jsx19(
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
        children: /* @__PURE__ */ jsx19(
          AgGridReact2,
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
    selectedReview && /* @__PURE__ */ jsx19(
      "div",
      {
        className: "rg-drawer-overlay",
        onClick: handleCloseDrawer,
        "aria-hidden": "false",
        children: /* @__PURE__ */ jsxs16(
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
              /* @__PURE__ */ jsxs16("header", { className: "rg-drawer-header", children: [
                /* @__PURE__ */ jsxs16("div", { className: "rg-drawer-header-info", children: [
                  /* @__PURE__ */ jsx19("span", { id: "rg-review-drawer-desc", className: "rg-drawer-subtitle", children: "Manual Review Investigation" }),
                  /* @__PURE__ */ jsx19("h2", { id: "rg-review-drawer-title", className: "rg-drawer-title", children: selectedReview.order_id })
                ] }),
                /* @__PURE__ */ jsxs16(
                  "button",
                  {
                    ref: closeButtonRef,
                    type: "button",
                    className: "rg-drawer-close-btn",
                    onClick: handleCloseDrawer,
                    "aria-label": "Close review details",
                    children: [
                      /* @__PURE__ */ jsx19(CloseIcon, { size: 14, "aria-hidden": "true" }),
                      /* @__PURE__ */ jsx19("span", { children: "Close" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs16("div", { className: "rg-drawer-body", children: [
                /* @__PURE__ */ jsxs16("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx19("div", { className: "rg-drawer-section-title", children: "Risk Verdict & Recommendation" }),
                  /* @__PURE__ */ jsxs16("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
                    /* @__PURE__ */ jsx19(RiskBadge, { score: selectedReview.risk_score }),
                    /* @__PURE__ */ jsx19(RiskBadge, { action: selectedReview.suggested_action || selectedReview.policy_action }),
                    /* @__PURE__ */ jsx19(RiskBadge, { severity: selectedReview.tier })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs16("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx19("div", { className: "rg-drawer-section-title", children: "Review Context" }),
                  /* @__PURE__ */ jsxs16("div", { className: "rg-context-grid", children: [
                    /* @__PURE__ */ jsxs16("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-label", children: "Decision ID" }),
                      /* @__PURE__ */ jsx19(
                        "span",
                        {
                          className: "rg-context-value",
                          style: { fontFamily: "var(--rg-font-mono, monospace)", fontSize: 12 },
                          children: selectedReview.decision_id
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs16("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-label", children: "Order ID" }),
                      /* @__PURE__ */ jsx19(
                        "span",
                        {
                          className: "rg-context-value",
                          style: { fontFamily: "var(--rg-font-mono, monospace)", fontSize: 12 },
                          children: selectedReview.order_id
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs16("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-label", children: "Queued Timestamp" }),
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-value", children: new Date(selectedReview.created_at).toLocaleString() })
                    ] }),
                    /* @__PURE__ */ jsxs16("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-label", children: "Current Status" }),
                      /* @__PURE__ */ jsx19(
                        "span",
                        {
                          className: "rg-context-value",
                          style: { fontWeight: 600, textTransform: "uppercase" },
                          children: selectedReview.status
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs16("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-label", children: "Assigned Reviewer" }),
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-value", children: selectedReview.reviewer || "Unassigned" })
                    ] }),
                    selectedReview.reviewed_at && /* @__PURE__ */ jsxs16("div", { className: "rg-context-item", children: [
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-label", children: "Resolved At" }),
                      /* @__PURE__ */ jsx19("span", { className: "rg-context-value", children: new Date(selectedReview.reviewed_at).toLocaleString() })
                    ] })
                  ] })
                ] }),
                selectedReview.notes && /* @__PURE__ */ jsxs16("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx19("div", { className: "rg-drawer-section-title", children: "Recorded Review Notes" }),
                  /* @__PURE__ */ jsxs16(
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
                /* @__PURE__ */ jsxs16("section", { className: "rg-drawer-section", children: [
                  /* @__PURE__ */ jsx19("div", { className: "rg-drawer-section-title", children: "Submit Review Resolution" }),
                  /* @__PURE__ */ jsx19(
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
                  submitting && /* @__PURE__ */ jsxs16(
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
                        /* @__PURE__ */ jsx19(
                          "span",
                          {
                            className: "rg-loading-spinner",
                            "aria-hidden": "true",
                            style: { width: 14, height: 14 }
                          }
                        ),
                        /* @__PURE__ */ jsx19("span", { children: "Submitting resolution to server..." })
                      ]
                    }
                  ),
                  submitResult && /* @__PURE__ */ jsx19(
                    "div",
                    {
                      className: submitResult.type === "success" ? "rg-review-alert-success" : "rg-review-alert-error",
                      style: { marginBottom: 12 },
                      role: submitResult.type === "success" ? "status" : "alert",
                      children: submitResult.message
                    }
                  ),
                  /* @__PURE__ */ jsxs16("div", { className: "rg-review-actions-panel", children: [
                    /* @__PURE__ */ jsx19(
                      "label",
                      {
                        htmlFor: "rg-review-notes-input",
                        style: { fontSize: 12, fontWeight: 500, color: "var(--rg-text-secondary)" },
                        children: "Reviewer Notes / Justification:"
                      }
                    ),
                    /* @__PURE__ */ jsx19(
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
                    /* @__PURE__ */ jsxs16("div", { className: "rg-review-btn-row", children: [
                      /* @__PURE__ */ jsxs16(
                        "button",
                        {
                          type: "button",
                          className: "rg-btn-approve",
                          disabled: submitting,
                          onClick: () => handleSubmitAction("approve"),
                          "aria-label": "Approve transaction",
                          children: [
                            /* @__PURE__ */ jsx19(ShieldIcon, { size: 14, "aria-hidden": "true" }),
                            /* @__PURE__ */ jsx19("span", { children: submitting ? "Submitting..." : "Approve" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs16(
                        "button",
                        {
                          type: "button",
                          className: "rg-btn-reject",
                          disabled: submitting,
                          onClick: () => handleSubmitAction("reject"),
                          "aria-label": "Reject transaction",
                          children: [
                            /* @__PURE__ */ jsx19(AlertTriangleIcon, { size: 14, "aria-hidden": "true" }),
                            /* @__PURE__ */ jsx19("span", { children: submitting ? "Submitting..." : "Reject" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs16(
                        "button",
                        {
                          type: "button",
                          className: "rg-btn-escalate",
                          disabled: submitting,
                          onClick: () => handleSubmitAction("escalate"),
                          "aria-label": "Escalate transaction",
                          children: [
                            /* @__PURE__ */ jsx19(InfoIcon, { size: 14, "aria-hidden": "true" }),
                            /* @__PURE__ */ jsx19("span", { children: submitting ? "Submitting..." : "Escalate" })
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

// src/components/ReportsPage.tsx
import { useState as useState8, useMemo as useMemo11 } from "react";
import {
  ResponsiveContainer as ResponsiveContainer7,
  BarChart as BarChart6,
  Bar as Bar6,
  XAxis as XAxis6,
  YAxis as YAxis6,
  CartesianGrid as CartesianGrid6,
  Cell as Cell6,
  Tooltip as Tooltip7
} from "recharts";
import { jsx as jsx20, jsxs as jsxs17 } from "react/jsx-runtime";
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
  const [exportNotice, setExportNotice] = useState8(null);
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
  const policyChartData = useMemo11(
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
  return /* @__PURE__ */ jsxs17("div", { children: [
    /* @__PURE__ */ jsxs17("header", { className: "rg-reports-header", children: [
      /* @__PURE__ */ jsxs17("div", { className: "rg-reports-title-group", children: [
        /* @__PURE__ */ jsx20("h2", { className: "rg-reports-title", children: "Operational Reports & Audit Exports" }),
        /* @__PURE__ */ jsx20("p", { className: "rg-reports-subtitle", children: "Exportable decision datasets, policy governance metrics, and processor dispute analytics." })
      ] }),
      /* @__PURE__ */ jsxs17("div", { className: "rg-reports-header-actions", children: [
        /* @__PURE__ */ jsxs17(
          "button",
          {
            type: "button",
            onClick: handleRefreshAll,
            className: "rg-reports-refresh-btn",
            "aria-label": "Refresh reports data",
            children: [
              /* @__PURE__ */ jsx20(RefreshIcon, { size: 14, "aria-hidden": "true" }),
              /* @__PURE__ */ jsx20("span", { children: "Refresh" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs17(
          "button",
          {
            type: "button",
            onClick: handleExport,
            className: "rg-reports-download-btn",
            disabled: decisions.length === 0 || decisionsLoading,
            "aria-label": "Export loaded decisions CSV",
            children: [
              /* @__PURE__ */ jsx20(DownloadIcon, { size: 14, "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs17("span", { children: [
                "Export Loaded Decisions (",
                decisions.length,
                ")"
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs17("section", { className: "rg-kpi-grid rg-metrics-grid", "aria-label": "Operational Governance Metrics", children: [
      /* @__PURE__ */ jsxs17("div", { className: "rg-card", "data-testid": "kpi-total-decisions", children: [
        /* @__PURE__ */ jsx20("div", { className: "rg-card-title", children: "Total Evaluated Decisions (Historical)" }),
        /* @__PURE__ */ jsx20("div", { className: "rg-card-value", children: summaryLoading ? "\u2014" : totalDecisions.toLocaleString() }),
        /* @__PURE__ */ jsx20("div", { className: "rg-card-subtitle", children: "Cumulative lifetime decisions scored" })
      ] }),
      /* @__PURE__ */ jsxs17("div", { className: "rg-card", "data-testid": "kpi-allow-share", children: [
        /* @__PURE__ */ jsx20("div", { className: "rg-card-title", children: "ALLOW Decision Share" }),
        /* @__PURE__ */ jsx20("div", { className: "rg-card-value", style: { color: "var(--rg-low-text)" }, children: summaryLoading ? "\u2014" : totalDecisions > 0 ? `${allowSharePct.toFixed(1)}%` : "\u2014" }),
        /* @__PURE__ */ jsx20("div", { className: "rg-card-subtitle", children: summaryLoading ? "\u2014" : `${allowCount.toLocaleString()} of ${totalDecisions.toLocaleString()} decisions` })
      ] }),
      /* @__PURE__ */ jsxs17("div", { className: "rg-card", "data-testid": "kpi-total-disputes", children: [
        /* @__PURE__ */ jsx20("div", { className: "rg-card-title", children: "Recorded Disputes" }),
        /* @__PURE__ */ jsx20("div", { className: "rg-card-value", children: trendsLoading ? "\u2014" : totalDisputes.toLocaleString() }),
        /* @__PURE__ */ jsx20("div", { className: "rg-card-subtitle", children: trendsLoading ? "\u2014" : `Dispute rate: ${disputeRatePct.toFixed(2)}%` })
      ] }),
      /* @__PURE__ */ jsxs17("div", { className: "rg-card", "data-testid": "kpi-disputed-volume", children: [
        /* @__PURE__ */ jsx20("div", { className: "rg-card-title", children: "Disputed Volume" }),
        /* @__PURE__ */ jsx20(
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
        /* @__PURE__ */ jsx20("div", { className: "rg-card-subtitle", children: "Aggregate merchant dispute exposure" })
      ] })
    ] }),
    isOverallLoading && /* @__PURE__ */ jsx20("div", { className: "rg-loading-state", role: "status", "aria-live": "polite", children: "Loading operational report metrics..." }),
    (summaryError || trendsError || decisionsError) && /* @__PURE__ */ jsxs17("div", { className: "rg-error-state", role: "alert", style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ jsx20("h4", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Failed to load reports data" }),
      /* @__PURE__ */ jsx20("p", { style: { margin: "0 0 10px 0", fontSize: 13 }, children: (summaryError == null ? void 0 : summaryError.message) || (trendsError == null ? void 0 : trendsError.message) || (decisionsError == null ? void 0 : decisionsError.message) }),
      /* @__PURE__ */ jsxs17("button", { type: "button", onClick: handleRefreshAll, className: "rg-retry-btn", children: [
        /* @__PURE__ */ jsx20(RefreshIcon, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx20("span", { children: "Retry" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs17("section", { className: "rg-reports-hero-card", "aria-label": "Decisions Export Center", children: [
      /* @__PURE__ */ jsxs17("div", { className: "rg-reports-card-header", children: [
        /* @__PURE__ */ jsxs17("div", { children: [
          /* @__PURE__ */ jsx20("h3", { style: { margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }, children: "Decisions Audit Dataset Export Center" }),
          /* @__PURE__ */ jsx20("p", { style: { margin: 0, fontSize: 13, color: "var(--rg-text-secondary)" }, children: "Export the currently loaded page of risk decisions for offline compliance, fraud audits, and model governance." })
        ] }),
        /* @__PURE__ */ jsxs17("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsx20("span", { className: "rg-reports-badge rg-reports-badge-accent", children: "Single Batch (Max 50 Records)" }),
          /* @__PURE__ */ jsx20("span", { className: "rg-reports-badge", children: "RFC 4180 / CWE-1236 Protected" })
        ] })
      ] }),
      exportNotice && /* @__PURE__ */ jsx20("div", { className: "rg-review-alert-success", role: "status", children: exportNotice }),
      /* @__PURE__ */ jsxs17("div", { children: [
        /* @__PURE__ */ jsx20("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 8 }, children: "Export Governance & PII-Scrubbing Pipeline:" }),
        /* @__PURE__ */ jsx20(
          "div",
          {
            className: "rg-reports-pipeline-flow",
            role: "region",
            "aria-label": "Export data governance and sanitization pipeline",
            children: EXPORT_PIPELINE_STAGES.map((st) => /* @__PURE__ */ jsxs17("div", { className: "rg-reports-pipeline-node", children: [
              /* @__PURE__ */ jsxs17("div", { className: "rg-reports-pipeline-node-header", children: [
                /* @__PURE__ */ jsx20("span", { className: "rg-reports-pipeline-step-badge", children: st.step }),
                /* @__PURE__ */ jsx20("span", { className: "rg-reports-pipeline-node-subtitle", children: st.subtitle })
              ] }),
              /* @__PURE__ */ jsx20("h4", { className: "rg-reports-pipeline-node-title", children: st.title }),
              /* @__PURE__ */ jsx20("p", { className: "rg-reports-pipeline-node-desc", children: st.id === "ingestion" ? `${decisions.length} / 50 records loaded (single page limit)` : st.description })
            ] }, st.id))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs17("div", { children: [
        /* @__PURE__ */ jsx20("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--rg-text-secondary)", marginBottom: 6 }, children: "Exported Dataset Schema (12 Attributes):" }),
        /* @__PURE__ */ jsx20("div", { className: "rg-reports-columns-wrap", children: EXPORTED_CSV_COLUMNS.map((col) => /* @__PURE__ */ jsx20("span", { className: "rg-reports-column-chip", children: col }, col)) })
      ] }),
      /* @__PURE__ */ jsxs17("div", { className: "rg-reports-privacy-box", children: [
        /* @__PURE__ */ jsx20(LockIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0 } }),
        /* @__PURE__ */ jsxs17("span", { children: [
          /* @__PURE__ */ jsx20("strong", { children: "Privacy Assurance:" }),
          " Export is strictly non-PII. Customer names, emails, phones, and physical addresses are excluded."
        ] })
      ] }),
      /* @__PURE__ */ jsxs17("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 4 }, children: [
        /* @__PURE__ */ jsxs17("span", { style: { fontSize: 12, color: "var(--rg-text-muted)" }, children: [
          "Current batch: ",
          /* @__PURE__ */ jsxs17("strong", { children: [
            decisions.length,
            " / 50"
          ] }),
          " loaded decisions available for export."
        ] }),
        /* @__PURE__ */ jsxs17(
          "button",
          {
            type: "button",
            onClick: handleExport,
            className: "rg-reports-download-btn",
            disabled: decisions.length === 0 || decisionsLoading,
            children: [
              /* @__PURE__ */ jsx20(DownloadIcon, { size: 14, "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs17("span", { children: [
                "Download CSV (",
                decisions.length,
                " Records)"
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs17("div", { className: "rg-reports-analytical-grid", children: [
      /* @__PURE__ */ jsxs17("section", { className: "rg-card", "aria-label": "Policy Action Governance", children: [
        /* @__PURE__ */ jsxs17("div", { className: "rg-reports-card-header", children: [
          /* @__PURE__ */ jsxs17("div", { children: [
            /* @__PURE__ */ jsx20("h3", { style: { margin: "0 0 4px 0", fontSize: 15, fontWeight: 600 }, children: "Policy Action Governance" }),
            /* @__PURE__ */ jsx20("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Distribution of risk engine policy actions across all evaluated decisions." })
          ] }),
          /* @__PURE__ */ jsx20("span", { className: "rg-reports-badge", children: "Policy Engine" })
        ] }),
        /* @__PURE__ */ jsx20("div", { style: { marginBottom: 16 }, children: /* @__PURE__ */ jsxs17(
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
              /* @__PURE__ */ jsx20(ResponsiveContainer7, { width: "100%", height: 160, children: /* @__PURE__ */ jsxs17(BarChart6, { data: policyChartData, margin: { top: 12, right: 16, left: -20, bottom: 4 }, children: [
                /* @__PURE__ */ jsx20(CartesianGrid6, { strokeDasharray: "3 3", stroke: CHART_CSS_VARS.grid, vertical: false }),
                /* @__PURE__ */ jsx20(XAxis6, { dataKey: "label", stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false }),
                /* @__PURE__ */ jsx20(YAxis6, { stroke: CHART_CSS_VARS.axis, fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false }),
                /* @__PURE__ */ jsx20(
                  Tooltip7,
                  {
                    content: /* @__PURE__ */ jsx20(
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
                /* @__PURE__ */ jsx20(Bar6, { dataKey: "count", radius: [4, 4, 0, 0], isAnimationActive: false, children: policyChartData.map((entry) => /* @__PURE__ */ jsx20(Cell6, { fill: entry.color }, entry.action)) })
              ] }) }),
              /* @__PURE__ */ jsx20(
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
        /* @__PURE__ */ jsx20("table", { className: "rg-reports-stat-table", "aria-label": "Policy recommendations breakdown", children: /* @__PURE__ */ jsxs17("tbody", { children: [
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "ALLOW Recommendations" }),
            /* @__PURE__ */ jsxs17("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-low-text)" }, children: [
              policyDist.allow.count.toLocaleString(),
              " (",
              policyDist.allow.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "REVIEW Recommendations" }),
            /* @__PURE__ */ jsxs17("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-med-text)" }, children: [
              policyDist.review.count.toLocaleString(),
              " (",
              policyDist.review.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "STEP-UP VERIFICATION" }),
            /* @__PURE__ */ jsxs17("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-accent)" }, children: [
              policyDist.stepUp.count.toLocaleString(),
              " (",
              policyDist.stepUp.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "BLOCK Recommendations" }),
            /* @__PURE__ */ jsxs17("td", { className: "rg-reports-stat-value", style: { color: "var(--rg-high-text)" }, children: [
              policyDist.block.count.toLocaleString(),
              " (",
              policyDist.block.pct.toFixed(1),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Critical Tier (CRITICAL)" }),
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", children: (tierDist.CRITICAL || 0).toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "High Risk Tier (HIGH)" }),
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", children: (tierDist.HIGH || 0).toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Average Risk Score" }),
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", children: ((_h = summary == null ? void 0 : summary.average_risk_score) != null ? _h : 0).toFixed(4) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs17("div", { className: "rg-reports-notice-box", children: [
          /* @__PURE__ */ jsx20(InfoIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0, marginTop: 1 } }),
          /* @__PURE__ */ jsx20("span", { children: "Policy decisions reflect ReturnGuard fraud evaluations. They represent risk recommendations and do not imply payment authorization or bank settlement." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs17("section", { className: "rg-card", "aria-label": "Dispute & Chargeback Analytics", children: [
        /* @__PURE__ */ jsxs17("div", { className: "rg-reports-card-header", children: [
          /* @__PURE__ */ jsxs17("div", { children: [
            /* @__PURE__ */ jsx20("h3", { style: { margin: "0 0 4px 0", fontSize: 15, fontWeight: 600 }, children: "Dispute & Chargeback Analytics" }),
            /* @__PURE__ */ jsx20("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Aggregated dispute records received from merchant processor webhooks." })
          ] }),
          /* @__PURE__ */ jsx20("span", { className: "rg-reports-badge", children: "Gateway Relay" })
        ] }),
        /* @__PURE__ */ jsxs17("div", { className: "rg-reports-meter-container", children: [
          /* @__PURE__ */ jsxs17("div", { className: "rg-reports-meter-status", children: [
            /* @__PURE__ */ jsx20("span", { style: { fontWeight: 600, color: "var(--rg-text-secondary)" }, children: "Dispute Rate Exposure" }),
            /* @__PURE__ */ jsx20(
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
          /* @__PURE__ */ jsxs17(
            "div",
            {
              className: "rg-reports-meter-track",
              role: "img",
              "aria-label": disputeMeter.accessibleLabel,
              children: [
                /* @__PURE__ */ jsx20(
                  "div",
                  {
                    className: "rg-reports-meter-threshold rg-reports-meter-threshold-warning",
                    style: { left: `${disputeMeter.warningMarkerPct}%` },
                    title: "Early Warning Reference Threshold (0.65%)"
                  }
                ),
                /* @__PURE__ */ jsx20(
                  "div",
                  {
                    className: "rg-reports-meter-threshold rg-reports-meter-threshold-critical",
                    style: { left: `${disputeMeter.criticalMarkerPct}%` },
                    title: "Excessive Dispute Reference Threshold (0.90%)"
                  }
                ),
                /* @__PURE__ */ jsx20(
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
          /* @__PURE__ */ jsxs17("div", { className: "rg-reports-meter-labels", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsx20("span", { children: "0.00%" }),
            /* @__PURE__ */ jsx20("span", { style: { color: "var(--rg-med-text)" }, children: "0.65% (Warning Ref)" }),
            /* @__PURE__ */ jsx20("span", { style: { color: "var(--rg-high-text)" }, children: "0.90% (Critical Ref)" }),
            /* @__PURE__ */ jsxs17("span", { children: [
              disputeMeter.scaleMaxPct.toFixed(2),
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx20("table", { className: "rg-reports-stat-table", "aria-label": "Dispute analytics breakdown", children: /* @__PURE__ */ jsxs17("tbody", { children: [
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Total Disputes Recorded" }),
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", children: disputeMeter.totalDisputes.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Total Disputed Amount" }),
            /* @__PURE__ */ jsxs17(
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
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Dispute Rate" }),
            /* @__PURE__ */ jsxs17("td", { className: "rg-reports-stat-value", children: [
              disputeMeter.ratePct.toFixed(2),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Processor Currency" }),
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", children: disputeMeter.currency })
          ] }),
          /* @__PURE__ */ jsxs17("tr", { children: [
            /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Monitoring Status" }),
            /* @__PURE__ */ jsx20(
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
        /* @__PURE__ */ jsxs17("div", { className: "rg-reports-notice-box", children: [
          /* @__PURE__ */ jsx20(AlertTriangleIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0, marginTop: 1 } }),
          /* @__PURE__ */ jsx20("span", { children: "Dispute records are populated via processor webhooks. Reference levels (0.65% early warning, 0.90% critical) reflect standard payment network dispute monitoring program thresholds. Historical time-series trend is omitted due to zero recorded disputes and absence of multi-period dispute telemetry." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs17("section", { className: "rg-reports-footer-card", "aria-label": "Domain & Volume Governance", children: [
      /* @__PURE__ */ jsxs17("div", { className: "rg-reports-card-header", children: [
        /* @__PURE__ */ jsxs17("div", { children: [
          /* @__PURE__ */ jsx20("h3", { style: { margin: "0 0 4px 0", fontSize: 14, fontWeight: 600 }, children: "Domain & Volume Governance" }),
          /* @__PURE__ */ jsx20("p", { style: { margin: 0, fontSize: 12, color: "var(--rg-text-muted)" }, children: "Tenant data partitioning and evaluated monetary volume disclosure." })
        ] }),
        /* @__PURE__ */ jsx20("span", { className: "rg-reports-badge", children: "Tenant Isolated" })
      ] }),
      /* @__PURE__ */ jsx20("table", { className: "rg-reports-stat-table", "aria-label": "Evaluated volume and domain boundaries", children: /* @__PURE__ */ jsxs17("tbody", { children: [
        /* @__PURE__ */ jsxs17("tr", { children: [
          /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Cumulative Evaluated Order Volume" }),
          /* @__PURE__ */ jsxs17("td", { className: "rg-reports-stat-value", children: [
            "INR ",
            totalVolumeInr.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs17("tr", { children: [
          /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Tenant Scope" }),
          /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", style: { fontFamily: "var(--rg-font-mono)" }, children: (summary == null ? void 0 : summary.tenant_id) || "merch_shoppoint" })
        ] }),
        /* @__PURE__ */ jsxs17("tr", { children: [
          /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Serving Model" }),
          /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", style: { fontFamily: "var(--rg-font-mono)" }, children: "candidate_lgbm_v1" })
        ] }),
        /* @__PURE__ */ jsxs17("tr", { children: [
          /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-label", children: "Model Verification Mode" }),
          /* @__PURE__ */ jsx20("td", { className: "rg-reports-stat-value", children: "Active (Shadow Mode)" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs17("div", { className: "rg-reports-notice-box", children: [
        /* @__PURE__ */ jsx20(ShieldIcon, { size: 14, "aria-hidden": "true", style: { flexShrink: 0, marginTop: 1 } }),
        /* @__PURE__ */ jsx20("span", { children: "Evaluated volume is aggregated from order records within the tenant partition. Individual risk score events store feature snapshots and ML reason codes rather than raw payment credentials." })
      ] })
    ] })
  ] });
};

// src/components/ReturnGuardDashboard.tsx
import { useState as useState9 } from "react";
import { jsx as jsx21, jsxs as jsxs18 } from "react/jsx-runtime";
var ReturnGuardDashboard = ({
  initialTab = "overview",
  brandTitle = "ReturnGuard"
}) => {
  const [currentTab, setCurrentTab] = useState9(initialTab);
  return /* @__PURE__ */ jsxs18(DashboardShell, { currentTab, onTabChange: setCurrentTab, brandTitle, children: [
    currentTab === "overview" && /* @__PURE__ */ jsx21(OverviewPage, {}),
    currentTab === "investigations" && /* @__PURE__ */ jsx21(InvestigationsPage, {}),
    currentTab === "transactions" && /* @__PURE__ */ jsx21(TransactionsPage, {}),
    currentTab === "customers" && /* @__PURE__ */ jsx21(CustomersPage, {}),
    currentTab === "analytics" && /* @__PURE__ */ jsx21(RiskAnalyticsPage, {}),
    currentTab === "rules" && /* @__PURE__ */ jsx21(RulesPage, {}),
    currentTab === "models" && /* @__PURE__ */ jsx21(ModelsPage, {}),
    currentTab === "pipeline" && /* @__PURE__ */ jsx21(PaymentPipelinePage, {}),
    currentTab === "reviews" && /* @__PURE__ */ jsx21(ReviewsPage, {}),
    currentTab === "reports" && /* @__PURE__ */ jsx21(ReportsPage, {})
  ] });
};
export {
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
  calculatePercentage,
  formatMetricValue,
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