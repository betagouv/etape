interface QuestionHeaderProps {
  step: number;
  title: string;
  subtitle?: string;
}

/** Entête d'une question : libellé "QUESTION N" (accent) + titre (H2) + consigne. */
export function QuestionHeader({ step, title, subtitle }: QuestionHeaderProps) {
  return (
    <header className="flex w-full flex-col gap-4">
      <p className="text-content-accent text-xs leading-4 font-normal uppercase">Question {step}</p>
      <h2 className="text-foreground text-[28px] leading-9 font-bold">{title}</h2>
      {subtitle && <p className="text-content-secondary text-base leading-6">{subtitle}</p>}
    </header>
  );
}
