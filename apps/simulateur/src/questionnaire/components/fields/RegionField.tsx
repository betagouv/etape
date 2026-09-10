"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@etape/ui/components/select";

import { REGIONS } from "../../domain/regions";
import type { RegionField as RegionFieldDef } from "../../domain/types";
import { fieldErrorMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";
import { FieldHeader } from "./FieldHeader";

interface RegionFieldProps {
  field: RegionFieldDef;
  value: string | undefined;
  onChange: (value: string) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message affiché sous la liste quand aucune région n'est choisie. */
  error?: string;
}

const METROPOLE = REGIONS.filter((region) => !("outreMer" in region));
const OUTRE_MER = REGIONS.filter((region) => "outreMer" in region);

/**
 * Choix d'une région dans la liste fermée du produit.
 *
 * Une liste déroulante, pas une recherche : les 18 régions tiennent à l'écran,
 * et la saisie au clavier de Radix amène directement sur celle dont le nom
 * commence par les lettres tapées. Les collectivités d'outre-mer sont groupées
 * à part pour que la métropole reste lisible d'un coup d'œil.
 */
export function RegionField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
  error,
}: RegionFieldProps) {
  const labelId = field.label ? `${field.name}-label` : undefined;
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const triggerId = field.name;
  const errorId = `${field.name}-error`;

  return (
    <div className="flex w-full flex-col gap-2">
      <FieldHeader labelId={labelId} label={field.label} hintId={hintId} hint={field.hint} />
      <Select value={value ?? ""} onValueChange={onChange}>
        {/* Le nom accessible combine le libellé et la région choisie : le bouton
            s'annonce « Votre région de résidence, Occitanie ». */}
        <SelectTrigger
          id={triggerId}
          aria-labelledby={joinIds(labelId ?? labelledBy, triggerId)}
          aria-describedby={joinIds(hintId, error ? errorId : undefined, describedBy)}
          aria-invalid={error ? true : undefined}
          {...fieldErrorMark(error)}
          className="h-11 w-full max-w-md md:h-9"
        >
          <SelectValue placeholder={field.placeholder ?? "Choisir une région"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Métropole</SelectLabel>
            {METROPOLE.map((region) => (
              <SelectItem key={region.code} value={region.code}>
                {region.nom}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Outre-mer</SelectLabel>
            {OUTRE_MER.map((region) => (
              <SelectItem key={region.code} value={region.code}>
                {region.nom}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
