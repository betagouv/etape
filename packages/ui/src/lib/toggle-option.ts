import { isOptionValue } from "@etape/ui/lib/option-value";

/**
 * Les valeurs cochées après un clic sur `value` : ajoutée ou retirée, puis rangées dans l'ordre
 * des options, pour que la valeur du champ ne dépende pas de l'ordre des clics.
 */
export function toggleOptionValue<TValue extends string>(
  options: Record<TValue, string>,
  values: readonly TValue[],
  value: TValue,
  isChecked: boolean,
): TValue[] {
  const checked = new Set<string>(values);
  if (isChecked) checked.add(value);
  else checked.delete(value);

  return Object.keys(options).filter(
    (option): option is TValue => isOptionValue(options, option) && checked.has(option),
  );
}
