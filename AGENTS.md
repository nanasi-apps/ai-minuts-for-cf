## Overview

AI Minutes monorepo with two main packages:
- **site/**: Nuxt 4 SSR application running on Cloudflare Workers, using oRPC for API contracts and Prisma ORM
- **workers/**: Cloudflare Worker for background job processing (transcription, summarization) using Hono

## Build/Lint/Test Commands

### Root Commands (run from repo root)
```bash
# Development
pnpm dev              # Start both site and workers in parallel
pnpm dev:site         # Start only the site
pnpm dev:workers      # Start only the workers

# Build & Deploy
pnpm deploy:site      # Deploy the site to Cloudflare
pnpm deploy:workers   # Deploy the workers to Cloudflare
pnpm deploy           # Deploy both packages

# Quality Checks
pnpm lint-format      # Run Biome lint and format check
pnpm lint-format:fix  # Run Biome with --write to fix issues
pnpm typecheck        # TypeScript check across all packages

# Database
pnpm prisma:generate  # Generate Prisma client
```

### Site Package Commands (from site/)
```bash
pnpm build            # Build Nuxt for production
pnpm dev              # Start Nuxt dev server
pnpm generate         # Generate static + Prisma + wrangler types
pnpm prisma:generate  # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm cf-typegen       # Generate Cloudflare types
pnpm typecheck        # Nuxt typecheck
```

### Workers Package Commands (from workers/)
```bash
pnpm dev              # Start wrangler dev
pnpm deploy           # Deploy worker
pnpm typecheck        # TypeScript check
pnpm cf-typegen       # Generate Cloudflare types
```

## Code Style Guidelines

### Formatting & Linting
- **Tool**: Biome (not ESLint/Prettier)
- **Indent**: Tabs
- **Quotes**: Double quotes
- **Max line length**: Default (80)
- Organize imports automatically via Biome

### Import Conventions
```typescript
// 1. External dependencies first
import { oc } from "@orpc/contract";
import * as z from "zod";

// 2. Internal aliases (site uses @/* and #/*)
import { authMiddleware } from "@/server/middlewares/auth";
import { os } from "@/server/orpc/os";
import { contract } from "#/orpc";  // #/* maps to ./shared/*

// 3. Type imports when applicable
import type { Job } from "../utils/queueTypes";
```

### Naming Conventions
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE (rare) or camelCase
- **Database fields**: camelCase (follow Prisma schema)
- **Files**: kebab-case.ts or PascalCase.vue

### TypeScript Conventions
- Enable `strict: true` in all tsconfig.json
- Always use explicit return types for exported functions
- Use `interface` for object shapes (not `type`)
- Use `zod` for all runtime validation
- Use `type` imports when importing types only

### Vue/Nuxt Conventions
- Always use `<script setup lang="ts">`
- Use PascalCase for component names (both file and usage)
- Use computed() for derived state
- Use composables in `app/composables/` (auto-imported)
- Props interface should be named `Props`

### oRPC Contract-First Development
All API development must follow contract-first:

1. **Define contract in `site/shared/orpc/contracts/`**:
```typescript
const getUser = oc
  .route({ path: "/:userId", method: "GET" })
  .input(z.object({ userId: z.coerce.number().int().positive() }))
  .output(z.object({ id: z.number(), name: z.string() }));
```

2. **Implement in `site/server/orpc/procedures/`**:
```typescript
get: os.users.get.use(authMiddleware).handler(async ({ context, input }) => {
  // Implementation
});
```

3. **Never deviate from contract** - update contract first if changes needed

### Error Handling
- Use `ORPCError` from `@orpc/server` for API errors
- Always provide user-friendly error messages in Japanese
- Log server errors with `console.error`
- Example:
```typescript
try {
  // operation
} catch (error) {
  console.error("Failed to generate presigned URL:", error);
  throw new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "エラーメッセージ",
  });
}
```

### Database (Prisma)
- Always use Prisma client from context (not global)
- Use `@/server/prisma-client` imports
- Enable `@prisma/adapter-d1` for Cloudflare D1
- Database operations must handle Cloudflare Workers constraints

### Middleware Patterns
- oRPC middleware: `use(middlewareName)` chain
- Auth middleware adds `userId` to context (AuthenticatedORPCContext)
- DB middleware adds `db` to context (ORPCContext)

## Git Workflow

- Pre-commit hook runs: `pnpm lint-format && pnpm typecheck`
- Husky is configured at `.husky/pre-commit`
- CI runs: install → prisma:generate → lint-format → typecheck → build

## Architecture Constraints

### Cloudflare Workers Environment
- **Stateless**: No filesystem persistence
- **Edge runtime**: Limited Node.js APIs
- **Durable Objects**: Use for stateful operations (QueueDO)
- **Bindings**: Access via `context.event.context.cloudflare.env`

### SSR on Workers (Nuxt)
- Nitro preset: `cloudflare-module`
- Prisma uses Data Proxy / D1 adapter
- All server code must be Workers-compatible

## Agent Behavior Rules

1. **Complete tasks fully** - no partial answers or skipped sections
2. **Output in Japanese** for all final responses
3. **No code blocks in final output** (only reasoning)
4. **Contract-first**: Always define/update oRPC contracts first
5. **camelCase everywhere** - variables, functions, fields
6. **Use latest versions** - Nuxt 4, oRPC, Prisma, Cloudflare Workers
7. **No TODO lists** - complete tasks directly
8. **Error messages in Japanese** for user-facing errors
