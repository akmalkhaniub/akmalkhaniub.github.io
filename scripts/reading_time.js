/**
 * Reading Time Estimator and Dynamic Theme Helper for akmalkhaniub.github.io
 */

export function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text || typeof text !== 'string') return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatReadingTimeBadge(minutes) {
  return `${minutes} min read`;
}
