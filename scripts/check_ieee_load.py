"""Script to verify IEEE-CIS dataset loading via IEEE_DATA_DIR environment variable."""

import os
import sys

def check_ieee_load():
    data_dir = os.environ.get("IEEE_DATA_DIR")
    if not data_dir:
        print("[ieee_check] IEEE_DATA_DIR environment variable is NOT set.")
        print("[ieee_check] IEEE-CIS dataset presence: UNVERIFIED (environment variable missing).")
        print("[ieee_check] TransactionAmt currency: UNVERIFIED (no stated currency in IEEE-CIS specification).")
        return {
            "status": "UNVERIFIED",
            "reason": "IEEE_DATA_DIR environment variable not set",
            "currency": "UNVERIFIED"
        }

    txn_path = os.path.join(data_dir, "train_transaction.csv")
    id_path = os.path.join(data_dir, "train_identity.csv")

    if not os.path.exists(txn_path):
        print(f"[ieee_check] train_transaction.csv not found at {txn_path}.")
        print("[ieee_check] IEEE-CIS dataset presence: UNVERIFIED (files not found).")
        print("[ieee_check] TransactionAmt currency: UNVERIFIED (no stated currency in IEEE-CIS specification).")
        return {
            "status": "UNVERIFIED",
            "reason": f"File not found: {txn_path}",
            "currency": "UNVERIFIED"
        }

    import pandas as pd
    print(f"[ieee_check] Loading {txn_path}...")
    df_txn = pd.read_csv(txn_path, usecols=["TransactionID", "isFraud", "TransactionAmt"])
    n_rows = len(df_txn)
    n_fraud = int(df_txn["isFraud"].sum())

    print(f"[ieee_check] Rows loaded: {n_rows:,} (Expected: 590,540)")
    print(f"[ieee_check] Fraud labels: {n_fraud:,} (Expected: 20,663)")
    print(f"[ieee_check] TransactionAmt currency: UNVERIFIED (IEEE-CIS schema does not specify currency)")

    id_present = os.path.exists(id_path)
    n_id = None
    if id_present:
        df_id = pd.read_csv(id_path, usecols=["TransactionID"])
        n_id = len(df_id)
        print(f"[ieee_check] Identity rows loaded: {n_id:,} (Expected: 144,233)")

    return {
        "status": "VERIFIED" if (n_rows == 590540 and n_fraud == 20663) else "ROW_COUNT_MISMATCH",
        "rows": n_rows,
        "fraud_labels": n_fraud,
        "identity_rows": n_id,
        "currency": "UNVERIFIED"
    }

if __name__ == "__main__":
    check_ieee_load()
