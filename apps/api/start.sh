#!/bin/sh
set -e

cd /app/apps/api

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Running database migrations..."
  alembic upgrade head || python -c "from db.session import init_db; init_db(); print('init_db fallback ok')"
fi

echo "Starting DocuMind API on port ${PORT:-8000}"
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
