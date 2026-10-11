/**
 * Purpose: Verify every JSON REST operation and its safe error responses.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * USE Supertest with an isolated migrated database and app fixture.
 * FOR list/create/get/update/delete/add-related/remove-related: check success and validation.
 * CHECK not-found where applicable and injected database failure for every operation.
 * CHECK create Location header, JSON content type, 204 empty bodies, and filtering.
 * CHECK malformed JSON, invalid path/query values, and unsupported content types.
 * CHECK 409 conflicts, 422 domain failures, and consistent error envelopes.
 * ASSERT generic 500 responses never expose SQL, paths, internal messages, or stack traces.
 */
