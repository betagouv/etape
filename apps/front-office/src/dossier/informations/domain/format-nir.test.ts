import { describe, expect, it } from "vitest";

import { formatNir } from "./format-nir";

describe("formatNir", () => {
  it("groupe les treize caractères en 1, 2, 2, 2, 3 et 3", () => {
    expect(formatNir("1850578006084")).toBe("1 85 05 78 006 084");
  });

  it("groupe une saisie en cours, sans espace finale", () => {
    expect(formatNir("")).toBe("");
    expect(formatNir("1")).toBe("1");
    expect(formatNir("185")).toBe("1 85");
    expect(formatNir("18505780")).toBe("1 85 05 78 0");
  });

  it("garde les lettres A et B des départements corses", () => {
    expect(formatNir("185052A006084")).toBe("1 85 05 2A 006 084");
    expect(formatNir("185052b006084")).toBe("1 85 05 2b 006 084");
  });

  it("retire les autres caractères", () => {
    expect(formatNir("1 85-05.78 x006 084")).toBe("1 85 05 78 006 084");
  });

  it("tronque à 13 caractères", () => {
    expect(formatNir("185057800608436")).toBe("1 85 05 78 006 084");
  });
});
