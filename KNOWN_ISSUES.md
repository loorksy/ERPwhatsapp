# Known Issues

## Environment & Setup
- Package installation may fail in restricted environments (e.g., npm registry access errors for native modules like `bcrypt`); ensure network and build prerequisites are available.
- External API keys (OpenAI, Anthropic, Google, WhatsApp session) must be provided for full functionality; without them, related features will return placeholder responses or fail.
- SSL certificates and DNS records are required for the provided Nginx/Certbot configuration; staging domains should be verified before running `certbot` in production.

## Backend
- No automated migration tool is configured; schema updates require rerunning `schema.sql` manually or adopting a migration framework.
- Background job/queue processing is not yet implemented for long-running tasks (embeddings generation, exports), which may affect performance under load.
- Webhook and socket event authentication rely on existing JWT/session flows; additional hardening (per-event auth or namespace-level guards) may be needed for multi-tenant deployments.

## Frontend
- Client-side data is optimistic in some flows (e.g., conversation send), and errors may require manual refresh to reconcile state.
- Real-time updates depend on a stable Socket.io connection; proxy/load balancer configuration must allow WebSocket upgrades.
- Some charts/exports use mock data when analytics endpoints are unavailable; ensure backend analytics APIs are live before production use.

## Operations
- Backups rely on local filesystem retention; offsite/object storage replication is not configured.
- Observability/alerting integrations (APM/metrics) are not yet wired; production monitoring needs completion.
- Comprehensive automated tests are not yet in place; manual QA is required before releases.
