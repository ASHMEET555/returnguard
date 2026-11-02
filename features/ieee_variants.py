"""
IEEE Feature Set Variants for Phase C3 exploration.
All features adhere strictly to point-in-time causality:
- Derived strictly from prior rows (j < i)
- Zero dependency on fraud labels (is_fraud)
- Non-leaking transformations (log1p of current amount, causal expanding counters)
"""

import numpy as np
import pandas as pd
from ml.features.build_features import FEATURE_COLUMNS
from ml.external.ieee.card_product_features import (
    build_card_product_features,
    NEW_FEATURE_NAMES,
)

# Baseline Phase 17 feature set (16 features)
FEATURES_F0_BASE16 = list(FEATURE_COLUMNS) + ["card_product_share"]

# Variant 1: Base 15 + All 3 Card-Product Familiarity Features (18 features)
FEATURES_F1_ALLCP = list(FEATURE_COLUMNS) + [
    "card_product_prior_count",
    "card_product_seen_before",
    "card_product_share",
]

# Variant 2: Base 15 + card_product_share + log_amount (17 features)
FEATURES_F2_LOGAMT = list(FEATURE_COLUMNS) + [
    "card_product_share",
    "log_amount",
]

# Variant 3: Full augmented set (19 features)
FEATURES_F3_FULL = list(FEATURE_COLUMNS) + [
    "card_product_prior_count",
    "card_product_seen_before",
    "card_product_share",
    "log_amount",
]


def add_ieee_variants(df: pd.DataFrame) -> pd.DataFrame:
    """
    Constructs variant features causally:
    1. Sorts by TransactionDT to guarantee chronological causality
    2. Runs build_card_product_features for card_product_prior_count, seen_before, share
    3. Calculates log_amount = log1p(max(0, amount))
    Returns a copy with all candidate feature columns attached.
    """
    sorted_df = df.sort_values("TransactionDT").reset_index(drop=True)
    out = build_card_product_features(sorted_df)
    # log_amount is instantaneous per-row (same as amount, causal)
    out["log_amount"] = np.log1p(np.maximum(0.0, out["amount"].fillna(0.0).values))
    return out
