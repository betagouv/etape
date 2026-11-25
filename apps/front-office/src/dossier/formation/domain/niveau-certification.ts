/**
 * Les niveaux proposés pour une certification visée saisie à la main, dans l'ordre de la liste
 * (transmise le 2026-11-25). Deux entrées au niveau 6 : licence et maîtrise.
 */
export const NIVEAU_CERTIFICATION = {
  NIVEAU_3: "niveau-3",
  NIVEAU_4: "niveau-4",
  NIVEAU_5: "niveau-5",
  NIVEAU_6_LICENCE: "niveau-6-licence",
  NIVEAU_6_MAITRISE: "niveau-6-maitrise",
  NIVEAU_7: "niveau-7",
  NIVEAU_8: "niveau-8",
  NON_DIPLOMANTE: "non-diplomante",
} as const;

/** Un niveau de certification, parmi ceux de `NIVEAU_CERTIFICATION`. */
export type NiveauCertification = (typeof NIVEAU_CERTIFICATION)[keyof typeof NIVEAU_CERTIFICATION];

/** Libellé de chaque niveau de certification. */
export const NIVEAU_CERTIFICATION_LABEL: Record<NiveauCertification, string> = {
  [NIVEAU_CERTIFICATION.NIVEAU_3]: "Niveau 3 - CAP / BEP",
  [NIVEAU_CERTIFICATION.NIVEAU_4]: "Niveau 4 - Baccalauréat / BP",
  [NIVEAU_CERTIFICATION.NIVEAU_5]: "Niveau 5 - DEUG / BTS / DUT / DEUST",
  [NIVEAU_CERTIFICATION.NIVEAU_6_LICENCE]: "Niveau 6 - Licence / licence professionnelle / BUT",
  [NIVEAU_CERTIFICATION.NIVEAU_6_MAITRISE]: "Niveau 6 - Maîtrise",
  [NIVEAU_CERTIFICATION.NIVEAU_7]:
    "Niveau 7 - Master, diplôme d’études approfondies, diplôme d’études supérieures spécialisées, diplôme d’ingénieur…",
  [NIVEAU_CERTIFICATION.NIVEAU_8]: "Niveau 8 - Doctorat, habilitation à diriger des recherches",
  [NIVEAU_CERTIFICATION.NON_DIPLOMANTE]: "La certification n’est pas diplômante",
};
