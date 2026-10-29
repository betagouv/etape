import { describe, expect, it } from "vitest";

import { formatVoletErrorsTitle } from "./volet-errors";

describe("formatVoletErrorsTitle", () => {
  it("accorde le nombre d'erreurs", () => {
    expect(formatVoletErrorsTitle(1)).toBe("Le formulaire contient 1 erreur");
    expect(formatVoletErrorsTitle(3)).toBe("Le formulaire contient 3 erreurs");
  });
});
