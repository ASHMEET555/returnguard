"""Completeness checker and configuration loader for dispute evidence (Phase I)."""

from pathlib import Path
from typing import Any, Dict, List, Set, Tuple
import yaml

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "evidence_types.yaml"


def load_evidence_config() -> Dict[str, Any]:
    """Loads config/evidence_types.yaml."""
    if not CONFIG_PATH.exists():
        return {"evidence_types": {}, "document_kinds": {}}
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def get_required_and_optional_kinds(reason_code: str) -> Tuple[List[str], List[str]]:
    """Returns (required_kinds, optional_kinds) for a given dispute reason_code."""
    cfg = load_evidence_config()
    types_map = cfg.get("evidence_types", {})

    # Match exact reason or check normalized key
    norm_key = (reason_code or "").strip().upper()
    type_info = types_map.get(norm_key)

    if not type_info:
        # Fallback to DEFAULT
        type_info = types_map.get("DEFAULT", {})

    required = list(type_info.get("required_kinds", []))
    optional = list(type_info.get("optional_kinds", []))
    return required, optional


def check_completeness(
    reason_code: str,
    present_evidence_types: List[str],
) -> Dict[str, Any]:
    """
    Evaluates evidence completeness for a dispute.

    Returns:
    - required: list of required document kinds
    - optional: list of optional document kinds
    - present: list of present document kinds from stored rows
    - missing: list of missing required document kinds
    - completeness_pct: float percentage (100.0 if no required, else (present_req / total_req) * 100)
    """
    required, optional = get_required_and_optional_kinds(reason_code)
    present_set: Set[str] = {t.strip().upper() for t in present_evidence_types if t}

    required_set: Set[str] = set(required)
    missing = [req for req in required if req not in present_set]

    total_required = len(required)
    if total_required == 0:
        completeness_pct = 100.0
    else:
        present_required = total_required - len(missing)
        completeness_pct = round((present_required / total_required) * 100.0, 2)

    return {
        "reason_code": reason_code,
        "required_kinds": required,
        "optional_kinds": optional,
        "present_kinds": sorted(list(present_set)),
        "missing_kinds": missing,
        "completeness_pct": completeness_pct,
        "is_complete": len(missing) == 0,
    }
