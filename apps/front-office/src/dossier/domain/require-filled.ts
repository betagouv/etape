import { listFilledFields } from "./volet-progress";

/** Ce que le `superRefine` de zod donne pour signaler une erreur ; rien d'autre ne sert ici. */
export interface IssueContext {
  addIssue(issue: { code: "custom"; path: string[]; message: string }): void;
}

/**
 * Signale chaque champ exigé resté vide, avec son message, dans l'ordre donné. « Vide » a le
 * même sens que pour les compteurs du volet : absent, `null` ou texte fait d'espaces.
 */
export function requireFilled<TName extends string>(
  ctx: IssueContext,
  values: Partial<Record<NoInfer<TName>, unknown>>,
  names: readonly TName[],
  messages: Record<NoInfer<TName>, string>,
): void {
  const filledFields = listFilledFields(values, names);
  for (const name of names) {
    if (!filledFields.includes(name))
      ctx.addIssue({ code: "custom", path: [name], message: messages[name] });
  }
}
