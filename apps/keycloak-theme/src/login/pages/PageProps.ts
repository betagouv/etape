import type { PageProps } from "keycloakify/login/pages/PageProps";

import type { I18n } from "../i18n";
import type Template from "../Template";

/**
 * `PageProps` de Keycloakify, avec le gabarit d'ETAPE à la place du gabarit
 * générique.
 *
 * Keycloakify type `Template` de façon volontairement large pour que n'importe
 * quel gabarit convienne. Le nôtre accepte une propriété de plus — `subtitle` —
 * et sans ce resserrement, TypeScript la refuserait dans les pages.
 */
export type EtapePageProps<NarrowedKcContext> = Omit<
  PageProps<NarrowedKcContext, I18n>,
  "Template"
> & {
  Template: typeof Template;
};
