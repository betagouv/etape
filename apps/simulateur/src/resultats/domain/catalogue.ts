// Catalogue des résultats — règles métier de la PO (ticket « page de résultats »).
//
// Une entrée = une carte. Elle est affichée quand `quand(profil)` est vrai, et
// n'est affichée qu'une fois même si plusieurs réponses la déclenchent : c'est
// une liste de cartes, pas une liste de raisons.
//
// Correspondance avec les scénarios du ticket :
//   S1/S2  salarié·e CDI (cadre / non-cadre) — le statut cadre ne change RIEN
//          aux résultats, les deux scénarios sont identiques.
//   S3/S4  salarié·e CDD (cadre / non-cadre)
//   S5     intérimaire        S6  intermittent·e du spectacle
//   S7     demandeur·euse d'emploi
//   S8     agent·e de la fonction publique
//   S9     sans emploi
//   +      auto-entrepreneur·euse / chef·fe d'entreprise : absent du ticket,
//          arbitré avec la PO — CEP et les quatre outils, aucun dispositif
//          (pas d'employeur, donc ni OPCO ni Transitions Pro).
//
// Les liens ont été vérifiés (HTTP 200) au moment de l'écriture.

import { FLAGS } from "@/questionnaire/domain/flags";

import { cepUrl } from "./cep";
import type { Profil } from "./profil";
import type { Resultat } from "./types";

// ─── Prédicats de situation ───────────────────────────────────────────────
// Un nom par situation : les règles ci-dessous se lisent alors comme le ticket.
const salarie = (p: Profil) => p.flags.has(FLAGS.SALARIE);
const cdi = (p: Profil) => p.flags.has(FLAGS.CDI);
const cdd = (p: Profil) => p.flags.has(FLAGS.CDD);
const interim = (p: Profil) => p.flags.has(FLAGS.INTERIM);
const intermittent = (p: Profil) => p.flags.has(FLAGS.INTERMITTENT);
const demandeurEmploi = (p: Profil) => p.flags.has(FLAGS.DE);
const agentPublic = (p: Profil) => p.flags.has(FLAGS.FONCTIONNAIRE);
const independant = (p: Profil) => p.flags.has(FLAGS.INDEPENDANT);
const sansEmploi = (p: Profil) => p.flags.has(FLAGS.SANS_EMPLOI);

const arretTravail = (p: Profil) => p.flags.has(FLAGS.ARRET_TRAVAIL);
const rqth = (p: Profil) => p.flags.has(FLAGS.RQTH);
/** Q1 : « Mon poste est menacé ou mon entreprise est en difficulté ». */
const posteMenace = (p: Profil) => p.flags.has(FLAGS.MENACE);

/** Salarié·e sous contrat de droit commun : les deux se comportent pareil. */
const cdiOuCdd = (p: Profil) => salarie(p) && (cdi(p) || cdd(p));

// ─── Seuils d'ancienneté ──────────────────────────────────────────────────
// Une durée non renseignée ne peut pas ouvrir un droit : elle vaut 0.
const ancienneteMois = (p: Profil) => p.ancienneteMois ?? 0;
const activiteAnnees = (p: Profil) => p.activiteAnnees ?? 0;

/** PTP : 12 mois chez l'employeur actuel ET 24 mois d'activité au total. */
const ancienneteePtp = (p: Profil) => ancienneteMois(p) >= 12 && activiteAnnees(p) >= 2;

/** Démission-Reconversion : 5 ans d'activité. */
const anciennete5Ans = (p: Profil) => activiteAnnees(p) >= 5;

export const CATALOGUE: Resultat[] = [
  // ═══ INTERLOCUTEURS ═════════════════════════════════════════════════════
  {
    id: "cep",
    categorie: "interlocuteur",
    nom: "CEP régional",
    description:
      "Un conseiller en évolution professionnelle fait le point avec vous, gratuitement, et vous aide à construire votre projet et à le financer. C'est le premier interlocuteur à contacter.",
    // Réseau régionalisé : le portail dépend de la région de l'utilisateur.
    url: cepUrl,
    // Absent du parcours demandeur d'emploi : France Travail y est l'opérateur
    // CEP, la carte ferait doublon et enverrait vers le mauvais guichet (S7).
    quand: (p) => salarie(p) || agentPublic(p) || sansEmploi(p) || independant(p),
  },
  {
    id: "employeur",
    categorie: "interlocuteur",
    nom: "Votre employeur",
    description:
      "Votre manager ou votre service RH peut financer une formation, aménager votre temps de travail et valider une mobilité. L'entretien de parcours professionnel est le moment d'en parler.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F32040",
    quand: (p) => salarie(p) || agentPublic(p),
  },
  {
    id: "opco",
    categorie: "interlocuteur",
    nom: "OPCO",
    description:
      "L'opérateur de compétences de votre branche professionnelle finance les formations des salariés et conseille votre entreprise sur les dispositifs mobilisables.",
    url: "https://travail-emploi.gouv.fr/les-operateurs-de-competences-opco",
    quand: salarie,
  },
  {
    id: "transitions-pro",
    categorie: "interlocuteur",
    nom: "Transitions Pro régionale",
    description:
      "L'association régionale qui instruit et finance les projets de transition professionnelle et le dispositif démissionnaire. Elle valide votre projet avant la formation.",
    url: "https://www.transitionspro.fr/",
    quand: (p) => salarie(p) && (cdi(p) || cdd(p) || interim(p)),
  },
  {
    id: "france-travail",
    categorie: "interlocuteur",
    nom: "France Travail",
    description:
      "Inscription, indemnisation, accompagnement et financement de formations. France Travail assure aussi le conseil en évolution professionnelle des personnes sans emploi.",
    url: "https://www.francetravail.fr/",
    quand: (p) => (salarie(p) && (cdd(p) || interim(p))) || demandeurEmploi(p) || sansEmploi(p),
  },
  {
    id: "cpam",
    categorie: "interlocuteur",
    nom: "CPAM",
    description:
      "Pendant un arrêt de travail, l'Assurance Maladie peut vous accompagner pour préparer le retour à l'emploi ou une reconversion compatible avec votre état de santé.",
    url: "https://www.ameli.fr/assure/droits-demarches/maladie-accident-hospitalisation/prevention-desinsertion-professionnelle",
    // Le ticket ne cite la CPAM que dans les scénarios salariés (S1 à S6).
    quand: (p) => salarie(p) && arretTravail(p),
  },
  {
    id: "agefiph",
    categorie: "interlocuteur",
    nom: "AGEFIPH",
    description:
      "L'Agefiph finance des aides à la formation, à l'aménagement de poste et à la création d'entreprise pour les personnes reconnues travailleurs handicapés.",
    url: "https://www.agefiph.fr/personne-handicapee",
    // Salarié·es (S1 à S6) et agents publics (S8), comme écrit au ticket.
    quand: (p) => rqth(p) && (salarie(p) || agentPublic(p)),
  },

  // ═══ OUTILS ═════════════════════════════════════════════════════════════
  {
    id: "cpf",
    categorie: "outil",
    nom: "Compte personnel de formation (CPF)",
    description:
      "Les droits accumulés depuis le début de votre carrière financent une formation certifiante, un bilan de compétences ou une VAE.",
    url: "https://www.moncompteformation.gouv.fr/espace-public/consulter-mes-droits-formation",
    quand: () => true,
  },
  {
    id: "vae",
    categorie: "outil",
    nom: "Validation des acquis de l'expérience (VAE)",
    description:
      "Faites reconnaître votre expérience par un diplôme ou un titre professionnel, sans repasser par la case formation. Ouverte à tous les statuts.",
    url: "https://vae.gouv.fr/",
    quand: () => true,
  },
  {
    id: "bilan-competences",
    categorie: "outil",
    nom: "Bilan de compétences",
    description:
      "24 heures d'accompagnement, réparties sur 3 mois au maximum, pour analyser vos compétences et vos motivations et arrêter un projet réaliste.",
    url: "https://www.moncompteformation.gouv.fr/espace-public/bilan-de-competences",
    quand: () => true,
  },
  {
    id: "pmsmp",
    categorie: "outil",
    nom: "Immersion en entreprise (PMSMP)",
    description:
      "Quelques jours en entreprise pour découvrir un métier de l'intérieur et confirmer votre projet, sans rien changer à votre situation actuelle.",
    url: "https://immersion-facile.beta.gouv.fr/",
    // Proposée à tous les profils sauf aux intermittent·es du spectacle (S6).
    quand: (p) => !intermittent(p),
  },
  {
    id: "compte-penibilite",
    categorie: "outil",
    nom: "Compte professionnel de prévention (compte pénibilité)",
    description:
      "Si votre poste vous expose à des facteurs de risques professionnels, les points accumulés financent une formation pour changer de métier.",
    url: "https://www.compteprofessionnelprevention.fr/",
    quand: salarie,
  },

  // ═══ DISPOSITIFS ════════════════════════════════════════════════════════
  {
    id: "periode-reconversion",
    categorie: "dispositif",
    nom: "Période de reconversion",
    description:
      "Depuis 2026, ce dispositif remplace la Pro-A et Transitions collectives : se former vers un nouveau métier en gardant son contrat, dans son entreprise ou chez une entreprise d'accueil.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F13516",
    quand: cdiOuCdd,
  },
  {
    id: "ptp",
    categorie: "dispositif",
    nom: "Projet de transition professionnelle (PTP)",
    description:
      "Un congé rémunéré pour suivre une formation certifiante vers un autre métier, en conservant votre contrat de travail. Le dossier est validé par Transitions Pro.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14018",
    // Conditions d'ancienneté en CDI et CDD ; sans condition en intérim et en
    // intermittence, dont les règles d'accès sont propres à leur branche (S5, S6).
    quand: (p) =>
      salarie(p) && (interim(p) || intermittent(p) || (cdiOuCdd(p) && ancienneteePtp(p))),
  },
  {
    id: "demission-reconversion",
    categorie: "dispositif",
    nom: "Démission-Reconversion",
    description:
      "Démissionner en gardant ses allocations chômage. Le projet doit être jugé réel et sérieux par Transitions Pro AVANT la démission.",
    url: "https://demission-reconversion.gouv.fr",
    quand: (p) => salarie(p) && cdi(p) && anciennete5Ans(p),
  },
  {
    id: "csp",
    categorie: "dispositif",
    nom: "Contrat de sécurisation professionnelle (CSP)",
    description:
      "En cas de licenciement économique : 12 mois d'accompagnement renforcé et une allocation majorée pour rebondir vers un nouveau métier.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F13819",
    quand: (p) => cdiOuCdd(p) && posteMenace(p),
  },
  {
    id: "aref",
    categorie: "dispositif",
    nom: "Allocation d'aide au retour à l'emploi formation (AREF)",
    description:
      "Si vous êtes indemnisé par France Travail, votre allocation est maintenue pendant une formation validée par votre conseiller.",
    url: "https://www.francetravail.fr/candidat/en-formation/les-dispositifs/lallocation-daide-au-retour-a-le.html",
    quand: demandeurEmploi,
  },
  {
    id: "poec",
    categorie: "dispositif",
    nom: "Préparation opérationnelle à l'emploi collective (POEC)",
    description:
      "Une formation collective et gratuite aux compétences d'un métier qui recrute, souvent suivie d'entretiens avec les employeurs qui recrutent.",
    url: "https://travail-emploi.gouv.fr/la-preparation-operationnelle-lemploi-collective-poec",
    quand: demandeurEmploi,
  },
  {
    id: "conseil-regional",
    categorie: "dispositif",
    nom: "Formations du conseil régional",
    description:
      "Le programme régional de formation finance des formations qualifiantes, gratuites, pour les personnes en recherche d'emploi.",
    url: "https://www.francetravail.fr/candidat/en-formation/mes-aides-financieres/le-programme-regional-de-formati.html",
    quand: demandeurEmploi,
  },
  {
    id: "contrat-professionnalisation",
    categorie: "dispositif",
    nom: "Contrat de professionnalisation",
    description:
      "Une alternance rémunérée pour acquérir une qualification tout en travaillant. Accessible à tout âge aux personnes en recherche d'emploi.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15478",
    quand: demandeurEmploi,
  },
  {
    id: "dtp",
    categorie: "dispositif",
    nom: "Dispositif de transition professionnelle (DTP)",
    description:
      "Le congé de transition professionnelle permet à un agent public de se former, en restant rémunéré, pour exercer un nouveau métier.",
    url: "https://www.fonction-publique.gouv.fr/etre-agent-public/je-quitte-la-fonction-publique/engager-une-reconversion-professionnelle",
    quand: agentPublic,
  },
];
