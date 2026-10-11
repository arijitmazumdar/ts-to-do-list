/**
 * Purpose: Verify persistence and rollback against isolated SQLite databases.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * BEFORE each case: open fresh in-memory database and apply migrations.
 * CHECK CRUD, missing IDs, status/tag filters, and complete domain mapping.
 * CHECK tag replacement/deduplication and canonical symmetric related links.
 * DELETE a parent: verify children detach and task links cascade.
 * FORCE a multi-table constraint failure: verify entire mutation rolls back.
 * AFTER each case: close database.
 */
