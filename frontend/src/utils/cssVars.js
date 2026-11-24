/**
 * Extract a computed CSS custom property value from :root.
 * Useful for libraries like recharts that don't support CSS variables directly.
 */
export function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(monthNum) {
  return MONTH_LABELS[(monthNum - 1) % 12] || monthNum;
}
