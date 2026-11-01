import os
import hashlib
import json

def generate_manifest():
    manifest = {
        "source_repo": "https://github.com/ASHMEET555/merchantshield-ai",
        "source_commit": "f9a4333b4136d5d0dfcd3e4cfb018e07a3b3599f",
        "artifacts": {}
    }

    models_dir = "ml/models"
    for fname in sorted(os.listdir(models_dir)):
        fpath = os.path.join(models_dir, fname)
        if os.path.isfile(fpath):
            with open(fpath, "rb") as f:
                data = f.read()
            sha256 = hashlib.sha256(data).hexdigest()
            norm_path = fpath.replace("\\", "/")
            manifest["artifacts"][norm_path] = {
                "file_path": norm_path,
                "size_bytes": len(data),
                "sha256": sha256,
                "source_path": "merchantshield-ai/" + norm_path,
                "frozen": True,
            }

    os.makedirs("reports", exist_ok=True)
    with open("reports/artifact_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Generated reports/artifact_manifest.json with {len(manifest['artifacts'])} artifacts:")
    for k, v in manifest["artifacts"].items():
        print(f"  {k}: {v['sha256']} ({v['size_bytes']} bytes)")

if __name__ == "__main__":
    generate_manifest()
