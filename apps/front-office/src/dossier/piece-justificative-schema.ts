import { z } from "zod";

/** Une pièce justificative déposée, telle que le formulaire la porte : dans une démarche ou un document. */
export const pieceJustificativeSchema = z.object({
  id: z.string(),
  fichier: z.instanceof(File),
  dateDepot: z.date(),
});
