import { isAnalyticsEvent, type AnalyticsApp, type AnalyticsEvent } from "./events";
import { trackEvent } from "./tracker";

const EVENT_ATTRIBUTE = "data-analytics-event";
const LABEL_ATTRIBUTE = "data-analytics-label";

export interface AnalyticsEventProps {
  "data-analytics-event": AnalyticsEvent;
  "data-analytics-label"?: string;
}

/**
 * Les attributs à étaler sur un bouton ou un lien pour en mesurer les clics. Un
 * attribut plutôt qu'un `onClick` : la vue reste pure, et ça marche aussi dans un
 * composant serveur, où un gestionnaire d'événement est impossible.
 */
export function analyticsEventProps(event: AnalyticsEvent, label?: string): AnalyticsEventProps {
  return label === undefined
    ? { [EVENT_ATTRIBUTE]: event }
    : { [EVENT_ATTRIBUTE]: event, [LABEL_ATTRIBUTE]: label };
}

/**
 * Un seul écouteur, délégué au document, mesure tous les éléments marqués par
 * `analyticsEventProps`. En phase de capture : il passe avant tout
 * `stopPropagation` et avant la navigation d'un lien. Renvoie de quoi le retirer.
 */
export function startClickTracking(app: AnalyticsApp): () => void {
  function handleClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) return;

    const element = event.target.closest(`[${EVENT_ATTRIBUTE}]`);
    const name = element?.getAttribute(EVENT_ATTRIBUTE);
    if (!element || !name || !isAnalyticsEvent(name)) return;

    trackEvent(app, name, element.getAttribute(LABEL_ATTRIBUTE) ?? undefined);
  }

  document.addEventListener("click", handleClick, { capture: true });
  return () => document.removeEventListener("click", handleClick, { capture: true });
}
