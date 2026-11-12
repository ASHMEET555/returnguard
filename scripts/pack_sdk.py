"""Script to build and pack @returnguard/sdk tarball and compute SHA-256 checksum."""

import hashlib
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SDK_DIR = os.path.join(ROOT, "packages", "sdk")
DOWNLOADS_DIR = os.path.join(ROOT, "web", "public", "downloads")

os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# 1. npm pack
cmd = ["npm", "pack", "--pack-destination", DOWNLOADS_DIR, SDK_DIR]
proc = subprocess.run(cmd, capture_output=True, text=True, shell=True)
if proc.returncode != 0:
    print("Failed to run npm pack:", proc.stderr)
    sys.exit(1)

# Find generated tgz
packed_name = None
for line in proc.stdout.strip().splitlines():
    if line.endswith(".tgz"):
        packed_name = line.strip()

if not packed_name:
    # Look for returnguard-sdk-*.tgz
    for f in os.listdir(DOWNLOADS_DIR):
        if f.startswith("returnguard-sdk") and f.endswith(".tgz") and f != "returnguard-sdk.tgz":
            packed_name = f
            break

if packed_name:
    src = os.path.join(DOWNLOADS_DIR, packed_name)
    dst = os.path.join(DOWNLOADS_DIR, "returnguard-sdk.tgz")
    shutil.copyfile(src, dst)
    with open(dst, "rb") as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    with open(os.path.join(DOWNLOADS_DIR, "returnguard-sdk.tgz.sha256"), "w") as f:
        f.write(digest + "\n")
    print(f"Packaged returnguard-sdk.tgz successfully. SHA-256: {digest}")
