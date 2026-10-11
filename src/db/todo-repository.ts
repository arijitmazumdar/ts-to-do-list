/**
 * Purpose: Own parameterized SQL, transactional persistence, and row-to-domain mapping.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * ACCEPT database connection; prepare parameterized queries.
 * CREATE task and replace tags/related links in one transaction; return complete Todo.
 * LIST tasks with optional status/tag filters; FIND task by positive ID or return null.
 * UPDATE supplied fields and collection replacements atomically; return null if missing.
 * DELETE task and links; detach children via foreign keys; report whether task existed.
 * REPLACE tags using normalized unique tag names and join rows.
 * ADD related link as ordered smaller/larger ID pair; REMOVE that canonical pair.
 * CHECK descendants with recursive traversal for parent-cycle validation.
 * MAP snake_case rows into camelCase Todo including tags, parent, children, related IDs.
 * DERIVE isPaused from status; expose related links symmetrically.
 * ROLLBACK all writes when any part of a logical mutation fails.
 */
