import { FieldDescription } from "@etape/ui/components/field";

export interface PrefilledFieldDescriptionProps {
  /** Relié au champ par son `aria-describedby`. */
  id: string;
  email: string;
}

/** Description d'un champ repris de l'inscription : seul le support peut le modifier. */
export function PrefilledFieldDescription({ id, email }: PrefilledFieldDescriptionProps) {
  return (
    <FieldDescription id={id}>
      Repris de votre inscription. Pour le modifier, écrivez au support&nbsp;:{" "}
      <a href={`mailto:${email}`}>{email}</a>
    </FieldDescription>
  );
}
