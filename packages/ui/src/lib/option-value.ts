/**
 * Vrai si `value` est l'une des valeurs proposées, les clés d'`options` : ramène au type de ces
 * valeurs une chaîne reçue d'un contrôle, que Radix rend en `string`.
 */
export function isOptionValue<TValue extends string>(
  options: Record<TValue, string>,
  value: string,
): value is TValue {
  return Object.hasOwn(options, value);
}
