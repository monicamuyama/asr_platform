#!/usr/bin/env bash
set -euo pipefail

export PYTHONPATH="${PYTHONPATH:-src}"

echo "[startup] Applying migrations"
alembic upgrade head

echo "[startup] Starting API"
exec python -m uvicorn isdr_api.main:app --host 0.0.0.0 --port "${PORT:-8080}"
