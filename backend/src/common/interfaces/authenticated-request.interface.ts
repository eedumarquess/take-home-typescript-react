import type { Request } from 'express';
import type { TokenPayload } from './token-payload.interface';

export type AuthenticatedRequest = Request & {
  user?: TokenPayload;
};
