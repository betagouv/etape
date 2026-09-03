// Catalogue des résultats — règles métier de la PO.
//
// Deux tickets le fixent, et ils sont complémentaires :
//   - « page de résultats » donne les 9 scénarios Gherkin (S1 à S9), donc les
//     conditions d'affichage ET l'ordre des cartes ;
//   - « liste des éléments à afficher » donne les intitulés, les textes et les
//     liens de chaque fiche.
//
// Une entrée = une carte. Elle est affichée quand `quand(profil)` est vrai, et
// n'est affichée qu'une fois même si plusieurs réponses la déclenchent : c'est
// une liste de cartes, pas une liste de raisons.
//
// L'ordre de déclaration à l'intérieur de chaque catégorie est celui des
// tableaux Gherkin, et c'est lui qui ordonne l'affichage (voir `selection.ts`).
// Les dispositifs sont donc groupés par public — salarié·es, puis demandeur·euses
// d'emploi, puis fonction publique — parce qu'aucun profil n'en croise deux.
//
// Les scénarios du ticket :
//   S1/S2  salarié·e CDI (cadre / non-cadre) — le statut cadre ne change RIEN
//          aux résultats, les deux scénarios sont identiques.
//   S3/S4  salarié·e CDD (cadre / non-cadre)
//   S5     intérimaire        S6  intermittent·e du spectacle
//   S7     demandeur·euse d'emploi
//   S8     agent·e de la fonction publique
//   S9     sans emploi
//   +      auto-entrepreneur·euse / chef·fe d'entreprise : absent des scénarios,
//          arbitré avec la PO — CEP et les quatre outils ouverts à tous, aucun
//          dispositif (pas d'employeur, donc ni OPCO ni Transitions Pro).
//
// Les liens sont ceux de la liste de la PO et ont été vérifiés (HTTP 200) au
// moment de l'écriture.

import { FLAGS } from "@/questionnaire/domain/flags";

import { cepUrl } from "./cep";
import { conseilRegionalUrl } from "./conseil-regional";
import type { Profil } from "./profil";
import { transitionsProUrl } from "./transitions-pro";
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
      "Le conseiller en évolution professionnelle (CEP) vous accompagne gratuitement dans vos réflexions sur votre avenir professionnel. Il vous aide à faire le point sur votre situation, à construire votre projet et à identifier les solutions adaptées à vos objectifs.",
    // Réseau régionalisé : le portail dépend de la région de l'utilisateur.
    url: cepUrl,
    // Absent du parcours demandeur d'emploi (S7) : France Travail y est
    // l'opérateur CEP, la carte ferait doublon et enverrait au mauvais guichet.
    quand: (p) => salarie(p) || agentPublic(p) || sansEmploi(p) || independant(p),
  },
  {
    id: "employeur",
    categorie: "interlocuteur",
    nom: "Employeur",
    description:
      "Votre employeur peut être un interlocuteur précieux dans votre réflexion. Que vous souhaitiez développer vos compétences, évoluer dans votre métier ou envisager un nouveau projet professionnel, il peut vous aider à identifier les opportunités existantes dans votre entreprise et les solutions susceptibles de soutenir votre démarche.",
    // La liste de la PO ne donne pas de lien : celui-ci est conservé en attendant
    // son arbitrage (retirer le bouton, ou garder cette page).
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F32040",
    quand: (p) => salarie(p) || agentPublic(p),
  },
  {
    id: "opco",
    categorie: "interlocuteur",
    nom: "OPCO",
    description:
      "Les OPCO (Opérateurs de compétences) accompagnent les entreprises et leurs salariés dans le développement des compétences. Ils peuvent informer votre employeur sur les formations adaptées à votre projet et sur les solutions de financement mobilisables pour les mettre en œuvre.",
    // Pas de lien dans la liste de la PO : celui-ci est conservé en attendant
    // son arbitrage.
    url: "https://travail-emploi.gouv.fr/les-operateurs-de-competences-opco",
    quand: salarie,
  },
  {
    id: "transitions-pro",
    categorie: "interlocuteur",
    nom: "Transitions Pro régionale",
    description:
      "Que votre projet soit encore en réflexion ou déjà bien défini, Transitions Pro vous accompagne dans sa construction. Ses équipes peuvent vous aider à clarifier vos objectifs, comprendre les solutions mobilisables et identifier les financements adaptés à votre situation pour sécuriser votre évolution professionnelle.",
    // Réseau régionalisé : une association par région.
    url: transitionsProUrl,
    // Absente du parcours intermittent (S6).
    quand: (p) => salarie(p) && (cdi(p) || cdd(p) || interim(p)),
  },
  {
    id: "france-travail",
    categorie: "interlocuteur",
    nom: "France Travail",
    description:
      "Inscription, indemnisation, accompagnement et financement de formations. France Travail assure aussi le conseil en évolution professionnelle des personnes sans emploi.",
    url: "https://www.francetravail.fr/accueil/",
    // Seul interlocuteur du demandeur d'emploi (S7), la carte CEP étant exclue
    // de ce parcours. Aussi servie aux CDD et intérimaires (S3 à S5) et aux
    // personnes sans emploi (S9).
    quand: (p) => (salarie(p) && (cdd(p) || interim(p))) || demandeurEmploi(p) || sansEmploi(p),
  },
  {
    id: "cpam",
    categorie: "interlocuteur",
    nom: "CPAM",
    description:
      "Si votre état de santé a un impact sur votre activité professionnelle, la CPAM peut vous accompagner dans certaines démarches liées à votre situation. Elle peut vous informer sur les dispositifs existants et vous orienter vers les interlocuteurs adaptés pour sécuriser votre parcours professionnel.",
    url: "https://www.ameli.fr/assure",
    // Les scénarios ne la citent que pour les salarié·es (S1 à S6) : un agent
    // public en arrêt ne la voit pas.
    quand: (p) => salarie(p) && arretTravail(p),
  },
  {
    id: "agefiph",
    categorie: "interlocuteur",
    nom: "AGEFIPH",
    description:
      "L'Agefiph œuvre pour l'emploi des personnes en situation de handicap. Elle accompagne les bénéficiaires dans leurs projets professionnels et finance, sous certaines conditions, des solutions permettant de lever les freins liés à leur situation.",
    url: "https://www.agefiph.fr/",
    // Salarié·es (S1 à S6) et agents publics (S8).
    quand: (p) => rqth(p) && (salarie(p) || agentPublic(p)),
  },

  // ═══ OUTILS ═════════════════════════════════════════════════════════════
  {
    id: "cpf",
    categorie: "outil",
    nom: "Compte personnel de formation (CPF)",
    description:
      "Utiliser les droits à la formation acquis au cours de votre carrière pour financer une formation, développer vos compétences ou préparer un nouveau projet professionnel.",
    // La liste de la PO renvoie vers Service Public, qui a une page par statut
    // (privé, FPE, FPT, demandeur d'emploi) : en attendant son arbitrage, le
    // service lui-même, valable pour tous les statuts.
    url: "https://www.moncompteformation.gouv.fr/espace-public/consulter-mes-droits-formation",
    quand: () => true,
  },
  {
    id: "vae",
    categorie: "outil",
    nom: "Validation des acquis de l'expérience (VAE)",
    description:
      "Faire reconnaître les compétences acquises grâce à votre expérience et obtenir une certification, un titre professionnel ou un diplôme.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2401",
    quand: () => true,
  },
  {
    id: "bilan-competences",
    categorie: "outil",
    nom: "Bilan de compétences",
    description:
      "Faire le point sur vos compétences, vos motivations et vos perspectives pour construire un projet professionnel adapté à vos aspirations.",
    // Pas de lien dans la liste de la PO : celui-ci est conservé en attendant
    // son arbitrage.
    url: "https://www.moncompteformation.gouv.fr/espace-public/tout-savoir-sur-le-bilan-de-competences",
    quand: () => true,
  },
  {
    id: "pmsmp",
    categorie: "outil",
    nom: "Période de mise en situation en milieu professionnel (PMSMP)",
    description:
      "Découvrir un métier, confirmer un projet professionnel ou explorer un nouveau secteur d'activité grâce à une immersion temporaire en entreprise.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14102",
    // Proposée à tous les profils sauf aux intermittent·es du spectacle (S6).
    quand: (p) => !intermittent(p),
  },
  {
    id: "c2p",
    categorie: "outil",
    nom: "Compte professionnel de prévention (C2P)",
    description:
      "Mobiliser les droits acquis au titre de certains facteurs de pénibilité pour financer une formation ou préparer une évolution professionnelle vers un emploi moins exposé.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15504",
    // Salarié·es du privé seulement (S1 à S6) : le C2P n'existe pas dans la
    // fonction publique.
    quand: salarie,
  },

  // ═══ DISPOSITIFS — salarié·es (S1 à S6) ═════════════════════════════════
  {
    id: "periode-reconversion",
    categorie: "dispositif",
    nom: "Période de reconversion (ex Pro-A)",
    description:
      "Développer de nouvelles compétences ou accéder à un nouveau métier tout en restant salarié de son entreprise.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F13516",
    quand: cdiOuCdd,
  },
  {
    id: "ptp",
    categorie: "dispositif",
    nom: "Projet de transition professionnelle (PTP)",
    description:
      "Suivre une formation pour changer de métier tout en conservant son contrat de travail et, sous conditions, une partie de sa rémunération.",
    url: "https://www.transitionspro.fr/nos-dispositifs/projet-de-transition-professionnelle/",
    // Conditions d'ancienneté en CDI et CDD ; sans condition en intérim et en
    // intermittence, dont les règles d'accès sont propres à leur branche (S5, S6).
    quand: (p) =>
      salarie(p) && (interim(p) || intermittent(p) || (cdiOuCdd(p) && ancienneteePtp(p))),
  },
  {
    id: "pur",
    categorie: "dispositif",
    nom: "Prévention Usure Reconversion (PUR)",
    description:
      "Construire un projet de reconversion professionnelle avec un accompagnement dédié et le financement d'un parcours de formation adapté à votre objectif en utilisant vos droits acquis au titre du compte pénibilité (C2P).",
    url: "https://www.transitionspro.fr/nos-dispositifs/prevention-usure-reconversion/",
    // CDI uniquement : les scénarios ne la citent qu'en S1 et S2. Le questionnaire
    // ne demande ni l'exposition à la pénibilité ni les points C2P, donc aucune
    // condition ne s'y ajoute.
    quand: (p) => salarie(p) && cdi(p),
  },
  {
    id: "demission-reconversion",
    categorie: "dispositif",
    nom: "Démission-Reconversion",
    description:
      "Quitter son emploi pour réaliser un projet de reconversion ou de création d'entreprise tout en pouvant bénéficier de l'allocation chômage, sous certaines conditions.",
    url: "https://www.transitionspro.fr/nos-dispositifs/demission-reconversion/",
    quand: (p) => salarie(p) && cdi(p) && anciennete5Ans(p),
  },
  {
    id: "csp",
    categorie: "dispositif",
    nom: "Contrat de sécurisation professionnelle (CSP)",
    description:
      "Bénéficier d'un accompagnement renforcé pour retrouver un emploi, suivre une formation ou construire un nouveau projet professionnel après un licenciement économique.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F13819",
    quand: (p) => cdiOuCdd(p) && posteMenace(p),
  },

  // ═══ DISPOSITIFS — demandeur·euses d'emploi (S7) ════════════════════════
  {
    id: "aref",
    categorie: "dispositif",
    nom: "Allocation d'aide au retour à l'emploi formation (AREF)",
    description:
      "Bénéficier d'un revenu pendant votre formation lorsque celle-ci est validée dans le cadre de votre accompagnement avec France Travail.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F291",
    quand: demandeurEmploi,
  },
  {
    id: "poec",
    categorie: "dispositif",
    nom: "Préparation opérationnelle à l'emploi collective (POEC)",
    // Texte de remplacement, dans le registre des autres fiches : la liste de la
    // PO ne donne pas de rédaction pour la POEC, alors que le scénario S7 la cite.
    description:
      "Se former gratuitement aux compétences d'un métier qui recrute, dans le cadre d'une formation collective préparant à des postes à pourvoir.",
    url: "https://travail-emploi.gouv.fr/la-preparation-operationnelle-lemploi-collective-poec",
    quand: demandeurEmploi,
  },
  {
    id: "conseil-regional",
    categorie: "dispositif",
    nom: "Conseil régional",
    description:
      "Accéder à une formation prise en charge par votre Région pour développer vos compétences, préparer une reconversion ou faciliter votre retour à l'emploi.",
    // Réseau régionalisé : chaque Région a sa propre offre de formation.
    url: conseilRegionalUrl,
    quand: demandeurEmploi,
  },
  {
    id: "contrat-professionnalisation",
    categorie: "dispositif",
    nom: "Contrat de professionnalisation",
    description:
      "Se former à un métier tout en exerçant une activité professionnelle rémunérée pour faciliter son insertion ou sa reconversion.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15478",
    quand: demandeurEmploi,
  },

  // ═══ DISPOSITIFS — fonction publique (S8) ═══════════════════════════════
  {
    id: "cfp",
    categorie: "dispositif",
    nom: "Congé de formation professionnelle (CFP)",
    description:
      "Suivre une formation afin de développer ses compétences, préparer une évolution professionnelle ou construire un nouveau projet de carrière.",
    // Page de la fonction publique d'État, sur décision de la PO : c'est le seul
    // lien que donne sa liste. Les deux autres versants ont leur propre page si
    // elle change d'avis — territoriale F3042, hospitalière F3054 — et les flags
    // FP_TERRITORIALE / FP_HOSPITALIERE permettraient de les servir.
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F3026",
    quand: agentPublic,
  },
];
