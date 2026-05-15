FROM python:3.11-slim

WORKDIR /app

# Build tools needed by some Python packages (scipy, cryptography, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend source files
COPY . .

ENV PORT=8080
EXPOSE 8080

# Cloud Run sets PORT env var; uvicorn reads it at runtime
CMD exec uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 1
