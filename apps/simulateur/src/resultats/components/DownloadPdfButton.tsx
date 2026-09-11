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

const PDF_FILENAME = "resultats-simulateur-etape.pdf";

/**
 * `@react-pdf/renderer` et le document PDF ne sont importés qu'au clic (via
 * `import()`) : leur poids ne doit pas alourdir le chargement initial de la
 * page, le simulateur étant pensé comme un widget embarqué.
 */
export function DownloadPdfButton({ resultats, recapEntries }: DownloadPdfButtonProps) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
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
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("La génération du PDF a échoué. Réessayez.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleDownload}
      disabled={generating}
      aria-busy={generating}
      className="self-start"
    >
      {generating && <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />}
      {generating ? "Génération du PDF…" : "Télécharger mes résultats en PDF"}
    </Button>
  );
}
