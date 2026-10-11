/**
 * Purpose: Enforce domain rules independently of HTTP and coordinate atomic mutations.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * ACCEPT repository and injectable now clock.
 * LIST/GET tasks; report not-found when a required task is missing.
 * CREATE: normalize tags; validate dates and referenced tasks; set planned status.
 * UPDATE: load existing task, merge supplied fields, and validate the resulting state.
 * ALLOW planned -> in_progress/cancelled; in_progress -> paused/completed/cancelled;
 * ALLOW paused -> in_progress/cancelled; reject transitions from terminal states.
 * ON first start: set actualStartDate; on resume: preserve start and clear pause reason.
 * ON pause: require nonblank reason; all other statuses require null reason.
 * ON completion: require actual start and set missing actual end; validate date order.
 * REJECT self-links, missing references, and cyclic parent/child relationships.
 * REPLACE supplied tags/related IDs; preserve omitted collections.
 * REFRESH lastUpdatedDate once per mutation; persist related writes in one transaction.
 * DELETE or modify related links only after existence/conflict checks.
 * PROPAGATE internal persistence failures for generic boundary error handling.
 */
