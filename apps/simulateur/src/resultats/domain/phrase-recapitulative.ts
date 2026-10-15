// Réponses reprises telles que libellées, en minuscule en milieu de phrase. Les
// réponses hors parcours étant effacées (`pruneAnswers`), seuls les compléments
// conditionnels sont testés.

import { isFieldVisible } from "@/questionnaire/domain/conditions";
import { MONTH_NAMES, parseMonth } from "@/questionnaire/domain/month";
import {
  CADRE_NON,
  CADRE_OUI,
  FIELD_ARRET_TRAVAIL,
  FIELD_AUTRE_REGION,
  FIELD_CADRE,
  FIELD_CONTRAT,
  FIELD_DUREE_ACTIVITE,
  FIELD_ENTREE_EMPLOYEUR,
  FIELD_METIER,
  FIELD_ACTIVITE_MOINS_UN_AN,
  FIELD_ORIGINE,
  FIELD_REGION_RESIDENCE,
  FIELD_REGION_TRAVAIL,
  FIELD_RESIDENCE,
  FIELD_RQTH,
  FIELD_SITUATION,
  FIELD_VERSANT,
  LOC_FRANCE,
  SITUATION_AGENT,
  SITUATION_SALARIE,
  questions,
} from "@/questionnaire/domain/questions";
import type { Answers, Field, TextPart } from "@/questionnaire/domain/types";

import { answerText } from "./recap";

const FIELDS = new Map<string, Field>(
  questions.flatMap((question) => question.fields).map((field) => [field.name, field]),
);

// « Êtes-vous cadre ? Oui » donnerait « un statut oui ».
const CADRE_LABELS: Partial<Record<string, string>> = {
  [CADRE_OUI]: "cadre",
  [CADRE_NON]: "non cadre",
};

function readAnswer(name: string, answers: Answers): string {
  const field = FIELDS.get(name);
  return field && isFieldVisible(field, answers) ? answerText(field, answers[name]) : "";
}

function findOrigineLabels(answers: Answers): string[] {
  const field = FIELDS.get(FIELD_ORIGINE);
  const value = answers[FIELD_ORIGINE];
  if (field?.type !== "checkbox" || !Array.isArray(value)) return [];
  return field.options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);
}

/** « En France » → « en France », mais « CDI » reste « CDI ». */
function lowercaseFirst(text: string): string {
  const isAcronym = /^\p{Lu}\p{Lu}/u.test(text);
  return isAcronym ? text : text.charAt(0).toLowerCase() + text.slice(1);
}

const emphasize = (text: string): TextPart => ({ emphasis: text });
const emphasizeLowercase = (text: string): TextPart => emphasize(lowercaseFirst(text));

/** Mois précédés de « d' » : « au mois d'avril », pas « au mois de avril ». */
const MOIS_AVEC_APOSTROPHE: ReadonlySet<string> = new Set(["avril", "août", "octobre"]);

/** « a », « a et b », « a, b et c ». */
function joinList(items: TextPart[][]): TextPart[] {
  return items.flatMap((item, index) => {
    if (index === 0) return item;
    return [index === items.length - 1 ? " et " : ", ", ...item];
  });
}

function describeSituation(answers: Answers): TextPart[] {
  if (answers[FIELD_SITUATION] === SITUATION_AGENT) {
    return [" avec le versant ", emphasizeLowercase(readAnswer(FIELD_VERSANT, answers))];
  }
  if (answers[FIELD_SITUATION] !== SITUATION_SALARIE) return [];

  const statut = CADRE_LABELS[String(answers[FIELD_CADRE])];
  return [
    " avec ",
    ...joinList([
      ["un contrat ", emphasizeLowercase(readAnswer(FIELD_CONTRAT, answers))],
      ...(statut ? [["un statut ", emphasize(statut)]] : []),
      [
        "la réponse ",
        emphasizeLowercase(readAnswer(FIELD_ARRET_TRAVAIL, answers)),
        " à la question de l'arrêt de travail",
      ],
    ]),
  ];
}

function describeDureeActivite(answers: Answers): TextPart[] {
  const duree =
    readAnswer(FIELD_DUREE_ACTIVITE, answers) || readAnswer(FIELD_ACTIVITE_MOINS_UN_AN, answers);
  const cumul = [emphasizeLowercase(duree), " d'expérience professionnelle."];
  const entree = parseMonth(answers[FIELD_ENTREE_EMPLOYEUR]);
  if (!entree) return ["Vous cumulez ", ...cumul];

  const mois = MONTH_NAMES[entree.month - 1];
  return [
    "Vous travaillez chez votre employeur actuel depuis ",
    emphasize(String(entree.year)),
    MOIS_AVEC_APOSTROPHE.has(mois) ? ", au mois d'" : ", au mois de ",
    emphasize(mois),
    ", et vous cumulez ",
    ...cumul,
  ];
}

function describeLieu(answers: Answers): TextPart[] {
  const residence = emphasizeLowercase(readAnswer(FIELD_RESIDENCE, answers));
  const regionTravail = readAnswer(FIELD_REGION_TRAVAIL, answers);

  // Seul cas hors de France qui atteint les résultats : la personne travaille en France.
  if (answers[FIELD_RESIDENCE] !== LOC_FRANCE) {
    return [
      "Vous habitez ",
      residence,
      " et vous travaillez en France, dans la région ",
      emphasize(regionTravail),
      ".",
    ];
  }

  return [
    "Vous habitez ",
    residence,
    " dans la région ",
    emphasize(readAnswer(FIELD_REGION_RESIDENCE, answers)),
    ...(regionTravail
      ? [
          " et vous avez indiqué ",
          emphasize(FIELDS.get(FIELD_AUTRE_REGION)?.label ?? ""),
          ", dans la région ",
          emphasize(regionTravail),
        ]
      : []),
    ".",
  ];
}

export function buildPhraseRecapitulative(answers: Answers): TextPart[] {
  const [origine, ...autresOrigines] = findOrigineLabels(answers);

  return [
    "Votre point de départ : ",
    ...joinList([
      [emphasize(origine)],
      ...autresOrigines.map((autre) => [emphasizeLowercase(autre)]),
    ]),
    ". Côté projet professionnel, vous avez répondu : ",
    emphasize(readAnswer(FIELD_METIER, answers)),
    ". Aujourd'hui, vous êtes ",
    emphasizeLowercase(readAnswer(FIELD_SITUATION, answers)),
    ...describeSituation(answers),
    ". ",
    ...describeDureeActivite(answers),
    " Concernant la reconnaissance de travailleur·euse handicapé·e, vous avez répondu : ",
    emphasize(readAnswer(FIELD_RQTH, answers)),
    ". ",
    ...describeLieu(answers),
  ];
}
