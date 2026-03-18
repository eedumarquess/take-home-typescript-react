import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateRefreshSessionInput = {
  userId: string;
  tokenId: string;
  expiresAt: Date;
};

type RevokeRefreshSessionInput = {
  tokenId: string;
  replacedByTokenId?: string;
  revokedAt: Date;
};

@Injectable()
export class RefreshSessionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create({ userId, tokenId, expiresAt }: CreateRefreshSessionInput) {
    return this.prismaService.refreshSession.create({
      data: {
        userId,
        tokenId,
        expiresAt,
      },
    });
  }

  findByTokenId(tokenId: string) {
    return this.prismaService.refreshSession.findUnique({
      where: {
        tokenId,
      },
    });
  }

  async revoke({ tokenId, replacedByTokenId, revokedAt }: RevokeRefreshSessionInput) {
    const session = await this.prismaService.refreshSession.findUnique({
      where: {
        tokenId,
      },
    });

    if (!session) {
      return null;
    }

    return this.prismaService.refreshSession.update({
      where: {
        tokenId,
      },
      data: {
        revokedAt,
        replacedByTokenId: replacedByTokenId ?? session.replacedByTokenId,
      },
    });
  }
}
