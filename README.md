# Crawler X9

MVP web crawler with a Next.js frontend and a FastAPI backend.

## Structure
- `frontend/` — Next.js + Tailwind
- `backend/` — FastAPI + Postgres + SMTP

## Requirements
- `pnpm`
- `docker`

## Run Frontend

```bash
pnpm install
pnpm dev
```

Frontend: `http://localhost:3000`

## Run Backend (Docker)

Create a root `.env` file with:

```
DATABASE_URL="postgresql://user:pass@host:5432/db"
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM=""
MONITOR_BASE_URL="http://localhost:3000/monitor"
MONITOR_PASSWORD=""
```

Then:

```bash
docker compose up --build
```

Backend: `http://localhost:8000`

## MVP Flow
1. User submits URL + match string + interval + email + password.
2. Backend creates a unique monitor per URL.
3. Monitoring link is sent by email.
4. `/monitor/{id}` shows status and logs.

## Endpoints
- `POST /monitor` — create monitor
- `GET /status/{id}` — monitor status
- `GET /logs/{id}` — monitor logs
- `GET /health` — healthcheck

## Backend Environment Variables
See `backend/.env.example`.
