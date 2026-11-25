import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { PieceJustificative } from "../../domain/piece-justificative";
import type { SectionProgress, VoletProgress } from "../../domain/statut-volet";
import { VOLET_FORM_OPTIONS } from "../../volet-form-options";
import {
  computeDocumentsObligatoiresProgress,
  computeDocumentsProgress,
  formatDocumentsStatutChange,
} from "../domain/document-obligatoire";
import { documentsSchema, type DocumentsFieldName, type DocumentsFormData } from "../schema";

/** Ce que renvoie `useDocumentsForm` : le formulaire, l'avancement du volet, le compteur des documents obligatoires et l'annonce d'un changement de statut. */
export interface UseDocumentsFormResult {
  form: UseFormReturn<DocumentsFormData>;
  progress: VoletProgress;
  obligatoires: SectionProgress;
  /** Le statut du volet après que `field` reçoit `pieces`, s'il change : « Mes documents : 2 documents restants à déposer. » */
  describeStatutChange: (
    field: DocumentsFieldName,
    pieces: readonly PieceJustificative[],
  ) => string;
}

/** Le formulaire « Mes documents » et ce qui s'en déduit pendant le rendu. */
export function useDocumentsForm(): UseDocumentsFormResult {
  const form = useForm<DocumentsFormData>({
    ...VOLET_FORM_OPTIONS,
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      programmeFormation: [],
      calendrierFormation: [],
      devisFormation: [],
    },
  });
  const progress = useWatch({ control: form.control, compute: computeDocumentsProgress });

  const describeStatutChange = (
    field: DocumentsFieldName,
    pieces: readonly PieceJustificative[],
  ): string => {
    const before = form.getValues();
    return formatDocumentsStatutChange(before, { ...before, [field]: pieces });
  };

  return {
    form,
    progress,
    obligatoires: computeDocumentsObligatoiresProgress(progress),
    describeStatutChange,
  };
}
