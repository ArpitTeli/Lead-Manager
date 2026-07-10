export function verifyPassword(plain: string, stored: string): boolean {
  return plain === stored;
}
