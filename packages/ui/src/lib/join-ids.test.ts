import { describe, expect, it } from "vitest";

import { joinIds } from "@etape/ui/lib/join-ids";

describe("joinIds", () => {
  it("sépare les id par une espace, dans l'ordre donné", () => {
    expect(joinIds(["civilite-description", "civilite-error"])).toBe(
      "civilite-description civilite-error",
    );
  });

  it("écarte les id absents", () => {
    expect(joinIds([false, "civilite-error", undefined])).toBe("civilite-error");
  });

  it("ne rend rien quand aucun id ne reste", () => {
    expect(joinIds([false, undefined])).toBeUndefined();
    expect(joinIds([])).toBeUndefined();
  });
});
