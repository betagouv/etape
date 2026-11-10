import { Button } from "@etape/ui/components/button";
import { RefreshCw } from "lucide-react";
import { Component, type ComponentType, lazy, type ReactNode, Suspense, useState } from "react";

import type { I18n } from "../../i18n";
import { Alert, MESSAGE_TYPE } from "../alert";
import type { ManualAdresseFormProps } from "./manual-adresse-form";

const LOAD_FAILED_ID = "manual-adresse-load-failed";

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

export function ManualAdresseLoader(props: {
  i18n: I18n;
  children: (ManualAdresseForm: ComponentType<ManualAdresseFormProps>) => ReactNode;
}) {
  const { i18n, children } = props;
  const [attempt, setAttempt] = useState(0);
  const [ManualAdresseForm, setManualAdresseForm] = useState(createManualAdresseForm);

  return (
    <LoadFailureBoundary
      key={attempt}
      fallback={
        <Alert
          summaryId={LOAD_FAILED_ID}
          type={MESSAGE_TYPE.WARNING}
          summary={i18n.msgStr("etapeAdresseManualLoadFailed")}
          isLive={false}
        >
          <Button
            type="button"
            variant="outline"
            className="self-start"
            autoFocus
            aria-describedby={LOAD_FAILED_ID}
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
          <p className="text-muted-foreground text-sm">{i18n.msg("etapeAdresseManualLoading")}</p>
        }
      >
        {children(ManualAdresseForm)}
      </Suspense>
    </LoadFailureBoundary>
  );
}
