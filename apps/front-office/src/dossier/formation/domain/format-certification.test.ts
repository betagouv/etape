import type { Certification } from "@etape/api-contract";
import { describe, expect, it } from "vitest";

import {
  formatCertificateurs,
  formatCertificationTitle,
  formatNiveauCard,
  formatNiveauOption,
  formatNumeroFicheLabel,
} from "./format-certification";

const CAP_BOULANGER: Certification = {
  numeroFiche: "RNCP12345",
  repertoire: "RNCP",
  intitule: "Boulanger",
  abrege: "CAP",
  niveau: 3,
  certificateurs: [{ siret: "11004301500012", nom: "Ministère de l’Éducation nationale" }],
};

const CLEA: Certification = {
  numeroFiche: "RS7003",
  repertoire: "RS",
  intitule: "Certification socle de compétences et de connaissances professionnelles (CléA)",
  abrege: null,
  niveau: null,
  certificateurs: [],
};

function withCertificateurs(count: number): Certification {
  return {
    ...CAP_BOULANGER,
    certificateurs: Array.from({ length: count }, (_, index) => ({
      siret: String(index),
      nom: `Certificateur ${index + 1}`,
    })),
  };
}

describe("formatCertificationTitle", () => {
  it("fait précéder l'intitulé de l'abrégé", () => {
    expect(formatCertificationTitle(CAP_BOULANGER)).toBe("CAP Boulanger");
  });

  it("garde l'intitulé seul sans abrégé, ou quand il commence déjà par lui", () => {
    expect(formatCertificationTitle(CLEA)).toBe(CLEA.intitule);
    expect(formatCertificationTitle({ ...CAP_BOULANGER, intitule: "CAP Boulanger" })).toBe(
      "CAP Boulanger",
    );
  });
});

describe("formatNumeroFicheLabel", () => {
  it("sépare le répertoire des chiffres", () => {
    expect(formatNumeroFicheLabel("RNCP12345")).toBe("RNCP 12345");
    expect(formatNumeroFicheLabel("RS7003")).toBe("RS 7003");
  });
});

describe("formatNiveauOption", () => {
  it("dit le niveau, ou qu'il n'y en a pas", () => {
    expect(formatNiveauOption(4)).toBe("Niveau 4");
    expect(formatNiveauOption(null)).toBe("Sans niveau");
  });
});

describe("formatNiveauCard", () => {
  it("précise les diplômes du niveau", () => {
    expect(formatNiveauCard(3)).toBe("3 (CAP, BEP)");
    expect(formatNiveauCard(8)).toBe("8 (Doctorat, HDR)");
  });

  it("dit « Sans niveau » pour une fiche du RS, et le niveau seul hors de la liste", () => {
    expect(formatNiveauCard(null)).toBe("Sans niveau");
    expect(formatNiveauCard(2)).toBe("Niveau 2");
  });
});

describe("formatCertificateurs", () => {
  it("donne le certificateur unique", () => {
    expect(formatCertificateurs(CAP_BOULANGER)).toBe("Ministère de l’Éducation nationale");
  });

  it("donne le premier et compte les autres", () => {
    expect(formatCertificateurs(withCertificateurs(2))).toBe("Certificateur 1 et 1 autre");
    expect(formatCertificateurs(withCertificateurs(12))).toBe("Certificateur 1 et 11 autres");
  });

  it("ne donne rien sans certificateur", () => {
    expect(formatCertificateurs(CLEA)).toBeNull();
  });
});
