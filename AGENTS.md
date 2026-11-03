# AGENTS.md

Instructions for any AI coding agent working in this repo. Read this file fully
at the start of every session. It is the source of truth for rules and roadmap.

## Project

A production-grade e-commerce backend built with NestJS. The project is already
scaffolded: never re-scaffold or restart it. Inspect the repo before changing it.

## Stack (non-negotiable)

- NestJS, TypeScript with `strict: true`
- Prisma + PostgreSQL (Primary: Neon serverless Postgres; Docker Postgres is optional)
- `@t3-oss/env-core` + Zod for environment variables (validated at startup)
- Zod + `nestjs-zod` for validation and DTOs
- `@nestjs/swagger` for OpenAPI docs at `/docs`
- pnpm (Turborepo only if the repo already uses it)
- pino for JSON logging

## Type-safety rules

1. One source of truth: Zod schema -> inferred TS type -> DTO -> Swagger.
2. Never hand-write a type that Prisma or Zod can generate.
3. Every controller method has an explicit return type and a response DTO.
4. No `any`, no `as` casts to silence errors, no `@ts-ignore`.
5. Prisma models must not leak into API responses; map to response DTOs.
6. Never read `process.env` directly. Import the typed `env` object.
7. Money is stored as integers in minor units (e.g. cents), never floats.

## Architecture rules

- One feature = one NestJS module with controller -> service -> Prisma.
  No business logic in controllers.
- Shared code lives in `common/` (filters, guards, decorators, pipes, utils).
- Global setup: validation, unified exception filter, request-id middleware,
  JSON logger, Helmet, CORS, throttler.
- Unified error shape: `{ statusCode, message, code, requestId, timestamp }`.
- Anything touching stock or money runs inside a Prisma transaction.
  Prevent race conditions with atomic conditional updates.
- Orders keep a price snapshot per item; totals are always computed server-side.
- Soft delete for products. Auto-generated unique slugs.
- Auth: JWT access + refresh, refresh tokens stored hashed, argon2 passwords,
  `@Roles()` decorator + guard (`CUSTOMER` / `ADMIN`).
- Every endpoint is documented in Swagger: request, response, errors, auth.
- Every new env var goes into `env.ts` AND `.env.example`.

## Workflow (every phase)

1. **Plan first**: list files to create/change, Prisma models, endpoints, env vars.
   Wait for the user to say "go".
2. **Implement** only that phase. Do not touch unrelated features.
3. **Verify**: run typecheck (`tsc --noEmit`), lint, tests, and fix everything.
4. **Summarize**: what was built, endpoints, env vars, how to test, decisions made.
5. **Update the roadmap below** (tick the boxes).
6. **Commit** the finished work (see "Git & commits" below), then stop for approval.

If a requirement is unclear or risky, ask instead of guessing. If you know a
better approach, say so with reasons. Explain non-obvious decisions in plain,
beginner-friendly language.

## Git & commits

- After a phase passes verification (typecheck, lint, tests), **commit it yourself**.
  Never commit code that fails typecheck, lint, or tests.
- Use **Conventional Commits** (commitlint enforces this):
  `type(scope): short description`, in the imperative, lowercase, no trailing period.
  Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`, `perf`.
  Examples: `feat(auth): add refresh token rotation`, `chore(db): add products migration`.
- Make **small, logical commits** inside a phase (e.g. one for the Prisma schema +
  migration, one for the module, one for tests, one for docs/roadmap) instead of
  one giant commit. Each commit should leave the project in a working state.
- Stage only files related to the change (`git add <paths>`). Never `git add .`
  blindly, and never commit `.env`, secrets, `node_modules`, or build output.
- Do NOT use `--no-verify` to skip the Husky hooks. If a hook fails, fix the problem.
- Commit the roadmap tick (`docs(roadmap): complete phase N`) as part of the phase.
- Do **not** push, force-push, rewrite history, or merge branches unless the user
  explicitly asks. Committing locally is enough.
- Work on a branch per phase if the user asks for it (`feat/phase-1-auth`);
  otherwise commit on the current branch.
- After committing, show the user `git log --oneline` for the phase's commits.

## Definition of done (per phase)

- Typecheck, lint, and tests pass
- Migration created and applies cleanly on a fresh database
- Seed updated if needed
- Swagger shows every new endpoint with correct schemas
- Tests cover the happy path and the main failure cases
- Roadmap updated
- Work committed with Conventional Commit messages

---

## Roadmap

### MVP

- [x] **Phase 0 - Foundation**: t3-env, Prisma setup, global pipes/filters/logger,
      Helmet/CORS/throttler, Swagger, `/health`, docker-compose Postgres, `.env.example`
- [ ] **Phase 1 - Auth & Users**: register, login, refresh, logout, RBAC, password
      hashing, login rate limiting; profile, shipping addresses, admin user list
      (search, activate/deactivate)
- [ ] **Phase 2 - Categories & Products**: category public list + admin CRUD + slug +
      delete protection; products with pagination, filters, search, sorting, get by
      id or slug, admin CRUD, soft delete, image upload
- [ ] **Phase 3 - Inventory & Orders**: stock check, transactional deduction, restore
      on cancel, oversell prevention, low-stock report; order creation, totals,
      snapshots, status lifecycle, customer/admin views, `Idempotency-Key`
- [ ] **Phase 4 - Payments**: provider interface, mock + Stripe test mode, signed
      webhook, auto `PAID`
- [ ] **Phase 5 - Admin stats & hardening**: orders, revenue, customers, top sellers,
      date filters; security/error/logging review
- [ ] **Phase 6 - DevOps**: multi-stage Docker (`turbo prune` if Turborepo),
      docker compose, GitHub Actions (+ Remote Cache), GHCR push + deploy,
      Husky / lint-staged / commitlint
- [ ] **Phase 7 - MVP tests**: unit, e2e, and a concurrency test proving no overselling

### Advanced (do in this order, one phase at a time)

- [ ] **A1 - Advanced security**: email verification, password reset, token rotation,
      session management, account lockout, audit log, granular permissions,
      OAuth login, 2FA
- [ ] **A2 - Performance foundations**: Redis caching, cursor pagination,
      per-user rate limiting, CDN-ready image delivery
- [ ] **A3 - Notifications & jobs**: BullMQ queues, transactional emails, retries, cron jobs
- [ ] **A4 - Catalog**: variants (size/color), brands, tags, related products,
      CSV import/export
- [ ] **A5 - Cart & wishlist**: server-side cart, cross-device sync, guest cart merge,
      back-in-stock alerts
- [ ] **A6 - Coupons & promotions**: codes, usage limits, auto promotions
- [ ] **A7 - Shipping, tax & fulfillment**: rates by region, tracking, partial shipments
- [ ] **A8 - Returns, refunds & invoices**: return flow, refunds, PDF invoices
- [ ] **A9 - Reviews & ratings**: verified purchase, aggregated ratings, moderation
- [ ] **A10 - Advanced search**: Meilisearch or Elasticsearch, facets, autocomplete
- [ ] **A11 - Real-time**: WebSockets/SSE for orders, admin alerts, live stock
- [ ] **A12 - Architecture upgrades**: domain events, outbox pattern, CQRS read models,
      feature flags, API versioning
- [ ] **A13 - i18n**: multi-language content, multi-currency, localized emails
- [ ] **A14 - Observability**: Prometheus, Grafana, OpenTelemetry, Sentry, alerts
- [ ] **A15 - Advanced testing**: Testcontainers, contract tests, k6 load tests,
      concurrency tests
- [ ] **A16 - Advanced DevOps**: preview environments, blue-green deploys, Trivy,
      Dependabot, semantic-release, Terraform, dev -> staging -> prod
- [ ] **A17 - Advanced admin**: analytics charts, customer segments, bulk actions,
      CSV/PDF reports

### Extras

- [ ] **E1 - Comments & Q&A**: threaded comments, product questions, voting,
      moderation queue, spam protection, mentions, internal admin notes, real-time updates
- [ ] **E2 - Loyalty & referrals**: points, redemption, customer tiers, referral
      codes, fraud checks

---

## Current status

Phase in progress: **Phase 0 completed (stopped before Phase 1 for user review)**

## Decisions log

Record important decisions here (date, decision, reason).

- 2026-11-04: Database: Neon. Pooled URL for the app, direct URL for migrations. Dev and test use separate Neon branches, never production.
- 2026-11-04: Prisma 7 setup: CLI connection configured in `prisma.config.ts` using `DATABASE_URL_UNPOOLED` for migrations; runtime queries use pooled `DATABASE_URL` with `@prisma/adapter-pg`.
- 2026-11-04: nestjs-zod v5: uses `cleanupOpenApiDoc(document)` for Swagger generation, and registers `ZodValidationPipe` (APP_PIPE) and `ZodSerializerInterceptor` (APP_INTERCEPTOR) globally.
- 2026-11-04: TypeScript strictness: enabled `"strict": true`, `"noImplicitAny": true`, `"strictBindCallApply": true` in `tsconfig.json`.
