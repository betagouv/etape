"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@etape/ui/components/button";

import type { RecapEntry } from "../domain/recap";
import type { ResultatAffiche } from "../domain/types";

interface DownloadPdfButtonProps {
  resultats: ResultatAffiche[];
  recapEntries: RecapEntry[];
}

/** États de la génération du PDF : mécanisme technique, identifiants en anglais. */
const PDF_STATUS = {
  IDLE: "idle",
  GENERATING: "generating",
  DONE: "done",
} as const;
type PdfStatus = (typeof PDF_STATUS)[keyof typeof PDF_STATUS];

const PDF_FILENAME = "resultats-simulateur-etape.pdf";

/*
 * Révoquer l'URL du blob dans la foulée de `click()` peut annuler le
 * téléchargement : Safari et certaines versions de Firefox résolvent l'URL de
 * façon asynchrone, et iOS Safari ne lance le téléchargement qu'une fois que
 * l'utilisateur a confirmé, parfois plusieurs secondes plus tard. Le délai
 * retenu est celui de FileSaver.js ; le blob (quelques centaines de ko) reste
 * en mémoire d'ici là, sans conséquence.
 */
const REVOKE_DELAY_MS = 40_000;

/*
 * Messages de la région `role="status"` (aria-live polite). Le changement de
 * libellé du bouton n'est pas annoncé de façon fiable par les lecteurs
 * d'écran ; cette région, toujours présente dans le DOM, l'est.
 */
const ANNOUNCEMENTS: Record<PdfStatus, string> = {
  [PDF_STATUS.IDLE]: "",
  [PDF_STATUS.GENERATING]: "Génération du PDF en cours.",
  [PDF_STATUS.DONE]: "Le PDF est prêt, le téléchargement a démarré.",
};

/** Libellé visible du bouton ; les annonces pour lecteurs d'écran restent dans `ANNOUNCEMENTS`. */
const BUTTON_LABELS: Record<PdfStatus, string> = {
  [PDF_STATUS.IDLE]: "Télécharger mes résultats en PDF",
  [PDF_STATUS.GENERATING]: "Génération du PDF…",
  [PDF_STATUS.DONE]: "Télécharger mes résultats en PDF",
};

/**
 * `@react-pdf/renderer` et le document PDF ne sont importés qu'au clic (via
 * `import()`) : leur poids ne doit pas alourdir le chargement initial de la
 * page, le simulateur étant pensé comme un widget embarqué.
 *
 * Le bouton n'est jamais `disabled` pendant la génération : le navigateur
 * retirerait le focus à l'élément actif et l'utilisateur au clavier perdrait
 * sa position. `aria-disabled` expose l'état sans casser le focus, et la garde
 * dans le handler empêche une seconde activation.
 */
export function DownloadPdfButton({ resultats, recapEntries }: DownloadPdfButtonProps) {
  const [status, setStatus] = useState<PdfStatus>(PDF_STATUS.IDLE);
  const isGenerating = status === PDF_STATUS.GENERATING;

  async function handleDownload() {
    if (isGenerating) return;
    setStatus(PDF_STATUS.GENERATING);
    try {
      const [{ pdf }, { ResultsPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../pdf/ResultsPdfDocument"),
      ]);

      const blob = await pdf(
        <ResultsPdfDocument resultats={resultats} recapEntries={recapEntries} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = PDF_FILENAME;
      // Rattaché au DOM le temps du clic : les anciens Firefox ignorent
      // `click()` sur un lien détaché.
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
      setStatus(PDF_STATUS.DONE);
    } catch {
      // Le toast porte sa propre région live : pas de doublon d'annonce.
      setStatus(PDF_STATUS.IDLE);
      toast.error("La génération du PDF a échoué. Réessayez.");
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleDownload}
        aria-disabled={isGenerating}
        aria-busy={isGenerating}
        className="self-start aria-busy:cursor-progress"
      >
        {isGenerating && <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />}
        {BUTTON_LABELS[status]}
      </Button>
      <p role="status" className="sr-only">
        {ANNOUNCEMENTS[status]}
      </p>
    </>
  );
}
