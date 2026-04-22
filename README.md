# ISDR Core Prototype

## Runtime Mode

This project now runs in extended mode only.

- Active API namespace: `/auth/*`
- Legacy minimal workflow endpoints (`/users`, `/submissions`, `/community`, `/expert`, `/tips`, `/governance`) have been removed.

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
PYTHONPATH=src pytest -q
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

4. Verify extended endpoints:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/auth/consent-documents
- http://127.0.0.1:8000/auth/languages
- http://127.0.0.1:8000/auth/signin

## Authentication

- Sign in via `POST /auth/signin` to receive a bearer token.
- Include `Authorization: Bearer <access_token>` for transcription write endpoints:
	- `POST /transcription/recordings`
	- `POST /transcription/tasks`
	- `POST /transcription/tasks/{task_id}/validations`
	- `POST /transcription/tasks/{task_id}/translations`
	- `POST /transcription/tasks/{task_id}/graduate`

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

`NEXT_PUBLIC_API_BASE` defaults to `http://127.0.0.1:8000` and should match your FastAPI host/port.

3. Run dev server:

```bash
npm run dev
```

4. Validate lint/build:

```bash
npm run lint
npm run build
```

The UI is aligned to extended auth/profile flows (`/sign-up`, `/sign-in`).
