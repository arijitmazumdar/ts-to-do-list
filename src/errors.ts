/**
 * Purpose: Describe shared domain errors and safe HTTP error responses.
 *
 * Planning placeholder only; no implementation.
 * Pseudocode:
 * DEFINE validation, not-found, relationship-conflict, and unexpected error categories.
 * MAP malformed JSON or invalid path/query values to 400; missing tasks to 404.
 * MAP relationship conflicts to 409; invalid payload/business rules to 422.
 * LOG unexpected failures internally and return generic 500 without stack traces.
 * FORMAT JSON as error with code, message, and optional field details.
 * FOR HTML requests, render escaped inline field errors or a safe error page.
 */
