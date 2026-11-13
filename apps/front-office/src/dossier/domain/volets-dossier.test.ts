import { describe, expect, it } from "vitest";

import { VOLET_ID } from "./volet-id";
import { findVoletLabel, VOLETS_DOSSIER } from "./volets-dossier";

describe("findVoletLabel", () => {
  it("donne le libellé du volet", () => {
    expect(findVoletLabel(VOLET_ID.SITUATION_PROFESSIONNELLE)).toBe("Ma situation professionnelle");
  });

  it("donne un libellé à chaque volet du dossier", () => {
    for (const { id, label } of VOLETS_DOSSIER) expect(findVoletLabel(id)).toBe(label);
  });

  it("donne le libellé du menu, pas le titre de l'écran", () => {
    expect(findVoletLabel(VOLET_ID.CEP)).toBe("Mon CEP");
  });
});
