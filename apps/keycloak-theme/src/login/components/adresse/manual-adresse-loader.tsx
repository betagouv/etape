import { Button } from "@etape/ui/components/button";
import { RefreshCw } from "lucide-react";
import { Component, type ComponentType, lazy, type ReactNode, Suspense } from "react";

import type { I18n } from "../../i18n";
import { Alert, MESSAGE_TYPE } from "../alert";
import type { ManualAdresseFormProps } from "./manual-adresse-form";

const LOAD_FAILED_ID = "manual-adresse-load-failed";
const LOAD_FAILED_HINT_ID = "manual-adresse-load-failed-hint";

// Un nouvel `import()` du même fichier ne sert à rien : le navigateur garde l'échec du module,
// et après un déploiement le fichier n'existe plus sous ce nom. Seul un rechargement le retrouve.
const ManualAdresseForm = lazy(() => import("./manual-adresse-form"));

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

/** Props de `ManualAdresseLoader`. */
export interface ManualAdresseLoaderProps {
  /** Page d'inscription rechargée si le formulaire ne se charge pas. */
  reloadUrl: string;
  i18n: I18n;
  children: (Form: ComponentType<ManualAdresseFormProps>) => ReactNode;
}

/** Charge à la demande le formulaire de saisie manuelle, qui embarque le `Select` de Radix. */
export function ManualAdresseLoader(props: ManualAdresseLoaderProps) {
  const { reloadUrl, i18n, children } = props;

  return (
    <LoadFailureBoundary
      fallback={
        <Alert
          type={MESSAGE_TYPE.WARNING}
          summary={i18n.msgStr("etapeAdresseManualLoadFailed")}
          summaryId={LOAD_FAILED_ID}
          isLive={false}
        >
          <p id={LOAD_FAILED_HINT_ID} className="text-foreground">
            {i18n.msg("etapeAdresseManualLoadFailedHint")}
          </p>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            autoFocus
            aria-describedby={`${LOAD_FAILED_ID} ${LOAD_FAILED_HINT_ID}`}
            onClick={() => window.location.assign(reloadUrl)}
          >
            <RefreshCw aria-hidden />
            {i18n.msg("etapeAdresseManualReload")}
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
