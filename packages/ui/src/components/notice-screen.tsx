import { ActionNotice } from "@etape/ui/components/action-notice";
import { Container } from "@etape/ui/components/container";

export interface NoticeScreenProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/**
 * Un écran entier occupé par un avis : son titre est le `h1` de la page. Sert
 * quand l'app ne peut rien afficher d'autre (échec de connexion, service
 * indisponible).
 */
export function NoticeScreen({ title, message, actionLabel, onAction }: NoticeScreenProps) {
  return (
    <main>
      <Container size="sm" className="py-12">
        <ActionNotice
          title={title}
          titleAs="h1"
          message={message}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      </Container>
    </main>
  );
}
