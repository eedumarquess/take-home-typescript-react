import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getHealth() {
    await this.prismaService.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'fastmeals-api',
      environment: this.configService.getOrThrow<string>('NODE_ENV'),
      database: 'connected',
    };
  }
}
