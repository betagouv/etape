import { describe, expect, it } from "vitest";

import { hasDraggedFiles } from "@etape/ui/lib/dragged-files";

describe("hasDraggedFiles", () => {
  it("reconnaît des fichiers glissés depuis l'ordinateur", () => {
    expect(hasDraggedFiles(["Files"])).toBe(true);
    expect(hasDraggedFiles(["text/uri-list", "Files"])).toBe(true);
  });

  it("écarte du texte ou un lien glissés depuis la page", () => {
    expect(hasDraggedFiles(["text/plain", "text/html"])).toBe(false);
    expect(hasDraggedFiles([])).toBe(false);
  });
});
