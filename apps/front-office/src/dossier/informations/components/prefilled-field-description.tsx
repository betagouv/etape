import { FieldDescription } from "@etape/ui/components/field";

import { SUPPORT_EMAIL } from "../../domain/volets-dossier";

export interface PrefilledFieldDescriptionProps {
  /** Relié au champ par son `aria-describedby`. */
  id: string;
}

/** Description d'un champ repris de l'inscription : seul le support peut le modifier. */
export function PrefilledFieldDescription({ id }: PrefilledFieldDescriptionProps) {
  return (
    <FieldDescription id={id}>
      Repris de votre inscription. Pour le modifier, écrivez au support&nbsp;:{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
    </FieldDescription>
  );
}
