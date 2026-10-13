import { FLAGS } from "./flags";
import {
  MOIS_PAR_AN,
  monthLabel,
  monthsSince,
  oldestAcceptedYear,
  parseMonth,
  type MonthValue,
} from "./month";
import type { Answers, Outcome, Question } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Questionnaire du simulateur ÉTAPE — règles métier de la PO (ticket #56).
//
// SÉQUENCE de 7 questions, posées dans l'ordre de ce tableau. Une question
// conditionnelle porte un prédicat `when` ; une précision conditionnelle est un
// champ de plus sur le MÊME écran, avec son `visibleWhen` et son `sub`, qui dit
// sous quelle option elle s'ouvre.
//
// Les options ajoutent des flags, lus par la porte de sortie de Q6 et par le
// module `resultats/`.
// ─────────────────────────────────────────────────────────────────────────

/** Sentinelle : fin du questionnaire → écran de résultats (module `resultats/`). */
export const STEP_RESULTS = "resultats";

// Champs — clés dans la map des réponses.
export const FIELD_ORIGINE = "origine";
export const FIELD_METIER = "metier";
export const FIELD_SITUATION = "situation";
export const FIELD_CONTRAT = "contrat";
export const FIELD_CADRE = "cadre";
export const FIELD_VERSANT = "versant";
export const FIELD_ARRET_TRAVAIL = "arretTravail";
export const FIELD_ENTREE_EMPLOYEUR = "entreeEmployeur";
export const FIELD_MOINS_UN_AN = "activiteMoinsUnAn";
export const FIELD_DUREE_ACTIVITE = "dureeActivite";
export const FIELD_RESIDENCE = "residence";
export const FIELD_REGION_RESIDENCE = "regionResidence";
export const FIELD_AUTRE_REGION = "autreRegion";
export const FIELD_TRAVAIL_FRANCE = "travailFrance";
export const FIELD_REGION_TRAVAIL = "regionTravail";
export const FIELD_RQTH = "rqth";

// Identifiants d'étapes (= id de question), repris dans l'URL (`?q=`).
const Q_ORIGINE = "origine";
const Q_METIER = "metier";
const Q_SITUATION = "situation";
const Q_ANCIENNETE = "anciennete";
const Q_DUREE = "duree";
const Q_LIEU = "lieu";
const Q_RQTH = "rqth";

// Valeurs de Q3, référencées par les conditions des précisions.
export const SITUATION_SALARIE = "salarie";
export const SITUATION_DEMANDEUR = "demandeur";
export const SITUATION_AGENT = "agent";
export const SITUATION_INDEPENDANT = "independant";
export const SITUATION_SANS_EMPLOI = "sans-emploi";

// Valeurs de Q6.
export const LOC_FRANCE = "france";
export const LOC_HORS_FRANCE = "hors-france";
const OUI = "oui";
const NON = "non";

/** Écran terminal : ne réside ni ne travaille en France. */
export const OUTCOME_HORS_FRANCE = "hors-france";

/** A un employeur : les seules situations à qui l'ancienneté est demandée. */
const aUnEmployeur = (answers: Answers): boolean =>
  answers[FIELD_SITUATION] === SITUATION_SALARIE || answers[FIELD_SITUATION] === SITUATION_AGENT;

/**
 * En activité : salarié·e, agent·e ou indépendant·e. Ces situations sont les
 * seules à qui l'on demande l'arrêt de travail et le lieu de travail — les
 * autres n'ont pas d'employeur à situer.
 */
const enActivite = (answers: Answers): boolean =>
  aUnEmployeur(answers) || answers[FIELD_SITUATION] === SITUATION_INDEPENDANT;

const estSalarie = (answers: Answers): boolean => answers[FIELD_SITUATION] === SITUATION_SALARIE;

const CONTRATS_CADRE = ["cdi", "cdd"];

/**
 * Le statut cadre n'est demandé qu'en CDI et en CDD (règle du ticket) : il ne
 * veut rien dire pour un intérim ou un intermittent du spectacle.
 */
const isCadreDemande = (answers: Answers): boolean =>
  estSalarie(answers) && CONTRATS_CADRE.includes(String(answers[FIELD_CONTRAT]));

/**
 * Les précisions de Q3 s'ouvrent une à une, chacune une fois la précédente
 * donnée (maquettes « Q3 - Completed ») : l'arrêt de travail, posé en dernier,
 * attend le contrat et le statut cadre du salarié·e, ou le versant de l'agent·e.
 * L'indépendant·e n'a pas d'autre précision : la question lui vient d'emblée.
 */
const isSituationPrecisee = (answers: Answers): boolean => {
  if (estSalarie(answers)) {
    if (answers[FIELD_CONTRAT] === undefined) return false;
    return !isCadreDemande(answers) || answers[FIELD_CADRE] !== undefined;
  }
  if (answers[FIELD_SITUATION] === SITUATION_AGENT) return answers[FIELD_VERSANT] !== undefined;
  return true;
};

/** « 1 an », « 2 ans » : en français, 0 et 1 restent au singulier. */
const enAnnees = (count: number): string => `${count} ${count > 1 ? "ans" : "an"}`;

/**
 * Ancienneté représentée par la date d'entrée de Q4, affichée sous le champ.
 * Les parties nulles sont tues : « Soit 4 ans », « Soit 3 mois ».
 */
const ancienneteTexte = (entree: MonthValue): string => {
  const mois = monthsSince(entree);
  if (mois === 0) return "Soit moins d'un mois d'ancienneté.";
  const annees = Math.floor(mois / MOIS_PAR_AN);
  const reste = mois % MOIS_PAR_AN;
  const parties = [annees > 0 ? enAnnees(annees) : "", reste > 0 ? `${reste} mois` : ""];
  return `Soit ${parties.filter(Boolean).join(" et ")} d'ancienneté.`;
};

/** Ancienneté chez l'employeur actuel, en mois révolus. `null` sans Q4 valide. */
const ancienneteMois = (answers: Answers): number | null => {
  const entree = parseMonth(answers[FIELD_ENTREE_EMPLOYEUR]);
  return entree ? monthsSince(entree) : null;
};

/**
 * La case « moins d'un an » de Q5 n'est proposée qu'à qui peut y répondre oui :
 * ni à la personne sans emploi, qui ne travaille pas ; ni à celle dont Q4 dit
 * déjà au moins un an chez son employeur actuel.
 */
const isMoinsUnAnPropose = (answers: Answers): boolean => {
  if (answers[FIELD_SITUATION] === SITUATION_SANS_EMPLOI) return false;
  if (!aUnEmployeur(answers)) return true;
  const mois = ancienneteMois(answers);
  return mois === null || mois < MOIS_PAR_AN;
};

const isMoinsUnAn = (answers: Answers): boolean =>
  isMoinsUnAnPropose(answers) && answers[FIELD_MOINS_UN_AN] === true;

/**
 * Durée totale d'activité en années (Q5) : 0 quand la case « moins d'un an » est
 * cochée, sinon le nombre saisi. `null` si rien d'exploitable n'a été répondu.
 */
export function readDureeActivite(answers: Answers): number | null {
  if (isMoinsUnAn(answers)) return 0;
  const value = answers[FIELD_DUREE_ACTIVITE];
  return typeof value === "string" && /^\d+$/.test(value) ? Number(value) : null;
}

/**
 * Q5 ne peut pas être inférieure à Q4 : on ne totalise pas 5 ans d'activité en
 * étant chez le même employeur depuis 10 ans.
 *
 * Le seuil est l'ancienneté arrondie à l'année INFÉRIEURE : une ancienneté de
 * 10 ans et 8 mois se déclare légitimement 10 comme 11, et seul 10 fait un seuil
 * qui n'accuse personne à tort.
 *
 * Porté par Q5 seule, jamais par Q4 : voir `Field.coherence`.
 */
const dureeCoherente = (answers: Answers): string | null => {
  const entree = parseMonth(answers[FIELD_ENTREE_EMPLOYEUR]);
  // Ancienneté non demandée (sans employeur) ou pas encore saisie : rien à comparer.
  if (!entree) return null;

  const seuil = Math.floor(monthsSince(entree) / MOIS_PAR_AN);
  const total = Number(answers[FIELD_DUREE_ACTIVITE]);
  if (!Number.isFinite(total) || total >= seuil) return null;

  return `Vous avez indiqué être chez votre employeur actuel depuis ${monthLabel(entree)}, soit ${enAnnees(seuil)} : votre durée totale ne peut pas être inférieure. Corrigez-la, ou revenez à la question précédente.`;
};

/**
 * Séquence ordonnée des questions du flow.
 *
 * Les « ? » sont précédés d'une espace insécable (`\u00a0`) : sans elle, le
 * point d'interrogation peut se retrouver seul en début de ligne.
 */
export const questions: Question[] = [
  // ─── Q1. Origine de la demande ─────────────────────────────────────────
  {
    id: Q_ORIGINE,
    title: "D'où vient ce besoin d'informations\u00a0?",
    subtitle:
      "Votre point de départ nous aide à vous orienter vers les dispositifs les plus adaptés.",
    fields: [
      {
        type: "checkbox",
        name: FIELD_ORIGINE,
        required: true,
        options: [
          {
            value: "nouveau-depart",
            label: "J'ai envie d'un nouveau départ",
            description:
              "Vouloir changer est une raison suffisante. Des dispositifs existent pour construire ce projet.",
            flags: [FLAGS.NOUVEAU_DEPART],
          },
          {
            value: "sante",
            label: "Ma santé ne me permet plus de me projeter dans ma situation professionnelle",
            description:
              "Des dispositifs existent spécifiquement pour ces situations. Des solutions adaptées existent.",
            flags: [FLAGS.SANTE],
          },
          {
            value: "poste-menace",
            label: "Mon poste est menacé ou mon entreprise est en difficulté ou en restructuration",
            description:
              "Anticiper vous ouvre plus de solutions. Des solutions existent avant toute rupture de contrat.",
            flags: [FLAGS.MENACE],
          },
          {
            value: "pas-emploi",
            label: "Je ne trouve pas d'emploi",
            description: "Une reconversion peut aussi ouvrir de nouvelles opportunités.",
            flags: [FLAGS.PAS_EMPLOI],
          },
          {
            value: "autre",
            label: "Autre raison",
            description:
              "Toutes les situations sont prises en compte, même si elles n'entrent pas dans une case.",
            flags: [FLAGS.AUTRE_MOTIF],
          },
        ],
      },
    ],
  },

  // ─── Q2. Métier souhaité ───────────────────────────────────────────────
  {
    id: Q_METIER,
    title: "Avez-vous une idée du métier que vous souhaitez faire\u00a0?",
    subtitle:
      "Certains dispositifs demandent un projet défini, d'autres servent justement à le construire.",
    fields: [
      {
        type: "radio",
        name: FIELD_METIER,
        required: true,
        options: [
          {
            value: "precis",
            label: "Oui, j'ai un métier cible précis",
            description: "Nous allons identifier les dispositifs pour y parvenir.",
            flags: [FLAGS.METIER_PRECIS],
          },
          {
            value: "piste",
            label: "J'ai une piste mais pas encore de certitude",
            description:
              "Une piste est un bon point de départ. Un accompagnement peut vous aider à la confirmer.",
            flags: [FLAGS.ORIENTATION],
          },
          {
            value: "ailleurs",
            label: "Je veux garder mon métier mais l'exercer ailleurs",
            description:
              "Changer de cadre est aussi un projet professionnel. Des dispositifs existent pour évoluer ailleurs.",
            flags: [FLAGS.GARDER_METIER],
          },
          {
            value: "non",
            label: "Non, je ne sais pas encore",
            description:
              "C'est le cas le plus fréquent, et c'est précisément ce qu'un conseiller peut vous aider à clarifier.",
            flags: [FLAGS.ORIENTATION],
          },
        ],
      },
    ],
  },

  // ─── Q3. Situation professionnelle et ses précisions ───────────────────
  // Les précisions vivent sur le même écran, sous l'option qui les déclenche.
  {
    id: Q_SITUATION,
    title: "Quelle est votre situation professionnelle actuelle\u00a0?",
    subtitle: "Les dispositifs accessibles dépendent de votre statut.",
    fields: [
      {
        type: "radio",
        name: FIELD_SITUATION,
        required: true,
        options: [
          {
            value: SITUATION_SALARIE,
            label: "Salarié.e",
            flags: [FLAGS.SALARIE],
          },
          {
            value: SITUATION_DEMANDEUR,
            label: "Demandeur.se d'emploi",
            flags: [FLAGS.DE],
          },
          {
            value: SITUATION_AGENT,
            label: "Agent.e de la fonction publique",
            flags: [FLAGS.FONCTIONNAIRE],
          },
          {
            value: SITUATION_INDEPENDANT,
            label: "Auto-entrepreneur.se ou chef.fe d'entreprise",
            flags: [FLAGS.INDEPENDANT],
          },
          {
            value: SITUATION_SANS_EMPLOI,
            label: "Sans emploi",
            flags: [FLAGS.SANS_EMPLOI],
          },
        ],
      },
      {
        type: "radio",
        name: FIELD_CONTRAT,
        sub: SITUATION_SALARIE,
        label: "Quel est votre type de contrat\u00a0?",
        required: true,
        visibleWhen: estSalarie,
        options: [
          { value: "cdi", label: "CDI", flags: [FLAGS.CDI] },
          { value: "cdd", label: "CDD", flags: [FLAGS.CDD] },
          { value: "interim", label: "Intérimaire", flags: [FLAGS.INTERIM] },
          {
            value: "intermittent",
            label: "Intermittent.e du spectacle",
            flags: [FLAGS.INTERMITTENT],
          },
        ],
      },
      {
        type: "radio",
        name: FIELD_CADRE,
        sub: SITUATION_SALARIE,
        label: "Êtes-vous cadre\u00a0?",
        required: true,
        visibleWhen: isCadreDemande,
        options: [
          { value: "cadre", label: "Oui", flags: [FLAGS.CADRE] },
          { value: "non-cadre", label: "Non" },
        ],
      },
      {
        type: "radio",
        name: FIELD_VERSANT,
        sub: SITUATION_AGENT,
        label: "Dans quelle fonction publique travaillez-vous\u00a0?",
        required: true,
        visibleWhen: (answers) => answers[FIELD_SITUATION] === SITUATION_AGENT,
        options: [
          { value: "etat", label: "Fonction publique d'État", flags: [FLAGS.FP_ETAT] },
          {
            value: "territoriale",
            label: "Fonction publique territoriale",
            flags: [FLAGS.FP_TERRITORIALE],
          },
          {
            value: "hospitaliere",
            label: "Fonction publique hospitalière",
            flags: [FLAGS.FP_HOSPITALIERE],
          },
        ],
      },
      {
        // Même précision sous trois situations : un seul champ, une seule
        // réponse stockée, ancrée sous l'option retenue.
        type: "radio",
        name: FIELD_ARRET_TRAVAIL,
        sub: [SITUATION_SALARIE, SITUATION_AGENT, SITUATION_INDEPENDANT],
        label: "Êtes-vous en arrêt de travail (maladie, accident du travail, invalidité)\u00a0?",
        required: true,
        visibleWhen: (answers) => enActivite(answers) && isSituationPrecisee(answers),
        options: [
          { value: OUI, label: "Oui", flags: [FLAGS.ARRET_TRAVAIL] },
          { value: NON, label: "Non" },
        ],
      },
    ],
  },

  // ─── Q4. Ancienneté chez l'employeur actuel ────────────────────────────
  {
    id: Q_ANCIENNETE,
    title: "Depuis quand travaillez-vous chez votre employeur actuel\u00a0?",
    subtitle: "Votre ancienneté conditionne l'accès à certains dispositifs.",
    when: aUnEmployeur,
    // Tant que la situation est inconnue, la question compte dans le total :
    // celui-ci part du chemin le plus long et ne s'allonge jamais.
    pending: (answers) => answers[FIELD_SITUATION] === undefined,
    branch: "situation",
    fields: [
      {
        type: "month",
        name: FIELD_ENTREE_EMPLOYEUR,
        required: true,
        minYear: oldestAcceptedYear(),
        describeValue: ancienneteTexte,
      },
    ],
  },

  // ─── Q5. Durée totale d'activité professionnelle ───────────────────────
  {
    id: Q_DUREE,
    title: "Depuis combien d'années travaillez-vous au total\u00a0?",
    subtitle: "Comptez toutes vos périodes d'activité, y compris chez d'autres employeurs.",
    fields: [
      {
        // Libellé au passé et au total plutôt que « Je travaille depuis moins
        // d'un an » (maquette) : la case est aussi proposée aux demandeur·ses
        // d'emploi, qui ne travaillent pas en ce moment.
        type: "toggle",
        name: FIELD_MOINS_UN_AN,
        label: "J'ai travaillé moins d'un an au total",
        summary: "Moins d'un an",
        visibleWhen: isMoinsUnAnPropose,
      },
      {
        // Cochée, la case répond à la place du champ, qui disparaît : deux
        // réponses à la même question ne pourraient que se contredire.
        type: "number",
        name: FIELD_DUREE_ACTIVITE,
        label: "Nombre d'années",
        hint: "Exemple\u00a0: 12",
        required: true,
        visibleWhen: (answers) => !isMoinsUnAn(answers),
        coherence: dureeCoherente,
        min: 0,
        max: 50,
        placeholder: "Saisissez le nombre d'années",
        suffix: "ans",
      },
    ],
  },

  // ─── Q6. Lieu de résidence et lieu de travail ──────────────────────────
  {
    id: Q_LIEU,
    title: "Où habitez-vous\u00a0?",
    subtitle: "Les organismes compétents et une partie des aides dépendent de votre région.",
    // Porte d'inéligibilité : ni résidence ni travail en France. Une personne
    // qui n'est pas en activité ne se voit pas poser la question du travail :
    // résider hors de France suffit alors à fermer le parcours.
    outcome: (flags) =>
      flags.has(FLAGS.RESIDENCE_HORS_FRANCE) && !flags.has(FLAGS.TRAVAIL_FRANCE)
        ? OUTCOME_HORS_FRANCE
        : null,
    fields: [
      {
        type: "radio",
        name: FIELD_RESIDENCE,
        required: true,
        options: [
          { value: LOC_FRANCE, label: "En France" },
          {
            value: LOC_HORS_FRANCE,
            label: "Hors de France",
            flags: [FLAGS.RESIDENCE_HORS_FRANCE],
          },
        ],
      },
      {
        type: "region",
        name: FIELD_REGION_RESIDENCE,
        label: "Votre région de résidence",
        required: true,
        visibleWhen: (answers) => answers[FIELD_RESIDENCE] === LOC_FRANCE,
      },
      {
        // Masquée aux personnes sans employeur : leur demander où elles
        // travaillent n'a pas de sens (règle du ticket, étendue au demandeur
        // d'emploi pour la même raison).
        type: "toggle",
        name: FIELD_AUTRE_REGION,
        label: "Je travaille dans une autre région",
        visibleWhen: (answers) => answers[FIELD_RESIDENCE] === LOC_FRANCE && enActivite(answers),
      },
      {
        type: "radio",
        name: FIELD_TRAVAIL_FRANCE,
        label: "Travaillez-vous en France\u00a0?",
        required: true,
        visibleWhen: (answers) =>
          answers[FIELD_RESIDENCE] === LOC_HORS_FRANCE && enActivite(answers),
        options: [
          { value: OUI, label: "Oui", flags: [FLAGS.TRAVAIL_FRANCE] },
          { value: NON, label: "Non" },
        ],
      },
      {
        type: "region",
        name: FIELD_REGION_TRAVAIL,
        label: "Votre région de travail",
        required: true,
        visibleWhen: (answers) =>
          (answers[FIELD_RESIDENCE] === LOC_FRANCE && answers[FIELD_AUTRE_REGION] === true) ||
          (answers[FIELD_RESIDENCE] === LOC_HORS_FRANCE && answers[FIELD_TRAVAIL_FRANCE] === OUI),
      },
    ],
  },

  // ─── Q7. Reconnaissance de travailleur handicapé ───────────────────────
  {
    id: Q_RQTH,
    title: "Êtes-vous reconnu·e travailleur·euse handicapé·e\u00a0?",
    subtitle: "Cette reconnaissance ouvre des droits spécifiques. Choix unique.",
    fields: [
      {
        type: "radio",
        name: FIELD_RQTH,
        required: true,
        options: [
          { value: OUI, label: "Oui", flags: [FLAGS.RQTH] },
          { value: NON, label: "Non" },
          {
            value: "refus",
            label: "Je ne souhaite pas répondre",
            flags: [FLAGS.RQTH_REFUS],
          },
        ],
      },
    ],
  },
];

/** Écrans terminaux du flow (dead-ends), indexés par id. */
export const outcomes: Record<string, Outcome> = {
  [OUTCOME_HORS_FRANCE]: {
    id: OUTCOME_HORS_FRANCE,
    title: "Les dispositifs recensés ne s'appliquent pas hors de France.",
    // La porte se déclenche pour deux profils : celui qui réside ET travaille
    // hors de France, et celui qui réside hors de France sans être en activité.
    // Le texte doit être juste pour les deux.
    text: "Ils s'adressent aux personnes qui résident ou qui travaillent en France. Vous n'avez indiqué ni l'une ni l'autre : la simulation s'arrête ici.",
    actions: [{ label: "Retour à l'accueil", href: "/", variant: "primary" }],
  },
};

export function findQuestion(id: string): Question | undefined {
  return questions.find((question) => question.id === id);
}

export function findOutcome(id: string): Outcome | undefined {
  return outcomes[id];
}
