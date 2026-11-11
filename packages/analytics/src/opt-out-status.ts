// Sans React : les textes d'une app (composants serveur) indexent leurs libellés
// sur ces états.
export const AUDIENCE_OPT_OUT_STATUS = {
  /** En attente du script Matomo, qui seul connaît le choix enregistré. */
  LOADING: "loading",
  /** Mesure désactivée pour cet environnement, ou script bloqué : rien n'est mesuré. */
  UNAVAILABLE: "unavailable",
  TRACKED: "tracked",
  OPTED_OUT: "optedOut",
} as const;

export type AudienceOptOutStatus =
  (typeof AUDIENCE_OPT_OUT_STATUS)[keyof typeof AUDIENCE_OPT_OUT_STATUS];
