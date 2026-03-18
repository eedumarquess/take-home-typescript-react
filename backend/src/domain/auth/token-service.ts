import type { AppRole } from '../../common/enums/app-role.enum';

export type TokenPayloadData = {
  sub: string;
  email: string;
  role: AppRole;
};

export type RefreshTokenPayload = TokenPayloadData & {
  jti?: string;
};

export interface ITokenService {
  signAccessToken(payload: TokenPayloadData): Promise<string>;
  signRefreshToken(payload: RefreshTokenPayload): Promise<string>;
  verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload>;
}
