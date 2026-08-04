// Drapeaux (flags) accumulés au fil des réponses.
//
// Chaque option de question peut contribuer un ou plusieurs flags. L'ensemble
// des flags d'un parcours est la matière première de l'éligibilité : le module
// `resultats/` lit ces flags pour classer les dispositifs.
//
// Fichier FEUILLE volontairement sans import : il est partagé par les questions
// (`questions.ts`), la traversée du flow (`flow.ts`) et le catalogue de
// dispositifs (`resultats/domain/*`) sans créer de cycle d'import.

export const FLAGS = {
  /** Travaille hors de France. */
  TRAVAIL_HORS_FRANCE: "TRAVAIL_HORS_FRANCE",
  /** Réside hors de France. */
  RESIDENCE_HORS_FRANCE: "RESIDENCE_HORS_FRANCE",

  /** Reconversion contrainte (santé, économique…) plutôt que choisie. */
  CONTRAINT: "CONTRAINT",
  /** Projet de création / reprise d'entreprise. */
  ENTREPRENEUR: "ENTREPRENEUR",
  /** Entrepreneur·e déjà inscrit·e à France Travail (ouvre l'ARCE). */
  DE_ENTREPRENEUR: "DE_ENTREPRENEUR",
  /** Savoir-faire à faire valider par un diplôme (piste VAE). */
  VAE: "VAE",
  /** Besoin d'orientation / projet non défini. */
  ORIENTATION: "ORIENTATION",

  /** Moins de 26 ans. */
  JEUNE: "JEUNE",
  /** 45 ans et plus. */
  SENIOR: "SENIOR",

  /** Demandeur·euse d'emploi inscrit·e à France Travail. */
  DE: "DE",
  /** Agent·e de la fonction publique. */
  FONCTIONNAIRE: "FONCTIONNAIRE",
  /** Salarié·e du secteur privé. */
  SALARIE: "SALARIE",
  /** Salarié·e en CDI. */
  CDI: "CDI",
  /** Salarié·e en CDD ou intérim. */
  CDD: "CDD",
  /** Indépendant·e / auto-entrepreneur·e. */
  INDEPENDANT: "INDEPENDANT",

  /** Ancienneté suffisante pour un PTP (plus de 2 ans). */
  PTP: "PTP",
  /** Ancienneté partielle (1 à 2 ans). */
  PTP_PARTIEL: "PTP_PARTIEL",

  /** Envisage de démissionner. */
  DEMISSION: "DEMISSION",
  /** Poste menacé (licenciement économique possible ou annoncé). */
  MENACE: "MENACE",
  /** 5 ans d'activité salariée continue (condition démissionnaire). */
  DEM_5ANS: "DEM_5ANS",

  /** RQTH (ou démarche en cours). */
  RQTH: "RQTH",
  /** Accident du travail / maladie professionnelle reconnu·e. */
  ATMP: "ATMP",
  /** Pension d'invalidité. */
  INVALIDITE: "INVALIDITE",

  /** Niveau CAP ou inférieur. */
  SANS_DIPLOME: "SANS_DIPLOME",
  /** Bac+3 et au-delà. */
  BAC3: "BAC3",
} as const;

export type Flag = (typeof FLAGS)[keyof typeof FLAGS];

/** Ensemble de flags d'un parcours (lecture seule pour les consommateurs). */
export type FlagSet = ReadonlySet<string>;
