import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

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

const formSectionTitleVariants = cva("font-semibold", {
  variants: {
    size: {
      // La hauteur de ligne suit la taille : `tailwind-merge` l'efface sinon.
      default: "text-lg leading-none",
      // Sections de l'inscription (Figma FRONT-OFFICE, « 01. SIGN-UP ») : titre de 16 px.
      sm: "text-base leading-none",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

/** Titre d'une `FormSection` ; `asChild` en change le niveau (`h2` sous le `h1` d'une page). */
function FormSectionTitle({
  className,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"h3"> &
  VariantProps<typeof formSectionTitleVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h3";

  return (
    <Comp
      data-slot="form-section-title"
      className={cn(formSectionTitleVariants({ size }), className)}
      {...props}
    />
  );
}

export { FormSection, FormSectionHeader, FormSectionTitle };
