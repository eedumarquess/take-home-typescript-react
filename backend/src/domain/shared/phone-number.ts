import { DomainError } from './domain-error';

export class PhoneNumber {
  constructor(readonly value: string) {
    if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value)) {
      throw new DomainError('Telefone invalido', 'INVALID_PHONE');
    }
  }
}
