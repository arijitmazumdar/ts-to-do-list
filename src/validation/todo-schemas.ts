/**
 * Purpose: Plan strict request schemas and shared input/domain types.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * DESCRIBE Todo and TodoStatus from the README domain contract.
 * PARSE positive integer route IDs and related-task path IDs.
 * VALIDATE list filters against known statuses and valid tag input.
 * VALIDATE trimmed name length 1..200 and nullable description length up to 5000.
 * VALIDATE real YYYY-MM-DD calendar dates and matching start/end ordering.
 * CREATE schema: allow editable fields only; reject server-managed and unknown fields.
 * PATCH schema: allow editable fields plus status/reason; reject empty or unknown fields.
 * DISTINGUISH omitted fields from explicit null; preserve omitted patch values.
 * VALIDATE tags, relationship IDs, nullable parent ID, and local status/reason combinations.
 * LEAVE rules requiring stored state to the service after merging a patch.
 */
