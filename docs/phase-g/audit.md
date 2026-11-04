# ReturnGuard Phase G — Repository & Compatibility Audit

## 1. Environment & Dependencies Summary

- **Root Framework / Web App:** `web/` running Next.js 16.4.3, React 19.3.0, TypeScript 5.
- **ShopPoint / Frontend Reference:** `merchantshield-ai/frontend/` running React 19.2.8, Vite 8.
- **AG Grid Version:** AG Grid Community `36.2.0` (`ag-grid-community` & `ag-grid-react` installed in `web/package.json`).
- **Core SDK Package:** `packages/sdk` version `0.1.0` (zero runtime dependencies, dual ESM/CJS output, strict ES2017 compliant).
- **React SDK Target:** `packages/react` version `0.1.0` (`@returnguard/react`), depending on `@returnguard/sdk` and peer-dependent on `react >= 16.13 || >= 17 || >= 18 || >= 19`.

## 2. AG Grid Licensing & Community Boundaries

Audit conducted via official `ag-grid` MCP server (v32-36):
- **Allowed Community Features:**
  - Standard Client & Infinite/Cursor-driven Row Models
  - Column Sorting, Filtering, Resizing, Reordering, Visibility
  - Custom Cell Renderers (Risk Badge, Policy Action, Timestamps, Currency)
  - Quick Filter text search
  - CSV export of client rows via `gridApi.exportDataAsCsv()`
  - Single & Multiple Row Selection with selection events
- **Enterprise Features Strictly Prohibited (Licensing boundary):**
  - Master/Detail view (Must use custom React Sliding Drawer component instead)
  - Row Grouping & Aggregation
  - Range Selection & Context Menus
  - Server-Side Row Model (SSRM) Enterprise Beans
  - Set Filter (Use Community Text / Number / Filter components)

## 3. API Contract & Tenant Isolation

Verified against Phase F endpoints:
- `POST /v1/score`: Score transaction, returns decision, risk score, severity, suggested action, model version, explanation. (Requires server API key; embed tokens rejected with 403).
- `POST /v1/auth/embed-tokens`: Issues HS256 scoped JWT for client embed.
- `GET /v1/decisions`: Cursor-paginated decision list (`limit`, `cursor`), tenant-isolated.
- `GET /v1/decisions/{id}`: Single decision details.
- `GET /v1/decisions/{id}/audit`: Full reconstruction of features, rules, scoring events.
- `GET /v1/reviews`: Review queue items.
- `POST /v1/reviews/{id}`: Submit manual review decision.
- `GET /v1/analytics/summary`: Aggregate transaction metrics, volume, flagged rates.
- `GET /v1/models/performance`: Synthetic & IEEE evaluation metrics with `reproduction_status` and honest limits note.

## 4. Compatibility Findings

- The React package `@returnguard/react` will be built with `tsup` targeting ESM and CJS with TypeScript declarations.
- Peer dependencies will accommodate React 18/19 while maintaining compatibility down to React 16.14.
- Zero secrets or tenant-override bypasses will be present in frontend client builds.
