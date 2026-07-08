import time
from collections import defaultdict


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int = 3600) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds
        self._hits[key] = [hit for hit in self._hits[key] if hit > window_start]

        if len(self._hits[key]) >= self.max_requests:
            return False

        self._hits[key].append(now)
        return True
