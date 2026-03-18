const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SAO_PAULO_OFFSET = '-03:00';

export type DateRangeInput = {
  startDate?: string;
  endDate?: string;
};

export function isDateOnly(value: string) {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00.000${SAO_PAULO_OFFSET}`).getTime());
}

export function assertOrderedDateRange(input: DateRangeInput) {
  if (input.startDate && !isDateOnly(input.startDate)) {
    return 'Data inicial invalida';
  }

  if (input.endDate && !isDateOnly(input.endDate)) {
    return 'Data final invalida';
  }

  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return 'A data inicial nao pode ser maior que a data final';
  }

  return null;
}

export function startOfSaoPauloDay(date: string) {
  return new Date(`${date}T00:00:00.000${SAO_PAULO_OFFSET}`);
}

export function endExclusiveOfSaoPauloDay(date: string) {
  return new Date(`${date}T24:00:00.000${SAO_PAULO_OFFSET}`);
}

export function buildSaoPauloDayRange(input: DateRangeInput) {
  return {
    gte: input.startDate ? startOfSaoPauloDay(input.startDate) : undefined,
    lt: input.endDate ? endExclusiveOfSaoPauloDay(input.endDate) : undefined,
  };
}

export function formatSaoPauloDate(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}
