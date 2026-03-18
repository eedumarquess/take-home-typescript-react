import type { AppRole } from '../enums/app-role.enum';

export type TokenPayload = {
  sub: string;
  email: string;
  role: AppRole;
  jti?: string;
  iat?: number;
  exp?: number;
};
