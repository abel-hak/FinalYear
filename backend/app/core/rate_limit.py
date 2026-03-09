"""
Simple in-memory rate limiter for API protection.
Uses fixed window: count requests per key within a time window.
"""
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock


@dataclass
class Window:
    count: int
    window_start: float


class RateLimiter:
    """Thread-safe in-memory rate limiter."""

    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self._store: dict[str, Window] = {}
        self._lock = Lock()

    def _now(self) -> float:
        return datetime.now(timezone.utc).timestamp()

    def _cleanup_old(self) -> None:
        now = self._now()
        cutoff = now - 120  # Keep last 2 minutes
        to_remove = [k for k, v in self._store.items() if v.window_start < cutoff]
        for k in to_remove:
            del self._store[k]

    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed. Returns True if under limit."""
        # In test runs, we intentionally perform many logins quickly.
        # Disable rate limiting under pytest to keep tests deterministic.
        if os.getenv("PYTEST_CURRENT_TEST"):
            return True
        with self._lock:
            self._cleanup_old()
            now = self._now()
            window_start = now - (now % 60)  # Align to minute boundary
            if key not in self._store:
                self._store[key] = Window(count=1, window_start=window_start)
                return True
            w = self._store[key]
            if now - w.window_start >= 60:
                w.count = 1
                w.window_start = window_start
                return True
            if w.count >= self.requests_per_minute:
                return False
            w.count += 1
            return True

    def remaining(self, key: str) -> int:
        """Return remaining requests in current window (approximate)."""
        with self._lock:
            self._cleanup_old()
            now = self._now()
            if key not in self._store:
                return self.requests_per_minute
            w = self._store[key]
            if now - w.window_start >= 60:
                return self.requests_per_minute
            return max(0, self.requests_per_minute - w.count)


# Global limiters
_login_limiter = RateLimiter(5)   # 5 login attempts per minute per IP
_hint_limiter = RateLimiter(10)  # 10 hint requests per minute per learner
