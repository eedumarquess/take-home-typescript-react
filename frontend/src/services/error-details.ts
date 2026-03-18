import { ApiError } from './api';

export type FieldErrorMap = Record<string, string>;

export function formatApiError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const detailedMessage = summarizeApiErrorDetails(error);

    return detailedMessage ? `${error.message}: ${detailedMessage}` : error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export function getApiFieldErrors(error: unknown) {
  if (!(error instanceof ApiError)) {
    return {};
  }

  return error.details.reduce<FieldErrorMap>((fieldErrors, detail) => {
    if (!detail || typeof detail !== 'object') {
      return fieldErrors;
    }

    const field = 'field' in detail ? String(detail.field) : null;
    const message = 'message' in detail ? String(detail.message) : null;

    if (!field || !message || field in fieldErrors) {
      return fieldErrors;
    }

    fieldErrors[field] = message;
    return fieldErrors;
  }, {});
}

function summarizeApiErrorDetails(error: ApiError) {
  const messages = error.details
    .flatMap((detail) => {
      if (!detail || typeof detail !== 'object') {
        return [];
      }

      const detailEntries = ['message', 'reason', 'productName', 'productId']
        .filter((key) => key in detail && detail[key as keyof typeof detail])
        .map((key) => String(detail[key as keyof typeof detail]));

      return detailEntries;
    })
    .filter((value, index, values) => values.indexOf(value) === index);

  return messages.join(', ');
}
