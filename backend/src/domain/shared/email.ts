import { DomainError } from './domain-error';

export class Email {
  constructor(readonly value: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new DomainError('Email invalido', 'INVALID_EMAIL');
    }
  }
}
