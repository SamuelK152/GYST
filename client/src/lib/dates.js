import dayjs from 'dayjs';

export const todayKey = () => dayjs().format('YYYY-MM-DD');

export function rangeFor(mode = 'month') {
  const now = dayjs();
  if (mode === 'week') {
    return {
      from: now.startOf('week').format('YYYY-MM-DD'),
      to: now.endOf('week').format('YYYY-MM-DD')
    };
  }
  if (mode === 'year') {
    return {
      from: now.startOf('year').format('YYYY-MM-DD'),
      to: now.endOf('year').format('YYYY-MM-DD')
    };
  }
  return {
    from: now.startOf('month').format('YYYY-MM-DD'),
    to: now.endOf('month').format('YYYY-MM-DD')
  };
}
