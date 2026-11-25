import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import type { PieceJustificative } from "../../domain/piece-justificative";
import type { SectionProgress, VoletProgress } from "../../domain/statut-volet";
import { computeSectionProgress, computeVoletProgress } from "../../domain/volet-progress";
import { VOLET_FORM_OPTIONS } from "../../volet-form-options";
import {
  findDocumentsRequiredFields,
  formatDocumentsStatutChange,
} from "../domain/document-obligatoire";
import {
  DOCUMENTS_SECTION,
  documentsSchema,
  type DocumentsFieldName,
  type DocumentsFormData,
  type DocumentsSection,
} from "../schema";

/** Ce que renvoie `useDocumentsForm` : le formulaire, l'avancement du volet et de ses sections, et l'annonce d'un changement de statut. */
export interface UseDocumentsFormResult {
  form: UseFormReturn<DocumentsFormData>;
  progress: VoletProgress;
  sections: Record<DocumentsSection, SectionProgress>;
  /** Le statut du volet après que `field` reçoit `pieces`, s'il change : « Mes documents : 2 documents restants à déposer. » */
  describeStatutChange: (
    field: DocumentsFieldName,
    pieces: readonly PieceJustificative[],
  ) => string;
}

/**
 * Le formulaire « Mes documents » et ce qui s'en déduit pendant le rendu, par le calcul commun
 * aux volets. Sans `useVoletProgress` : son annonce compte en champs, et doublerait celle du
 * dépôt, que fait le champ des pièces.
 */
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
  const { errors } = form.formState;
  const requiredFields = useWatch({ control: form.control, compute: findDocumentsRequiredFields });

  const describeStatutChange = (
    field: DocumentsFieldName,
    pieces: readonly PieceJustificative[],
  ): string => {
    const before = form.getValues();
    return formatDocumentsStatutChange(before, { ...before, [field]: pieces }, errors);
  };

  return {
    form,
    progress: computeVoletProgress(requiredFields, errors),
    sections: {
      [DOCUMENTS_SECTION.OBLIGATOIRES]: computeSectionProgress(
        requiredFields,
        DOCUMENTS_SECTION.OBLIGATOIRES,
        errors,
      ),
    },
    describeStatutChange,
  };
}
