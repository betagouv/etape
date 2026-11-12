import { describe, expect, it } from "vitest";

import { groupChars } from "./group-chars";

describe("groupChars", () => {
  it("sépare les groupes par une espace", () => {
    expect(groupChars("50393256800010", [3, 3, 3, 5])).toBe("503 932 568 00010");
  });

  it("laisse le dernier groupe incomplet, sans espace finale", () => {
    expect(groupChars("", [3, 3])).toBe("");
    expect(groupChars("503", [3, 3])).toBe("503");
    expect(groupChars("5039", [3, 3])).toBe("503 9");
  });

  it("ne garde pas les caractères au-delà du dernier groupe", () => {
    expect(groupChars("5039325", [3, 3])).toBe("503 932");
  });
});
