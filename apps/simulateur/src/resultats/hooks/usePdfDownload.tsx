"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type { RecapEntry } from "../domain/recap";
import type { ResultatAffiche } from "../domain/types";

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
 * façon asynchrone, et iOS Safari attend la confirmation de l'utilisateur.
 * Délai repris de FileSaver.js.
 */
const REVOKE_DELAY_MS = 40_000;

const ANNOUNCEMENTS: Record<PdfStatus, string> = {
  [PDF_STATUS.IDLE]: "",
  [PDF_STATUS.GENERATING]: "Génération du PDF en cours.",
  [PDF_STATUS.DONE]: "Le PDF est prêt, le téléchargement a démarré.",
};

const BUTTON_LABELS: Record<PdfStatus, string> = {
  [PDF_STATUS.IDLE]: "Télécharger mes résultats (PDF)",
  [PDF_STATUS.GENERATING]: "Génération du PDF…",
  [PDF_STATUS.DONE]: "Télécharger mes résultats (PDF)",
};

export interface UsePdfDownloadResult {
  label: string;
  announcement: string;
  isGenerating: boolean;
  download: () => Promise<void>;
}

/**
 * Un seul état pour les deux boutons de la page, et une seule région qui annonce.
 * La garde passe par une ref : deux clics dans la même tâche liraient tous deux
 * l'état d'avant le rendu.
 *
 * `@react-pdf/renderer` et le document ne sont importés qu'au clic : leur poids
 * ne doit pas alourdir le widget embarqué.
 */
export function usePdfDownload(
  resultats: ResultatAffiche[],
  recapEntries: RecapEntry[],
): UsePdfDownloadResult {
  const [status, setStatus] = useState<PdfStatus>(PDF_STATUS.IDLE);
  const isGeneratingRef = useRef(false);

  async function download() {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
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
    } finally {
      isGeneratingRef.current = false;
    }
  }

  return {
    label: BUTTON_LABELS[status],
    announcement: ANNOUNCEMENTS[status],
    isGenerating: status === PDF_STATUS.GENERATING,
    download,
  };
}
