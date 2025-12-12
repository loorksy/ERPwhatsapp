# TODO

## High Priority
- Integrate automated test suite (unit/integration/e2e) covering auth, messaging, AI responses, and knowledge search flows.
- Wire CI/CD pipeline to run linting, tests, and security scanning (npm audit/snyk, docker best practices).
- Implement production-grade secrets management (e.g., environment vault/KMS) and rotate API keys regularly.
- Harden database access with least-privilege roles and verify TLS/SSL for PostgreSQL and Redis in production.
- Finalize observability stack (structured logs shipping, metrics, distributed tracing) and alerting thresholds.
- Validate rate limits, CSRF, and sanitizer behavior under load and with real-world clients/mobile devices.

## Medium Priority
- Add multi-region/HA deployment strategy with rolling updates and blue/green options.
- Build message queue or job worker for heavy tasks (embeddings generation, exports, notifications fan-out).
- Extend AI provider abstraction to support streaming responses and cost tracking per user/account.
- Add role/permission management UI for admins to configure granular access beyond current roles.
- Enhance analytics with cohort retention, funnel analysis, and SLA breach reporting.
- Provide data retention policies and automated cleanup for messages/media/logs per compliance requirements.

## Low Priority
- Localize entire UI/notifications for additional languages beyond Arabic, with RTL/LTR switching.
- Add theming support (light/dark/custom brand palettes) and save preferences per user.
- Implement offline/poor-network handling on the frontend with request retries and optimistic UI fallbacks.
- Create sample seed data and fixtures for demos and integration tests.
- Document disaster recovery drills and runbooks, including restore rehearsals from backups.
