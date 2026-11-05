const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

/** Moment du dernier enregistrement : l'heure seule le jour même, sinon la date et l'heure. */
export function formatUpdatedAt(updatedAt: Date, now: Date): string {
  const time = TIME_FORMAT.format(updatedAt);
  if (updatedAt.toDateString() === now.toDateString()) return `à ${time}`;
  return `le ${DAY_FORMAT.format(updatedAt)} à ${time}`;
}
