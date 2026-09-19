# IT Service Desk Ticketing System — standalone webapp (MVP)

Standalone (non-Azure) MVP of an internal IT Service Desk ticketing system,
adapted from `../documentation/*.txt`. See repo memory
(`/memories/repo/learningtools-ticketing.md`) for the full list of
adaptation decisions vs. the original Azure-based design.

## Stack

- Frontend: React + TypeScript + Vite (`frontend/`)
- Backend: Node.js + TypeScript + Express (`backend/`)
- Database: SQLite via Prisma (`backend/prisma/schema.prisma`)
- Auth: username/password (bcrypt hash + server-side session cookie)
- File storage: local disk (`backend/data/uploads`)
- Background jobs: node-cron (in-process)

## Getting started (development)

### Backend

```
cd backend
cp .env.example .env   # then edit SESSION_SECRET etc.
npm install
npx prisma migrate dev
npm run dev             # http://localhost:4000
```

Seeded accounts (see `prisma/seed.ts`), default password `ChangeMe123!`
(or `SEED_ADMIN_PASSWORD` env var), all with `mustChangePassword=true`:

- `admin.sd@company.example` (ADMIN / SD team)
- `admin.l2@company.example` (ADMIN / L2 team)
- `requester.demo@company.example` (REQUESTER)

### Frontend

```
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxies /api to :4000)
```

## Configuration

- Secrets / environment-specific values: `backend/.env` (never commit).
- Non-secret branding/deployment settings (app name, ticket prefix, auto-close
  days, allowed attachment extensions, active device provider, etc.):
  `backend/config/app.config.json`.

## LAN demo (no hosting cost, no domain needed)

To show the app to colleagues on the same office/internal network from your
own machine, without deploying anywhere:

```
cd frontend
npm run build

cd ../backend
```

In `backend/.env`, set:

```
COOKIE_SECURE=false
SERVE_FRONTEND_DIST=../frontend/dist
```

Then start the backend once — it now serves the built frontend **and** the
API from a single port (no separate frontend dev server, no CORS):

```
npm run build
npm start                # http://localhost:4000
```

Find your machine's LAN IP address (`ipconfig`, look for the IPv4 address of
your Wi-Fi/Ethernet adapter, e.g. `192.168.0.79`), then:

1. Allow inbound connections to port 4000 in Windows Firewall, e.g.:
   ```
   netsh advfirewall firewall add rule name="Ticketing demo" dir=in action=allow protocol=TCP localport=4000
   ```
2. Share the URL with colleagues on the same network: `http://<your-ip>:4000`

This is plain HTTP (no TLS) — acceptable for a short internal demo, but not
for a real deployment. Remove the firewall rule when done:
```
netsh advfirewall firewall delete rule name="Ticketing demo"
```

For an actual longer-term internal deployment (Windows Server + IIS reverse
proxy, or Azure VM), keep `COOKIE_SECURE=true` and put a real TLS certificate
in front of the app.

## Status

Phase 1 (project foundation) complete: scaffolding, auth, session security
middleware, Prisma schema, seed data. See project plan in repo memory for
remaining phases.
