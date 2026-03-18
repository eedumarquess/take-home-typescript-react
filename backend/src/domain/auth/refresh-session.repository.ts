export type RefreshSession = {
  userId: string;
  tokenId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export interface IRefreshSessionRepository {
  create(input: { userId: string; tokenId: string; expiresAt: Date }): Promise<void>;
  findByTokenId(tokenId: string): Promise<RefreshSession | null>;
  revoke(input: { tokenId: string; revokedAt: Date; replacedByTokenId?: string }): Promise<void>;
  revokeIfActive(input: {
    tokenId: string;
    revokedAt: Date;
    replacedByTokenId?: string;
  }): Promise<boolean>;
  rotate(input: {
    currentTokenId: string;
    userId: string;
    revokedAt: Date;
    replacementTokenId: string;
    replacementExpiresAt: Date;
  }): Promise<boolean>;
  cleanupExpiredAndRevoked(input?: { userId?: string; now?: Date }): Promise<number>;
}
