# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes directly (dev shortcut, skips migration tracking)
- Required env: `DATABASE_URL` — Postgres connection string

## Fresh Environment Setup

Follow these steps in order when setting up on a brand-new database:

1. **Provision a PostgreSQL database** and set `DATABASE_URL` in the environment.
2. **Run the setup command** — migrates all tables then seeds sample data (idempotent: seed is skipped if data already exists):
   ```
   pnpm --filter @workspace/db run setup
   ```
3. **Start the API server:**
   ```
   pnpm --filter @workspace/api-server run dev
   ```

The `setup` command is safe to re-run: migrations are applied incrementally and the seed is skipped if listings already exist. Use it on every fresh deploy.

### Existing database (already set up via `push`)

If your database was set up using `drizzle-kit push` before migration tracking was added, stamp the existing schema so `migrate` knows it's already applied:

```
pnpm --filter @workspace/db run stamp-migrations
```

Then run the normal setup command — the seed will be skipped automatically if listings already exist:
```
pnpm --filter @workspace/db run setup
```

### Adding schema changes

1. Edit `lib/db/src/schema/` as needed.
2. Generate a new migration file:
   ```
   pnpm --filter @workspace/db run generate
   ```
3. Apply it:
   ```
   pnpm --filter @workspace/db run migrate
   ```

Migration SQL files live in `lib/db/migrations/` and are committed to source control.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
