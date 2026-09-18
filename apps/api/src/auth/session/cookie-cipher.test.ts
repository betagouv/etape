import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import { openCookieValue, sealCookieValue } from "./cookie-cipher.js";

const key = randomBytes(32);

describe("sealCookieValue et openCookieValue", () => {
  it("retrouvent la valeur scellée", () => {
    const sealed = sealCookieValue(key, '{"returnTo":"/compte/"}');

    expect(openCookieValue(key, sealed)).toBe('{"returnTo":"/compte/"}');
  });

  it("ne laissent pas la valeur en clair", () => {
    const sealed = sealCookieValue(key, "/compte/");

    expect(Buffer.from(sealed, "base64url").toString("latin1")).not.toContain("/compte/");
  });

  it("produisent un chiffré différent à chaque appel", () => {
    expect(sealCookieValue(key, "valeur")).not.toBe(sealCookieValue(key, "valeur"));
  });

  it("refusent une valeur altérée", () => {
    const bytes = Buffer.from(sealCookieValue(key, "valeur"), "base64url");
    bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 0xff;

    expect(openCookieValue(key, bytes.toString("base64url"))).toBeNull();
  });

  it("refusent une autre clé", () => {
    expect(openCookieValue(randomBytes(32), sealCookieValue(key, "valeur"))).toBeNull();
  });

  it("refusent une valeur tronquée ou arbitraire", () => {
    expect(openCookieValue(key, sealCookieValue(key, "valeur").slice(0, 20))).toBeNull();
    expect(openCookieValue(key, "pas-un-cookie")).toBeNull();
    expect(openCookieValue(key, "")).toBeNull();
  });
});
