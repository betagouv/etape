import type { ComponentProps, RefObject } from "react";
import Link from "next/link";

import { Button } from "@etape/ui/components/button";

import type { Outcome, OutcomeAction } from "../domain/types";

/**
 * L'action métier dit son rôle, le design system dit à quoi il ressemble.
 * `outline-primary` et `size="xl"` (44 px, la hauteur des maquettes) couvrent
 * exactement le besoin : rien à redéfinir par `className`.
 */
const ACTION_VARIANTS: Record<OutcomeAction["variant"], ComponentProps<typeof Button>["variant"]> =
  {
    primary: "default",
    secondary: "outline-primary",
  };

interface OutcomeScreenProps {
  outcome: Outcome;
  /**
   * Retour à la dernière question répondue. Un écran terminal reste atteint
   * par une réponse : sans porte de sortie, une faute de clic obligerait à
   * tout recommencer.
   */
  onBack?: () => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

export function OutcomeScreen({ outcome, onBack, headingRef }: OutcomeScreenProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-6">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-8 md:gap-12">
        <div className="flex w-full flex-col gap-3 text-center md:gap-4">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-foreground focus-visible:outline-ring rounded-sm text-2xl leading-8 font-bold focus-visible:outline-2 focus-visible:outline-offset-4 md:text-[28px] md:leading-9"
          >
            {outcome.title}
          </h1>
          {outcome.text && (
            <p className="text-content-secondary text-sm leading-5 md:text-base md:leading-6">
              {outcome.text}
            </p>
          )}
        </div>

        <div className="flex w-full max-w-[400px] flex-col gap-4 md:gap-6">
          {outcome.actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant={ACTION_VARIANTS[action.variant]}
              size="xl"
              className="w-full"
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}

          {onBack && (
            <Button
              type="button"
              variant="outline-primary"
              size="xl"
              onClick={onBack}
              className="w-full"
            >
              Modifier ma réponse
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
