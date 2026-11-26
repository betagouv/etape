import { describe, expect, it, vi } from "vitest";

import { keepFocus } from "@etape/ui/lib/keep-focus";

describe("keepFocus", () => {
  it("annule l'effet par défaut de l'appui : le champ en cours garde le focus", () => {
    const preventDefault = vi.fn();

    keepFocus({ preventDefault });

    expect(preventDefault).toHaveBeenCalledOnce();
  });
});
