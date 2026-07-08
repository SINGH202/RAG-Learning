#!/bin/sh
set -e

echo "Starting DocuMind API on port ${PORT:-8000}"
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
