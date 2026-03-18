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
}
