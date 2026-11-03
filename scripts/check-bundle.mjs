#!/usr/bin/env node
/**
 * Bundle verification script:
 * 1. Checks that no secrets, hardcoded API keys, or private tokens exist in dist/.
 * 2. Checks that React is NOT imported anywhere in dist/.
 * 3. Parses dist output using Acorn to verify strict ES2017 syntax compliance.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const acorn = require(path.resolve(__dirname, "../packages/sdk/node_modules/acorn"));

const DIST_DIR = path.resolve(__dirname, "../packages/sdk/dist");

if (!fs.existsSync(DIST_DIR)) {
  console.error(`Dist directory not found: ${DIST_DIR}. Run build first.`);
  process.exit(1);
}

const files = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith(".js") || f.endsWith(".cjs") || f.endsWith(".mjs"));

if (files.length === 0) {
  console.error("No JS bundle files found in dist.");
  process.exit(1);
}

let hasError = false;

for (const file of files) {
  const filePath = path.join(DIST_DIR, file);
  const content = fs.readFileSync(filePath, "utf-8");

  // 1. Secrets check
  const secretPatterns = [
    /rg_live_[a-zA-Z0-9_\-]{16,}/g,
    /rg_test_[a-zA-Z0-9_\-]{16,}/g,
    /super_secure_embed/g,
    /eyJ[a-zA-Z0-9_\-]{20,}\.eyJ/g, // Raw JWT
  ];

  for (const pat of secretPatterns) {
    if (pat.test(content)) {
      console.error(`[FAIL] File ${file} contains matched secret or hardcoded token pattern: ${pat}`);
      hasError = true;
    }
  }

  // 2. React import check
  const reactPatterns = [
    /from\s+["']react["']/g,
    /require\(["']react["']\)/g,
    /from\s+["']react-dom["']/g,
    /require\(["']react-dom["']\)/g,
  ];

  for (const pat of reactPatterns) {
    if (pat.test(content)) {
      console.error(`[FAIL] File ${file} contains Forbidden React import: ${pat}`);
      hasError = true;
    }
  }

  // 3. Acorn ES2017 parsing check
  try {
    const isEsm = file.endsWith(".js") || file.endsWith(".mjs");
    acorn.parse(content, {
      ecmaVersion: 2017,
      sourceType: isEsm ? "module" : "script",
    });
    console.log(`[PASS] ${file} satisfies strict ES2017 syntax`);
  } catch (parseErr) {
    console.error(`[FAIL] File ${file} failed ES2017 Acorn parse:`, parseErr);
    hasError = true;
  }
}

if (hasError) {
  console.error("Bundle checks failed!");
  process.exit(1);
} else {
  console.log("All bundle checks passed (no secrets, no React, strict ES2017).");
}
