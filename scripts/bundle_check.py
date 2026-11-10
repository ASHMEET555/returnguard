"""Checks Next.js production build artifacts for accidental secret token leakage."""

import os
import re
import sys

NEXT_BUILD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web", ".next")

# Patterns to forbid in frontend bundle:
FORBIDDEN_PATTERNS = [
    re.compile(r"rg_live_[a-zA-Z0-9_-]{20,}"),  # Real live key pattern
    re.compile(r"rg_admin_[a-zA-Z0-9_-]{20,}"), # Real admin token pattern
    re.compile(r"RG_ADMIN_TOKEN\s*=\s*['\"][^'\"]{10,}['\"]"),
]

def scan_bundle():
    if not os.path.isdir(NEXT_BUILD_DIR):
        print(f"Error: {NEXT_BUILD_DIR} does not exist. Run 'npm run build' first.")
        sys.exit(1)

    violations = []
    scanned_files = 0

    for root, _, files in os.walk(NEXT_BUILD_DIR):
        for f in files:
            if f.endswith((".js", ".html", ".json", ".map")):
                scanned_files += 1
                file_path = os.path.join(root, f)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as handle:
                        content = handle.read()
                        for pattern in FORBIDDEN_PATTERNS:
                            matches = pattern.findall(content)
                            # Exclude benign placeholders if any
                            real_matches = [
                                m for m in matches 
                                if "XXXXXXXX" not in m and "<your-admin-token" not in m and "placeholder" not in m
                            ]
                            if real_matches:
                                violations.append((file_path, real_matches))
                except Exception as exc:
                    print(f"Warning: could not read {file_path}: {exc}")

    print(f"Scanned {scanned_files} bundle files in {NEXT_BUILD_DIR}.")
    if violations:
        print("FAIL: Secret leakage detected in production bundle!")
        for path, leaks in violations:
            print(f"  {path}: {leaks}")
        sys.exit(1)
    else:
        print("PASS: Zero secret keys or admin tokens leaked in bundle.")

if __name__ == "__main__":
    scan_bundle()
