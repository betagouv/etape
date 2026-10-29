const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/u;

export function isEmailFormatValid(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
