import { Button } from "@etape/ui/components/button";
import { RefreshCw } from "lucide-react";
import { Component, lazy, type ReactNode, Suspense, useState } from "react";

import type { UseManualAdresseResult } from "../../hooks/use-manual-adresse";
import type { I18n } from "../../i18n";
import { Alert, MESSAGE_TYPE } from "../alert";

const createManualAdresseForm = () => lazy(() => import("./manual-adresse-form"));

class LoadFailureBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasFailed: boolean }
> {
  override state = { hasFailed: false };

  static getDerivedStateFromError() {
    return { hasFailed: true };
  }

  override render() {
    return this.state.hasFailed ? this.props.fallback : this.props.children;
  }
}

export function ManualAdresseLoader(props: { manual: UseManualAdresseResult; i18n: I18n }) {
  const { manual, i18n } = props;
  const [attempt, setAttempt] = useState(0);
  const [ManualAdresseForm, setManualAdresseForm] = useState(createManualAdresseForm);

  return (
    <LoadFailureBoundary
      key={attempt}
      fallback={
        <Alert type={MESSAGE_TYPE.WARNING} summary={i18n.msgStr("etapeAdresseManualLoadFailed")}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            autoFocus
            onClick={() => {
              setManualAdresseForm(createManualAdresseForm);
              setAttempt((current) => current + 1);
            }}
          >
            <RefreshCw aria-hidden />
            {i18n.msg("etapeAdresseRetry")}
          </Button>
        </Alert>
      }
    >
      <Suspense
        fallback={
          <p className="text-body-sm text-muted-foreground">
            {i18n.msg("etapeAdresseManualLoading")}
          </p>
        }
      >
        <ManualAdresseForm manual={manual} i18n={i18n} />
      </Suspense>
    </LoadFailureBoundary>
  );
}
