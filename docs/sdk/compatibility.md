# ReturnGuard SDK Runtime & Environment Compatibility

## Supported Environments
- **Node.js**: $\ge 20.0.0$ (ESM and CommonJS supported).
- **Modern Browsers**: Chrome, Firefox, Edge, Safari (all ES2017+ capable browsers).
- **Edge Runtimes**: Cloudflare Workers, Vercel Edge Runtime, Deno, Bun.

## Language and Syntax Targets
- **Target ECMAScript**: ES2017. Verified using AST verification with Acorn (`scripts/check-bundle.mjs`).
- **Module System**: Dual-format bundle:
  - ECMAScript Modules (`dist/index.js`)
  - CommonJS (`dist/index.cjs`)
  - TypeScript Types (`dist/index.d.ts`, `dist/index.d.cts`)

## Dependencies & Decoupling
- **Zero Runtime Dependencies**: `@returnguard/sdk` relies strictly on native platform primitives (`fetch`, `AbortController`, `URLSearchParams`).
- **Decoupled from Frameworks**: Zero dependencies on React, Vue, Angular, or backend frameworks. Phase G owns all React components.
- **In-Memory Token Storage**: No dependencies on `window.localStorage`, `window.sessionStorage`, or `indexedDB`, maintaining complete SSR compatibility and security against XSS token harvesting.
