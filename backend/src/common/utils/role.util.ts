import { UserRole } from '@prisma/client';
import { AppRole } from '../enums/app-role.enum';

export function toAppRole(role: UserRole) {
  return role === UserRole.ADMIN ? AppRole.ADMIN : AppRole.VIEWER;
}
