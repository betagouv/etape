import { DownloadIcon, Loader2Icon } from "lucide-react";

import { ANALYTICS_EVENT, analyticsEventProps } from "@etape/analytics";
import { Button } from "@etape/ui/components/button";

import type { UsePdfDownloadResult } from "../hooks/usePdfDownload";

type DownloadPdfButtonProps = Pick<UsePdfDownloadResult, "label" | "isGenerating" | "download">;

/**
 * Jamais `disabled` pendant la génération : le navigateur retirerait le focus
 * au bouton. `aria-disabled` expose l'état, la garde de `download` bloque la
 * seconde activation ; la mesure du clic s'efface aussi pendant ce temps, pour
 * ne pas compter un téléchargement par clic impatient.
 */
export function DownloadPdfButton({ label, isGenerating, download }: DownloadPdfButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="responsive-sm"
      onClick={download}
      aria-disabled={isGenerating}
      aria-busy={isGenerating}
      className="aria-busy:cursor-progress"
      {...(isGenerating ? {} : analyticsEventProps(ANALYTICS_EVENT.SIMULATEUR_TELECHARGER_PDF))}
    >
      {isGenerating ? (
        <Loader2Icon aria-hidden="true" className="animate-spin" />
      ) : (
        <DownloadIcon aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
