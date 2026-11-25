const ANNOUNCEMENT_SEPARATOR = " ";

/** Les annonces d'un même changement, pour une région `role="status"`, une phrase après l'autre ; les vides sont omises. */
export function joinAnnouncements(...parts: readonly string[]): string {
  return parts.filter(Boolean).join(ANNOUNCEMENT_SEPARATOR);
}
