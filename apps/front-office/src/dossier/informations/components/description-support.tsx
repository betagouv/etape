import { FieldDescription } from "@etape/ui/components/field";

export function DescriptionSupport({ email }: { email: string }) {
  return (
    <FieldDescription>
      Repris de votre inscription. Pour le modifier, écrivez au support&nbsp;:{" "}
      <a href={`mailto:${email}`}>{email}</a>
    </FieldDescription>
  );
}
