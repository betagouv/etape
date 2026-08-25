import figma from "@figma/code-connect";

import { NavLink } from "@/components/nav-link";

/**
 * Association Code Connect : composant Figma `ItemNavBar` → composant `NavLink`.
 *
 * L'URL pointe vers une **instance** du composant dans la maquette : c'est le
 * seul identifiant disponible sans jeton d'API Figma. Avant la première
 * publication, régénérer ce fichier avec la commande ci-dessous, qui résout
 * l'instance vers son composant principal et découvre ses propriétés
 * (variantes, texte) :
 *
 *   FIGMA_ACCESS_TOKEN=… npm run figma:create -w @etape/site -- \
 *     "https://www.figma.com/design/CjMnzScPtELfkwJpJYfl4n/SIMULATEUR-v2?node-id=3770-2379"
 *
 * Les propriétés Figma (`figma.string`, `figma.enum`…) sont volontairement
 * absentes : les déclarer au jugé ferait échouer la publication. Elles seront
 * renseignées à partir des propriétés réelles du composant.
 */
figma.connect(NavLink, "<SIMULATEUR_V2>?node-id=3770-2379", {
  example: () => <NavLink href="/">Accueil</NavLink>,
});
