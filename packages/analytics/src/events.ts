/** L'app d'où part la mesure : c'est la catégorie de chaque event Matomo. */
export const ANALYTICS_APP = {
  SITE: "site",
  SIMULATEUR: "simulateur",
  FRONT_OFFICE: "front_office",
  BACK_OFFICE: "back_office",
} as const;

export type AnalyticsApp = (typeof ANALYTICS_APP)[keyof typeof ANALYTICS_APP];

/**
 * Le catalogue des events : un event sans question à laquelle il répond ne sert
 * à rien (`stack-front.md`, décision 10, principe 3). Noms en `snake_case`
 * français (`nommage.md`). Ni le nom ni le libellé ne portent jamais de donnée
 * personnelle : un libellé est un emplacement ou un identifiant du catalogue.
 */
export const ANALYTICS_EVENT = {
  /** Depuis quel bouton du site on passe au simulateur. Libellé : l'emplacement. */
  ACCES_SIMULATEUR: "acces_simulateur",
  /** Première simulation lancée depuis l'accueil du simulateur. */
  SIMULATEUR_DEMARRER: "simulateur_demarrer",
  /** Retour sur une simulation déjà commencée. */
  SIMULATEUR_REPRENDRE: "simulateur_reprendre",
  /** Simulation en cours abandonnée pour repartir de zéro. */
  SIMULATEUR_RECOMMENCER: "simulateur_recommencer",
  /** Réponse modifiée depuis les résultats. Libellé : l'identifiant de la question. */
  SIMULATEUR_MODIFIER_REPONSE: "simulateur_modifier_reponse",
  /** Résultats téléchargés en PDF. */
  SIMULATEUR_TELECHARGER_PDF: "simulateur_telecharger_pdf",
  /** Lien « En savoir plus » d'un résultat. Libellé : l'identifiant du résultat. */
  SIMULATEUR_OUVRIR_RESULTAT: "simulateur_ouvrir_resultat",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];

const ANALYTICS_EVENTS: readonly string[] = Object.values(ANALYTICS_EVENT);

/** Ce qu'on lit dans le DOM n'est mesuré que s'il figure au catalogue. */
export function isAnalyticsEvent(value: string): value is AnalyticsEvent {
  return ANALYTICS_EVENTS.includes(value);
}
