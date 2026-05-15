# Backend - FastAPI Application
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Waiting for database..."\n\
while ! pg_isready -h ${DATABASE_HOST:-postgres} -U codequest -d codequest; do\n\
  sleep 1\n\
done\n\
echo "Database is ready!"\n\
echo "Running migrations..."\n\
alembic upgrade head || true\n\
echo "Seeding mock data (if absent)..."\n\
# Run seed script using sync DB URL; ignore failure if already seeded or missing env\n\
python -m scripts.seed || true\n\
echo "Starting server..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run the startup script
CMD ["/app/start.sh"]
