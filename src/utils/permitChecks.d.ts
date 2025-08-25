/**
 * Detects missing or invalid fields from a permit summary.
 * Returns a string[] of issue descriptions.
 * @param {object} summary - The object produced by makePermitSummary
 * @returns {string[]}
 */
export function detectPermitIssues(summary: object): string[];
declare namespace _default {
    export { detectPermitIssues };
}
export default _default;
