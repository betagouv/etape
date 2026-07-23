import Link from "next/link";

import { Button } from "@etape/ui/components/button";

import type { Outcome } from "../domain/types";

/**
 * Écran terminal du flow : titre + texte + actions, centré, sans navbar.
 * La simulation s'arrête ici (Figma "Desktop - Erreur", node 3504-45562).
 */
export function OutcomeScreen({ outcome }: { outcome: Outcome }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-12">
        <div className="flex w-full flex-col gap-4 text-center">
          <h1 className="text-foreground text-[28px] leading-9 font-bold">{outcome.title}</h1>
          {outcome.text && (
            <p className="text-content-secondary text-base leading-6">{outcome.text}</p>
          )}
        </div>

        <div className="flex w-[400px] max-w-full flex-col gap-6">
          {outcome.actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant={action.variant === "primary" ? "default" : "outline"}
              className={
                action.variant === "primary"
                  ? "h-auto min-h-11 w-full rounded-lg px-6 py-4 text-base font-semibold"
                  : "border-primary text-primary hover:bg-secondary hover:text-secondary-foreground h-auto min-h-11 w-full rounded-lg px-6 py-4 text-base font-semibold"
              }
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
