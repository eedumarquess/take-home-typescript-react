import { assertOrderedDateRange } from '../../common/utils/sao-paulo-date.util';
import { DomainError } from './domain-error';

export class DateRange {
  constructor(
    readonly startDate?: string,
    readonly endDate?: string,
  ) {
    const validationMessage = assertOrderedDateRange({ startDate, endDate });

    if (validationMessage) {
      throw new DomainError(validationMessage, 'INVALID_DATE_RANGE');
    }
  }
}
