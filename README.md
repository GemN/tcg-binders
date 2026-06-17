# Boilergem

Reusable full-stack starter extracted from a production monorepo.

## Stack

- Yarn 4 workspaces under `@app/*`
- React 19, Vite, TypeScript, React Router
- Tailwind CSS v4, shadcn/Radix primitives, lucide icons
- Supabase local development with Auth, Postgres, RLS and pg_graphql
- Apollo Client and GraphQL Code Generator
- Graphile Worker with MJML email templates
- i18n with `react-i18next` in English and French

## Structure

```text
@app/client    React app shell, UI kit, auth pages, generic organization context
@app/config    Shared runtime configuration loaded by Node processes
@app/graphql   Generated GraphQL hooks and types
@app/supabase  Supabase config, migrations, seed and migration helper
@app/worker    Graphile Worker tasks and email transport
```

## Practices Kept

- Keep domain code out of `components/ui`; primitives stay reusable.
- Keep app-specific composition in `components`, `pages`, `providers` and `lib`.
- Use Supabase RLS as the authorization boundary.
- Use SQL functions for current-user GraphQL entrypoints.
- Load environment variables in Node tools with `node -r @app/config/env`.
- Generate GraphQL hooks from `.graphql` documents instead of writing operation types by hand.
- Keep async side effects in Graphile Worker tasks.
- Use `x-organization-id` as the active organization context header.

## Getting Started

```sh
cp .env.example .env
yarn
yarn db start
yarn worker install-db-schema
yarn graphql codegen
yarn dev
```

The seed creates a demo account:

```text
email: admin@example.com
password: test
```

Supabase Studio runs on `http://127.0.0.1:55323`.

## Common Commands

```sh
yarn client dev
yarn client build
yarn graphql codegen
yarn db start
yarn db stop
yarn worker build
yarn worker dev
```

## Migration Workflow

Put draft SQL in `@app/supabase/schemas/current.sql`, then create and apply a migration:

```sh
yarn db commit add_feature_name
```

The helper creates a migration file, applies it locally and resets `current.sql`.

## Notes

- `yarn dev` runs GraphQL Codegen first, so Supabase must be running on `127.0.0.1:55321`.
- `.env.example` contains local Supabase keys only. Replace keys for remote projects.
- Generated files, build outputs, local Supabase state and email preview credentials are intentionally not committed.
