// Catalogue des dispositifs — repris du prototype HTML v2.1 (textes, organismes
// et liens conservés). Chaque condition du prototype est décomposée en
// « critères d'accès » individuels dont le statut classe le dispositif dans un
// des trois onglets (voir `eligibility.ts`).

import { FLAGS } from "@/questionnaire/domain/flags";

import type { Critere, Device } from "./types";

// ─── Fabriques de critères ─────────────────────────────────────────────────
const valide = (label: string): Critere => ({ label, statut: "valide" });
const aVerifier = (label: string): Critere => ({ label, statut: "a-verifier" });
const manquant = (label: string): Critere => ({ label, statut: "manquant" });

/**
 * Critère conditionnel : `ok` vrai → validé ; sinon `manquant` (condition dure,
 * bloquante → « Non éligible ») ou `a-verifier` (condition souple → « Sous réserve »).
 */
const critere = (label: string, ok: boolean, dur = false): Critere =>
  ok ? valide(label) : dur ? manquant(label) : aVerifier(label);

export const DEVICES: Device[] = [
  // ── Départ sécurisé de l'emploi ───────────────────────────────────────────
  {
    id: "Démissionnaire",
    name: "Dispositif démissionnaire — démission avec droit au chômage (ARE)",
    acteur: "CEP → Transitions Pro → France Travail",
    description:
      "Démissionnez en conservant vos allocations chômage pour mener un projet réel et sérieux de reconversion ou de création d'entreprise.",
    url: "https://demission-reconversion.gouv.fr",
    relevant: (f) => f.has(FLAGS.DEMISSION) || f.has(FLAGS.CDI),
    priorite: (f) => (f.has(FLAGS.DEM_5ANS) ? 1 : 3),
    criteres: (f) => [
      critere("Être en CDI dans le secteur privé", f.has(FLAGS.CDI), true),
      f.has(FLAGS.DEM_5ANS)
        ? valide("Justifier 5 ans d'activité salariée continue")
        : aVerifier("Justifier 5 ans d'activité salariée continue (à confirmer)"),
      critere("Projet réel et sérieux de reconversion ou de création", !f.has(FLAGS.ORIENTATION)),
      aVerifier("Projet validé par Transitions Pro AVANT de démissionner"),
    ],
  },
  {
    id: "Rupture conv.",
    name: "Rupture conventionnelle",
    acteur: "Négociation avec l'employeur / DREETS",
    description:
      "Départ négocié d'un commun accord avec l'employeur : indemnité de rupture et droit à l'ARE, sans condition d'ancienneté.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/N19806",
    relevant: (f) => f.has(FLAGS.DEMISSION) || f.has(FLAGS.MENACE) || f.has(FLAGS.CDI),
    priorite: () => 2,
    criteres: (f) => [
      critere("Être en CDI", f.has(FLAGS.CDI), true),
      aVerifier("Accord de l'employeur (il peut refuser)"),
      aVerifier("Homologation par la DREETS"),
    ],
  },
  {
    id: "CSP",
    name: "Contrat de Sécurisation Professionnelle",
    acteur: "France Travail / Employeur",
    description:
      "En cas de licenciement économique : accompagnement renforcé de 12 mois et allocation majorée (~75 % du brut).",
    url: "https://www.service-public.fr/particuliers/vosdroits/F13819",
    relevant: (f) => f.has(FLAGS.MENACE) || f.has(FLAGS.SALARIE),
    priorite: (f) => (f.has(FLAGS.MENACE) ? 1 : 4),
    criteres: (f) => [
      critere("Licenciement économique en cours ou annoncé", f.has(FLAGS.MENACE), true),
      critere("Être salarié·e (proposé par l'employeur)", f.has(FLAGS.SALARIE)),
      aVerifier("Entreprise de moins de 1 000 salariés"),
    ],
  },

  // ── Entrepreneuriat ─────────────────────────────────────────────────────
  {
    id: "ACRE/ARCE",
    name: "Aide à la Création ou Reprise d'Entreprise",
    acteur: "France Travail / URSSAF",
    description:
      "ACRE : exonération partielle de charges la 1re année. ARCE : 60 % de vos droits ARE versés en capital pour démarrer.",
    url: "https://www.service-public.fr/particuliers/vosdroits/F15252",
    relevant: (f) => f.has(FLAGS.ENTREPRENEUR),
    priorite: (f) => (f.has(FLAGS.DE_ENTREPRENEUR) ? 1 : 2),
    criteres: (f) => [
      valide("Porter un projet de création ou de reprise d'entreprise"),
      f.has(FLAGS.DE_ENTREPRENEUR)
        ? valide("Être demandeur·euse d'emploi indemnisé·e (pour l'ARCE)")
        : aVerifier("ARCE réservée aux demandeurs d'emploi indemnisés"),
    ],
  },
  {
    id: "CAPE",
    name: "Contrat d'Appui au Projet d'Entreprise",
    acteur: "Coopératives, associations d'accompagnement",
    description:
      "Testez votre projet en conservant votre couverture sociale, hébergé·e par une structure d'accompagnement.",
    url: "https://www.service-public.fr/particuliers/vosdroits/F11299",
    relevant: (f) => f.has(FLAGS.ENTREPRENEUR),
    priorite: () => 2,
    criteres: () => [
      valide("Porter un projet d'entreprise"),
      aVerifier("Être hébergé·e par une structure d'accompagnement (couveuse…)"),
    ],
  },
  {
    id: "NACRE",
    name: "Nouvel Accompagnement pour la Création et Reprise d'Entreprise",
    acteur: "Opérateurs agréés État / BPI France",
    description:
      "Accompagnement en 3 phases (montage, financement, développement) et prêt à taux zéro jusqu'à 8 000 €.",
    url: "https://www.service-public.fr/particuliers/vosdroits/F13067",
    relevant: (f) => f.has(FLAGS.ENTREPRENEUR),
    priorite: (f) => (f.has(FLAGS.JEUNE) || f.has(FLAGS.DE_ENTREPRENEUR) ? 2 : 3),
    criteres: (f) => [
      valide("Porter un projet de création / reprise"),
      critere(
        "Public prioritaire (demandeur d'emploi, RSA, moins de 26 ans)",
        f.has(FLAGS.DE_ENTREPRENEUR) || f.has(FLAGS.JEUNE),
      ),
    ],
  },
  {
    id: "BGE / CCI / RE",
    name: "Réseaux d'accompagnement à l'entrepreneuriat",
    acteur: "BGE, CCI, Réseau Entreprendre, Initiative France",
    description:
      "Accompagnement pour structurer le projet, identifier les financements et rejoindre un réseau d'entrepreneurs.",
    url: "https://bpifrance-creation.fr/contacts-utiles",
    relevant: (f) => f.has(FLAGS.ENTREPRENEUR),
    priorite: () => 4,
    criteres: () => [valide("Porter un projet entrepreneurial")],
  },

  // ── Santé / Handicap / AT-MP ──────────────────────────────────────────────
  {
    id: "PRE",
    name: "Programme de Retour à l'Emploi",
    acteur: "CPAM (Assurance Maladie)",
    description:
      "Accompagnement pluridisciplinaire pour les personnes en arrêt prolongé suite à un AT/MP ou une maladie invalidante.",
    url: "https://www.ameli.fr/assure/remboursements/maladie-accident-hospitalisation/arret-travail-maladie/desinsertion-professionnelle",
    relevant: (f) => f.has(FLAGS.ATMP) || f.has(FLAGS.INVALIDITE),
    priorite: () => 1,
    criteres: (f) => [
      critere(
        "Arrêt suite à AT/MP ou maladie invalidante",
        f.has(FLAGS.ATMP) || f.has(FLAGS.INVALIDITE),
        true,
      ),
      aVerifier("Prescription du médecin conseil de la CPAM"),
    ],
  },
  {
    id: "SRRT",
    name: "Stage de Réentraînement au Travail",
    acteur: "CPAM / Centres de Rééducation Professionnelle",
    description:
      "Remise en condition physique et mentale progressive, débouchant sur un projet de reconversion adapté à l'état de santé.",
    url: "https://www.ameli.fr/assure/remboursements/maladie-accident-hospitalisation/accident-travail/reeducation-professionnelle",
    relevant: (f) => f.has(FLAGS.ATMP),
    priorite: () => 1,
    criteres: (f) => [
      critere("Être victime d'un AT/MP", f.has(FLAGS.ATMP), true),
      aVerifier("Prescription médicale du médecin conseil CPAM"),
    ],
  },
  {
    id: "CRE",
    name: "Contrat de Rééducation Professionnelle en Entreprise",
    acteur: "CARSAT / Assurance Maladie",
    description:
      "Réapprentissage d'un métier compatible avec votre état de santé chez un employeur, avec maintien des indemnités AT/MP.",
    url: "https://www.service-public.fr/particuliers/vosdroits/F31659",
    relevant: (f) => f.has(FLAGS.ATMP),
    priorite: () => 1,
    criteres: (f) => [
      critere("Être victime d'un AT/MP", f.has(FLAGS.ATMP), true),
      aVerifier("Accord de l'employeur d'accueil et de la CARSAT"),
    ],
  },
  {
    id: "AGEFIPH",
    name: "Aides de l'AGEFIPH",
    acteur: "AGEFIPH (secteur privé)",
    description:
      "Aides à la formation, à l'aménagement de poste et à la création d'entreprise pour les travailleurs handicapés du privé.",
    url: "https://www.agefiph.fr/personne-handicapee/services-et-aides",
    relevant: (f) => f.has(FLAGS.RQTH) && !f.has(FLAGS.FONCTIONNAIRE),
    priorite: () => 1,
    criteres: (f) => [
      critere("Disposer d'une RQTH", f.has(FLAGS.RQTH), true),
      critere("Relever du secteur privé", !f.has(FLAGS.FONCTIONNAIRE), true),
    ],
  },
  {
    id: "FIPHFP",
    name: "Aides du FIPHFP",
    acteur: "FIPHFP (fonction publique)",
    description:
      "Équivalent de l'AGEFIPH pour la fonction publique : aménagements, formations adaptées et accompagnement vers un autre métier.",
    url: "https://www.fiphfp.fr/personnes-en-situation-de-handicap/evoluer-dans-la-fonction-publique/se-maintenir-dans-l-emploi",
    relevant: (f) => f.has(FLAGS.RQTH) && f.has(FLAGS.FONCTIONNAIRE),
    priorite: () => 1,
    criteres: (f) => [
      critere("Disposer d'une RQTH", f.has(FLAGS.RQTH), true),
      critere("Être agent·e de la fonction publique", f.has(FLAGS.FONCTIONNAIRE), true),
    ],
  },
  {
    id: "Emploi acc.",
    name: "Emploi Accompagné",
    acteur: "MDPH / Opérateurs agréés",
    description:
      "Un référent dédié accompagne dans la durée : recherche d'emploi, intégration et maintien sur le poste. L'employeur est aussi accompagné.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F34063",
    relevant: (f) => f.has(FLAGS.RQTH) && !f.has(FLAGS.ENTREPRENEUR),
    priorite: () => 2,
    criteres: (f) => [
      critere("Disposer d'une RQTH", f.has(FLAGS.RQTH), true),
      aVerifier("Orientation par la MDPH"),
    ],
  },

  // ── Orientation et réflexion ──────────────────────────────────────────────
  {
    id: "CEP",
    name: "Conseil en Évolution Professionnelle",
    acteur: (f) =>
      f.has(FLAGS.BAC3) ? "APEC" : f.has(FLAGS.JEUNE) ? "Mission Locale" : "France Travail",
    description:
      "Accompagnement personnalisé et gratuit pour faire le point et construire un plan d'action. L'étape obligatoire avant toute démission.",
    url: "https://mon-cep.org/",
    relevant: () => true,
    priorite: (f) =>
      f.has(FLAGS.ORIENTATION) || f.has(FLAGS.DEMISSION) ? 1 : f.has(FLAGS.ENTREPRENEUR) ? 3 : 4,
    criteres: () => [valide("Ouvert à toute personne active, gratuitement")],
  },
  {
    id: "Bilan de comp.",
    name: "Bilan de compétences",
    acteur: "Organismes certifiés (finançable via CPF)",
    description:
      "24h sur 3 mois maximum pour analyser compétences, motivations et valeurs et définir un projet solide.",
    url: "https://www.moncompteformation.gouv.fr/espace-public/bilan-de-competences",
    relevant: (f) => !f.has(FLAGS.ENTREPRENEUR),
    priorite: (f) => (f.has(FLAGS.ORIENTATION) ? 1 : 5),
    criteres: () => [valide("Ouvert à toute personne active"), valide("Finançable via le CPF")],
  },
  {
    id: "PMSMP",
    name: "Immersion en entreprise",
    acteur: "France Travail / Mission Locale",
    description:
      "Immersion de 1 à 5 jours en entreprise pour découvrir un métier de l'intérieur et confirmer un projet. Indemnisation maintenue.",
    url: "https://immersion-facile.beta.gouv.fr/",
    relevant: (f) => !f.has(FLAGS.ENTREPRENEUR),
    priorite: (f) => (f.has(FLAGS.ORIENTATION) ? 2 : 5),
    criteres: (f) => [
      critere(
        "Être demandeur·euse d'emploi ou salarié·e en reconversion",
        f.has(FLAGS.DE) || f.has(FLAGS.SALARIE),
      ),
      aVerifier("Accord d'un employeur d'accueil"),
    ],
  },

  // ── Formation et financement ──────────────────────────────────────────────
  {
    id: "CPF",
    name: "Compte Personnel de Formation",
    acteur: "Caisse des Dépôts — moncompteformation.gouv.fr",
    description:
      "Vos droits accumulés financent une formation certifiante, un bilan de compétences, une VAE ou une formation à la création d'entreprise.",
    url: "https://www.moncompteformation.gouv.fr/espace-public/decouvrir-le-compte-personnel-de-formation",
    relevant: () => true,
    priorite: () => 3,
    criteres: (f) => [
      valide("Ouvert à tout actif"),
      f.has(FLAGS.INDEPENDANT)
        ? aVerifier("Droits réduits pour les indépendants")
        : valide("Vérifier son solde sur moncompteformation.gouv.fr"),
    ],
  },
  {
    id: "VAE",
    name: "Validation des Acquis de l'Expérience",
    acteur: "France VAE — Organismes certificateurs",
    description:
      "Obtenez tout ou partie d'un diplôme grâce à votre expérience, sans formation obligatoire. Ouverte à tous les statuts.",
    url: "https://vae.gouv.fr/",
    relevant: (f) => !f.has(FLAGS.ENTREPRENEUR),
    priorite: (f) => (f.has(FLAGS.VAE) ? 1 : 3),
    criteres: (f) => [
      valide("Ouverte à tous les statuts"),
      f.has(FLAGS.VAE)
        ? valide("Justifier une expérience en lien avec la certification")
        : aVerifier("Justifier au moins 1 an d'expérience en lien avec la certification visée"),
    ],
  },
  {
    id: "PTP",
    name: "Projet de Transition Professionnelle",
    acteur: "Transitions Pro (ex-Fongecif)",
    description:
      "Congé rémunéré pour suivre une formation certifiante vers un autre métier, en conservant son contrat de travail.",
    url: "https://www.transitionspro.fr",
    relevant: (f) => f.has(FLAGS.SALARIE),
    priorite: (f) => (f.has(FLAGS.PTP) ? 2 : 3),
    criteres: (f) => [
      critere("Statut de salarié (CDI, CDD ou intérim)", f.has(FLAGS.SALARIE), true),
      f.has(FLAGS.PTP)
        ? valide("24 mois d'ancienneté, dont 12 dans l'entreprise")
        : f.has(FLAGS.PTP_PARTIEL)
          ? aVerifier("Ancienneté proche du seuil (24 mois requis)")
          : manquant("24 mois d'ancienneté, dont 12 dans l'entreprise"),
      valide("Formation certifiante inscrite au RNCP"),
      critere("Projet de reconversion vers un nouveau métier", !f.has(FLAGS.ORIENTATION)),
      aVerifier("Dossier validé par Transitions Pro"),
    ],
  },
  {
    id: "Pro-A",
    name: "Reconversion ou Promotion par Alternance",
    acteur: "OPCO (Opérateur de Compétences)",
    description:
      "Se reconvertir par alternance sans quitter son emploi : la formation se déroule sur le temps de travail, financée par l'OPCO.",
    url: "https://www.service-public.fr/particuliers/vosdroits/F13516",
    relevant: (f) => f.has(FLAGS.CDI) && f.has(FLAGS.SANS_DIPLOME),
    priorite: () => 2,
    criteres: (f) => [
      critere("Être en CDI", f.has(FLAGS.CDI), true),
      critere("Niveau de diplôme inférieur à Bac+3", !f.has(FLAGS.BAC3), true),
      aVerifier("Accord de l'employeur"),
    ],
  },

  // ── Demandeurs d'emploi ───────────────────────────────────────────────────
  {
    id: "AIF",
    name: "Aide Individuelle à la Formation",
    acteur: "France Travail",
    description:
      "Financement d'une formation individuelle par France Travail, en complément ou à la place du CPF.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/N31131",
    relevant: (f) => f.has(FLAGS.DE),
    priorite: () => 2,
    criteres: (f) => [
      critere("Être inscrit·e à France Travail", f.has(FLAGS.DE), true),
      aVerifier("Formation en lien avec un projet validé par le conseiller"),
    ],
  },
  {
    id: "POEC",
    name: "Préparation Opérationnelle à l'Emploi Collective",
    acteur: "France Travail / OPCO",
    description:
      "Formation collective pour acquérir les compétences d'un métier en tension, souvent suivie d'entretiens avec des employeurs.",
    url: "https://travail-emploi.gouv.fr/la-preparation-operationnelle-lemploi-collective-poec",
    relevant: (f) => f.has(FLAGS.DE),
    priorite: () => 2,
    criteres: (f) => [
      critere("Être demandeur·euse d'emploi", f.has(FLAGS.DE), true),
      aVerifier("Formation sur un métier en tension (France Travail / OPCO)"),
    ],
  },
  {
    id: "Contrat Pro",
    name: "Contrat de Professionnalisation",
    acteur: "OPCO / Employeur",
    description:
      "Alternance pour acquérir une qualification tout en travaillant, rémunération garantie. Accessible à tout âge.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F15478",
    relevant: (f) => f.has(FLAGS.DE),
    priorite: () => 3,
    criteres: (f) => [
      critere("Être demandeur·euse d'emploi", f.has(FLAGS.DE), true),
      aVerifier("Accord d'un employeur"),
    ],
  },

  // ── Jeunes ────────────────────────────────────────────────────────────────
  {
    id: "Mission Locale",
    name: "Mission Locale + Contrat d'Engagement Jeune",
    acteur: "Mission Locale",
    description:
      "Accompagnement global (emploi, formation, logement, santé) par un conseiller dédié, avec allocation possible et suivi intensif.",
    url: "https://www.1jeune1solution.gouv.fr/espace-jeune",
    relevant: (f) => f.has(FLAGS.JEUNE) && !f.has(FLAGS.ENTREPRENEUR),
    priorite: () => 1,
    criteres: (f) => [
      critere("Avoir entre 16 et 25 ans révolus", f.has(FLAGS.JEUNE), true),
      aVerifier("Ni en emploi, ni en formation"),
    ],
  },
  {
    id: "EPIDE / E2C",
    name: "EPIDE et École de la 2e Chance",
    acteur: "EPIDE / Réseau E2C France",
    description:
      "Insertion intensive pour jeunes sans qualification : remise à niveau, savoir-être professionnel, projet de vie.",
    url: "https://www.epide.fr/",
    relevant: (f) => f.has(FLAGS.JEUNE) && f.has(FLAGS.SANS_DIPLOME),
    priorite: () => 1,
    criteres: (f) => [
      critere("Jeune de 16 à 30 ans (selon le dispositif)", f.has(FLAGS.JEUNE), true),
      critere("Sans qualification / en décrochage", f.has(FLAGS.SANS_DIPLOME)),
    ],
  },
  {
    id: "Apprentissage",
    name: "Contrat d'apprentissage",
    acteur: "CFA / OPCO",
    description:
      "Alternance en CFA du CAP au Master : salarié·e dès le premier jour, formation prise en charge. Voie directe vers un diplôme.",
    url: "https://www.alternance.emploi.gouv.fr/candidat-le-contrat-dapprentissage",
    relevant: (f) =>
      (f.has(FLAGS.JEUNE) || (f.has(FLAGS.RQTH) && !f.has(FLAGS.SENIOR))) &&
      !f.has(FLAGS.ENTREPRENEUR),
    priorite: (f) => (f.has(FLAGS.JEUNE) ? 2 : 4),
    criteres: (f) => [
      critere(
        "Avoir jusqu'à 29 ans révolus (sans limite d'âge avec une RQTH)",
        f.has(FLAGS.JEUNE) || f.has(FLAGS.RQTH),
        true,
      ),
      aVerifier("Trouver un employeur et un CFA"),
    ],
  },

  // ── Fonctionnaires ──────────────────────────────────────────────────────
  {
    id: "CPF-AP",
    name: "Compte Personnel de Formation — Agents Publics",
    acteur: "Employeur public / Ministère",
    description:
      "Équivalent du CPF pour les agents publics : droits cumulés sur la carrière pour formations certifiantes, bilans ou VAE.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F18090",
    relevant: (f) => f.has(FLAGS.FONCTIONNAIRE),
    priorite: () => 2,
    criteres: (f) => [
      critere("Être agent·e public (titulaire ou contractuel)", f.has(FLAGS.FONCTIONNAIRE), true),
      aVerifier("Droits variables selon la durée de service"),
    ],
  },
  {
    id: "DTP",
    name: "Dispositif de Transition Professionnelle",
    acteur: "Ministère employeur / DGAFP",
    description:
      "Équivalent du PTP pour la fonction publique : congé rémunéré (partiellement) pour se former vers un nouveau métier.",
    url: "https://www.service-public.fr/particuliers/vosdroits/F3026",
    relevant: (f) => f.has(FLAGS.FONCTIONNAIRE),
    priorite: () => 2,
    criteres: (f) => [
      critere("Être agent·e public avec l'ancienneté minimale", f.has(FLAGS.FONCTIONNAIRE), true),
      aVerifier("Conditions selon le versant (FPE, FPT, FPH)"),
    ],
  },
];
