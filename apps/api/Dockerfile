FROM python:3.11-slim

WORKDIR /app

COPY packages/rag-core /app/packages/rag-core
COPY apps/api /app/apps/api

RUN pip install --no-cache-dir -r /app/apps/api/requirements.txt \
    && pip install --no-cache-dir -e /app/packages/rag-core

WORKDIR /app/apps/api

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Render sets $PORT dynamically — must bind to it, not hardcoded 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
