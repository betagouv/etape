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

type Statut = "repos" | "generation" | "termine";

const PDF_FILENAME = "resultats-simulateur-etape.pdf";

/*
 * Messages de la région `role="status"` (aria-live polite). Le changement de
 * libellé du bouton n'est pas annoncé de façon fiable par les lecteurs
 * d'écran ; cette région, toujours présente dans le DOM, l'est.
 */
const ANNONCES: Record<Statut, string> = {
  repos: "",
  generation: "Génération du PDF en cours.",
  termine: "Le PDF est prêt, le téléchargement a démarré.",
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
  const [statut, setStatut] = useState<Statut>("repos");
  const generating = statut === "generation";

  async function handleDownload() {
    if (generating) return;
    setStatut("generation");
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
      setStatut("termine");
    } catch {
      // Le toast porte sa propre région live : pas de doublon d'annonce.
      setStatut("repos");
      toast.error("La génération du PDF a échoué. Réessayez.");
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleDownload}
        aria-disabled={generating}
        aria-busy={generating}
        className="self-start aria-busy:cursor-progress"
      >
        {generating && <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />}
        {generating ? "Génération du PDF…" : "Télécharger mes résultats en PDF"}
      </Button>
      <p role="status" className="sr-only">
        {ANNONCES[statut]}
      </p>
    </>
  );
}
