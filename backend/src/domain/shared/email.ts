import { DomainError } from './domain-error';

export class Email {
  readonly value: string;

  constructor(value: string) {
    const normalizedValue = value.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
      throw new DomainError('Email invalido', 'INVALID_EMAIL');
    }

    this.value = normalizedValue;
  }
}
