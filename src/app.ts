/**
 * Purpose: Compose the HTTP application without opening a socket so tests can inject dependencies.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * ACCEPT service, database readiness check, and error logger dependencies.
 * CREATE Express app; configure Nunjucks with autoescaping enabled.
 * REGISTER size-limited JSON and URL-encoded parsers, then public assets.
 * REGISTER GET /health: check database; return 200 ok or generic 503 error.
 * MOUNT JSON API router under /api, then HTML router under /.
 * REGISTER not-found handler and final error handler using errors.ts.
 * RETURN app without listening or opening a database.
 */
