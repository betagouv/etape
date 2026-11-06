import { z } from "zod";

/** Sous-classe de la NAF rév. 2 de l'Insee : `code` au format `10.71C`. */
export const SecteurActiviteSchema = z.object({
  code: z.string(),
  libelle: z.string(),
});

export type SecteurActivite = z.infer<typeof SecteurActiviteSchema>;

export const SecteursActiviteResponseSchema = z.array(SecteurActiviteSchema);

export type SecteursActiviteResponse = z.infer<typeof SecteursActiviteResponseSchema>;
