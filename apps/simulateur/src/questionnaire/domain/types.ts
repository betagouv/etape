// Modèle de données du flow de questions.
// Une question est une DONNÉE typée : le moteur lit ces définitions et un
// renderer choisit le composant de champ. Ajouter une question = ajouter une
// entrée ici, pas du JSX.

import type { FlagSet } from "./flags";

/** Types de champs supportés. À étendre au fil des questions. */
export type FieldType = "radio" | "city" | "checkbox";

/** Option d'un champ à choix (radio, checkbox, select…). */
export interface Option {
  value: string;
  label: string;
  /** Texte secondaire optionnel affiché sous le libellé. */
  description?: string;
  /**
   * Drapeaux ajoutés à l'ensemble du parcours quand cette option est retenue.
   * Ils pilotent le branchement (`Question.next`) et l'éligibilité (module
   * `resultats/`). Voir `domain/flags.ts`.
   */
  flags?: string[];
  /**
   * (Checkbox) Option exclusive (type "Aucune de ces situations") : la cocher
   * décoche les autres, et cocher une autre la décoche.
   */
  exclusive?: boolean;
}

/**
 * Commune renvoyée par l'API Adresse de l'État (geo.api.gouv.fr).
 * On conserve l'objet complet dans l'état pour les étapes suivantes.
 */
export interface Commune {
  code: string; // code INSEE
  nom: string;
  codesPostaux?: string[];
  departement?: { code: string; nom: string };
}

/** Valeur stockée pour un champ donné dans la map des réponses. */
export type AnswerValue = string | string[] | Commune | null;

/** Toutes les réponses du flow, indexées par `name` de champ. */
export type Answers = Record<string, AnswerValue>;

interface BaseField {
  /** Clé dans la map des réponses. */
  name: string;
  label?: string;
  /** Requis par défaut (`true`). Passer `false` pour rendre optionnel. */
  required?: boolean;
  /**
   * Branchement : le champ n'est affiché (et validé) que si ce prédicat
   * renvoie `true`. Absent = toujours visible.
   */
  visibleWhen?: (answers: Answers) => boolean;
}

export interface RadioField extends BaseField {
  type: "radio";
  options: Option[];
  /** Disposition des options. Défaut : "vertical". */
  orientation?: "horizontal" | "vertical";
}

export interface CityField extends BaseField {
  type: "city";
  placeholder?: string;
}

export interface CheckboxField extends BaseField {
  type: "checkbox";
  options: Option[];
}

export type Field = RadioField | CityField | CheckboxField;

export interface Question {
  /** Identifiant stable (sert aussi de clé d'étape pour le branchement). */
  id: string;
  /** Titre affiché (heading). */
  title: string;
  /** Sous-titre / consigne optionnel (ex. "Choix unique."). */
  subtitle?: string;
  fields: Field[];
  /**
   * Branchement basé sur les flags accumulés (option courante incluse) :
   * renvoie l'id de l'étape suivante — une autre question ou le sentinelle
   * `STEP_RESULTS` (écran de résultats). `null` = suivre l'ordre du tableau.
   */
  next?: (flags: FlagSet) => string | null;
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
