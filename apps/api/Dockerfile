FROM python:3.11-slim

WORKDIR /app

COPY packages/rag-core /app/packages/rag-core
COPY apps/api /app/apps/api

RUN pip install --no-cache-dir -r /app/apps/api/requirements.txt

WORKDIR /app/apps/api

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
