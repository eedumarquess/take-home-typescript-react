import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';
import type { IPasswordHasher } from '../../domain/auth/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  compare(plainText: string, passwordHash: string) {
    return compare(plainText, passwordHash);
  }
}
