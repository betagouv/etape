import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function sealCookieValue(key: Buffer, value: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function openCookieValue(key: Buffer, sealedValue: string): string | null {
  const payload = Buffer.from(sealedValue, "base64url");
  if (payload.length <= IV_LENGTH + AUTH_TAG_LENGTH) return null;

  const decipher = createDecipheriv(ALGORITHM, key, payload.subarray(0, IV_LENGTH), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH));

  try {
    const plaintext = Buffer.concat([
      decipher.update(payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}
