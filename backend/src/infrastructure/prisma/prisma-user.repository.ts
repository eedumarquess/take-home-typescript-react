import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AppRole } from '../../common/enums/app-role.enum';
import { Email } from '../../domain/shared/email';
import { User } from '../../domain/users/user';
import type { IUserRepository } from '../../domain/users/user.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: Email) {
    const user = await this.prismaService.user.findUnique({
      where: { email: email.value },
    });

    return user
      ? new User(user.id, new Email(user.email), user.password, toAppRole(user.role))
      : null;
  }

  async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    return user
      ? new User(user.id, new Email(user.email), user.password, toAppRole(user.role))
      : null;
  }
}

function toAppRole(role: UserRole) {
  return role === UserRole.ADMIN ? AppRole.ADMIN : AppRole.VIEWER;
}
