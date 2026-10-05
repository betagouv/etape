import { Container } from "@etape/ui/components/container";

export interface PendingScreenProps {
  message: string;
}

/** Un écran d'attente, annoncé aux lecteurs d'écran par sa région de statut. */
export function PendingScreen({ message }: PendingScreenProps) {
  return (
    <main>
      <Container size="sm" className="py-12">
        <p role="status" className="text-body text-content-secondary">
          {message}
        </p>
      </Container>
    </main>
  );
}
