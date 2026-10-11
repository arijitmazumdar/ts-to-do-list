/**
 * Purpose: Adapt HTML forms and HTMX requests to the same service used by the API.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * GET /: list filtered tasks and render index or requested list fragment.
 * GET /todos/:id/edit: fetch task and render edit form/full page as appropriate.
 * POST /todos: parse form values and create task.
 * POST /todos/:id: parse supplied form values and update task.
 * POST /todos/:id/delete: delete task.
 * POST /todos/:id/status: request lifecycle transition with optional pause reason.
 * CONVERT comma-separated tags, nullable dates, and relationship IDs to service input.
 * ON HX-Request: return fragments with explicit matching targets and valid swaps.
 * ON normal successful submission: redirect to /; keep basic forms usable without HTMX.
 * ON validation failure: render escaped values and inline field errors with status 422.
 * FORWARD other failures to shared error handling.
 */
