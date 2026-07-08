FROM python:3.11-slim

WORKDIR /app

COPY packages/rag-core /app/packages/rag-core
COPY apps/api /app/apps/api

RUN pip install --no-cache-dir -r /app/apps/api/requirements.txt \
    && pip install --no-cache-dir -e /app/packages/rag-core \
    && chmod +x /app/apps/api/start.sh

WORKDIR /app/apps/api

ENV PYTHONUNBUFFERED=1

CMD ["/bin/sh", "/app/apps/api/start.sh"]
