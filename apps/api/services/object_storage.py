from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from config import settings
from services.session_manager import DocumentInfo

_client = None


def _get_client():
    global _client
    if not settings.s3_enabled:
        return None
    if _client is not None:
        return _client

    import boto3
    from botocore.client import Config

    _client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url.strip(),
        aws_access_key_id=settings.s3_access_key_id.strip(),
        aws_secret_access_key=settings.s3_secret_access_key.strip(),
        region_name=(settings.s3_region.strip() or None),
        config=Config(signature_version="s3v4"),
    )
    return _client


def is_enabled() -> bool:
    return settings.s3_enabled


def _meta_key(session_id: str) -> str:
    return f"sessions/{session_id}/meta.json"


def _pdf_key(session_id: str, document_id: str) -> str:
    return f"sessions/{session_id}/docs/{document_id}.pdf"


def _prefix(session_id: str) -> str:
    return f"sessions/{session_id}/"


def session_meta_dict(session) -> dict[str, Any]:
    return {
        "session_id": session.session_id,
        "created_at": session.created_at.isoformat() + "Z",
        "last_active": session.last_active.isoformat() + "Z",
        "documents": [
            {
                "document_id": doc.document_id,
                "filename": doc.filename,
                "chunk_count": doc.chunk_count,
            }
            for doc in session.documents
        ],
    }


def put_pdf(session_id: str, document_id: str, content: bytes, filename: str) -> None:
    client = _get_client()
    if client is None:
        return
    client.put_object(
        Bucket=settings.s3_bucket_name,
        Key=_pdf_key(session_id, document_id),
        Body=content,
        ContentType="application/pdf",
        Metadata={"filename": filename[:200]},
    )


def put_meta(session_id: str, meta: dict[str, Any]) -> None:
    client = _get_client()
    if client is None:
        return
    client.put_object(
        Bucket=settings.s3_bucket_name,
        Key=_meta_key(session_id),
        Body=json.dumps(meta).encode("utf-8"),
        ContentType="application/json",
    )


def _is_not_found(exc: Exception) -> bool:
    from botocore.exceptions import ClientError

    if isinstance(exc, ClientError):
        error_code = exc.response.get("Error", {}).get("Code", "")
        return error_code in {"404", "NoSuchKey", "NotFound", "NoSuchBucket"}
    return False


def get_meta(session_id: str) -> dict[str, Any] | None:
    client = _get_client()
    if client is None:
        return None
    try:
        response = client.get_object(
            Bucket=settings.s3_bucket_name,
            Key=_meta_key(session_id),
        )
    except Exception as exc:
        if _is_not_found(exc):
            return None
        raise

    body = response["Body"].read()
    return json.loads(body.decode("utf-8"))


def get_pdf(session_id: str, document_id: str) -> bytes | None:
    client = _get_client()
    if client is None:
        return None
    try:
        response = client.get_object(
            Bucket=settings.s3_bucket_name,
            Key=_pdf_key(session_id, document_id),
        )
    except Exception as exc:
        if _is_not_found(exc):
            return None
        raise
    return response["Body"].read()


def delete_session_prefix(session_id: str) -> None:
    client = _get_client()
    if client is None:
        return

    prefix = _prefix(session_id)
    continuation: str | None = None
    while True:
        kwargs: dict[str, Any] = {
            "Bucket": settings.s3_bucket_name,
            "Prefix": prefix,
        }
        if continuation:
            kwargs["ContinuationToken"] = continuation
        listed = client.list_objects_v2(**kwargs)
        contents = listed.get("Contents") or []
        if contents:
            client.delete_objects(
                Bucket=settings.s3_bucket_name,
                Delete={
                    "Objects": [{"Key": item["Key"]} for item in contents],
                    "Quiet": True,
                },
            )
        if not listed.get("IsTruncated"):
            break
        continuation = listed.get("NextContinuationToken")


def parse_iso(value: str) -> datetime:
    cleaned = value.replace("Z", "+00:00") if value.endswith("Z") else value
    return datetime.fromisoformat(cleaned).replace(tzinfo=None)


def documents_from_meta(meta: dict[str, Any]) -> list[DocumentInfo]:
    documents: list[DocumentInfo] = []
    for item in meta.get("documents") or []:
        documents.append(
            DocumentInfo(
                document_id=item["document_id"],
                filename=item["filename"],
                chunk_count=int(item.get("chunk_count") or 0),
            )
        )
    return documents
