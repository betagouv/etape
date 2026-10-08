import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@etape/ui/lib/utils";

type CalloutTitleTag = "p" | "h1" | "h2" | "h3";

function Callout({
  icon: Icon,
  title,
  titleAs: TitleTag = "p",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon: LucideIcon;
  title: React.ReactNode;
  /**
   * Balise du titre, sans effet sur son apparence. Un encart qui est le seul
   * contenu de la page (échec de connexion, service indisponible) en porte le
   * `h1` : sans lui, la page n'aurait aucun titre.
   */
  titleAs?: CalloutTitleTag;
}) {
  return (
    <div
      data-slot="callout"
      className={cn("bg-muted flex items-start gap-4 rounded-lg p-6", className)}
      {...props}
    >
      <div className="bg-secondary shrink-0 rounded-sm p-2">
        <Icon aria-hidden="true" focusable="false" className="text-primary size-6" />
      </div>

      <div className="flex min-w-0 flex-col gap-1 break-words">
        <TitleTag className="text-body text-foreground font-bold">{title}</TitleTag>
        <div className="text-body text-content-secondary">{children}</div>
      </div>
    </div>
  );
}

export { Callout };
