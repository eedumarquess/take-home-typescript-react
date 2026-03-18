import { HttpException } from '@nestjs/common';

export type ErrorDetail = Record<string, string | number | boolean | null>;

type ErrorPayload = {
  error: {
    code: string;
    message: string;
    details: ErrorDetail[];
  };
};

export class AppException extends HttpException {
  constructor(statusCode: number, code: string, message: string, details: ErrorDetail[] = []) {
    super(
      {
        error: {
          code,
          message,
          details,
        },
      } satisfies ErrorPayload,
      statusCode,
    );
  }

  getErrorPayload() {
    return this.getResponse() as ErrorPayload;
  }
}
