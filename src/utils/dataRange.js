function getDateRange(period) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'this-week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'this-month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'this-year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

module.exports = { getDateRange };