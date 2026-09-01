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
  // ─── Q1. Origine de la demande ─────────────────────────────────────────
  /** Envie d'un nouveau départ. */
  NOUVEAU_DEPART: "NOUVEAU_DEPART",
  /** La santé ne permet plus de se projeter dans la situation actuelle. */
  SANTE: "SANTE",
  /** Poste menacé, entreprise en difficulté ou en restructuration. */
  MENACE: "MENACE",
  /** Ne trouve pas d'emploi. */
  PAS_EMPLOI: "PAS_EMPLOI",
  /** Autre origine, non listée. */
  AUTRE_MOTIF: "AUTRE_MOTIF",

  // ─── Q2. Métier souhaité ───────────────────────────────────────────────
  /** Métier cible précis. */
  METIER_PRECIS: "METIER_PRECIS",
  /** Projet non arrêté (piste incertaine ou aucune idée) : besoin d'orientation. */
  ORIENTATION: "ORIENTATION",
  /** Veut garder son métier mais l'exercer ailleurs. */
  GARDER_METIER: "GARDER_METIER",

  // ─── Q3. Situation professionnelle ─────────────────────────────────────
  /** Salarié·e du secteur privé. */
  SALARIE: "SALARIE",
  /** Demandeur·euse d'emploi inscrit·e à France Travail. */
  DE: "DE",
  /** Agent·e de la fonction publique. */
  FONCTIONNAIRE: "FONCTIONNAIRE",
  /** Auto-entrepreneur·euse ou chef·fe d'entreprise. */
  INDEPENDANT: "INDEPENDANT",
  /** Sans emploi, non inscrit·e à France Travail. */
  SANS_EMPLOI: "SANS_EMPLOI",

  /** Salarié·e en CDI. */
  CDI: "CDI",
  /** Salarié·e en CDD. */
  CDD: "CDD",
  /** Salarié·e en intérim. */
  INTERIM: "INTERIM",
  /** Intermittent·e du spectacle. */
  INTERMITTENT: "INTERMITTENT",
  /** Statut cadre (posé aux seuls CDI et CDD). */
  CADRE: "CADRE",

  /** Fonction publique d'État. */
  FP_ETAT: "FP_ETAT",
  /** Fonction publique territoriale. */
  FP_TERRITORIALE: "FP_TERRITORIALE",
  /** Fonction publique hospitalière. */
  FP_HOSPITALIERE: "FP_HOSPITALIERE",

  /** En arrêt de travail (maladie, accident du travail ou invalidité). */
  ARRET_TRAVAIL: "ARRET_TRAVAIL",

  // ─── Q6. Résidence et travail ──────────────────────────────────────────
  /** Réside hors de France. */
  RESIDENCE_HORS_FRANCE: "RESIDENCE_HORS_FRANCE",
  /**
   * Travaille en France en résidant hors de France. Son ABSENCE, combinée à
   * `RESIDENCE_HORS_FRANCE`, ferme le parcours : ni résidence ni travail en
   * France.
   */
  TRAVAIL_FRANCE: "TRAVAIL_FRANCE",

  // ─── Q7. Reconnaissance de travailleur handicapé ───────────────────────
  /** Reconnaissance de travailleur handicapé. */
  RQTH: "RQTH",
  /**
   * A choisi de ne pas répondre. À distinguer d'un « non » : les dispositifs
   * réservés aux bénéficiaires de l'obligation d'emploi restent « à vérifier »
   * plutôt que de tomber en « non éligible ».
   */
  RQTH_REFUS: "RQTH_REFUS",

  // ─── Flags orphelins ───────────────────────────────────────────────────
  // Plus AUCUNE question ne les pose : le questionnaire du ticket ne demande
  // ni l'âge, ni le niveau de diplôme, ni l'allocation chômage, ni le détail
  // des situations de santé (seule la RQTH subsiste). `resultats/domain/devices.ts`
  // les lit encore — ils sont conservés le temps que le catalogue soit repris,
  // dans la session dédiée aux résultats. Un flag jamais posé rend son critère
  // non rempli : les dispositifs concernés sont listés dans cette reprise.
  /** Moins de 26 ans. */
  JEUNE: "JEUNE",
  /** Projet de création / reprise d'entreprise. */
  ENTREPRENEUR: "ENTREPRENEUR",
  /** Entrepreneur·e déjà inscrit·e à France Travail (ouvre l'ARCE). */
  DE_ENTREPRENEUR: "DE_ENTREPRENEUR",
  /** Savoir-faire à faire valider par un diplôme (piste VAE). */
  VAE: "VAE",
  /** Accident du travail / maladie professionnelle reconnu·e. */
  ATMP: "ATMP",
  /** Pension d'invalidité. */
  INVALIDITE: "INVALIDITE",
  /** Ancienneté suffisante pour un PTP. */
  PTP: "PTP",
  /** Ancienneté partielle au regard du PTP. */
  PTP_PARTIEL: "PTP_PARTIEL",
  /** Envisage de démissionner. */
  DEMISSION: "DEMISSION",
  /** 5 ans d'activité salariée continue (condition démissionnaire). */
  DEM_5ANS: "DEM_5ANS",
  /** Niveau CAP ou inférieur. */
  SANS_DIPLOME: "SANS_DIPLOME",
  /** Bac+3 et au-delà. */
  BAC3: "BAC3",
} as const;

export type Flag = (typeof FLAGS)[keyof typeof FLAGS];

/** Ensemble de flags d'un parcours (lecture seule pour les consommateurs). */
export type FlagSet = ReadonlySet<string>;
