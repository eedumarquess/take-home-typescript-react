export interface IPasswordHasher {
  compare(plainText: string, passwordHash: string): Promise<boolean>;
}
