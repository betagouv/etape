import { z } from "zod";

/** Vue de la session exposée au front. Aucun jeton n'en fait partie. */
export const PublicSessionSchema = z.object({
  sub: z.string(),
  email: z.string().optional(),
  isFranceConnectSession: z.boolean(),
  /** Non typés : les champs varient d'un fournisseur d'identité à l'autre. */
  claims: z.record(z.string(), z.unknown()),
});

export type PublicSession = z.infer<typeof PublicSessionSchema>;

/**
 * Toujours un objet, jamais un `null` nu : Nest répond un corps vide à un
 * `null`, qu'axios lit comme une chaîne vide. `session: null` signifie
 * « personne n'est connecté », un état normal et non une erreur — un 401 ne veut
 * donc plus dire, partout dans l'API, que « session expirée ».
 */
export const SessionResponseSchema = z.object({
  session: PublicSessionSchema.nullable(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;
