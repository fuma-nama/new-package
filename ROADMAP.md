# Blog CMS Roadmap

## Project Goal

Build a production-ready, collaborative blog CMS with:

- A central database for content (internal source of truth)
- Realtime editing via Y.js + Hocuspocus
- Publisher-based distribution (e.g. to GitHub, file system, or other websites)
- Strict boundary: public/blog apps consume publisher outputs, not central DB

## Current Architecture (Implemented)

### Core Platform

- Canonical CMS domain schema + mapped Prisma schema for DB sync
- Kysely + PostgreSQL storage adapter for runtime reads/writes
- Generic auth abstraction (already made a NextAuth adapter)
- Role-aware API guards (`admin` / `editor` / `viewer`)

### Realtime Collaboration

- Local Hocuspocus server with auth checks
- Y.js persistence to database
- Tiptap collaborative body editing
- Realtime post metadata editing (slug/title/description)
- Editor-level realtime connection status indicator

### Publishing System

- Snapshot-aware delta engine
- Publisher plugins:
  - GitHub
  - Local git
- Publish job tracking and history
- Deletion sync support (deleted posts can be published as removals)

### CMS App UX

- Fullscreen CMS layout with stable internal scrolling
- Dashboard + Editor + Settings pages
- Publisher management moved to Settings
- Publish popover with per-target status
- Trash section for deleted posts not fully synced to targets
- Shared design system tokens + reusable CMS UI primitives

### Frontend Data Layer

- Zustand store for CMS post state
- Data layer + action hook (`deletePost` action centralized)
- Y.js metadata subscription bridge into store
- Sidebar post list sourced from live frontend state

### API Contracts

- Zod body schemas + response schemas for CMS routes
- Typed response helper to enforce response shape at route level

## Phase Plan

## Phase 1: Stabilization (Now -> short-term)

- Finalize DB schema changes (`deletedAt`, `deletedBy`) in all environments
- Add integration tests for:
  - create/update/delete/publish flows
  - trash sync behavior
  - response schema enforcement
- Add route-level audit logging for destructive actions (delete/publish)

## Phase 2: Collaboration Hardening

- Add presence UI (who is online/editing)
- Add conflict-safe handling for slug changes during simultaneous edits
- Add reconnect/backoff UX signals for degraded websocket states
- Add optional readonly editor mode for `viewer`

## Phase 3: Publisher Maturity

- Publisher health checks and target validation UI
- Retry/cancel controls for failed publish jobs
- Batched publish for trash cleanup
- Better publish event timeline UI per post/target

## Phase 4: Content Workflow Improvements

- Post filtering/search/sorting (active + trash)
- Restore-from-trash workflow (optional, policy-driven)
- Optional scheduled publish and status transitions
- Richer editor UX (blocks/shortcuts/preview split)

## Phase 5: Operational Readiness

- Observability:
  - structured logs
  - basic metrics (publish success rate, latency, websocket stability)
- Security hardening:
  - stricter token handling
  - secrets management review
- Backup/recovery runbook for CMS and realtime docs

## Near-Term Backlog (Recommended Next 5)

1. Add automated tests for delete + publish-removal flow.
2. Add API contract tests that validate Zod response schemas.
3. Surface publish job history per post in dashboard/editor.
4. Add explicit reconnect/backoff indicator for realtime providers.
5. Add restore action for trash posts (with permission checks).

## Non-Goals (for now)

- Serving public blog directly from central CMS DB
- Multi-tenant hosting/deployment orchestration

## Success Criteria

- Editors can collaboratively edit without manual save actions.
- Publish operations deterministically sync content and deletions to targets.
- API request/response contracts are validated and consistent.
- CMS UI remains responsive and role-safe under concurrent editing.
