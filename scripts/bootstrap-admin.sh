#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d ".venv" ]]; then
  echo "Error: .venv not found in $ROOT_DIR"
  echo "Create it first, for example: python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

. .venv/bin/activate
PYTHONPATH=src python scripts/create_admin.py "$@"
