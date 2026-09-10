// Liens vers l'offre de formation des Régions. Chaque Région finance son propre
// programme régional de formation et le présente sur son propre site : il n'y a
// ni portail national, ni convention de nommage. Chaque lien a donc été cherché
// et vérifié un par un.
//
// Cible retenue : la page qui parle à une personne en recherche d'emploi de
// l'offre financée par la Région — pas la page institutionnelle « les
// compétences du Conseil régional ». Trois Régions n'exposent cela que sur un
// site tiers qu'elles pilotent, et il est alors préféré à une page interne
// moins pertinente (voir les commentaires).
//
// La carte n'est proposée qu'aux demandeur·euses d'emploi (S7).

import type { RegionCode } from "@/questionnaire/domain/regions";

/**
 * Page France Travail du programme régional de formation, servie quand la région
 * n'a pas pu être déterminée : elle explique le dispositif sans préjuger du
 * territoire.
 */
const CR_URL_DEFAUT =
  "https://www.francetravail.fr/candidat/en-formation/mes-aides-financieres/le-programme-regional-de-formati.html";

const CR_URLS: Record<RegionCode, string> = {
  // Île-de-France : accueil de la Région, sur décision du PO.
  "11": "https://www.iledefrance.fr/",
  "24": "https://www.centre-valdeloire.fr/vivre/accompagner-la-formation/se-former-tout-au-long-de-la-vie-en-centre-val-de-loire",
  "27": "https://www.bourgognefranchecomte.fr/la-formation-professionnelle-des-demandeurs-demploi",
  // Normandie : l'offre est portée par le portail régional « Des parcours, un
  // métier », pas par normandie.fr.
  "28": "https://parcours-metier.normandie.fr/en-recherche-demploi",
  "32": "https://www.hautsdefrance.fr/former-demandeurs-demploi/",
  // Grand Est : le site institutionnel n'a pas de page grand public, le portail
  // Formation Grand Est est le point d'entrée officiel.
  "44": "https://formation.grandest.fr/",
  "52": "https://www.paysdelaloire.fr/formation-et-emploi/formation-professionnelle/je-trouve-une-formation",
  "53": "https://www.bretagne.bzh/actions/formation/acces-emploi/",
  "75": "https://les-aides.nouvelle-aquitaine.fr/economie-et-emploi",
  "76": "https://www.laregion.fr/-La-formation-professionnelle-",
  "84": "https://www.auvergnerhonealpes.fr/particuliers/emploi-formation",
  // Région Sud : le Pass Sud Formation EST le dispositif de prise en charge.
  "93": "https://www.maregionsud.fr/vos-aides/detail/pass-sud-formation",
  // Corse : portail Corsica Orientazione de la Collectivité de Corse.
  "94": "https://orientazione.isula.corsica/definir-mon-projet/mon-profil/demandeur-demploi/",
  "01": "https://www.regionguadeloupe.fr/-Formation-Insertion-Apprentissage-",
  // Martinique : la CTM passe par l'AGEFMA, son Carif-Oref, qui publie ses aides.
  "02": "https://www.agefma.mq/formation/professionnelle/ctm-aides-formations/",
  // Guyane : portail régional Formanoo, piloté par la CTG.
  "03": "https://guyane-formation.formanoo.org/",
  "04": "https://regionreunion.com/aides-services/article/demandeur-de-formation-ou-d-emploi-aides-regionaux",
  // Mayotte : le Département n'a pas de page grand public sur la formation, le
  // Carif-Oref est l'interlocuteur emploi-formation du territoire.
  "06": "https://www.cariforef-mayotte.yt/",
};

/** Offre de formation de la Région, d'après la région déduite des réponses. */
export function conseilRegionalUrl(region: RegionCode | null): string {
  return region ? CR_URLS[region] : CR_URL_DEFAUT;
}
