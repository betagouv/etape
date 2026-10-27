// Point d'entrée commun à toutes les apps, importable depuis un composant serveur :
// ni hook React, ni Next, ni routeur ici. Les branchements propres à chaque pile
// vivent dans `./next` et `./router`, le hook d'opt-out dans `./opt-out`.
export { analyticsEventProps, type AnalyticsEventProps } from "./click-tracking";
export { readMatomoConfig, type MatomoConfig, type MatomoEnv } from "./config";
export { ANALYTICS_APP, ANALYTICS_EVENT, type AnalyticsApp, type AnalyticsEvent } from "./events";
export { AUDIENCE_OPT_OUT_STATUS, type AudienceOptOutStatus } from "./opt-out-status";
export { trackEvent, trackPageView } from "./tracker";
