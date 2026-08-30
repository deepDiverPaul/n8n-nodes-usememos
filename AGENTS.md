# n8n-nodes-usememos

## Overview
This repository contains the `n8n-nodes-usememos` community node package for [n8n](https://n8n.io), providing integrations with [useMemos](https://usememos.com) — an open-source, privacy-first, lightweight note-taking service.

The node connects to self-hosted or cloud-hosted useMemos instances using the official REST API v1.

## API Documentation
The official useMemos API documentation is available at:
- **API Reference (Latest)**: https://usememos.com/docs/api/latest
- **Access Tokens Guide**: https://usememos.com/docs/security/access-tokens

## Authentication & Credentials
Connecting to a Memos instance requires Bearer Token authentication via the `memosApi` credential (`credentials/MemosApi.credentials.ts`):
- **Server URL (`server`)**: The base URL of the Memos instance (e.g. `https://memos.example.com`). All API requests target the `/api/v1` prefix.
- **Access Token (`accessToken`)**: Personal access token generated in Memos user settings.
- **Auth Endpoint**: `GET /api/v1/auth/me`).

## Nodes in Package

### 1. Memos Node (`nodes/Memos/Memos.node.ts`)
A general action node to interact with resources in Memos.

#### Supported Resources & Operations:
- **Memo (`memo`)**:
  - `Create`: Create a new memo in Markdown format with optional visibility (`PRIVATE`, `PROTECTED`, `PUBLIC`), state (`NORMAL`, `ARCHIVED`), and pinned flag.
  - `Get`: Retrieve a specific memo by ID/name (e.g. `123` or `memos/123`).
  - `Get Many`: List memos with pagination (`returnAll` / `limit`), state filtering, CEL filter expressions (e.g. `creator == "users/1"`), and custom ordering (`orderBy`).
  - `Update`: Update content, visibility, state, and pinned status of an existing memo using `updateMask`.
  - `Delete`: Delete an existing memo by ID/name.
- **User (`user`)**:
  - `Get`: Retrieve user details by user ID or username.
  - `Get Many`: List users with pagination (`returnAll` / `limit`).
  - `Get Current User`: Fetch the authenticated user's profile and session status.

### 2. Memos Trigger Node (`nodes/Memos/MemosTrigger.node.ts`)
A webhook trigger node that automatically subscribes to and receives event notifications from a Memos instance via webhook callbacks (`/api/v1/users/{user}/webhooks`).

## Project Structure
```text
.
├── credentials/
│   ├── MemosApi.credentials.ts   # Credential type definition for Memos API
│   └── memos.png                 # Credential icon
├── nodes/
│   └── Memos/
│       ├── GenericFunctions.ts   # API request helpers, auth, and pagination
│       ├── Interfaces.ts         # TypeScript models and API response types
│       ├── Memos.node.ts         # Main Memos node implementation
│       ├── MemosTrigger.node.ts  # Memos Webhook trigger node implementation
│       └── memos.png             # Node icon
├── package.json                  # Package manifest and n8n registration
└── tsconfig.json                 # TypeScript build configuration
```

## Development & Build Commands
- **Build**: `npm run build` (transpiles TypeScript to `dist/` and copies static assets)
- **Lint**: `npm run lint` (runs ESLint and community node rules)
- **Lint Fix**: `npm run lint:fix`
- **Development Watch**: `npm run dev`

## Standards & Best Practices
- **Package Registration**: All nodes and credentials must be correctly registered in `package.json` under the `n8n` object (`n8n.nodes` and `n8n.credentials`).
- **Connection Types**: Nodes use `NodeConnectionTypes.Main` from `n8n-workflow` for inputs and outputs.
- **Error Handling**: API errors and validation issues are cleanly wrapped in `NodeApiError` and `NodeOperationError`.
- **Typing**: Strict TypeScript types without `any`.
- **AI Tool Compatibility**: `usableAsTool: true` is configured where appropriate.
