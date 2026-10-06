import { Container } from "@etape/ui/components/container";

export interface PendingScreenProps {
  message: string;
}

/**
 * Un écran d'attente. Son message est le contenu initial de la page, lu comme
 * le reste : sans `role="status"`, qu'une région insérée déjà remplie
 * n'annonce pas de façon fiable (`accessibilite.md`, § 2).
 */
export function PendingScreen({ message }: PendingScreenProps) {
  return (
    <main>
      <Container size="sm" className="py-12">
        <p className="text-body text-content-secondary">{message}</p>
      </Container>
    </main>
  );
}
