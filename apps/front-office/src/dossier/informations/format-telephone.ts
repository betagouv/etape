const TELEPHONE_MAX_DIGITS = 10;

export function formatTelephone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, TELEPHONE_MAX_DIGITS);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}
