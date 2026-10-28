import type { ComponentProps } from "react";

import { Link, type LinkComponentProps } from "@tanstack/react-router";

import { VOLET_PATH } from "@/navigation/paths";
import type { VoletId } from "../domain/volet-id";

export interface VoletLinkProps extends Omit<ComponentProps<"a">, "href"> {
  voletId: VoletId;
  activeProps?: LinkComponentProps<"a">["activeProps"];
}

/** Lien vers un autre volet du dossier affiché. */
export function VoletLink({ voletId, ...props }: VoletLinkProps) {
  return (
    <Link
      {...props}
      from={VOLET_PATH}
      to={VOLET_PATH}
      params={(params) => ({ ...params, voletId })}
    />
  );
}
