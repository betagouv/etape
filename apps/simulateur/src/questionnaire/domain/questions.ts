import { FLAGS } from "./flags";
import { oldestSelectableYear } from "./month";
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
const aUnEmployeur = (answers: Answers) =>
  answers[FIELD_SITUATION] === SITUATION_SALARIE || answers[FIELD_SITUATION] === SITUATION_AGENT;

/**
 * En activité : salarié·e, agent·e ou indépendant·e. Ces situations sont les
 * seules à qui l'on demande l'arrêt de travail et le lieu de travail — les
 * autres n'ont pas d'employeur à situer.
 */
const enActivite = (answers: Answers) =>
  aUnEmployeur(answers) || answers[FIELD_SITUATION] === SITUATION_INDEPENDANT;

const estSalarie = (answers: Answers) => answers[FIELD_SITUATION] === SITUATION_SALARIE;

/** Séquence ordonnée des questions du flow. */
export const questions: Question[] = [
  // ─── Q1. Origine de la demande ─────────────────────────────────────────
  {
    id: Q_ORIGINE,
    title: "D'où vient ce besoin d'informations ?",
    subtitle: "Plusieurs réponses possibles. Il n'y a pas de mauvaise réponse.",
    fields: [
      {
        type: "checkbox",
        name: FIELD_ORIGINE,
        required: true,
        options: [
          {
            value: "nouveau-depart",
            label: "J'ai envie d'un nouveau départ",
            flags: [FLAGS.NOUVEAU_DEPART],
          },
          {
            value: "sante",
            label: "Ma santé ne me permet plus de me projeter dans ma situation professionnelle",
            flags: [FLAGS.SANTE],
          },
          {
            value: "poste-menace",
            label: "Mon poste est menacé ou mon entreprise est en difficulté ou en restructuration",
            flags: [FLAGS.MENACE],
          },
          {
            value: "pas-emploi",
            label: "Je ne trouve pas d'emploi",
            flags: [FLAGS.PAS_EMPLOI],
          },
          { value: "autre", label: "Autre", flags: [FLAGS.AUTRE_MOTIF] },
        ],
      },
    ],
  },

  // ─── Q2. Métier souhaité ───────────────────────────────────────────────
  {
    id: Q_METIER,
    title: "Avez-vous une idée du métier que vous souhaitez faire ?",
    subtitle: "Choix unique.",
    fields: [
      {
        type: "radio",
        name: FIELD_METIER,
        required: true,
        options: [
          {
            value: "precis",
            label: "Oui, j'ai un métier cible précis",
            flags: [FLAGS.METIER_PRECIS],
          },
          {
            value: "piste",
            label: "J'ai une piste mais pas encore de certitude",
            flags: [FLAGS.ORIENTATION],
          },
          {
            value: "ailleurs",
            label: "Je veux garder mon métier mais l'exercer ailleurs",
            flags: [FLAGS.GARDER_METIER],
          },
          {
            value: "non",
            label: "Non, je ne sais pas encore",
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
    title: "Quelle est votre situation professionnelle actuelle ?",
    subtitle: "Choix unique. Des précisions s'afficheront sous votre réponse.",
    fields: [
      {
        type: "radio",
        name: FIELD_SITUATION,
        required: true,
        options: [
          {
            value: SITUATION_SALARIE,
            label: "Salarié·e",
            description: "Secteur privé.",
            flags: [FLAGS.SALARIE],
          },
          {
            value: SITUATION_DEMANDEUR,
            label: "Demandeur·euse d'emploi",
            description: "Inscrit·e à France Travail.",
            flags: [FLAGS.DE],
          },
          {
            value: SITUATION_AGENT,
            label: "Agent·e de la fonction publique",
            flags: [FLAGS.FONCTIONNAIRE],
          },
          {
            value: SITUATION_INDEPENDANT,
            label: "Auto-entrepreneur·euse ou chef·fe d'entreprise",
            flags: [FLAGS.INDEPENDANT],
          },
          {
            value: SITUATION_SANS_EMPLOI,
            label: "Sans emploi",
            description: "Non inscrit·e à France Travail.",
            flags: [FLAGS.SANS_EMPLOI],
          },
        ],
      },
      {
        type: "radio",
        name: FIELD_CONTRAT,
        sub: SITUATION_SALARIE,
        label: "Quel est votre type de contrat ?",
        required: true,
        visibleWhen: estSalarie,
        options: [
          { value: "cdi", label: "CDI", flags: [FLAGS.CDI] },
          { value: "cdd", label: "CDD", flags: [FLAGS.CDD] },
          { value: "interim", label: "Intérimaire", flags: [FLAGS.INTERIM] },
          {
            value: "intermittent",
            label: "Intermittent·e du spectacle",
            flags: [FLAGS.INTERMITTENT],
          },
        ],
      },
      {
        // Le statut cadre n'est demandé qu'en CDI et en CDD (règle du ticket) :
        // il ne veut rien dire pour un intérim ou un intermittent du spectacle.
        type: "radio",
        name: FIELD_CADRE,
        sub: SITUATION_SALARIE,
        label: "Quel est votre statut ?",
        required: true,
        orientation: "horizontal",
        visibleWhen: (answers) =>
          estSalarie(answers) &&
          (answers[FIELD_CONTRAT] === "cdi" || answers[FIELD_CONTRAT] === "cdd"),
        options: [
          { value: "cadre", label: "Cadre", flags: [FLAGS.CADRE] },
          { value: "non-cadre", label: "Non-cadre" },
        ],
      },
      {
        type: "radio",
        name: FIELD_VERSANT,
        sub: SITUATION_AGENT,
        label: "Dans quelle fonction publique travaillez-vous ?",
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
        label: "Êtes-vous en arrêt de travail pour maladie, accident du travail ou invalidité ?",
        required: true,
        orientation: "horizontal",
        visibleWhen: enActivite,
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
    title: "Depuis quand travaillez-vous chez votre employeur actuel ?",
    subtitle: "Le mois et l'année suffisent.",
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
        minYear: oldestSelectableYear(),
      },
    ],
  },

  // ─── Q5. Durée totale d'activité professionnelle ───────────────────────
  {
    id: Q_DUREE,
    title: "Depuis combien de temps travaillez-vous au total ?",
    subtitle: "Toutes vos périodes d'activité professionnelle cumulées.",
    fields: [
      {
        type: "number",
        name: FIELD_DUREE_ACTIVITE,
        // Pas de libellé propre : le titre de la question nomme le champ, et
        // « ans » porte l'unité. Un « Nombre d'années » de plus serait redondant.
        hint: "En années, arrondies à l'année la plus proche.",
        required: true,
        min: 0,
        max: 99,
        placeholder: "12",
        suffix: "ans",
      },
    ],
  },

  // ─── Q6. Lieu de résidence et lieu de travail ──────────────────────────
  {
    id: Q_LIEU,
    title: "Où habitez-vous ?",
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
        orientation: "horizontal",
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
        label: "Travaillez-vous en France ?",
        required: true,
        orientation: "horizontal",
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
    title: "Êtes-vous reconnu·e travailleur·euse handicapé·e ?",
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
