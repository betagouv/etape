import { Progress } from "@etape/ui/components/progress";

interface QuestionProgressProps {
  step: number;
  total: number;
}

export function QuestionProgress({ step, total }: QuestionProgressProps) {
  // La question EN COURS compte comme franchie : la barre est donc pleine sur
  // la dernière, et déjà entamée sur la première — arriver sur un questionnaire
  // à jauge vide donne l'impression que rien n'a démarré.
  const pct = total > 0 ? Math.max(0, Math.min(100, (step / total) * 100)) : 0;

  return (
    <Progress
      value={Math.round(pct)}
      aria-label="Progression du questionnaire"
      getValueLabel={() => `Question ${step} sur environ ${total}`}
    />
  );
}
