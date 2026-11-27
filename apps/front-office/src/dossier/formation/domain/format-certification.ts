import type { Certification } from "@etape/api-contract";

import { selectPlural, type PluralForms } from "@/lib/plural";

/** Ce que la carte précise de chaque niveau du cadre national, d'après la liste du 2026-11-25. */
const NIVEAU_DIPLOMES: Partial<Record<number, string>> = {
  3: "CAP, BEP",
  4: "Baccalauréat, BP",
  5: "DEUG, BTS, DUT, DEUST",
  6: "Licence, licence professionnelle, BUT, maîtrise",
  7: "Master, DEA, DESS, diplôme d’ingénieur",
  8: "Doctorat, HDR",
};

const AUTRES_LABELS: PluralForms<string> = { one: "autre", other: "autres" };

/** Une fiche du RS n'a pas de niveau : on le dit plutôt que de taire la ligne. */
export const SANS_NIVEAU_LABEL = "Sans niveau";

/**
 * Le nom de la certification, précédé de son abrégé (« CAP Boulanger ») ; une fiche dont
 * l'intitulé commence déjà par l'abrégé ne le répète pas.
 */
export function formatCertificationTitle({ abrege, intitule }: Certification): string {
  if (abrege === null || intitule.startsWith(`${abrege} `)) return intitule;
  return `${abrege} ${intitule}`;
}

/** Le numéro de fiche, le répertoire séparé des chiffres comme sur la maquette (« RNCP 12345 »). */
export function formatNumeroFicheLabel(numeroFiche: string): string {
  return numeroFiche.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
}

/** Le niveau dans la liste des résultats (« Niveau 4 »). */
export function formatNiveauOption(niveau: number | null): string {
  return niveau === null ? SANS_NIVEAU_LABEL : `Niveau ${niveau}`;
}

/** Le niveau sur la carte, avec les diplômes qui y correspondent (« 3 (CAP, BEP) »). */
export function formatNiveauCard(niveau: number | null): string {
  if (niveau === null) return SANS_NIVEAU_LABEL;
  const diplomes = NIVEAU_DIPLOMES[niveau];
  return diplomes === undefined ? `Niveau ${niveau}` : `${niveau} (${diplomes})`;
}

/** Le premier certificateur, puis le nombre des autres ; `null` si la fiche n'en a aucun. */
export function formatCertificateurs({ certificateurs }: Certification): string | null {
  const [first, ...others] = certificateurs;
  if (first === undefined) return null;
  if (others.length === 0) return first.nom;
  return `${first.nom} et ${others.length} ${selectPlural(others.length, AUTRES_LABELS)}`;
}
