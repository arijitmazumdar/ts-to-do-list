/**
 * Purpose: Translate the documented JSON REST contract into service calls.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * ACCEPT service; validate path/query/body before invoking it.
 * GET /todos: list with optional status/tag filters; respond 200 JSON.
 * POST /todos: create; respond 201 JSON and Location /api/todos/:id.
 * GET /todos/:id: fetch; respond 200 JSON.
 * PATCH /todos/:id: pass validated partial update; respond 200 JSON.
 * DELETE /todos/:id: delete; respond 204 with no body.
 * POST /todos/:id/related/:relatedId: add symmetric link; respond 204.
 * DELETE /todos/:id/related/:relatedId: remove link; respond 204.
 * REJECT unsupported body content types; forward failures to the shared error handler.
 * KEEP SQL and domain rules in repository/service modules.
 */
