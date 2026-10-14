import { Progress } from "@etape/ui/components/progress";

interface QuestionProgressProps {
  step: number;
  total: number;
}

export function QuestionProgress({ step, total }: QuestionProgressProps) {
  // La question en cours compte comme franchie : la jauge n'est jamais vide au départ.
  const value = total > 0 ? Math.round(Math.min(100, (step / total) * 100)) : 0;

  return (
    <Progress
      value={value}
      aria-label="Progression du questionnaire"
      getValueLabel={() => `Question ${step} sur environ ${total}`}
    />
  );
}
