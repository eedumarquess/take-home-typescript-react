import { AppRole } from '../../common/enums/app-role.enum';
import { Email } from '../shared/email';

export class User {
  constructor(
    readonly id: string,
    readonly email: Email,
    readonly passwordHash: string,
    readonly role: AppRole,
  ) {}
}
