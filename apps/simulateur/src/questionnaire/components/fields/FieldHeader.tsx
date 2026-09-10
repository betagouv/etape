interface FieldHeaderProps {
  labelId?: string;
  label?: string;
  hintId?: string;
  hint?: string;
  /**
   * Id du contrôle étiqueté. Rend un `<label for>` — le seul cas où le clic sur
   * le libellé donne le focus. Absent pour un groupe de contrôles (deux selects,
   * un radiogroup) ou pour un bouton, qui se réfèrent au libellé par
   * `aria-labelledby`.
   */
  htmlFor?: string;
}

/**
 * En-tête d'un champ de saisie : son libellé et sa précision, au-dessus du
 * contrôle. Les deux sont optionnels — un champ seul sur son écran emprunte son
 * libellé au titre de la question.
 */
export function FieldHeader({ labelId, label, hintId, hint, htmlFor }: FieldHeaderProps) {
  if (!label && !hint) return null;

  const labelClassName = "text-foreground text-sm font-semibold";

  return (
    <div className="flex flex-col gap-1">
      {label &&
        (htmlFor ? (
          <label id={labelId} htmlFor={htmlFor} className={labelClassName}>
            {label}
          </label>
        ) : (
          <span id={labelId} className={labelClassName}>
            {label}
          </span>
        ))}
      {hint && (
        <p id={hintId} className="text-content-secondary text-sm leading-5">
          {hint}
        </p>
      )}
    </div>
  );
}
