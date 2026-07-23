import type { Outcome, Question } from "./types";

// Champs (réutilisés par le branchement et les étapes suivantes).
export const FIELD_RESIDENCE = "residence";
export const FIELD_VILLE_RESIDENCE = "villeResidence";
export const FIELD_LIEU_TRAVAIL = "lieuTravail";
export const FIELD_VILLE_TRAVAIL = "villeTravail";
export const FIELD_METIER_IDEE = "metierIdee";
export const FIELD_SITUATION = "situation";
export const FIELD_SITUATIONS_PARTICULIERES = "situationsParticulieres";
export const FIELD_DIPLOME = "diplome";
export const FIELD_AGE = "age";
export const FIELD_ANCIENNETE = "anciennete";

// Valeurs de localisation (partagées par résidence et lieu de travail).
export const LOC_FRANCE = "france";
export const LOC_HORS_FRANCE = "hors-france";

// Identifiants d'écrans terminaux (issues du flow).
export const OUTCOME_HORS_FRANCE = "hors-france-erreur";

/** Séquence ordonnée des questions du flow. */
export const questions: Question[] = [
  {
    id: "residence",
    title: "Quel est ton lieu de résidence ?",
    fields: [
      {
        type: "radio",
        name: FIELD_RESIDENCE,
        required: true,
        orientation: "horizontal",
        options: [
          { value: LOC_FRANCE, label: "En France" },
          { value: LOC_HORS_FRANCE, label: "Hors de France" },
        ],
      },
      {
        type: "city",
        name: FIELD_VILLE_RESIDENCE,
        label: "Ville",
        required: true,
        placeholder: "Exemple : Lyon",
        visibleWhen: (answers) => answers[FIELD_RESIDENCE] === LOC_FRANCE,
      },
    ],
  },
  {
    id: "lieu-travail",
    title: "Quel est ton lieu de travail ?",
    // Branchement : un lieu de travail hors de France mène à l'écran terminal.
    next: (answers) =>
      answers[FIELD_LIEU_TRAVAIL] === LOC_HORS_FRANCE ? OUTCOME_HORS_FRANCE : null,
    fields: [
      {
        type: "radio",
        name: FIELD_LIEU_TRAVAIL,
        required: true,
        orientation: "horizontal",
        options: [
          { value: LOC_FRANCE, label: "En France" },
          { value: LOC_HORS_FRANCE, label: "Hors de France" },
        ],
      },
      {
        type: "city",
        name: FIELD_VILLE_TRAVAIL,
        label: "Ville",
        required: true,
        placeholder: "Exemple : Lyon",
        visibleWhen: (answers) => answers[FIELD_LIEU_TRAVAIL] === LOC_FRANCE,
      },
    ],
  },
  {
    id: "metier-idee",
    title: "As-tu déjà une idée du métier que tu souhaites faire ?",
    subtitle: "Choix unique.",
    fields: [
      {
        type: "radio",
        name: FIELD_METIER_IDEE,
        required: true,
        orientation: "vertical",
        options: [
          { value: "oui-precis", label: "Oui, j'ai un métier cible précis" },
          { value: "piste", label: "J'ai une piste mais pas encore de certitude" },
          { value: "non", label: "Non, je ne sais pas encore" },
        ],
      },
    ],
  },
  {
    id: "situation",
    title: "Quelle est ta situation actuelle ?",
    subtitle: "Choix unique.",
    fields: [
      {
        type: "radio",
        name: FIELD_SITUATION,
        required: true,
        orientation: "vertical",
        options: [
          { value: "salarie-cdi", label: "Salarié·e en CDI" },
          { value: "salarie-cdd", label: "Salarié·e en CDD ou intérimaire" },
          {
            value: "demandeur-emploi-are",
            label: "Demandeur·euse d'emploi inscrit·e (avec allocations ARE)",
          },
          {
            value: "demandeur-emploi-sans-allocation",
            label: "Demandeur·euse d'emploi inscrit·e (sans allocations)",
          },
          {
            value: "fonction-publique",
            label: "Agent·e de la fonction publique (État, territorial·e ou hospitalier·ère)",
          },
          {
            value: "independant",
            label: "Travailleur·euse indépendant·e / auto-entrepreneur·euse",
          },
          {
            value: "arret-travail",
            label: "En arrêt de travail (maladie, accident du travail, invalidité)",
          },
          {
            value: "sans-emploi-non-inscrit",
            label: "Sans emploi et non inscrit·e à France Travail",
          },
        ],
      },
    ],
  },
  {
    id: "situations-particulieres",
    title: "Y a-t-il une ou plusieurs situations qui te concernent ?",
    subtitle: "Plusieurs réponses possibles.",
    fields: [
      {
        type: "checkbox",
        name: FIELD_SITUATIONS_PARTICULIERES,
        required: true,
        options: [
          { value: "sante", label: "J'ai un problème de santé / maladie de longue durée" },
          {
            value: "rqth",
            label: "J'ai un handicap reconnu (RQTH) ou je suis en cours de reconnaissance",
          },
          {
            value: "at-mp",
            label: "J'ai eu un accident du travail ou une maladie professionnelle reconnu·e",
          },
          { value: "inapte", label: "Le médecin du travail m'a déclaré·e inapte à mon poste" },
          {
            value: "poste-menace",
            label: "Mon poste est menacé ou mon entreprise est en difficulté / restructuration",
          },
          { value: "licencie", label: "J'ai été licencié·e récemment" },
          { value: "aucune", label: "Aucune de ces situations", exclusive: true },
        ],
      },
    ],
  },
  {
    id: "diplome",
    title: "Quel est ton niveau de diplôme le plus élevé obtenu ?",
    subtitle: "Choix unique.",
    fields: [
      {
        type: "radio",
        name: FIELD_DIPLOME,
        required: true,
        orientation: "vertical",
        options: [
          { value: "sans-diplome", label: "Sans diplôme ou niveau inférieur au CAP" },
          { value: "cap-bep", label: "CAP, BEP, Mention complémentaire" },
          { value: "bac", label: "Bac (général, technologique ou professionnel)" },
          { value: "bac-2", label: "Bac+2 (BTS, DUT, BUT)" },
          {
            value: "bac-3-plus",
            label: "Bac+3 et au-delà (Licence, Master, Doctorat, Grandes écoles)",
          },
        ],
      },
    ],
  },
  {
    id: "age",
    title: "Quel est ton âge ?",
    subtitle: "Choix unique.",
    fields: [
      {
        type: "radio",
        name: FIELD_AGE,
        required: true,
        orientation: "vertical",
        options: [
          { value: "moins-26", label: "Moins de 26 ans" },
          { value: "26-44", label: "De 26 à 44 ans" },
          { value: "45-plus", label: "45 ans et plus" },
        ],
      },
    ],
  },
  {
    id: "anciennete",
    title: "Depuis combien de temps travailles-tu chez ton employeur actuel ?",
    subtitle: "Choix unique.",
    fields: [
      {
        type: "radio",
        name: FIELD_ANCIENNETE,
        required: true,
        orientation: "vertical",
        options: [
          { value: "moins-12-mois", label: "Moins de 12 mois" },
          { value: "12-24-mois", label: "Entre 12 et 24 mois" },
          {
            value: "plus-24-mois",
            label: "Plus de 24 mois (dont au moins 12 mois dans l'entreprise)",
          },
          { value: "plus-5-ans", label: "Plus de 5 ans" },
        ],
      },
    ],
  },
];

/** Écrans terminaux, indexés par id. */
export const outcomes: Record<string, Outcome> = {
  [OUTCOME_HORS_FRANCE]: {
    id: OUTCOME_HORS_FRANCE,
    title: "Nous n'avons pas encore la solution pour toi !",
    text: "Le simulateur ne couvre pas les dispositifs pour les situations 100% hors France. La simulation s'arrête ici.",
    actions: [
      { label: "Retour à l'accueil", href: "/", variant: "primary" },
      // TODO : cible réelle de "Découvrir les dispositifs" à préciser.
      { label: "Découvrir les dispositifs", href: "#", variant: "secondary" },
    ],
  },
};

export function findQuestion(id: string): Question | undefined {
  return questions.find((question) => question.id === id);
}

export function findOutcome(id: string): Outcome | undefined {
  return outcomes[id];
}

/** Id de la question suivante dans l'ordre par défaut, ou null si dernière. */
export function nextQuestionId(currentId: string): string | null {
  const index = questions.findIndex((question) => question.id === currentId);
  if (index < 0 || index + 1 >= questions.length) return null;
  return questions[index + 1].id;
}
