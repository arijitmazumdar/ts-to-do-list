/**
 * Purpose: Verify server-rendered pages, form workflows, and HTMX fragments.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * USE isolated app fixture; check list page, edit page, filters, and empty state.
 * CHECK create/update/delete/status forms with HX-Request true return matching fragments.
 * CHECK ordinary successful form submissions redirect to /.
 * CHECK invalid forms return 422 with preserved values and inline field errors.
 * CHECK escaping of user content and generic responses to persistence failures.
 * CHECK missing tasks and invalid lifecycle transitions through shared service behavior.
 */
