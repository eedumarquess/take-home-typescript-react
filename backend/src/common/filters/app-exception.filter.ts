import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { AppException, type ErrorDetail } from '../errors/app.exception';
import { AppErrorCode } from '../errors/app-error-code.enum';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json(exception.getErrorPayload());
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        response
          .status(HttpStatus.CONFLICT)
          .json(
            this.buildError(AppErrorCode.CONFLICT, 'Conflito de dados', [], HttpStatus.CONFLICT),
          );
        return;
      }

      if (exception.code === 'P2025') {
        response
          .status(HttpStatus.NOT_FOUND)
          .json(
            this.buildError(
              AppErrorCode.NOT_FOUND,
              'Recurso nao encontrado',
              [],
              HttpStatus.NOT_FOUND,
            ),
          );
        return;
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      if (exception instanceof BadRequestException) {
        const errorResponse = exception.getResponse();
        const details = this.extractHttpExceptionDetails(errorResponse);

        response
          .status(status)
          .json(this.buildError(AppErrorCode.VALIDATION_ERROR, 'Dados invalidos', details, status));
        return;
      }

      if (exception instanceof ForbiddenException) {
        response
          .status(status)
          .json(
            this.buildError(
              AppErrorCode.FORBIDDEN,
              'Permissao insuficiente para a acao',
              [],
              status,
            ),
          );
        return;
      }

      if (exception instanceof NotFoundException) {
        response
          .status(status)
          .json(this.buildError(AppErrorCode.NOT_FOUND, 'Recurso nao encontrado', [], status));
        return;
      }

      response
        .status(status)
        .json(
          this.buildError(
            AppErrorCode.INTERNAL_ERROR,
            exception.message || 'Erro interno do servidor',
            [],
            status,
          ),
        );
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        this.buildError(
          AppErrorCode.INTERNAL_ERROR,
          'Erro interno do servidor',
          [],
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
  }

  private buildError(code: string, message: string, details: ErrorDetail[], _statusCode: number) {
    return {
      error: {
        code,
        message,
        details,
      },
    };
  }

  private extractHttpExceptionDetails(response: string | object): ErrorDetail[] {
    if (typeof response === 'string') {
      return [{ message: response }];
    }

    const message = (response as { message?: unknown }).message;

    if (!Array.isArray(message)) {
      return [];
    }

    return message.map((entry) => ({ message: String(entry) }));
  }
}
