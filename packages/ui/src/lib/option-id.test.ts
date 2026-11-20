import { describe, expect, it } from "vitest";

import { formatOptionId } from "@etape/ui/lib/option-id";

describe("formatOptionId", () => {
  it("accole le nom du champ et la valeur de l'option", () => {
    expect(formatOptionId("demarcheDecouverte", "non")).toBe("demarcheDecouverte-non");
  });
});
