# Northline Roofing — Config-Driven Estimator & Owner Panel

A public, mobile-friendly multi-step roof cost estimator, plus an authenticated
owner panel where the business owner and bookkeeper can edit pricing, toggle
questions, and view captured leads — with zero code redeploys required for a price
change. Built for the Wantace SDE Intern take-home.

**Live URLs:**
- Public estimator: `TODO — paste after deploy`
- Owner panel: `TODO — paste after deploy` (append `/admin`)
- Test login: `admin` / `roofing2026!` *(change these before a real launch)*

## Stack

- **Client:** React 18 + Vite + Tailwind CSS + React Router
- **Server:** Node.js + Express
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT in an httpOnly cookie for the owner panel

## Project structure

```
roof-estimator/
├── client/     React app — public estimator + owner panel
├── server/     Express API + Prisma schema/seed
├── DECISIONS.md
├── AI_LOG.md
└── README.md
```

## Running locally from a clean clone

### 1. Prerequisites
- Node.js 18+
- A PostgreSQL database (local install, or a free instance from
  [Neon](https://neon.tech), [Render](https://render.com), or [Railway](https://railway.app))

### 2. Install dependencies
```bash
git clone <your-repo-url>
cd roof-estimator
npm run install:all
```

### 3. Configure environment variables

**`server/.env`** (copy from `server/.env.example`):
```
DATABASE_URL="postgresql://user:password@host:5432/roof_estimator?sslmode=require"
JWT_SECRET="a-long-random-string"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="roofing2026!"
CLIENT_ORIGIN="http://localhost:5173"
PORT=4000
NODE_ENV=development
```

**`client/.env`** (copy from `client/.env.example`):
```
VITE_API_BASE_URL=http://localhost:4000/api
```

### 4. Set up the database
```bash
cd server
npx prisma migrate dev --name init
npm run seed
cd ..
```
This creates the schema and loads the seed configuration (v3) plus the three
historical leads and the admin login from the brief.

### 5. Run it
In two terminals:
```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Visit `http://localhost:5173` for the public estimator, and
`http://localhost:5173/admin/login` for the owner panel.

## Environment variables reference

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | server | PostgreSQL connection string |
| `JWT_SECRET` | server | Signs owner-panel session tokens |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | server | Seeded owner login (seed script only, change after first login in production) |
| `CLIENT_ORIGIN` | server | CORS allow-list, comma-separated for multiple origins |
| `PORT` | server | API port (defaults to 4000) |
| `VITE_API_BASE_URL` | client | Where the frontend sends API requests |

## Deploying

- **Server:** Render / Railway — set the env vars above, build command
  `npm install && npx prisma generate`, start command `npm start`. Run
  `npx prisma migrate deploy && npm run seed` once against the production
  `DATABASE_URL` before first use.
- **Database:** Neon, Render Postgres, or Railway Postgres — any managed Postgres
  works, just point `DATABASE_URL` at it.
- **Client:** Vercel / Netlify — build command `npm run build`, output dir `dist`,
  set `VITE_API_BASE_URL` to the deployed server's `/api` URL.

## Verifying the core flow

1. Complete the public estimator end-to-end and confirm you land on a price range.
2. Log into `/admin`, open **Questions & Pricing**, change a rate (e.g. bump
   Architectural Shingle to $7.00/sqft), hit **Save Changes**.
3. In an incognito window, complete the estimator again with the same answers —
   the new rate is reflected immediately, no restart or redeploy.
4. Check **Leads** in the owner panel — both submissions should appear with their
   full answer sets.
