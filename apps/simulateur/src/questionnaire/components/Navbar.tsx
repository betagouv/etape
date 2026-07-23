import Link from "next/link";

interface NavbarProps {
  step: number;
  total: number;
}

/**
 * Barre supérieure du flow (Figma "Navbar", node 2368-6475) :
 * titre + lien "Quitter" + barre de progression 4px.
 */
export function Navbar({ step, total }: NavbarProps) {
  // Progression basée sur les questions complétées (0 % sur la 1re question).
  const pct = total > 0 ? Math.max(0, Math.min(100, ((step - 1) / total) * 100)) : 0;

  return (
    <header className="border-divider bg-background flex w-full flex-col gap-6 border-b pt-6">
      <div className="flex w-full items-center justify-between px-6">
        <p className="text-foreground text-base leading-6 font-bold">Simulateur d’éligibilité</p>
        <Link
          href="/"
          className="text-destructive-text hover:text-destructive text-base leading-5 font-semibold"
        >
          Quitter
        </Link>
      </div>

      <div
        className="bg-accent h-1 w-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );
}
