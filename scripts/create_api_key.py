"""API Key generation and revocation CLI tool for ReturnGuard.

Usage:
    # Create key:
    python scripts/create_api_key.py --merchant-id merch_001 --name "Demo Key"

    # Revoke key:
    python scripts/create_api_key.py --revoke key_1234567890abcdef
"""

import argparse
import datetime
import hashlib
import os
import secrets
import sys
import uuid

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.migrations import run_migrations
from db.models import APIKey, Merchant
from db.session import SessionLocal, engine


def create_key(merchant_id: str, name: str, prefix: str = "rg_live_") -> tuple[str, str, str]:
    """Generates an API key, persists its SHA-256 hash, and returns (key_id, merchant_id, plain_key)."""
    if merchant_id == "merch_legacy":
        raise ValueError("Cannot provision API keys for legacy migration sentinel 'merch_legacy'")
    db = SessionLocal()
    try:
        # 1. Ensure merchant exists
        merchant = db.query(Merchant).filter_by(id=merchant_id).first()
        if not merchant:
            merchant = Merchant(
                id=merchant_id,
                name=f"Merchant {merchant_id}",
                email=f"{merchant_id}@example.com",
            )
            db.add(merchant)
            db.flush()

        # 2. Generate secret token (at least 32 bytes URL-safe)
        random_secret = secrets.token_urlsafe(32)
        plain_key = f"{prefix}{random_secret}"
        key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
        key_id = f"key_{uuid.uuid4().hex[:16]}"

        # 3. Store prefix and hash only
        api_key_record = APIKey(
            id=key_id,
            merchant_id=merchant_id,
            key_prefix=prefix,
            key_hash=key_hash,
            name=name,
            is_active=True,
            created_at=datetime.datetime.now(datetime.UTC),
            revoked_at=None,
        )
        db.add(api_key_record)
        db.commit()

        return key_id, merchant_id, plain_key
    finally:
        db.close()


def revoke_key(key_id: str) -> bool:
    """Revokes an API key by setting revoked_at timestamp and is_active to False. No deletion."""
    db = SessionLocal()
    try:
        api_key = db.query(APIKey).filter_by(id=key_id).first()
        if not api_key:
            print(f"Error: API key with ID '{key_id}' not found.", file=sys.stderr)
            return False

        if not api_key.is_active or api_key.revoked_at is not None:
            print(f"API key '{key_id}' is already revoked.", file=sys.stderr)
            return True

        api_key.is_active = False
        api_key.revoked_at = datetime.datetime.now(datetime.UTC)
        db.commit()
        return True
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="ReturnGuard API Key Management (create and revoke)."
    )
    parser.add_argument(
        "--merchant-id",
        type=str,
        help="Merchant ID to associate with the new API key",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="Default API Key",
        help="Human-readable label for the API key",
    )
    parser.add_argument(
        "--prefix",
        type=str,
        default="rg_live_",
        help="Prefix for the generated key (default: rg_live_)",
    )
    parser.add_argument(
        "--revoke",
        type=str,
        metavar="KEY_ID",
        help="Revoke the API key with the specified ID (sets revoked_at; does not delete)",
    )

    args = parser.parse_args()

    # Ensure database schema is up-to-date
    run_migrations(engine)

    if args.revoke:
        success = revoke_key(args.revoke)
        if success:
            print(f"API key '{args.revoke}' successfully revoked.")
            sys.exit(0)
        else:
            sys.exit(1)

    if not args.merchant_id:
        parser.error("--merchant-id is required when creating a new API key.")

    key_id, merchant_id, plain_key = create_key(
        merchant_id=args.merchant_id,
        name=args.name,
        prefix=args.prefix,
    )

    print("==================================================")
    print("ReturnGuard API Key Created Successfully")
    print("==================================================")
    print(f"Key ID:      {key_id}")
    print(f"Merchant ID: {merchant_id}")
    print(f"Plain Key:   {plain_key}")
    print("==================================================")
    print("IMPORTANT: Store this key securely. It cannot be retrieved again.")


if __name__ == "__main__":
    main()
