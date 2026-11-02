# Legacy Artifacts & Reference Code

> **IMPORTANT**: Files in this directory are preserved strictly for historical reference, auditability, and comparative research.
> **No code in this directory is imported, called, or executed anywhere in the active ReturnGuard codebase.**

## Contents

- `data_generator/`: Prior Cash-on-Delivery (COD) / Return-to-Origin (RTO) synthetic generator and world simulator.
- `parquet_split/`: Prior COD train/val/test parquet splits and manifest.
- `features_builder_old.py`: Prior 18/31-feature COD feature builder.
- `dictionary_cod_legacy.yaml`: Prior COD feature dictionary.
- `rules/`: Prior rules implementation (`spike_cod_heavy`, `spike_micro`).
- `scripts/`: Prior CLI scripts (`inspect_order_old.py`).
- `tests/`: Prior unit tests exercising legacy COD components (`test_features.py`, `test_generator.py`, `test_leakage.py`, `test_rings.py`).

ReturnGuard's active ML feature extraction, models, and decision pipelines are located under `ml/`, `features/`, `backend/`, and `rules/`.
