// Phrase récapitulative des réponses (ticket « phrase récapitulative »). Les
// réponses sont reprises telles que libellées, première lettre en minuscule en
// milieu de phrase. Sur la page de résultats, toutes les réponses du parcours
// sont présentes et celles hors parcours effacées (`pruneAnswers`) : seuls les
// compléments conditionnels sont testés.

import { isFieldVisible } from "@/questionnaire/domain/conditions";
import { MONTH_NAMES, parseMonth } from "@/questionnaire/domain/month";
import {
  FIELD_ARRET_TRAVAIL,
  FIELD_AUTRE_REGION,
  FIELD_CADRE,
  FIELD_CONTRAT,
  FIELD_DUREE_ACTIVITE,
  FIELD_ENTREE_EMPLOYEUR,
  FIELD_METIER,
  FIELD_MOINS_UN_AN,
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
const STATUTS: Partial<Record<string, string>> = { cadre: "cadre", "non-cadre": "non cadre" };

function texte(name: string, answers: Answers): string {
  const field = FIELDS.get(name);
  return field && isFieldVisible(field, answers) ? answerText(field, answers[name]) : "";
}

function origines(answers: Answers): string[] {
  const field = FIELDS.get(FIELD_ORIGINE);
  const value = answers[FIELD_ORIGINE];
  if (field?.type !== "checkbox" || !Array.isArray(value)) return [];
  return field.options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);
}

/** « En France » → « en France », mais « CDI » reste « CDI ». */
function minuscule(text: string): string {
  const isSigle = /^\p{Lu}\p{Lu}/u.test(text);
  return isSigle ? text : text.charAt(0).toLowerCase() + text.slice(1);
}

const em = (text: string): TextPart => ({ emphasis: text });
const emMinuscule = (text: string): TextPart => em(minuscule(text));

/** « a », « a et b », « a, b et c ». */
function liste(items: TextPart[][]): TextPart[] {
  return items.flatMap((item, index) => {
    if (index === 0) return item;
    return [index === items.length - 1 ? " et " : ", ", ...item];
  });
}

function situation(answers: Answers): TextPart[] {
  if (answers[FIELD_SITUATION] === SITUATION_AGENT) {
    return [" avec le versant ", emMinuscule(texte(FIELD_VERSANT, answers))];
  }
  if (answers[FIELD_SITUATION] !== SITUATION_SALARIE) return [];

  const statut = STATUTS[String(answers[FIELD_CADRE])];
  return [
    " avec ",
    ...liste([
      ["un contrat ", emMinuscule(texte(FIELD_CONTRAT, answers))],
      ...(statut ? [["un statut ", em(statut)]] : []),
      [
        "la réponse ",
        emMinuscule(texte(FIELD_ARRET_TRAVAIL, answers)),
        " à la question de l'arrêt de travail",
      ],
    ]),
  ];
}

function experience(answers: Answers): TextPart[] {
  const duree = texte(FIELD_DUREE_ACTIVITE, answers) || texte(FIELD_MOINS_UN_AN, answers);
  const cumul = [emMinuscule(duree), " d'expérience professionnelle."];
  const entree = parseMonth(answers[FIELD_ENTREE_EMPLOYEUR]);
  if (!entree) return ["Vous cumulez ", ...cumul];

  return [
    "Vous travaillez chez votre employeur actuel depuis ",
    em(String(entree.year)),
    ", au mois de ",
    em(MONTH_NAMES[entree.month - 1]),
    ", et vous cumulez ",
    ...cumul,
  ];
}

function lieu(answers: Answers): TextPart[] {
  const residence = emMinuscule(texte(FIELD_RESIDENCE, answers));
  const regionTravail = texte(FIELD_REGION_TRAVAIL, answers);

  // Seul cas hors de France qui atteint les résultats : la personne travaille en France.
  if (answers[FIELD_RESIDENCE] !== LOC_FRANCE) {
    return [
      "Vous habitez ",
      residence,
      " et vous travaillez en France, dans la région ",
      em(regionTravail),
      ".",
    ];
  }

  return [
    "Vous habitez ",
    residence,
    " dans la région ",
    em(texte(FIELD_REGION_RESIDENCE, answers)),
    ...(regionTravail
      ? [
          " et vous avez indiqué ",
          em(FIELDS.get(FIELD_AUTRE_REGION)?.label ?? ""),
          ", dans la région ",
          em(regionTravail),
        ]
      : []),
    ".",
  ];
}

export function buildPhraseRecapitulative(answers: Answers): TextPart[] {
  const [origine, ...autresOrigines] = origines(answers);

  return [
    "Votre point de départ : ",
    ...liste([[em(origine)], ...autresOrigines.map((autre) => [emMinuscule(autre)])]),
    ". Côté projet professionnel, vous avez répondu : ",
    em(texte(FIELD_METIER, answers)),
    ". Aujourd'hui, vous êtes ",
    emMinuscule(texte(FIELD_SITUATION, answers)),
    ...situation(answers),
    ". ",
    ...experience(answers),
    " Concernant la reconnaissance de travailleur·euse handicapé·e, vous avez répondu : ",
    em(texte(FIELD_RQTH, answers)),
    ". ",
    ...lieu(answers),
  ];
}
