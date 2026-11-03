"""In-memory sliding-window rate limiter (Phase E-4).

Provides per-key rate limiting for protected API endpoints.
Enforces RATE_LIMIT_PER_MINUTE (default: 60) with sub-millisecond in-memory
sliding-window tracking and thread-safe lock.
"""

import os
import threading
import time
from typing import Dict, List, Tuple


class InMemoryRateLimiter:
    """Thread-safe sliding-window in-memory rate limiter."""

    def __init__(self, window_seconds: float = 60.0):
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._history: Dict[str, List[float]] = {}

    def get_limit(self) -> int:
        """Fetch configured rate limit per minute from environment or default."""
        try:
            return int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
        except (ValueError, TypeError):
            return 60

    def check(self, key_id: str) -> Tuple[bool, int]:
        """Check whether key_id is within rate limit.

        Returns:
            Tuple[bool, int]: (is_allowed, retry_after_seconds)
        """
        limit = self.get_limit()
        # Non-positive limit disables rate limiting
        if limit <= 0:
            return True, 0

        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            timestamps = self._history.get(key_id, [])
            # Evict expired timestamps
            valid_timestamps = [ts for ts in timestamps if ts > cutoff]

            if len(valid_timestamps) >= limit:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                self._history[key_id] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            self._history[key_id] = valid_timestamps
            return True, 0

    def reset(self):
        """Reset all rate limiter state (useful for test isolation)."""
        with self._lock:
            self._history.clear()


# Global singleton instance
_rate_limiter = InMemoryRateLimiter()


def get_rate_limiter() -> InMemoryRateLimiter:
    """Get global rate limiter instance."""
    return _rate_limiter
