import { addDays, addYears } from "date-fns";
import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../domain/entry-mode";
import { formatFieldDate } from "../domain/field-date";
import { LONGUEUR_MAX_TEXTE } from "../domain/longueur-max-texte";
import { MODALITE_FORMATION } from "./domain/modalite-formation";
import { formationSchema } from "./schema";

/** Une date à `days` jours d'aujourd'hui, au format des champs : le schéma compare au jour même. */
function inDays(days: number): string {
  return formatFieldDate(addDays(new Date(), days));
}

/** Une date à `years` ans et `days` jours d'aujourd'hui, au format des champs. */
function inYearsAndDays(years: number, days: number): string {
  return formatFieldDate(addDays(addYears(new Date(), years), days));
}

function findMessages(data: Record<string, unknown>, field: string): string[] {
  const issues = formationSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
}

const CERTIFICATION = {
  numeroFiche: "RNCP12345",
  repertoire: "RNCP",
  intitule: "Boulanger",
  abrege: "CAP",
  niveau: 3,
  certificateurs: [{ siret: "11004301500012", nom: "Ministère de l’Éducation nationale" }],
};

const EMPTY_FORM = {
  intituleFormation: "",
  certificationViseeEntryMode: ENTRY_MODE.SEARCH,
  certificationVisee: null,
  intituleCertificationVisee: "",
  numeroFiche: "",
  dureeFormation: "",
  heuresParSemaine: "",
  dateDebutFormation: "",
  dateFinFormation: "",
  modalitesFormation: [],
  contenuFormation: "",
};

/** Tout est rempli, diplôme choisi dans les répertoires. */
const VALID_FORM = {
  ...EMPTY_FORM,
  intituleFormation: "CAP Boulanger en un an",
  certificationVisee: CERTIFICATION,
  dureeFormation: "800",
  heuresParSemaine: "35",
  dateDebutFormation: inDays(30),
  dateFinFormation: inDays(365),
  modalitesFormation: [MODALITE_FORMATION.PRESENTIEL, MODALITE_FORMATION.PRATIQUE_ENTREPRISE],
  contenuFormation: "Technologie, pratique professionnelle, hygiène et sécurité.",
};

const MANUAL_FORM = {
  ...VALID_FORM,
  certificationViseeEntryMode: ENTRY_MODE.MANUAL,
  certificationVisee: null,
  intituleCertificationVisee: "CAP Boulanger",
};

describe("formationSchema", () => {
  it("accepte un formulaire rempli, en recherche comme en saisie manuelle", () => {
    expect(formationSchema.safeParse(VALID_FORM).success).toBe(true);
    expect(formationSchema.safeParse(MANUAL_FORM).success).toBe(true);
  });

  it("signale chaque champ vide dès le premier envoi, diplôme compris", () => {
    const issues = formationSchema.safeParse(EMPTY_FORM).error?.issues ?? [];

    expect(new Set(issues.map(({ path }) => path.join(".")))).toEqual(
      new Set([
        "intituleFormation",
        "certificationVisee",
        "dureeFormation",
        "heuresParSemaine",
        "dateDebutFormation",
        "dateFinFormation",
        "modalitesFormation",
        "contenuFormation",
      ]),
    );
    expect(findMessages(EMPTY_FORM, "dureeFormation")[0]).toBe(
      "Veuillez indiquer la durée totale de la formation.",
    );
    expect(findMessages(EMPTY_FORM, "modalitesFormation")).toEqual([
      "Veuillez indiquer comment se déroule la formation.",
    ]);
  });

  it("exige le diplôme choisi en recherche", () => {
    const data = { ...VALID_FORM, certificationVisee: null };
    expect(findMessages(data, "certificationVisee")).toEqual([
      "Veuillez choisir le diplôme, titre ou certificat délivré.",
    ]);
  });

  it("exige en saisie manuelle l'intitulé du diplôme, pas le code ni le niveau", () => {
    const data = { ...MANUAL_FORM, intituleCertificationVisee: "  " };
    const issues = formationSchema.safeParse(data).error?.issues ?? [];

    expect(issues.map(({ path }) => path.join("."))).toEqual(["intituleCertificationVisee"]);
    expect(issues[0]?.message).toBe("Veuillez saisir l’intitulé du diplôme, titre ou certificat.");
  });

  it("met le code RNCP en forme et le contrôle s'il est rempli", () => {
    const result = formationSchema.safeParse({ ...MANUAL_FORM, numeroFiche: "rncp 12345" });
    expect(result.data?.numeroFiche).toBe("RNCP12345");

    expect(findMessages({ ...MANUAL_FORM, numeroFiche: "RS5547" }, "numeroFiche")).toEqual([
      "Le code RNCP comporte RNCP suivi de chiffres, par exemple RNCP12345.",
    ]);
  });

  it("refuse un nombre d'heures qui n'est pas un entier d'au moins 1", () => {
    expect(findMessages({ ...VALID_FORM, dureeFormation: "35,5" }, "dureeFormation")).toEqual([
      "Indiquez un nombre entier d’heures, par exemple 400.",
    ]);
    expect(findMessages({ ...VALID_FORM, heuresParSemaine: "0" }, "heuresParSemaine")).toEqual([
      "Indiquez au moins 1 heure.",
    ]);
  });

  it("accepte 48 heures par semaine et refuse au-delà", () => {
    expect(formationSchema.safeParse({ ...VALID_FORM, heuresParSemaine: "48" }).success).toBe(true);
    expect(findMessages({ ...VALID_FORM, heuresParSemaine: "350" }, "heuresParSemaine")).toEqual([
      "Indiquez au plus 48 heures par semaine.",
    ]);
  });

  it("refuse une formation déjà commencée ou trop lointaine", () => {
    expect(
      findMessages({ ...VALID_FORM, dateDebutFormation: inDays(-1) }, "dateDebutFormation"),
    ).toEqual([
      "La formation ne doit pas avoir commencé : choisissez une date à partir d’aujourd’hui.",
    ]);
    expect(
      findMessages(
        { ...VALID_FORM, dateDebutFormation: inYearsAndDays(3, 1) },
        "dateDebutFormation",
      ),
    ).toEqual(["Choisissez une date dans les 3 ans à venir."]);
    expect(
      findMessages({ ...VALID_FORM, dateFinFormation: inYearsAndDays(6, 1) }, "dateFinFormation"),
    ).toEqual(["Choisissez une date dans les 6 ans à venir."]);
  });

  it("accepte une formation qui commence dans trois ans et finit plus tard", () => {
    const data = {
      ...VALID_FORM,
      dateDebutFormation: inYearsAndDays(3, 0),
      dateFinFormation: inYearsAndDays(5, 0),
    };
    expect(formationSchema.safeParse(data).success).toBe(true);
  });

  it("exige une date de fin après la date de début", () => {
    const data = { ...VALID_FORM, dateDebutFormation: inDays(30), dateFinFormation: inDays(30) };
    expect(findMessages(data, "dateFinFormation")).toEqual([
      "La date de fin doit être après la date de début.",
    ]);
  });

  it("refuse un contenu de plus de 1000 caractères", () => {
    const data = { ...VALID_FORM, contenuFormation: "a".repeat(LONGUEUR_MAX_TEXTE + 1) };
    expect(findMessages(data, "contenuFormation")).toHaveLength(1);
  });
});
