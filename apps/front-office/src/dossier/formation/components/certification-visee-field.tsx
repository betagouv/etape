import { useWatch, type UseFormReturn } from "react-hook-form";

import { RemoteSearchEntryField } from "../../components/remote-search-entry-field";
import { CERTIFICATION_VISEE_SEARCH } from "../certification-visee-search-definition";
import { CERTIFICATION_VISEE_FIELDS, FORMATION_FIELD, type FormationFormData } from "../schema";
import { CertificationViseeCard } from "./certification-visee-card";
import { CertificationViseeManualFields } from "./certification-visee-manual-fields";
import { CertificationViseeOption } from "./certification-visee-option";

/** Ce que reçoit `CertificationViseeField` : le formulaire du volet. */
export interface CertificationViseeFieldProps {
  form: UseFormReturn<FormationFormData>;
}

/** La recherche dans les répertoires RNCP et RS, la carte du diplôme choisi, ou la saisie manuelle. */
export function CertificationViseeField({ form }: CertificationViseeFieldProps) {
  const { control, setValue, clearErrors } = form;
  const mode = useWatch({ control, name: FORMATION_FIELD.CERTIFICATION_VISEE_ENTRY_MODE });
  const certificationVisee = useWatch({ control, name: FORMATION_FIELD.CERTIFICATION_VISEE });

  return (
    <RemoteSearchEntryField
      control={control}
      name={FORMATION_FIELD.CERTIFICATION_VISEE}
      search={{
        definition: CERTIFICATION_VISEE_SEARCH,
        renderOption: (certification) => <CertificationViseeOption certification={certification} />,
      }}
      entry={{
        mode,
        item: certificationVisee,
        fields: CERTIFICATION_VISEE_FIELDS,
        clearErrors,
        setMode: (nextMode) => setValue(FORMATION_FIELD.CERTIFICATION_VISEE_ENTRY_MODE, nextMode),
        setItem: (certification, options) =>
          setValue(FORMATION_FIELD.CERTIFICATION_VISEE, certification, options),
      }}
      renderCard={(certification, cardControl) => (
        <CertificationViseeCard certification={certification} {...cardControl} />
      )}
      renderManualFields={(manualFieldsControl) => (
        <CertificationViseeManualFields control={control} {...manualFieldsControl} />
      )}
    />
  );
}
