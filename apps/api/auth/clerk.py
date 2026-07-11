from __future__ import annotations

import time
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from config import settings

_bearer = HTTPBearer(auto_error=False)
_jwks_client: PyJWKClient | None = None
_jwks_fetched_at = 0.0


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _jwks_fetched_at
    jwks_url = settings.clerk_jwks_url.strip()
    if not jwks_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk JWKS URL is not configured.",
        )
    now = time.time()
    if _jwks_client is None or now - _jwks_fetched_at > 3600:
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        _jwks_fetched_at = now
    return _jwks_client


def verify_clerk_token(token: str) -> dict[str, Any]:
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        options = {"verify_aud": False}
        decode_kwargs: dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": options,
        }
        issuer = settings.clerk_issuer.strip()
        if issuer:
            decode_kwargs["issuer"] = issuer
        return jwt.decode(token, signing_key.key, **decode_kwargs)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired auth token: {exc}",
        ) from exc


class AuthUser:
    def __init__(self, user_id: str, email: str | None, name: str | None) -> None:
        self.user_id = user_id
        self.email = email
        self.name = name


def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AuthUser:
    if not settings.clerk_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth is not configured on this API.",
        )
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer token.",
        )
    payload = verify_clerk_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject.",
        )
    email = payload.get("email") or payload.get("primary_email_address")
    name = payload.get("name")
    if not name:
        first = payload.get("first_name") or ""
        last = payload.get("last_name") or ""
        name = f"{first} {last}".strip() or None
    return AuthUser(user_id=user_id, email=email, name=name)
