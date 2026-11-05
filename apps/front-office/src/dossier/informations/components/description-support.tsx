import { FieldDescription } from "@etape/ui/components/field";

export interface DescriptionSupportProps {
  /** Relié au champ par son `aria-describedby`. */
  id: string;
  email: string;
}

/** Description d'un champ repris de l'inscription : seul le support peut le modifier. */
export function DescriptionSupport({ id, email }: DescriptionSupportProps) {
  return (
    <FieldDescription id={id}>
      Repris de votre inscription. Pour le modifier, écrivez au support&nbsp;:{" "}
      <a href={`mailto:${email}`}>{email}</a>
    </FieldDescription>
  );
}
