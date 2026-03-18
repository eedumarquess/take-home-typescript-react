import type { Email } from '../shared/email';
import type { User } from './user';

export interface IUserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
