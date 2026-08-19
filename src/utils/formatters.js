export const formatDate = (date) => {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const MUSHROOM_STATUS_KEY = {
  PSILOCYBIN: 'psilocybin',
  NON_PSILOCYBIN: 'non-psilocybin',
  TOXIC: 'toxic',
  UNKNOWN: 'unknown',
  UNIDENTIFIABLE: 'unidentifiable',
  BAD_PICTURES: 'bad-pictures'
}

const lowercaseFirst = (str) => str.charAt(0).toLowerCase() + str.slice(1)

/**
 * Summarizes a request's mushroom status breakdown for the admin request tables,
 * e.g. "Psilocybin and 3 more" or "All psilocybin". Mushrooms that haven't been
 * given a decision yet (NOT_PROCESSED) don't count towards the summary; returns
 * null if none of the request's mushrooms have been decided on yet.
 *
 * @param mushroomStatusCounts a map of MushroomStatus to count, as returned by the API
 * @param t the i18n translate function
 * @returns {string|null}
 */
export const formatMushroomDecisionSummary = (mushroomStatusCounts, t) => {
  if (!mushroomStatusCounts) return null

  const decided = Object.entries(mushroomStatusCounts)
    .filter(([status, count]) => status !== 'NOT_PROCESSED' && count > 0)
    .sort((a, b) => b[1] - a[1])

  const totalDecided = decided.reduce((sum, [, count]) => sum + count, 0)
  if (totalDecided === 0) return null

  const [topStatus, topCount] = decided[0]
  const label = t(`mushroom.status.${MUSHROOM_STATUS_KEY[topStatus]}`)

  if (topCount === totalDecided) {
    return t('request.mushroomDecisionAllOf', { status: lowercaseFirst(label) })
  }
  return t('request.mushroomDecisionAndMore', { status: label, count: totalDecided - topCount })
}

export const formatRelativeTime = (date, locale = navigator.language) => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const updated = new Date(date);
  const seconds = Math.floor((now - updated) / 1000);

  const ranges = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [unit, value] of Object.entries(ranges)) {
    const delta = Math.floor(seconds / value);
    if (delta !== 0) {
      return rtf.format(-delta, unit); // negative means "ago"
    }
  }

  return rtf.format(0, 'second');
};
