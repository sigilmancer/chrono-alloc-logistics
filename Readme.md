# chrono-alloc-logistics API

A NestJS backend for managing couriers, depots, and dispatch runs in a logistics and scheduling workflow.

## Overview

This project exposes a REST API for operating a dispatch-oriented business domain. It is built with:

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod validation
- Jest for tests

The application is organised around three primary domain entities:

- Courier
- Depot
- DispatchRun

These entities are managed through a modular backend structure, with validation and persistence handled by Prisma and typed service logic.

## What this API does

This backend models a real-world operational workflow where:

- couriers represent delivery drivers or available dispatch units
- depots are operational locations or hubs
- dispatch runs represent scheduled dispatch activities or route assignments
- validation rules and scheduling checks are applied before records are processed

The codebase includes scheduler-related logic and operational checks. This service supports dispatch planning and time-based workflow validation rather than simple record storage alone.

## Project architecture

The application follows a standard NestJS modular design.

## Domain model

### Courier
Represents a courier, driver, or available dispatch unit.

Responsibilities include:
- storing courier attributes
- listing and querying couriers
- exposing courier data to API consumers
- validating courier-related payloads

### Depot
Represents a physical location such as a hub, warehouse, base, or dispatch origin.

Responsibilities include:
- managing depot data
- supporting location-based logistics operations
- linking route or dispatch logic to specific depots

### DispatchRun
Represents a scheduled or operational dispatch run.

Responsibilities include:
- creating and tracking dispatch runs
- validating run conditions
- checking business rules around scheduling or dispatch status
- applying logic through a dedicated scheduler layer

## Validation

The project uses Zod schemas and a custom validation pipe to validate incoming requests before they reach the service layers.

This is an important part of the design because it enforces structure and prevents invalid payloads from entering the database layer.

## Pagination

Using shared pagination utilities, the list endpoints are intended to support page-based result retrieval rather than returning raw full collections.

## Prisma and database

The project uses Prisma as the database layer, with the Prisma schema as the source of truth for the persistence model.

Database-related files:

```text
prisma/
├── schema.prisma
├── seed.ts
├── migrations/
├── seed/
│   ├── couriers.ts
│   ├── depots.ts
│   └── dispatchRuns.ts
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
SHARD_INSTANCE_ID=0
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run migrations

```bash
npx prisma migrate deploy
```

### 5. Seed the database

```bash
node prisma/seed.ts
```

If you are doing local development and want to reset the DB quickly, use the database tooling appropriate for your environment before re-running migrations and seeds.

## Running the API

### Development mode

```bash
npm run start:dev
```

### Production build

```bash
npm run build
npm run start:prod
```

## Tests

The project includes unit tests for mapping and shared utilities:

```bash
npm run test
```

## Common scripts

From the project setup, standard NestJS commands are supported, including:

```bash
npm run start
npm run start:dev
npm run build
npm run lint
npm run test
```

## API structure

The project is organised by resource modules, so the API is expected to follow a familiar REST pattern:

- `/couriers`
- `/depots`
- `/dispatch-runs`

The exact route names may differ depending on controller decorators and route prefixes in the actual NestJS files, but the structure follows modular REST resource design.

## Notable implementation details

This codebase contains a few especially strong patterns:

- Clean domain separation by module
- Strong request validation via Zod
- Prisma-based persistence
- Mapper layer separation between DB models and API output
- Shared pagination utility
- Scheduler logic for dispatch workflow management

These are the parts that make the project more than a basic CRUD server.

## Notes

This is best understood as an operations API for dispatch planning rather than a generic app backend. The real value is in the combination of:

- structured domain modules
- validation and type safety
- database persistence via Prisma
- schedule-aware dispatch logic
- realistic seed data for local testing

## License

No explicit license file is currently included in the repository structure.