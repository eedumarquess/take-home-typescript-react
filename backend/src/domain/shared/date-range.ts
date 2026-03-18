import { DomainError } from './domain-error';

export class DateRange {
  constructor(
    readonly startDate?: string,
    readonly endDate?: string,
  ) {
    if (startDate && Number.isNaN(new Date(`${startDate}T00:00:00.000Z`).getTime())) {
      throw new DomainError('Data inicial invalida', 'INVALID_DATE_RANGE');
    }

    if (endDate && Number.isNaN(new Date(`${endDate}T00:00:00.000Z`).getTime())) {
      throw new DomainError('Data final invalida', 'INVALID_DATE_RANGE');
    }

    if (startDate && endDate && startDate > endDate) {
      throw new DomainError('Periodo invalido', 'INVALID_DATE_RANGE');
    }
  }
}
