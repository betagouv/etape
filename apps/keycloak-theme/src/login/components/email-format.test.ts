import { describe, expect, it } from "vitest";

import { isEmailFormatValid } from "./email-format";

describe("isEmailFormatValid", () => {
  it.each(["camille.roux@gmail.com", "  camille@etape.fr  ", "a@b"])("accepte %s", (value) => {
    expect(isEmailFormatValid(value)).toBe(true);
  });

  it.each(["camille.rouxgmail.com", "@gmail.com", "camille@", "camille roux@gmail.com", ""])(
    "refuse « %s »",
    (value) => {
      expect(isEmailFormatValid(value)).toBe(false);
    },
  );
});
