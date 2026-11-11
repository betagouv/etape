import type { ReactNode } from "react";

import { Container } from "@etape/ui/components/container";

export interface PlaceholderScreenProps {
  title: string;
  children?: ReactNode;
}

/** Tient la place d'un écran dont la route existe mais pas encore l'intégration. */
export function PlaceholderScreen({ title, children }: PlaceholderScreenProps) {
  return (
    <Container size="app" className="flex flex-col items-start gap-4 py-12">
      <h1 className="font-heading text-heading-lg text-foreground">{title}</h1>
      <p className="text-muted-foreground text-sm">Écran à venir.</p>
      {children}
    </Container>
  );
}
