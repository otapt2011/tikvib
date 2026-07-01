/**
 * Converts a relative time string (e.g. "44 minutes ago", "2 days ago")
 * into an absolute Date, based on a reference date (defaults to now).
 *
 * @param {string} relativeStr - The relative time string from TikVib.
 * @param {Date}   reference   - The scrape / reference date.
 * @returns {Date|null}        - The estimated absolute date, or null if parsing fails.
 */
function relativeTimeToDate(relativeStr, reference = new Date()) {
  if (!relativeStr || typeof relativeStr !== 'string') return null;
  
  // Normalise the string
  let str = relativeStr.trim().toLowerCase();
  
  // Handle "just now" / "now"
  if (/^(just\s+now|now)$/.test(str)) return new Date(reference);
  
  // Remove trailing " ago" if present
  str = str.replace(/\s*ago$/, '');
  
  // Split into parts: "a minute", "44 minutes", "1 hour", "3 days", etc.
  const match = str.match(/^(an?|\d+)\s*(milliseconds?|seconds?|minutes?|hours?|days?|weeks?|months?|years?)$/i);
  if (!match) return null;
  
  let amount = match[1];
  const unit = match[2].toLowerCase();
  
  // Convert words to numbers
  if (amount === 'a' || amount === 'an') amount = 1;
  else amount = parseInt(amount, 10);
  
  if (isNaN(amount)) return null;
  
  // Map unit to milliseconds
  const unitMs = {
    'millisecond': 1,
    'milliseconds': 1,
    'second': 1000,
    'seconds': 1000,
    'minute': 60 * 1000,
    'minutes': 60 * 1000,
    'hour': 60 * 60 * 1000,
    'hours': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000,
    'days': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
    'weeks': 7 * 24 * 60 * 60 * 1000,
    'month': 30 * 24 * 60 * 60 * 1000, // approximate
    'months': 30 * 24 * 60 * 60 * 1000,
    'year': 365 * 24 * 60 * 60 * 1000, // approximate
    'years': 365 * 24 * 60 * 60 * 1000,
  };
  
  const ms = amount * (unitMs[unit] || 0);
  if (ms === 0) return null;
  
  // Subtract from reference date
  return new Date(reference.getTime() - ms);
}
