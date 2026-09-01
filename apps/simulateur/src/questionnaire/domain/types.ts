// Modèle de données du flow de questions.
// Une question est une DONNÉE typée : le moteur lit ces définitions et un
// renderer choisit le composant de champ. Ajouter une question = ajouter une
// entrée ici, pas du JSX.

import type { FlagSet } from "./flags";

/** Types de champs supportés. À étendre au fil des questions. */
export type FieldType = "radio" | "checkbox" | "month" | "number" | "region" | "toggle";

/** Option d'un champ à choix (radio, checkbox, select…). */
export interface Option {
  value: string;
  label: string;
  /** Texte secondaire optionnel affiché sous le libellé. */
  description?: string;
  /**
   * Drapeaux ajoutés à l'ensemble du parcours quand cette option est retenue.
   * Ils pilotent l'applicabilité des questions (`Question.when`), les portes de
   * sortie (`Question.outcome`) et l'éligibilité (module `resultats/`).
   * Voir `domain/flags.ts`.
   */
  flags?: string[];
  /**
   * (Checkbox) Option exclusive (type "Aucune de ces situations") : la cocher
   * décoche les autres, et cocher une autre la décoche.
   */
  exclusive?: boolean;
}

/**
 * Valeur stockée pour un champ donné dans la map des réponses.
 * `string` couvre les choix uniques, la région (code INSEE) et le mois
 * (`YYYY-MM-01`) ; `string[]` les choix multiples ; `boolean` les cases.
 */
export type AnswerValue = string | string[] | boolean | null;

/** Toutes les réponses du flow, indexées par `name` de champ. */
export type Answers = Record<string, AnswerValue>;

interface BaseField {
  /** Clé dans la map des réponses. */
  name: string;
  label?: string;
  /** Précision affichée sous le libellé (unité, exemple de saisie…). */
  hint?: string;
  /** Requis par défaut (`true`). Passer `false` pour rendre optionnel. */
  required?: boolean;
  /**
   * Branchement : le champ n'est affiché (et validé) que si ce prédicat
   * renvoie `true`. Absent = toujours visible.
   */
  visibleWhen?: (answers: Answers) => boolean;
  /**
   * Sous-question : valeur(s) d'option du champ principal sous laquelle ce
   * champ s'ouvre, dans le MÊME écran. Absent = champ de premier niveau.
   * Une liste quand la même précision se pose sous plusieurs options (l'arrêt
   * de travail, demandé aux salarié·es, aux agents et aux indépendant·es).
   * Le rendu correspondant arrive à l'étape 5 ; le moteur, lui, traite un
   * champ `sub` comme n'importe quel autre champ conditionnel.
   */
  sub?: string | string[];
}

export interface RadioField extends BaseField {
  type: "radio";
  options: Option[];
  /** Disposition des options. Défaut : "vertical". */
  orientation?: "horizontal" | "vertical";
}

export interface CheckboxField extends BaseField {
  type: "checkbox";
  options: Option[];
}

/**
 * Mois et année (ex. l'entrée chez l'employeur actuel). La valeur est stockée
 * normalisée en `YYYY-MM-01` — voir `domain/month.ts`. Le futur est refusé par
 * la validation, pas par convention d'appel.
 */
export interface MonthField extends BaseField {
  type: "month";
  /** Année la plus ancienne proposée à la saisie. */
  minYear?: number;
}

/** Entier positif saisi au clavier (ex. un nombre d'années). */
export interface NumberField extends BaseField {
  type: "number";
  /** Bornes incluses. Défauts : 0 et 99 (le ticket limite Q5 à 2 caractères). */
  min?: number;
  max?: number;
  placeholder?: string;
  /** Unité affichée après le champ (« ans »). Décorative : `aria-hidden`. */
  suffix?: string;
}

/** Région administrative, choisie dans la liste fermée de `domain/regions.ts`. */
export interface RegionField extends BaseField {
  type: "region";
  placeholder?: string;
}

/**
 * Case à cocher unique (booléen), sans liste d'options — pour une précision du
 * type « Je travaille dans une autre région », qui ouvre un champ à son tour.
 */
export interface ToggleField extends BaseField {
  type: "toggle";
  /** Libellé de la case elle-même : obligatoire, c'est le seul texte du champ. */
  label: string;
}

export type Field =
  RadioField | CheckboxField | MonthField | NumberField | RegionField | ToggleField;

/** Champs porteurs d'options — les seuls dont une réponse se lit dans `options`. */
export type OptionField = RadioField | CheckboxField;

export function hasOptions(field: Field): field is OptionField {
  return field.type === "radio" || field.type === "checkbox";
}

export interface Question {
  /** Identifiant stable (sert aussi de clé d'étape dans l'URL). */
  id: string;
  /** Titre affiché (heading). */
  title: string;
  /** Sous-titre / consigne optionnel (ex. "Choix unique."). */
  subtitle?: string;
  fields: Field[];
  /**
   * Applicabilité : la question n'est posée que si ce prédicat passe. Absente,
   * elle est toujours posée. Le parcours suit l'ordre du tableau — c'est le
   * modèle décrit par le ticket : une séquence fixe, des questions
   * conditionnelles, pas un graphe.
   */
  when?: (answers: Answers) => boolean;
  /**
   * Compte-t-elle dans le total affiché alors qu'elle ne s'applique pas encore ?
   * Vrai tant que la réponse dont dépend `when` est inconnue : le compteur part
   * ainsi du chemin le plus long et ne s'allonge jamais en cours de route.
   */
  pending?: (answers: Answers) => boolean;
  /**
   * Questions mutuellement exclusives d'une même bifurcation : une seule est
   * comptée par le total tant que la bifurcation n'est pas tranchée.
   */
  branch?: string;
  /**
   * Porte de sortie évaluée une fois la question répondue : renvoie l'id d'un
   * écran terminal (`outcomes`) pour interrompre le parcours, ou `null` pour
   * continuer.
   */
  outcome?: (flags: FlagSet) => string | null;
}

/** Action (bouton) d'un écran terminal. */
export interface OutcomeAction {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

/**
 * Écran terminal du flow (issue / dead-end) : titre + texte + actions.
 * Ce n'est PAS une question — pas de navbar/progression, la simulation s'arrête.
 */
export interface Outcome {
  id: string;
  title: string;
  text?: string;
  actions: OutcomeAction[];
}
