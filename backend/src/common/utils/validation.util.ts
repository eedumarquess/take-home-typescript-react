import type { ValidationError } from 'class-validator';
import type { ErrorDetail } from '../errors/app.exception';

export function buildValidationDetails(
  errors: ValidationError[],
  parentPath?: string,
): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const currentLevelErrors = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));

    if (!error.children || error.children.length === 0) {
      return currentLevelErrors;
    }

    return [...currentLevelErrors, ...buildValidationDetails(error.children, field)];
  });
}
