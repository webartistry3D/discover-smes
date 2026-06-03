# 🏙️ Discover Festac

> The digital operating system for hyperlocal commerce in Festac Town, Lagos.

Find trusted local businesses, connect via WhatsApp, book appointments, and power SME growth — all in one platform.

---

## Project Structure

```
discover-festac/
├── apps/
│   ├── backend/          ← Express API (Node.js + TypeScript + Prisma)
│   └── frontend/         ← React SPA (Vite + TypeScript + Tailwind)
├── packages/
│   └── shared/           ← Shared TypeScript types & utilities
├── render.yaml           ← Render deployment config (one-click deploy)
└── package.json          ← Monorepo root
```

---

## Local Development Setup

### Prerequisites

- **Node.js** v20+ → https://nodejs.org
- **npm** v10+
- **PostgreSQL** v14+ running locally

### Step 1 — Install dependencies

```bash
npm install
```

This installs packages for all three workspaces (backend, frontend, shared) at once.

---

### Step 2 — Create your local PostgreSQL database

Open `psql` or any Postgres client and run:

```sql
CREATE DATABASE discover_festac;
```

---

### Step 3 — Configure the backend

```bash
cd apps/backend
cp .env.example .env
```

Open `.env` and set at minimum:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/discover_festac?schema=public
JWT_SECRET=any-random-string-at-least-32-characters-long
JWT_REFRESH_SECRET=another-different-random-string-32-chars
```

> **Tip:** Generate secure secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

### Step 4 — Set up the database

Run these from the **project root**:

```bash
# Generate the Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate

# Seed with categories + sample data
npm run db:seed
```

---

### Step 5 — Configure the frontend

```bash
cd apps/frontend
cp .env.example .env
```

The default `.env` works as-is for local dev — Vite proxies `/api` to `localhost:4000` automatically.

---

### Step 6 — Run the dev servers

From the **project root**, run both servers together:

```bash
npm run dev
```

Or run them separately in two terminals:

```bash
# Terminal 1 — Backend API
npm run dev:backend
# → Running at http://localhost:4000

# Terminal 2 — Frontend
npm run dev:frontend
# → Running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

### Verify it's working

```bash
curl http://localhost:4000/api/v1/health
# → {"success":true,"data":{"status":"ok",...}}
```

---

### Useful dev commands

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio
# → http://localhost:5555

# Reset database (wipes all data!)
npm run db:reset

# TypeScript check all packages
npm run typecheck
```

---

### Dev login (OTP)

OTPs are printed to the **backend terminal** in development — no SMS needed:

```
🔑 OTP for +2348012345678: 482910
```

Default seeded accounts:
| Role | Phone |
|------|-------|
| Super Admin | +2348000000001 |
| Sample Vendor | +2348012345678 |

---

## Deploying to Render

### One-time setup

1. Push your project to a **GitHub repository**
2. Go to **https://dashboard.render.com**
3. Click **New → Blueprint**
4. Connect your GitHub repo — Render auto-reads `render.yaml`
5. It creates: Backend Web Service + Frontend Static Site + Postgres database

### After services are created, set environment variables

In **Render Dashboard → discover-festac-api → Environment**, add:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Same command, different output |
| `FRONTEND_URL` | Your frontend URL, e.g. `https://discover-festac-web.onrender.com` |
| `CORS_ORIGINS` | Same as FRONTEND_URL |
| `APP_URL` | Your backend URL, e.g. `https://discover-festac-api.onrender.com` |
| `OPENAI_API_KEY` | From platform.openai.com (optional) |
| `WHATSAPP_ACCESS_TOKEN` | From Meta Developers (optional) |

In **Render Dashboard → discover-festac-web → Environment**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://discover-festac-api.onrender.com/api/v1` |

Then **trigger a manual deploy** on both services.

### Seed production database

After the first deploy, open a **Shell** on Render for the backend service and run:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect().then(() => console.log('DB connected')).catch(console.error);
"
# Then run: npm run db:seed  (from the shell)
```

Or use the Render shell: Dashboard → discover-festac-api → Shell → `npm run db:seed`

---

## API Overview

**Base URL (local):** `http://localhost:4000/api/v1`
**Base URL (production):** `https://discover-festac-api.onrender.com/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/send` | Send OTP to phone number |
| POST | `/auth/otp/verify` | Verify OTP, receive tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |
| GET | `/vendors` | Search vendors (many filters) |
| GET | `/vendors/featured` | Featured vendors |
| GET | `/vendors/nearby?lat=&lng=` | Vendors near coordinates |
| GET | `/vendors/:slug` | Full vendor profile |
| POST | `/vendors` | Create vendor listing |
| GET | `/categories` | All categories |
| POST | `/bookings` | Create booking |
| GET | `/bookings/my` | My bookings |
| POST | `/whatsapp/webhook` | WhatsApp webhook receiver |
| POST | `/whatsapp/ai-chat` | Test AI chat |

---

## Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 64-char random string |
| `JWT_REFRESH_SECRET` | ✅ | Different 64-char random string |
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | — | Default: `4000` |
| `OPENAI_API_KEY` | — | Enables AI-powered WhatsApp replies |
| `WHATSAPP_ACCESS_TOKEN` | — | Meta WhatsApp Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | — | Meta phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | — | Your custom webhook verify token |
| `STORAGE_PROVIDER` | — | `local` (dev) or `aws` (prod) |
| `AWS_ACCESS_KEY_ID` | — | AWS S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | — | AWS S3 uploads |
| `AWS_S3_BUCKET` | — | S3 bucket name |
| `CORS_ORIGINS` | — | Allowed frontend origins |
| `FRONTEND_URL` | — | Frontend URL for links |

### Frontend (`apps/frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | — | API base URL. Default: `/api/v1` (proxied in dev) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite, React 18, TypeScript, Tailwind CSS, Framer Motion |
| State | Zustand + TanStack Query |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + Refresh Tokens + OTP |
| AI | OpenAI GPT-4o-mini |
| WhatsApp | Meta WhatsApp Cloud API |
| Maps | Leaflet.js + OpenStreetMap |
| Storage | Local filesystem (dev) / AWS S3 (prod) |
| Deploy | Render (backend + frontend + postgres) |
