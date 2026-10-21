import { z } from "zod";

/**
 * Quand la session prendra fin. Le temps restant est donné en durées, pas en
 * dates : le front les ajoute à sa propre horloge, qui peut différer de celle
 * du serveur. La règle du front sert aussi aux messages (« après 30 minutes
 * d'inactivité »), qu'aucune app n'écrit donc en dur.
 */
export const SessionExpirySchema = z.object({
  idleTimeoutMs: z.number().int().positive(),
  maxDurationMs: z.number().int().positive(),
  idleRemainingMs: z.number().int(),
  maxRemainingMs: z.number().int(),
});

export type SessionExpiry = z.infer<typeof SessionExpirySchema>;

/** Vue de la session exposée au front. Aucun jeton n'en fait partie. */
export const PublicSessionSchema = z.object({
  sub: z.string(),
  email: z.string().optional(),
  isFranceConnectSession: z.boolean(),
  /** Non typés : les champs varient d'un fournisseur d'identité à l'autre. */
  claims: z.record(z.string(), z.unknown()),
  expiry: SessionExpirySchema,
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

/** La prolongation exige une session : elle n'est jamais nulle ici (401 sinon). */
export const RefreshSessionResponseSchema = z.object({
  session: PublicSessionSchema,
});

export type RefreshSessionResponse = z.infer<typeof RefreshSessionResponseSchema>;
