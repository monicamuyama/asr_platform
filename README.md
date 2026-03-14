# ISDR Core Prototype

This repository currently contains:
- Implementation planning docs in docs/
- A Python core module for ISDR routing logic in src/isdr_core/
- Unit tests in tests/
- A Next.js UI in ui/

## Python setup

1. Create virtual environment:

```bash
python3 -m venv .venv
```

2. Activate and install dependencies:

```bash
. .venv/bin/activate
pip install -r requirements.txt
```

3. Run tests:

```bash
python3 -m unittest discover -s tests -v
```

## Backend API setup (FastAPI)

1. Activate the virtual environment:

```bash
. .venv/bin/activate
```

2. Run API server from project root:

```bash
PYTHONPATH=src uvicorn isdr_api.main:app --reload --host 127.0.0.1 --port 8000
```

3. Check API docs:

- http://127.0.0.1:8000/docs

## UI setup (Next.js)

1. Install dependencies:

```bash
cd ui
npm install
```

2. Configure API base URL:

```bash
cp .env.local.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

4. Validate lint/build:

```bash
npm run lint
npm run build
```
