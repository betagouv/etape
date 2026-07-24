import { FLAGS } from "./flags";
import type { Outcome, Question } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Flow du simulateur ÉTAPE (v2.1) — porté du prototype HTML.
//
// Chaque question porte UN champ (radio ou checkbox) dont les options ajoutent
// des flags. Le branchement (`next`) lit les flags accumulés (option courante
// incluse) et renvoie l'id de l'étape suivante, ou le sentinelle STEP_RESULTS.
// ─────────────────────────────────────────────────────────────────────────

/** Sentinelle : fin du questionnaire → écran de résultats (module `resultats/`). */
export const STEP_RESULTS = "resultats";

// Champs (une entrée par question). Servent de clé dans la map des réponses.
export const FIELD_MOTIVATION = "motivation";
export const FIELD_ENTREPRENEUR_FT = "entrepreneurFranceTravail";
export const FIELD_METIER_IDEE = "metierIdee";
export const FIELD_AGE = "age";
export const FIELD_FRANCE_TRAVAIL = "franceTravail";
export const FIELD_FONCTION_PUBLIQUE = "fonctionPublique";
export const FIELD_STATUT = "statut";
export const FIELD_ANCIENNETE = "anciennete";
export const FIELD_MODE_RECONVERSION = "modeReconversion";
export const FIELD_ANCIENNETE_SALARIALE = "ancienneteSalariale";
export const FIELD_SANTE = "sante";
export const FIELD_DIPLOME = "diplome";

// Identifiants d'étapes (= id de question) référencés par le branchement.
const Q_MOTIVATION = "motivation";
const Q_ENTREPRENEUR_FT = "entrepreneur-france-travail";
const Q_METIER_IDEE = "metier-idee";
const Q_AGE = "age";
const Q_FRANCE_TRAVAIL = "france-travail";
const Q_FONCTION_PUBLIQUE = "fonction-publique";
const Q_STATUT = "statut";
const Q_ANCIENNETE = "anciennete";
const Q_MODE_RECONVERSION = "mode-reconversion";
const Q_ANCIENNETE_SALARIALE = "anciennete-salariale";
const Q_SANTE = "sante-handicap";
const Q_DIPLOME = "diplome";

/** Séquence ordonnée des questions du flow. */
export const questions: Question[] = [
  {
    id: Q_MOTIVATION,
    title: "Quelle est ta situation actuelle ?",
    subtitle: "Choisis ce qui te correspond le mieux.",
    next: (flags) => (flags.has(FLAGS.ENTREPRENEUR) ? Q_ENTREPRENEUR_FT : Q_METIER_IDEE),
    fields: [
      {
        type: "radio",
        name: FIELD_MOTIVATION,
        required: true,
        orientation: "vertical",
        options: [
          {
            value: "envie",
            label: "Je veux changer de métier — c'est une envie personnelle",
          },
          {
            value: "contraint",
            label: "Je dois changer de métier",
            description: "Pour des raisons de santé, économiques ou autres",
            flags: [FLAGS.CONTRAINT],
          },
          {
            value: "entreprendre",
            label: "Je rêve d'entreprendre et de voler de mes propres ailes",
            flags: [FLAGS.ENTREPRENEUR],
          },
          {
            value: "vae",
            label: "Je sais travailler mais je n'ai pas de diplôme qui le prouve",
            flags: [FLAGS.VAE],
          },
          {
            value: "orientation",
            label: "J'ai besoin de faire le point sur mon parcours professionnel",
            flags: [FLAGS.ORIENTATION],
          },
        ],
      },
    ],
  },
  {
    id: Q_ENTREPRENEUR_FT,
    title: "Es-tu actuellement inscrit·e à France Travail ?",
    subtitle: "Cela détermine certaines aides à la création d'entreprise.",
    next: () => Q_AGE,
    fields: [
      {
        type: "radio",
        name: FIELD_ENTREPRENEUR_FT,
        required: true,
        orientation: "vertical",
        options: [
          {
            value: "oui",
            label: "Oui, je suis demandeur·euse d'emploi",
            flags: [FLAGS.DE_ENTREPRENEUR],
          },
          { value: "non", label: "Non" },
        ],
      },
    ],
  },
  {
    id: Q_METIER_IDEE,
    title: "As-tu déjà une idée du métier vers lequel tu veux aller ?",
    subtitle: "Choix unique.",
    next: () => Q_AGE,
    fields: [
      {
        type: "radio",
        name: FIELD_METIER_IDEE,
        required: true,
        orientation: "vertical",
        options: [
          { value: "oui-precis", label: "Oui, j'ai une idée assez précise" },
          {
            value: "pistes",
            label: "Pas vraiment, j'ai quelques pistes",
            flags: [FLAGS.ORIENTATION],
          },
          { value: "non", label: "Non, pas encore du tout", flags: [FLAGS.ORIENTATION] },
        ],
      },
    ],
  },
  {
    id: Q_AGE,
    title: "Quel est ton âge ?",
    subtitle: "Choix unique.",
    next: (flags) => (flags.has(FLAGS.ENTREPRENEUR) ? Q_SANTE : Q_FRANCE_TRAVAIL),
    fields: [
      {
        type: "radio",
        name: FIELD_AGE,
        required: true,
        orientation: "vertical",
        options: [
          { value: "moins-26", label: "Moins de 26 ans", flags: [FLAGS.JEUNE] },
          { value: "26-44", label: "De 26 à 44 ans" },
          { value: "45-plus", label: "45 ans et plus", flags: [FLAGS.SENIOR] },
        ],
      },
    ],
  },
  {
    id: Q_FRANCE_TRAVAIL,
    title: "Es-tu inscrit·e à France Travail comme demandeur·euse d'emploi ?",
    subtitle: "Choix unique.",
    next: (flags) => (flags.has(FLAGS.DE) ? Q_SANTE : Q_FONCTION_PUBLIQUE),
    fields: [
      {
        type: "radio",
        name: FIELD_FRANCE_TRAVAIL,
        required: true,
        orientation: "horizontal",
        options: [
          { value: "oui", label: "Oui", flags: [FLAGS.DE] },
          { value: "non", label: "Non" },
        ],
      },
    ],
  },
  {
    id: Q_FONCTION_PUBLIQUE,
    title: "Es-tu fonctionnaire ou agent·e de la fonction publique ?",
    subtitle: "Choix unique.",
    next: (flags) => (flags.has(FLAGS.FONCTIONNAIRE) ? Q_SANTE : Q_STATUT),
    fields: [
      {
        type: "radio",
        name: FIELD_FONCTION_PUBLIQUE,
        required: true,
        orientation: "vertical",
        options: [
          {
            value: "oui",
            label: "Oui — État, territorial ou hospitalier",
            flags: [FLAGS.FONCTIONNAIRE],
          },
          { value: "non", label: "Non" },
        ],
      },
    ],
  },
  {
    id: Q_STATUT,
    title: "Quel est ton statut actuel ?",
    subtitle: "Le type de contrat conditionne plusieurs dispositifs.",
    next: (flags) => (flags.has(FLAGS.SALARIE) ? Q_ANCIENNETE : Q_SANTE),
    fields: [
      {
        type: "radio",
        name: FIELD_STATUT,
        required: true,
        orientation: "vertical",
        options: [
          {
            value: "cdi",
            label: "Salarié·e en CDI — secteur privé",
            flags: [FLAGS.SALARIE, FLAGS.CDI],
          },
          {
            value: "cdd",
            label: "Salarié·e en CDD ou intérim — secteur privé",
            flags: [FLAGS.SALARIE, FLAGS.CDD],
          },
          {
            value: "independant",
            label: "Indépendant·e ou auto-entrepreneur·e",
            flags: [FLAGS.INDEPENDANT],
          },
          {
            value: "autre",
            label: "Autre (congé parental, sans emploi non inscrit…)",
          },
        ],
      },
    ],
  },
  {
    id: Q_ANCIENNETE,
    title: "Depuis combien de temps travailles-tu dans ton entreprise actuelle ?",
    subtitle: "Certains dispositifs exigent une ancienneté minimale.",
    next: (flags) => (flags.has(FLAGS.CDI) ? Q_MODE_RECONVERSION : Q_SANTE),
    fields: [
      {
        type: "radio",
        name: FIELD_ANCIENNETE,
        required: true,
        orientation: "vertical",
        options: [
          { value: "moins-1-an", label: "Moins d'1 an" },
          { value: "1-2-ans", label: "Entre 1 et 2 ans", flags: [FLAGS.PTP_PARTIEL] },
          { value: "plus-2-ans", label: "Plus de 2 ans", flags: [FLAGS.PTP] },
        ],
      },
    ],
  },
  {
    id: Q_MODE_RECONVERSION,
    title: "Comment envisages-tu cette reconversion ?",
    subtitle: "Il existe des dispositifs pour rester… et pour partir en sécurité.",
    next: (flags) => (flags.has(FLAGS.DEMISSION) ? Q_ANCIENNETE_SALARIALE : Q_SANTE),
    fields: [
      {
        type: "radio",
        name: FIELD_MODE_RECONVERSION,
        required: true,
        orientation: "vertical",
        options: [
          {
            value: "rester",
            label: "En gardant mon emploi actuel",
            description: "Formation pendant ou en parallèle du travail",
          },
          {
            value: "demission",
            label: "En quittant mon entreprise — j'envisage de démissionner",
            flags: [FLAGS.DEMISSION],
          },
          {
            value: "menace",
            label: "Mon poste est menacé — licenciement économique possible ou annoncé",
            flags: [FLAGS.MENACE],
          },
        ],
      },
    ],
  },
  {
    id: Q_ANCIENNETE_SALARIALE,
    title: "Totalises-tu au moins 5 ans d'activité salariée en continu ?",
    subtitle:
      "Sans interruption, chez un ou plusieurs employeurs (≈ 1 300 jours travaillés sur les 60 derniers mois). C'est la condition clé du dispositif démissionnaire.",
    next: () => Q_SANTE,
    fields: [
      {
        type: "radio",
        name: FIELD_ANCIENNETE_SALARIALE,
        required: true,
        orientation: "vertical",
        options: [
          {
            value: "oui",
            label: "Oui, 5 ans ou plus sans interruption",
            flags: [FLAGS.DEM_5ANS],
          },
          { value: "non", label: "Non, moins de 5 ans (ou avec des interruptions)" },
          { value: "nsp", label: "Je ne sais pas" },
        ],
      },
    ],
  },
  {
    id: Q_SANTE,
    title: "As-tu une ou plusieurs situations de santé ou de handicap reconnues ?",
    subtitle:
      "Plusieurs réponses possibles — ces situations ouvrent des droits spécifiques cumulables.",
    next: (flags) => (flags.has(FLAGS.ENTREPRENEUR) ? STEP_RESULTS : Q_DIPLOME),
    fields: [
      {
        type: "checkbox",
        name: FIELD_SANTE,
        required: true,
        options: [
          {
            value: "rqth",
            label: "RQTH — Reconnaissance Qualité Travailleur Handicapé (ou démarche en cours)",
            flags: [FLAGS.RQTH],
          },
          {
            value: "atmp",
            label: "Accident du travail ou maladie professionnelle reconnu·e",
            flags: [FLAGS.ATMP],
          },
          {
            value: "invalidite",
            label: "Pension d'invalidité (catégorie 1, 2 ou 3)",
            flags: [FLAGS.INVALIDITE],
          },
          { value: "aucune", label: "Aucune / Je ne sais pas", exclusive: true },
        ],
      },
    ],
  },
  {
    id: Q_DIPLOME,
    title: "Quel est ton niveau de formation le plus élevé ?",
    subtitle: "Choix unique.",
    next: () => STEP_RESULTS,
    fields: [
      {
        type: "radio",
        name: FIELD_DIPLOME,
        required: true,
        orientation: "vertical",
        options: [
          {
            value: "sans-diplome",
            label: "Sans diplôme ou Brevet des collèges",
            flags: [FLAGS.SANS_DIPLOME],
          },
          { value: "cap-bep", label: "CAP ou BEP", flags: [FLAGS.SANS_DIPLOME] },
          { value: "bac", label: "Bac ou Bac Pro" },
          { value: "bac-2", label: "Bac+2 — BTS, BUT, DUT…" },
          { value: "bac-3-plus", label: "Bac+3 et plus — Licence, Master…", flags: [FLAGS.BAC3] },
        ],
      },
    ],
  },
];

/** Écrans terminaux du flow (dead-ends), indexés par id. Aucun pour l'instant. */
export const outcomes: Record<string, Outcome> = {};

export function findQuestion(id: string): Question | undefined {
  return questions.find((question) => question.id === id);
}

export function findOutcome(id: string): Outcome | undefined {
  return outcomes[id];
}

/** Id de la question suivante dans l'ordre du tableau, ou null si dernière. */
export function nextQuestionId(currentId: string): string | null {
  const index = questions.findIndex((question) => question.id === currentId);
  if (index < 0 || index + 1 >= questions.length) return null;
  return questions[index + 1].id;
}
