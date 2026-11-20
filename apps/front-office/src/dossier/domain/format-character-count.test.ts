import { describe, expect, it } from "vitest";

import { formatCharacterCount } from "./format-character-count";

describe("formatCharacterCount", () => {
  it("compte les caractères saisis sur la limite, sans séparateur de milliers", () => {
    expect(formatCharacterCount(0, 1000)).toBe("0/1000 caractères");
    expect(formatCharacterCount(1000, 1000)).toBe("1000/1000 caractères");
  });

  it("garde le pluriel, qui porte sur la limite", () => {
    expect(formatCharacterCount(1, 1000)).toBe("1/1000 caractères");
  });
});
