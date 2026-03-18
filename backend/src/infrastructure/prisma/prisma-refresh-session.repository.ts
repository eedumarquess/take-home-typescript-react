import { Injectable } from '@nestjs/common';
import type { IRefreshSessionRepository } from '../../domain/auth/refresh-session.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaRefreshSessionRepository implements IRefreshSessionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: { userId: string; tokenId: string; expiresAt: Date }) {
    await this.prismaService.refreshSession.create({
      data: {
        expiresAt: input.expiresAt,
        tokenId: input.tokenId,
        userId: input.userId,
      },
    });
  }

  async findByTokenId(tokenId: string) {
    const session = await this.prismaService.refreshSession.findUnique({
      where: { tokenId },
    });

    return session
      ? {
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
          tokenId: session.tokenId,
          userId: session.userId,
        }
      : null;
  }

  async revoke(input: { tokenId: string; revokedAt: Date; replacedByTokenId?: string }) {
    await this.prismaService.refreshSession.update({
      data: {
        replacedByTokenId: input.replacedByTokenId ?? null,
        revokedAt: input.revokedAt,
      },
      where: { tokenId: input.tokenId },
    });
  }

  async revokeIfActive(input: { tokenId: string; revokedAt: Date; replacedByTokenId?: string }) {
    const result = await this.prismaService.refreshSession.updateMany({
      data: {
        replacedByTokenId: input.replacedByTokenId ?? null,
        revokedAt: input.revokedAt,
      },
      where: {
        expiresAt: {
          gt: input.revokedAt,
        },
        revokedAt: null,
        tokenId: input.tokenId,
      },
    });

    return result.count === 1;
  }

  async rotate(input: {
    currentTokenId: string;
    userId: string;
    revokedAt: Date;
    replacementTokenId: string;
    replacementExpiresAt: Date;
  }) {
    const revokedCount = await this.prismaService.$transaction(async (transaction) => {
      const revokedSession = await transaction.refreshSession.updateMany({
        data: {
          replacedByTokenId: input.replacementTokenId,
          revokedAt: input.revokedAt,
        },
        where: {
          expiresAt: {
            gt: input.revokedAt,
          },
          revokedAt: null,
          tokenId: input.currentTokenId,
          userId: input.userId,
        },
      });

      if (revokedSession.count !== 1) {
        return 0;
      }

      await transaction.refreshSession.create({
        data: {
          expiresAt: input.replacementExpiresAt,
          tokenId: input.replacementTokenId,
          userId: input.userId,
        },
      });

      return revokedSession.count;
    });

    return revokedCount === 1;
  }

  cleanupExpiredAndRevoked(input?: { userId?: string; now?: Date }) {
    const now = input?.now ?? new Date();

    return this.prismaService.refreshSession
      .deleteMany({
        where: {
          OR: [
            {
              expiresAt: {
                lte: now,
              },
            },
            {
              revokedAt: {
                not: null,
              },
            },
          ],
          userId: input?.userId,
        },
      })
      .then((result) => result.count);
  }
}
