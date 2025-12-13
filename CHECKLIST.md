# Project Readiness Checklist

## Architecture & Project Structure
- [ ] Repository structure aligns with documented layout for backend, frontend, deployment, and infrastructure assets.
- [ ] package.json files list all runtime and dev dependencies; lockfiles refreshed after dependency changes.
- [ ] `.env.example` is present, current, and mirrors required environment variables for backend, frontend, and deployment scripts.
- [ ] Git ignores secrets and build artifacts; CI/CD configuration honors environment separation.

## Backend Readiness
- [ ] API server starts with environment-driven configuration (ports, database, Redis, WhatsApp, AI providers).
- [ ] PostgreSQL schema applied successfully; migrations or schema scripts are in sync with models and services.
- [ ] Redis connectivity verified for caching/queues if applicable.
- [ ] Authentication: register/login/logout/forgot/reset flows tested; JWT issuance/verification and role checks confirmed.
- [ ] Authorization enforced on protected routes with role-based guards where required.
- [ ] Rate limiting, CSRF protection, request sanitization, and Helmet security headers enabled in Express middleware.
- [ ] Validation using express-validator covers all external inputs (body, query, params) with safe error responses.
- [ ] Logging via Winston writes to error/combined/access logs; sensitive data omitted from logs.
- [ ] Error handling middleware returns consistent JSON envelopes and surfaces correlation/request IDs when available.
- [ ] WhatsApp integration: session initialization, QR flow, reconnection, send/receive, and session persistence verified.
- [ ] Socket.io events broadcast QR codes, message updates, and notifications with proper authentication.
- [ ] Message handler processes media, intents, operating hours, and conversation lifecycle updates (status/notes/transfer).
- [ ] AI service returns responses for configured providers (OpenAI/Claude/Gemini/Custom) with retries and timeouts.
- [ ] Knowledge base CRUD, uploads, embedding generation, and semantic search endpoints function end-to-end.
- [ ] Notifications service emits and persists events (info/success/warning/error) with read/unread status.

## Frontend Readiness
- [ ] React app builds with Tailwind configuration and Vite setup without warnings/errors.
- [ ] API client injects JWT/CSRF tokens, handles refresh/forbidden responses, and surfaces errors consistently.
- [ ] Auth pages (register/login/forgot) validate inputs and update auth context/storage correctly.
- [ ] Dashboard shell renders sidebar/header with notification bell, profile menu, and WhatsApp status badge.
- [ ] Conversations UI loads lists with filters/search/sorting/pagination and streams updates via Socket.io.
- [ ] Chat window supports sending text/media, emoji picker, operator transfer, and shows timestamps/source styling.
- [ ] WhatsApp connect page displays QR codes with countdown, connect/disconnect actions, and real-time status.
- [ ] AI settings tabs save and load provider/model/prompt/behavioral options with validation and connection testing.
- [ ] Knowledge base page supports table filtering/sorting, modal CRUD, uploads with progress, and template editing.
- [ ] Quick replies page supports categories, search, drag-and-drop ordering, placeholders preview, and copy/edit/delete.
- [ ] Analytics and reports pages render charts, respect date filters, and export CSV/Excel/PDF as expected.
- [ ] Admin dashboards display metrics, manage users (filters/pagination/export), and update subscription/AI provider data.
- [ ] Advanced settings handle operating hours, timezone, welcome/off-hours messaging, and escalation keywords with saves.
- [ ] Styling is responsive (mobile/tablet/desktop) across key pages; RTL/Arabic text flows render correctly where applicable.

## Integrations & Deployment
- [ ] Backend and frontend communicate over configured base URLs; CORS and proxy settings allow required origins.
- [ ] WebSocket/SSE endpoints reachable through Nginx reverse proxy with proper upgrade headers.
- [ ] PM2 ecosystem config matches deployed paths, scripts, environment, and resource limits.
- [ ] Nginx config proxies API, serves frontend, enables gzip/SSL, and renews certificates via Certbot.
- [ ] Deployment script (deploy.sh) installs dependencies, builds frontend, restarts backend, and reloads Nginx without errors.
- [ ] Installation script (install.sh) provisions OS packages, creates users/db, applies schema, and seeds env files safely.
- [ ] Backup script runs on schedule, stores compressed DB/files securely, and prunes archives beyond retention policy.

## Quality & Testing
- [ ] Automated tests (unit/integration/e2e) pass or are documented as pending; linting/formatting enforced.
- [ ] Manual QA performed for critical flows: auth, messaging, AI responses, knowledge search, notifications.
- [ ] Performance reviewed for heavy queries (indexes, pagination) and WebSocket scaling considerations.
- [ ] Observability hooks (metrics/tracing) planned or integrated for production monitoring.

## Documentation
- [ ] README explains setup, environment variables, run/test commands, deployment, and troubleshooting.
- [ ] API endpoints documented with expected payloads, status codes, and auth requirements.
- [ ] Security practices noted (rate limits, CSRF, validation) and key operational runbooks provided.
- [ ] Any gaps or caveats recorded in TODO and KNOWN_ISSUES.
