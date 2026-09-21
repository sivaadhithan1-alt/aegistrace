# AegisTrace — Render Deployment

This repository is prepared for Render as two services:

- `aegistrace-pqc-frontend`: React/Vite static site
- `aegistrace-pqc-backend`: Dockerized FastAPI service with Open Quantum Safe `liboqs`

## Deploy

From Render, choose **New + > Blueprint** and select this repository. Render will read `render.yaml`.

### Frontend
- Build: `cd frontend && npm ci && npm run build`
- Publish: `frontend/dist`
- `VITE_API_URL` points to the backend service.

### Backend
- Dockerfile: `backend/Dockerfile`
- Health check: `/health`
- Runtime port: Render `$PORT`
- `liboqs` 0.12.0 is built inside the image before `liboqs-python` is installed.

## Persistence

The included Blueprint uses `/tmp/aegistrace-data` so it works on a basic demo deployment. SQLite, keystores, documents, forensic exports, and ledger state are therefore **ephemeral across instance replacement/redeploys**. For persistent data, attach a Render persistent disk and set `AEGISTRACE_DATA_DIR` to its mounted path.

## CORS

`CORS_ORIGINS` is preset for the generated frontend service URL. If the Render service name/URL is changed, update this environment variable on the backend.

## Local development

Run the FastAPI backend on port 8000 and leave `VITE_API_URL` empty. Vite will proxy `/api` to `VITE_DEV_API_URL`.
