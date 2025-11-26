## Overview

This project is a Nuxt 4 application running SSR on Cloudflare Workers.
The system uses oRPC as the communication layer and Prisma as the ORM.
All agents must strictly follow contract-first development principles, enforce schema validation with Zod, and ensure full type safety across server and client.

## Core Rules

### 1. Complete Each Task Fully

Agents must fully complete the assigned task. Partial answers, skipped reasoning, or omitted sections are not allowed.
Focus exclusively on the requested task until it is completed.

### 2. Output Language

All final outputs must be written in Japanese.

### 3. Contract-First Development (oRPC)

All system design and implementation must follow oRPC contract-first principles.

Required behaviors:
- Define oRPC contracts first, before any server or client implementation.
- Server and client must always share the exact same contract definition.
- Endpoints must strictly follow the path, method, request shape, and response shape defined in the contract.
- Type safety must be guaranteed by the contract.
- If the API specification changes, update the contract first, then regenerate or refactor both server and client accordingly.
- Avoid any API implementation that deviates from the defined contract.

### 4. Validation With Zod

All input and output schemas must use Zod for validation.
Validation must be applied at the contract level and relied upon by both server and client implementations.
Any invalid data must result in proper error propagation defined by the contract.

### 5. Error Handling

Errors must be handled according to the contract.
Server implementations should produce standardized, contract-driven error responses.
Clients must safely handle all contract-defined error formats.

### 6. Naming Conventions

Use camelCase for all variable names, function names, and field names.
This applies across server, client, contract, and database-accessible layers.

### 7. Continuous and Updated Reasoning

Agents must always use the latest information available.
When generating or reasoning about implementation details, assume up-to-date versions of Nuxt 4, oRPC, Prisma, Cloudflare Workers, and related tooling.

### 8. SSR on Cloudflare Workers

When generating code, architecture descriptions, or implementation guides, the agent must assume:
- Nuxt 4 executes SSR on Cloudflare Workers.
- All server logic must be compatible with Workers constraints such as limited filesystem access, edge runtime limitations, and stateless execution.
- Prisma must use the proper Data Proxy or recommended configuration for serverless/edge environments.

## Behavioral Requirements for the Agent

### Task Execution

When receiving a task, the agent must:
• Interpret the task precisely.
• Think step-by-step until a complete solution is formed.
• Produce a final Japanese answer containing the complete output with no missing components.
• Avoid extraneous commentary.

### Forbidden Behaviors

- Do not use code blocks in final output.
- Do not partially answer tasks.
- Do not produce inconsistent or non-contract-first APIs.
- Do not invent endpoints, methods, or schema elements not defined in the contract.
- Do not switch naming conventions.
