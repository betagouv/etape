import { describe, expect, it } from "vitest";

import { formatCharacterCount, formatCharacterCountAnnouncement } from "./format-character-count";

describe("formatCharacterCount", () => {
  it("compte les caractères saisis sur la limite, sans séparateur de milliers", () => {
    expect(formatCharacterCount(0, 1000)).toBe("0/1000 caractères");
    expect(formatCharacterCount(1000, 1000)).toBe("1000/1000 caractères");
  });

  it("garde le pluriel, qui porte sur la limite", () => {
    expect(formatCharacterCount(1, 1000)).toBe("1/1000 caractères");
  });
});

describe("formatCharacterCountAnnouncement", () => {
  it("dit le compteur en toutes lettres, sans barre oblique ni séparateur de milliers", () => {
    expect(formatCharacterCountAnnouncement(12, 1000)).toBe("12 caractères sur 1000");
    expect(formatCharacterCountAnnouncement(1000, 1000)).toBe("1000 caractères sur 1000");
  });

  it("accorde « caractère » avec le nombre saisi : singulier pour 0 et 1", () => {
    expect(formatCharacterCountAnnouncement(0, 1000)).toBe("0 caractère sur 1000");
    expect(formatCharacterCountAnnouncement(1, 1000)).toBe("1 caractère sur 1000");
    expect(formatCharacterCountAnnouncement(2, 1000)).toBe("2 caractères sur 1000");
  });
});
