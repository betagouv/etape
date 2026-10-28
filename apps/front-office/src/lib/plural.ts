const PLURAL_RULES = new Intl.PluralRules("fr-FR");

/** Formes selon le nombre ; `other` sert aussi pour une catégorie non renseignée (`many`). */
export type PluralForms<TForm> = Partial<Record<Intl.LDMLPluralRule, TForm>> &
  Record<"other", TForm>;

/** Règles du français : 0 et 1 au singulier. */
export function selectPlural<TForm>(count: number, forms: PluralForms<TForm>): TForm {
  return forms[PLURAL_RULES.select(count)] ?? forms.other;
}
