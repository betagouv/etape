import { describe, expect, it } from "vitest";

import { escapeLikePattern } from "./like-pattern.js";

describe("escapeLikePattern", () => {
  it("laisse un texte ordinaire tel quel", () => {
    expect(escapeLikePattern("chef d'équipe-pâtissier")).toBe("chef d'équipe-pâtissier");
  });

  it.each([
    ["100%", "100\\%"],
    ["a_b", "a\\_b"],
    ["a\\b", "a\\\\b"],
    ["%_\\", "\\%\\_\\\\"],
  ])("échappe « %s »", (word, escaped) => {
    expect(escapeLikePattern(word)).toBe(escaped);
  });
});
