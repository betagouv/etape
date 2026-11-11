import * as React from "react";

import { cn } from "@etape/ui/lib/utils";

/*
 * Sous-partie d'un formulaire, d'après `front-office-form-title-subsection` de la
 * maquette : un titre de 18 px (`text/lg`, semi-gras, Geist) et, en face, un compteur
 * ou une étiquette. Le kit n'a pas de style de titre à cette taille : c'est le texte
 * `lg` de Tailwind, pas un titre `heading-*` en Bricolage.
 */

function FormSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section data-slot="form-section" className={cn("flex flex-col gap-5", className)} {...props} />
  );
}

function FormSectionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-section-header"
      className={cn("flex items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

function FormSectionTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="form-section-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

export { FormSection, FormSectionHeader, FormSectionTitle };
