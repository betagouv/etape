import { Controller } from "react-hook-form";

import { PiecesJustificativesField } from "../../components/pieces-justificatives-field";
import type { DocumentObligatoire } from "../../documents/domain/document-obligatoire";
import { useDossierVolets } from "../../hooks/use-dossier-volets";

/** Ce que reçoit `DocumentFormationField` : le document et ses textes. */
export interface DocumentFormationFieldProps {
  document: DocumentObligatoire;
}

/**
 * Le dépôt d'un document de « Mes documents » depuis ce volet : il lit et écrit le formulaire de
 * « Mes documents », et annonce le statut de ce volet quand un dépôt le change.
 */
export function DocumentFormationField({
  document: { field: name, title, description, dropLabel },
}: DocumentFormationFieldProps) {
  const { form, describeStatutChange } = useDossierVolets().documents;

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <PiecesJustificativesField
          pieces={field.value}
          onChange={field.onChange}
          labels={{ title, description, dropLabel }}
          describeChange={(pieces) => describeStatutChange(name, pieces)}
        />
      )}
    />
  );
}
