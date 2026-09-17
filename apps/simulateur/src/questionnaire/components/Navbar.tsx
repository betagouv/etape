import Link from "next/link";

interface NavbarProps {
  step: number;
  total: number;
}

export function Navbar({ step, total }: NavbarProps) {
  // La question EN COURS compte comme franchie : la barre est donc pleine sur
  // la dernière, et déjà entamée sur la première — arriver sur un questionnaire
  // à jauge vide donne l'impression que rien n'a démarré.
  const pct = total > 0 ? Math.max(0, Math.min(100, (step / total) * 100)) : 0;

  return (
    <header className="border-divider bg-background flex w-full shrink-0 flex-col gap-4 border-b pt-4 md:gap-6 md:pt-6">
      <div className="flex w-full items-center justify-between gap-3 px-4 md:px-6">
        <p className="text-foreground text-base leading-6 font-bold">Simulateur d’éligibilité</p>
        <Link
          href="/"
          className="text-destructive-text hover:text-destructive focus-visible:outline-ring rounded-sm text-sm leading-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 md:text-base"
        >
          Quitter<span className="sr-only"> le simulateur</span>
        </Link>
      </div>

      <div
        className="bg-accent h-1 w-full overflow-hidden"
        role="progressbar"
        aria-label="Progression du questionnaire"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={total > 0 ? `Question ${step} sur environ ${total}` : undefined}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}
