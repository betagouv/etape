import { flagUrl, type Nationalite } from "../domain/nationalites";

export interface NationaliteLabelProps {
  nationalite: Nationalite;
}

/** Drapeau et nom d'une nationalité, dans la liste comme dans le champ. */
export function NationaliteLabel({ nationalite }: NationaliteLabelProps) {
  return (
    <span className="flex items-center gap-2">
      <img src={flagUrl(nationalite.code)} alt="" className="size-4 shrink-0" />
      {nationalite.label}
    </span>
  );
}
