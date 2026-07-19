# KW-VF — Virtual Fitting Room

Virtual try-on demo for **Kattenburg & Weenink** workwear. Upload a photo of a person plus one or more clothing images, and the app generates a realistic image of that person wearing the selected workwear.

> **Status:** v1 demo — built for internal evaluation (management / Vendit). Not connected to the production webshop.

## How it works

1. The user uploads a person photo and up to 8 clothing images in the web UI.
2. The API creates a try-on job (`POST /api/try-on`) and stores it in PostgreSQL.
3. The images are sent to OpenAI's `gpt-image-1` image-edit model, which renders the person wearing the clothing.
4. The frontend polls `GET /api/try-on/:id` until the job status is `completed` and shows the result.

## Tech stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 19, Vite 7, Tailwind CSS 4, shadcn/ui (Radix)     |
| API        | Node.js, Express 5, Multer (uploads), Pino (logging)    |
| Database   | PostgreSQL + Drizzle ORM                                |
| Contracts  | OpenAPI 3.1 spec → generated Zod schemas & React Query hooks (Orval) |
| AI         | OpenAI `gpt-image-1` (images edit endpoint)             |
| Tooling    | pnpm workspaces, TypeScript 5.9, esbuild                |

## Repository layout

```
artifacts/
  virtual-fitting/   # React frontend (Vite)
  api-server/        # Express API — also serves the built frontend in production
  mockup-sandbox/    # UI sandbox (not deployed)
lib/
  api-spec/          # OpenAPI spec (source of truth for the API)
  api-zod/           # Generated Zod schemas
  api-client-react/  # Generated React Query client
  db/                # Drizzle schema + config (table: try_on_jobs)
railway.json         # Railway build/deploy configuration
```

## Environment variables

| Variable         | Purpose                                            |
|------------------|----------------------------------------------------|
| `DATABASE_URL`   | PostgreSQL connection string                       |
| `OPENAI_API_KEY` | OpenAI API key (billed per generated image)        |
| `PORT`           | Server port (set automatically by Railway)         |

## Local development

Requires Node.js ≥ 22 and pnpm.

```bash
pnpm install
# Terminal 1 — API (needs DATABASE_URL and OPENAI_API_KEY):
pnpm --filter @workspace/api-server run dev
# Terminal 2 — frontend dev server:
BASE_PATH=/ PORT=5173 pnpm --filter @workspace/virtual-fitting run dev
```

Push database schema changes (dev only):

```bash
pnpm --filter @workspace/db run push
```

## Deployment (Railway)

The repo deploys as a **single Railway service**: the Express server serves both the API (under `/api`) and the built React frontend. Configuration lives in [`railway.json`](./railway.json):

- **Build:** builds the frontend (Vite) and the server bundle (esbuild)
- **Pre-deploy:** pushes the Drizzle schema to the database
- **Start:** runs the bundled server; health check on `/api/healthz`

Setup steps:

1. Create a Railway project → *Deploy from GitHub repo* → select this repo.
2. Add a **PostgreSQL** database to the project.
3. On the app service, set variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `OPENAI_API_KEY` = your OpenAI key
4. *Settings → Networking → Generate Domain* to get a public URL.

## Known limitations (v1)

- Result images are stored as base64 data URLs in PostgreSQL (~2 MB per try-on) — fine for a demo, should move to object storage for production use.
- No authentication — anyone with the URL can generate images (each generation costs OpenAI credits). Keep the URL private during the demo phase.
- Old jobs are never cleaned up.
