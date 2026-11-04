# Rootline Backend

A production-grade, modular e-commerce backend built with NestJS, TypeScript, Better Auth, and Prisma on Neon Serverless PostgreSQL.

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black" alt="Neon" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Better_Auth-000000?style=for-the-badge&logo=auth0&logoColor=white" alt="Better Auth" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
</p>

---

## 📑 Table of Contents

- [What is this?](#-what-is-this)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [How It Works](#-how-it-works)
  - [Architecture Request Flow](#architecture-request-flow)
  - [Database Models](#database-models)
- [Authentication Explained](#-authentication-explained)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 What is this?

**Rootline Backend** is a complete, scalable server-side application for modern e-commerce platforms. It provides robust identity management, role-based access control, customer profile handling, and shipping address management, designed from the ground up for high reliability, strict type safety, and cloud-native serverless databases.

This project is built for frontend web applications, mobile apps, and third-party API clients that require a rock-solid, fully documented, and secure e-commerce backend.

---

## ✨ Features

The project is developed in phased milestones. Below is the current implementation status based on our product roadmap:

### Core MVP Roadmap

| Milestone | Description | Status |
| :--- | :--- | :---: |
| **Phase 0 — Foundation** | Typed env (`@t3-oss/env-core`), Prisma 7 + Neon configuration, global pipes/filters/logging, Helmet, CORS, Throttler rate limiting, Swagger OpenAPI at `/docs`, and `/health` ping. | **Done** |
| **Phase 1 — Auth & Users** | Email/password registration, login, logout, session verification, dual cookie and Bearer tokens, Role-Based Access Control (`CUSTOMER` & `ADMIN`), profile management, shipping addresses with transactional default guarantee, and admin user moderation. | **Done** |
| **Phase 1.5 — Email & Reset** | Email verification, password reset flows, `MailService`, Mailpit in local development, and Resend in production. | *Planned* |
| **Phase 1.6 — Security Hardening** | Account lockout on repeated failures, active session inspection/revocation, and audit logging. | *Planned* |
| **Phase 1.7 — OAuth Social Login** | Google OAuth authentication via Better Auth. | *Planned* |
| **Phase 1.8 — Two-Factor Auth (2FA)** | Two-factor authentication with TOTP authenticator apps. | *Planned* |
| **Phase 2 — Categories & Products** | Category management with slug generation, product catalog with pagination, filters, search, sorting, soft delete, and image assets. | *Planned* |
| **Phase 3 — Inventory & Orders** | Transactional stock deduction, oversell prevention, order creation with item price snapshots, status lifecycle, and `Idempotency-Key` headers. | *Planned* |
| **Phase 4 — Payments** | Payment provider interface, Stripe test integration, signed webhook verification, and automated order status reconciliation. | *Planned* |
| **Phase 5 — Admin Analytics** | Revenue statistics, order metrics, customer summaries, top-selling items, and date-range reporting. | *Planned* |
| **Phase 6 — DevOps & Containers** | Multi-stage Docker packaging, remote build caching, GitHub Actions CI/CD pipeline, and registry deployment. | *Planned* |
| **Phase 7 — Concurrency & E2E** | Rigorous stress tests proving zero inventory overselling under high concurrency. | *Planned* |

### Advanced & Extensible Features (Planned)

| Area | Features | Status |
| :--- | :--- | :---: |
| **Advanced Foundations** | Granular ACL permissions (A1), Redis cache & cursor pagination (A2), BullMQ job queues (A3). | *Planned* |
| **Catalog & Cart** | Product variants & brands (A4), server-side cross-device cart & wishlist (A5), coupons & discounts (A6). | *Planned* |
| **Fulfillment & Customer** | Shipping rates & tracking (A7), returns & PDF invoices (A8), customer reviews & ratings (A9). | *Planned* |
| **Scale & Operations** | Meilisearch engine (A10), WebSockets real-time stock (A11), CQRS & domain events (A12), i18n multi-currency (A13), OpenTelemetry & Prometheus (A14), advanced admin analytics (A17). | *Planned* |
| **Community & Growth** | Threaded customer Q&A and comments (E1), customer loyalty points & tiers (E2). | *Planned* |

---

## 🛠️ Tech Stack

| Technology | Logo | Why We Use It |
| :--- | :---: | :--- |
| **NestJS 11** | <img src="https://raw.githubusercontent.com/nestjs/nest/master/resources/logo-small.svg" width="24" height="24" alt="NestJS" /> | Provides an enterprise-grade, modular architecture with dependency injection, standard middleware, guards, and decorators. |
| **TypeScript 5 (Strict)** | <img src="https://raw.githubusercontent.com/remojansen/logo.ts/master/ts.svg" width="24" height="24" alt="TypeScript" /> | Guarantees end-to-end compile-time type safety with `strict: true` and zero untyped `any` leaks. |
| **Prisma 7** | <img src="https://raw.githubusercontent.com/prisma/presskit/main/Assets/Prisma-IndigoLogo.svg" width="24" height="24" alt="Prisma" /> | Type-safe ORM connecting to PostgreSQL using `@prisma/adapter-pg` for efficient query execution. |
| **Neon PostgreSQL** | <img src="https://neon.tech/favicon/favicon.png" width="24" height="24" alt="Neon" /> | Cloud-native serverless PostgreSQL providing instant branching and autoscaling compute. |
| **Better Auth 1.7** | <img src="https://raw.githubusercontent.com/better-auth/better-auth/main/docs/public/favicon/apple-touch-icon.png" width="24" height="24" alt="Better Auth" /> | Modern authentication framework supporting session cookies, Bearer tokens, and secure password hashing. |
| **Zod & nestjs-zod** | <img src="https://raw.githubusercontent.com/colinhacks/zod/master/logo.svg" width="24" height="24" alt="Zod" /> | Acts as the single source of truth for runtime validation, TypeScript types, and Swagger documentation. |
| **Swagger / OpenAPI** | <img src="https://swagger.io/swagger/media/assets/images/swagger_logo.svg" width="24" height="24" alt="Swagger" /> | Automatically generates interactive API documentation and an OpenAPI specification importable into API clients. |
| **Pino** | <img src="https://raw.githubusercontent.com/pinojs/pino/master/extra/logo.png" width="24" height="24" alt="Pino" /> | High-performance JSON logger outputting structured logs with request IDs for production observability. |
| **Helmet & Throttler** | <img src="https://helmetjs.github.io/images/helmet.png" width="24" height="24" alt="Security" /> | Hardens HTTP response headers and protects authentication endpoints against brute-force and DDoS attacks. |

---

## 🔍 How It Works

### Architecture Request Flow

When an HTTP request reaches the server, it passes through layers of security, validation, authentication, and database pooling before returning a typed response:

```mermaid
flowchart TD
    Client["Client (Browser / Mobile App / API Client)"] --> Middleware["RequestId & Pino HTTP Logger"]
    Middleware --> Security["Helmet Headers & Throttler Rate Limiter"]
    Security --> Validation["ZodValidationPipe (Strict Input Validation)"]
    Validation --> AuthGuard["BetterAuth Guard & RolesGuard ('CUSTOMER' / 'ADMIN')"]
    AuthGuard --> Controllers["NestJS Wrapper Controllers"]
    Controllers --> Services["Feature Services (Business Logic)"]
    Services --> BetterAuth["Better Auth Core Engine"]
    Services --> Prisma["Prisma Client (@prisma/adapter-pg)"]
    BetterAuth --> Prisma
    Prisma --> PooledDB[("Neon Serverless Postgres (Pooled Runtime)")]

    subgraph MigrationsOnly["Database Migrations (CLI Only)"]
        DirectDB[("Neon Direct Connection (DATABASE_URL_UNPOOLED)")]
    end
```

**Flow explanation**:
1. **Middleware & Security**: Every incoming request receives a unique `X-Request-Id`, headers are hardened via Helmet, and client rates are checked against `@nestjs/throttler`.
2. **Strict Validation**: The global `ZodValidationPipe` validates the body against Zod schemas, stripping or rejecting unpermitted properties.
3. **Authentication & Authorization**: Better Auth inspects either the session cookie or the Bearer token against live database records. If the user is active, the `@Roles()` guard verifies permissions.
4. **Database Execution**: Queries execute through Prisma using `@prisma/adapter-pg` over Neon's connection pooler.

---

### Database Models

Our database schema manages users, credentials, active sessions, and customer shipping addresses:

```mermaid
erDiagram
    User ||--o{ Session : "has many"
    User ||--o{ Account : "has many"
    User ||--o{ Address : "has many"

    User {
        String id PK
        String name
        String email UK
        Boolean emailVerified
        String image
        String role "CUSTOMER | ADMIN"
        Boolean banned
        String banReason
        DateTime banExpires
        DateTime createdAt
        DateTime updatedAt
    }

    Session {
        String id PK
        String token UK
        DateTime expiresAt
        String ipAddress
        String userAgent
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Account {
        String id PK
        String accountId
        String providerId
        String userId FK
        String password
        DateTime createdAt
        DateTime updatedAt
    }

    Verification {
        String id PK
        String identifier
        String value
        DateTime expiresAt
        DateTime createdAt
        DateTime updatedAt
    }

    Address {
        String id PK
        String userId FK
        String recipientName
        String phone
        String street
        String city
        String state
        String postalCode
        String country
        Boolean isDefault
        DateTime createdAt
        DateTime updatedAt
    }
```

**Key model details**:
- **User**: Stores primary identity, role (`CUSTOMER` or `ADMIN`), and account ban/deactivation status.
- **Session**: Tracks active user sessions. When a user logs out or is banned, sessions are immediately invalidated.
- **Account**: Holds the credential provider information and hashed passwords.
- **Address**: Stores customer shipping addresses with an `isDefault` flag managed atomically.

---

## 🔐 Authentication Explained

Authentication in Rootline is designed for **both web browsers and standalone API clients** (like mobile apps, curl, or Apidog) without requiring client SDKs:

### 1. Key Concepts
- **Bearer token**: A security token sent in the `Authorization: Bearer <token>` header on every request. Non-browser clients (such as mobile apps) use this instead of cookies.
- **Session cookie**: Standard HTTP cookie (`better-auth.session_token`) stored automatically by web browsers with `HttpOnly` and `SameSite` flags.
- **RBAC (Role-Based Access Control)**: Restricting system access based on assigned user roles. We support two roles: `CUSTOMER` (standard user) and `ADMIN` (store administrator).
- **Pooled vs. Direct connection**:
  - *Pooled connection (`DATABASE_URL`)*: A connection routed through Neon's serverless PgBouncer pooler. It allows hundreds of concurrent application requests without exhausting database connection limits.
  - *Direct connection (`DATABASE_URL_UNPOOLED`)*: A direct socket connection to Postgres required for Prisma schema migrations, which require session-level locks.

### 2. Dual Token Response
Every successful sign-up and sign-in returns **both** authentication mechanisms at once:
- A `Set-Cookie` header containing `better-auth.session_token` for web browsers.
- A JSON body containing `{ "token": "<session_token>", "user": { ... } }` for mobile or API clients.

### 3. Disabled Native Better Auth Paths
By default, Better Auth exposes its own `/api/auth/sign-up/email` and `/api/auth/sign-in/email` routes. In Rootline, these native routes are explicitly **disabled** (`disabledPaths: ['/sign-up/email', '/sign-in/email']`). All authentication is routed through our custom NestJS wrapper controllers (`/auth/register`, `/auth/login`) to ensure:
- Strict validation through Zod schemas.
- Rejection of unknown properties (preventing attackers from sending `role: "ADMIN"`).
- Complete OpenAPI schema documentation in our Swagger UI.

### 4. Account Deactivation & Zero Stale Caching
Cookie caching is disabled (`cookieCache: { enabled: false }`), which forces Better Auth to query the database on every authenticated request. When an administrator deactivates or bans a user:
- The user's active database sessions are invalidated.
- Any subsequent request using that token or cookie is **immediately rejected with HTTP 401 Unauthorized**.

### 5. Quick curl Examples

#### Register a Customer
```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }'
```

#### Authenticated Request (Using Bearer Token)
```bash
curl -i -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN_HERE"
```

---

## 📖 API Documentation

The complete OpenAPI specification is generated automatically from our Zod schemas:

- **Interactive Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **Raw OpenAPI JSON Spec**: [http://localhost:3000/docs-json](http://localhost:3000/docs-json)

> [!TIP]
> **Importing into Apidog or Postman**:
> You can import our full API collection instantly by opening Apidog or Postman, selecting **Import**, and pasting `http://localhost:3000/docs-json`.

### Current Endpoints

| Module | Method | Path | Access | Description |
| :--- | :---: | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Public | Pings the application and tests the Neon database connection. |
| **Auth** | `POST` | `/auth/register` | Public | Creates a new customer account, sets session cookie, and returns Bearer token. |
| **Auth** | `POST` | `/auth/login` | Public | Authenticates credentials and returns dual cookie and Bearer token. Rate-limited. |
| **Auth** | `POST` | `/auth/logout` | Authenticated | Revokes the active session in the database and clears cookies. |
| **Auth** | `GET` | `/auth/session` | Authenticated | Returns current session metadata and user profile. |
| **Users** | `GET` | `/users/me` | Authenticated | Returns the profile of the currently logged-in user. |
| **Users** | `PATCH` | `/users/me` | Authenticated | Updates name or avatar image (rejects privilege escalation). |
| **Addresses** | `POST` | `/users/me/addresses` | Authenticated | Creates a shipping address with transactional default handling. |
| **Addresses** | `GET` | `/users/me/addresses` | Authenticated | Returns all shipping addresses for the authenticated user. |
| **Addresses** | `GET` | `/users/me/addresses/:id` | Authenticated | Retrieves a specific shipping address by ID. |
| **Addresses** | `PATCH` | `/users/me/addresses/:id` | Authenticated | Updates a shipping address. |
| **Addresses** | `DELETE` | `/users/me/addresses/:id` | Authenticated | Deletes a shipping address. |
| **Addresses** | `POST` | `/users/me/addresses/:id/default` | Authenticated | Promotes an address to default in an atomic transaction. |
| **Admin** | `GET` | `/admin/users` | Admin (`@Roles('ADMIN')`) | Paginated list of users with email/name search, role, and ban filters. |
| **Admin** | `GET` | `/admin/users/:id` | Admin (`@Roles('ADMIN')`) | Retrieves full user details including role and ban status. |
| **Admin** | `PATCH` | `/admin/users/:id/status` | Admin (`@Roles('ADMIN')`) | Bans or unbans a user (prevents self-deactivation and last-admin deactivation). |

---

## 📁 Project Structure

```text
rootline-backend-nest/
├── prisma/
│   ├── migrations/              # Database migration history SQL files
│   ├── prisma.config.ts         # Prisma 7 CLI connection configuration
│   ├── schema.prisma            # Database schema definitions
│   └── seed.ts                  # Database seeder (creates initial administrator)
├── src/
│   ├── common/                  # Shared utilities and global middleware
│   │   ├── decorators/          # @CurrentUser, @Roles, @AllowAnonymous
│   │   ├── dto/                 # Global error and pagination schemas
│   │   ├── filters/             # AllExceptionsFilter (unified error format)
│   │   ├── middleware/          # RequestIdMiddleware
│   │   ├── types/               # Common type definitions
│   │   └── utils/               # Cookie and header helpers
│   ├── config/                  # Validated configuration
│   │   ├── auth.config.ts       # Better Auth setup and adapter options
│   │   └── env.ts               # Typed environment schema with @t3-oss/env-core
│   ├── database/                # Database service
│   │   └── prisma.service.ts    # Prisma client lifecycle and connection setup
│   ├── modules/                 # Feature modules
│   │   ├── auth/                # Sign-up, sign-in, session, and logout
│   │   ├── health/              # /health terminus endpoint and database ping
│   │   └── users/               # Profile, addresses, and admin user controls
│   ├── app.module.ts            # Root application module
│   └── main.ts                  # Application entry point and global pipeline
├── test/
│   ├── app.e2e-spec.ts          # Core application E2E tests
│   ├── auth.e2e-spec.ts         # Authentication, RBAC, and address E2E tests
│   └── jest-e2e.json            # Jest E2E test runner configuration
├── .env.example                 # Template for required environment variables
├── AGENTS.md                    # Architecture rules, guidelines, and roadmap
├── package.json                 # Project dependencies and script definitions
└── tsconfig.json                # TypeScript strict configuration
```

---

## 🚀 Getting Started

Follow these steps to set up the project locally:

### 1. Prerequisites
- **Node.js** v20 or higher
- **pnpm** v9 or higher
- A free **[Neon](https://neon.tech)** serverless PostgreSQL account

### 2. Configure Your Neon Database
1. Create a project in [Neon Console](https://console.neon.tech).
2. Obtain your two connection strings from the project dashboard:
   - **Pooled connection string**: Contains `-pooler` in the hostname (used by the application at runtime).
   - **Direct unpooled connection string**: Direct host without `-pooler` (used for migrations).

### 3. Setup Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your connection strings and secrets (see [Environment Variables](#-environment-variables)).

### 4. Install Dependencies
```bash
pnpm install
```

### 5. Run Database Migrations
Apply all schema migrations to your Neon database:
```bash
pnpm run prisma:migrate
```

### 6. Seed the Initial Administrator
Run the seed script to create the initial admin account using the credentials defined in `.env`:
```bash
pnpm run seed
```

### 7. Start the Development Server
```bash
pnpm run start:dev
```
The server will start at `http://localhost:3000`. You can explore the API interactively at `http://localhost:3000/docs`.

---

## ⚙️ Environment Variables

All environment variables are strictly validated on application startup via `@t3-oss/env-core` and Zod. If any required variable is missing or invalid, the application will fail to start with a descriptive error.

| Variable | Purpose | Required? | Example Placeholder |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | Application environment (`development`, `production`, `test`). | Optional (default: `development`) | `development` |
| `PORT` | HTTP port the server listens on. | Optional (default: `3000`) | `3000` |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string used for app queries. | **Required** | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string used for Prisma migrations. | **Required** | `postgresql://user:pass@ep.neon.tech/neondb?sslmode=require` |
| `JWT_ACCESS_SECRET` | Secret key used for signing JWT access tokens (min 32 chars). | **Required** | `your_super_secret_jwt_access_key_min_32_chars` |
| `JWT_REFRESH_SECRET` | Secret key used for signing JWT refresh tokens (min 32 chars). | **Required** | `your_super_secret_jwt_refresh_key_min_32_chars` |
| `JWT_ACCESS_EXPIRES_IN` | Duration before access tokens expire. | Optional (default: `15m`) | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Duration before refresh tokens expire. | Optional (default: `7d`) | `7d` |
| `BETTER_AUTH_SECRET` | Secret encryption key for Better Auth (min 32 chars). | **Required** | `your_better_auth_secret_minimum_32_characters` |
| `BETTER_AUTH_URL` | Base URL of the backend application. | Optional (default: `http://localhost:3000`) | `http://localhost:3000` |
| `ADMIN_EMAIL` | Email address for the seeded initial administrator. | Optional (default: `admin@rootline.local`) | `admin@rootline.local` |
| `ADMIN_PASSWORD` | Password for the seeded initial administrator (min 12 chars). | **Required** | `YourAdminSecretPassword123!` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated). Required in production. | Optional in dev (default: `http://localhost:3000`) | `http://localhost:3000,http://localhost:3001` |
| `THROTTLE_TTL` | Rate limiting sliding time window in milliseconds. | Optional (default: `60000`) | `60000` |
| `THROTTLE_LIMIT` | Maximum requests allowed per window. | Optional (default: `100`) | `100` |

> [!CAUTION]
> **Security Notice**: Never commit the `.env` file to version control. The `.gitignore` file is pre-configured to exclude it. Only placeholder values should ever appear in `.env.example`.

---

## 📜 Available Scripts

All scripts defined in `package.json`:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `pnpm run build` | `nest build` | Compiles the TypeScript application into standard JavaScript in `dist/`. |
| `pnpm run format` | `prettier --write ...` | Automatically formats TypeScript files using Prettier. |
| `pnpm run start` | `nest start` | Starts the NestJS application. |
| `pnpm run start:dev` | `nest start --watch` | Runs the server in development mode with hot-reloading on file change. |
| `pnpm run start:debug` | `nest start --debug --watch` | Runs the server in debug mode with Node inspector attached. |
| `pnpm run start:prod` | `node dist/src/main` | Runs the compiled production build with Node.js. |
| `pnpm run lint` | `eslint ... --fix` | Runs ESLint and automatically fixes code style and formatting issues. |
| `pnpm test` | `jest` | Executes all unit test suites. |
| `pnpm run test:watch` | `jest --watch` | Runs unit tests in interactive watch mode. |
| `pnpm run test:cov` | `jest --coverage` | Generates a unit test code coverage report in `coverage/`. |
| `pnpm run test:debug` | `node --inspect-brk ...` | Debugs unit tests using the Node inspector. |
| `pnpm run test:e2e` | `jest --config ./test/jest-e2e.json` | Runs end-to-end integration tests against the database. |
| `pnpm run prisma:generate` | `prisma generate` | Re-generates the Prisma Client TypeScript typings. |
| `pnpm run prisma:migrate` | `prisma migrate dev` | Creates and applies database migrations using `DATABASE_URL_UNPOOLED`. |
| `pnpm run seed` | `tsx prisma/seed.ts` | Seeds the database with the initial administrator account. |

---

## 🧪 Testing

The codebase includes comprehensive unit tests and live end-to-end integration tests:

### Running Unit Tests
Unit tests verify business logic and service edge cases using Jest and mocked dependencies:
```bash
pnpm test
```

### Running End-to-End (E2E) Tests
E2E tests make live HTTP requests against the application and verify database state on your configured Neon dev branch:
```bash
pnpm run test:e2e
```
*E2E tests verify disabled native auth routes, registration, login, dual cookie/bearer tokens, profile updates, address transactions, admin moderation, and immediate ban session revocation.*

---

## 🗺️ Roadmap

Next planned development phases:
1. **Phase 1.5**: Email verification & password reset flows (`MailService`, Mailpit in dev, Resend in prod).
2. **Phase 1.6**: Security hardening (account lockout, active session management, audit logs).
3. **Phase 1.7**: OAuth social login (Google).
4. **Phase 1.8**: Two-factor authentication (2FA).
5. **Phase 2 & beyond**: Categories, Products, Inventory, Orders, and Stripe Payments.

For comprehensive details on all project phases, architecture guidelines, and decisions, refer to [AGENTS.md](AGENTS.md).

---

## 🤝 Contributing

We follow **Conventional Commits** for clean and automated changelog generation. Commit messages must follow this structure:

```text
type(scope): short description in imperative mood
```
*Common types*: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`, `perf`.

Before committing your changes, always verify that your code passes all checks:
```bash
pnpm exec tsc --noEmit && pnpm run lint && pnpm test
```
Refer to [AGENTS.md](AGENTS.md) for full project standards and type safety rules.

---

## 📄 License

License: to be decided
