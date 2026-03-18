import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { assertOrderedDateRange } from '../utils/sao-paulo-date.util';

@ValidatorConstraint({ name: 'IsOrderedDateRange', async: false })
export class DateRangeOrderConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, validationArguments: ValidationArguments) {
    const [startDateProperty] = validationArguments.constraints as [string];
    const startDate = validationArguments.object[startDateProperty as keyof object];
    const startDateValue = typeof startDate === 'string' ? startDate : undefined;
    const endDateValue = typeof value === 'string' ? value : undefined;

    return (
      assertOrderedDateRange({
        endDate: endDateValue,
        startDate: startDateValue,
      }) === null
    );
  }

  defaultMessage() {
    return 'A data inicial nao pode ser maior que a data final';
  }
}

export function IsOrderedDateRange(
  startDateProperty: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      constraints: [startDateProperty],
      options: validationOptions,
      propertyName,
      target: object.constructor,
      validator: DateRangeOrderConstraint,
    });
  };
}
