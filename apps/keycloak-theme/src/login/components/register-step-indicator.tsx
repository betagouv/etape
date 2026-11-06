import { Progress } from "@etape/ui/components/progress";

import type { RegisterStep } from "../hooks/use-register-form";
import type { I18n } from "../i18n";

const STEP_COUNT = 2;
const PROGRESS_PER_STEP = 100 / STEP_COUNT;
const LABEL_ID = "register-step-label";

export function RegisterStepIndicator(props: {
  step: RegisterStep;
  isStepComplete: boolean;
  i18n: I18n;
}) {
  const { step, isStepComplete, i18n } = props;
  const completedSteps = isStepComplete ? step : step - 1;

  return (
    <div className="flex flex-col gap-2">
      <p id={LABEL_ID} className="text-muted-foreground text-sm leading-none font-medium uppercase">
        {i18n.msg("etapeRegisterStep", String(step), String(STEP_COUNT))}
      </p>
      <Progress aria-labelledby={LABEL_ID} value={completedSteps * PROGRESS_PER_STEP} />
    </div>
  );
}
