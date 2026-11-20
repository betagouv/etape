import { useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { PlusIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { StatusRegion } from "@etape/ui/components/status-region";

import { OUI_NON } from "../../domain/oui-non";
import { formatDemarcheLabel, MESSAGE_NOMBRE_MAX_DEMARCHES } from "../domain/demarche";
import { useDemarches } from "../hooks/use-demarches";
import type { FuturMetierFormData } from "../schema";
import { DemarcheCard } from "./demarche-card";
import { DemarcheFields } from "./demarche-fields";

/** Ce que reçoit `Demarches` : le formulaire du volet. */
export interface DemarchesProps {
  form: UseFormReturn<FuturMetierFormData>;
}

/**
 * Après un « oui » : les démarches validées, puis la carte de saisie ou, une fois celle-ci
 * validée, le bouton qui en ouvre une autre (maquettes 10 à 12).
 */
export function Demarches({ form }: DemarchesProps) {
  const limitId = useId();
  const demarcheDecouverte = useWatch({ control: form.control, name: "demarcheDecouverte" });
  const {
    demarches,
    hasCurrentDemarche,
    isCurrentDemarcheFilled,
    canAdd,
    announcement,
    addButtonRef,
    validateDemarche,
    addDemarche,
  } = useDemarches(form);

  return (
    <>
      {demarcheDecouverte === OUI_NON.OUI && (
        <>
          {demarches.map((demarche, index) => (
            <DemarcheCard
              key={demarche.id}
              label={formatDemarcheLabel(index)}
              demarche={demarche}
            />
          ))}

          {hasCurrentDemarche ? (
            <DemarcheFields
              control={form.control}
              title={formatDemarcheLabel(demarches.length)}
              isFilled={isCurrentDemarcheFilled}
              onValidate={validateDemarche}
            />
          ) : (
            <div className="flex flex-col items-start gap-2">
              {/* Au maximum, le bouton reste atteignable et dit pourquoi il n'ajoute plus rien. */}
              <Button
                ref={addButtonRef}
                type="button"
                variant="outline"
                size="form"
                aria-disabled={!canAdd}
                aria-describedby={canAdd ? undefined : limitId}
                onClick={addDemarche}
              >
                <PlusIcon aria-hidden="true" className="size-5" />
                Ajouter une autre démarche
              </Button>
              {!canAdd && (
                <p id={limitId} className="text-muted-foreground text-sm">
                  {MESSAGE_NOMBRE_MAX_DEMARCHES}
                </p>
              )}
            </div>
          )}
        </>
      )}
      <StatusRegion message={announcement} />
    </>
  );
}
