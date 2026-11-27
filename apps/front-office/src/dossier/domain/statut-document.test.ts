import { describe, expect, it } from "vitest";

import { getStatutDocument, STATUT_DOCUMENT } from "./statut-document";

describe("getStatutDocument", () => {
  it("dit « à déposer » un document obligatoire sans pièce", () => {
    expect(getStatutDocument(true, 0)).toBe(STATUT_DOCUMENT.A_DEPOSER);
  });

  it("dit « déposé » un document obligatoire dès sa première pièce", () => {
    expect(getStatutDocument(true, 1)).toBe(STATUT_DOCUMENT.DEPOSE);
    expect(getStatutDocument(true, 2)).toBe(STATUT_DOCUMENT.DEPOSE);
  });

  it("dit « facultatif » un document facultatif, avec ou sans pièce", () => {
    expect(getStatutDocument(false, 0)).toBe(STATUT_DOCUMENT.FACULTATIF);
    expect(getStatutDocument(false, 2)).toBe(STATUT_DOCUMENT.FACULTATIF);
  });
});
