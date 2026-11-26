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
      // 24 px même sans compteur (maquette), pour que le formulaire ne saute pas quand il disparaît.
      // Faute de place, le compteur passe sous le titre plutôt que de le couper, et reste à droite.
      className={cn(
        "flex min-h-6 flex-wrap items-center justify-between gap-2 [&>:not(:first-child)]:ml-auto",
        className,
      )}
      {...props}
    />
  );
}

const formSectionTitleVariants = cva("font-semibold", {
  variants: {
    size: {
      // La hauteur de ligne suit la taille : `tailwind-merge` l'efface sinon. 24 px, la hauteur
      // de l'en-tête : un titre trop long pour une ligne garde des lignes lisibles.
      default: "text-lg leading-6",
      // Sections de l'inscription (Figma FRONT-OFFICE, « 01. SIGN-UP ») : titre de 16 px.
      sm: "text-base leading-none",
      // Sous-titre d'un groupe dans une section (Figma FRONT-OFFICE, « Mes documents », écrans 01
      // et 16) : 16 px sur une ligne de 24, couleur principale. Le style de `CardTitle` en
      // `summary`, gardé ici parce que c'est un titre de section, pas celui d'une carte.
      subtitle: "text-base leading-6 text-primary",
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
