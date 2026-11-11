export interface StatusRegionProps {
  /** Vide au repos ; chaque nouveau texte est annoncé. */
  message: string;
}

/**
 * La région où s'annoncent les changements d'état. Elle doit être montée avant
 * son premier message et ne plus bouger : une région insérée déjà remplie n'est
 * pas annoncée de façon fiable (`accessibilite.md`, § 2).
 */
export function StatusRegion({ message }: StatusRegionProps) {
  return (
    <p role="status" data-slot="status-region" className="sr-only">
      {message}
    </p>
  );
}
