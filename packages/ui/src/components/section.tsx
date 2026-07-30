import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@etape/ui/lib/utils";
import { Container, type ContainerSize } from "@etape/ui/components/container";

/**
 * Bande de contenu pleine largeur.
 *
 * C'est la brique répétée par toutes les sections des maquettes ETAPE : un fond
 * qui va d'un bord à l'autre, un rythme vertical constant (`Padding/4XL` :
 * 48px en mobile, 64px en desktop) et un contenu borné et centré.
 *
 * Le fond est porté par le `<section>`, la largeur par un `Container` interne :
 * ces deux responsabilités ne peuvent pas tenir sur le même élément.
 *
 * Server Component : aucun JavaScript côté client.
 */
const sectionVariants = cva("py-12 lg:py-16", {
  variants: {
    surface: {
      default: "bg-background text-foreground",
      /** `Surface/Base/Grey` — sections en léger retrait (réassurance, footer). */
      grey: "bg-muted text-foreground",
      /**
       * `Surface/Base/Secondary` — le bandeau « Le saviez-vous ». Le contenu
       * reste en `Content/Primary` et non en `--secondary-foreground` : le fond
       * teal très clair ne justifie pas de teinter le texte, et la maquette ne
       * le fait pas.
       */
      secondary: "bg-secondary text-foreground",
      /** `Surface/Base/Primary` — le bandeau « Pour qui ». */
      primary: "bg-primary text-primary-foreground",
    },
  },
  defaultVariants: {
    surface: "default",
  },
});

function Section({
  className,
  surface,
  width = "lg",
  containerClassName,
  children,
  ...props
}: React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants> & {
    /** Largeur du contenu, déléguée à `Container`. */
    width?: ContainerSize;
    /** Classes portées par le conteneur interne, pas par la bande. */
    containerClassName?: string;
  }) {
  return (
    <section
      data-slot="section"
      data-surface={surface}
      // Décale l'ancrage des liens internes : sans quoi un en-tête collant
      // recouvrirait le haut de la section une fois l'ancre suivie.
      className={cn(sectionVariants({ surface }), "scroll-mt-20", className)}
      {...props}
    >
      <Container size={width} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}

/**
 * En-tête de section : chapô, titre, sous-texte.
 *
 * Le chapô (« EN 3 ÉTAPES », « POUR QUI ? ») est un paragraphe et jamais un
 * titre : il n'ouvre pas de niveau dans le plan du document. Le `<h2>` porte
 * l'`id` que la section référence via `aria-labelledby`, ce qui donne son nom
 * accessible au repère sans dupliquer le texte.
 */
function SectionHeader({
  caption,
  title,
  titleId,
  subtext,
  align = "center",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  caption?: React.ReactNode;
  title: React.ReactNode;
  titleId: string;
  subtext?: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "flex flex-col gap-2 lg:gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
      {...props}
    >
      {caption ? (
        <p className="text-caption text-primary font-medium tracking-wide uppercase">{caption}</p>
      ) : null}
      <h2 id={titleId} className="text-h2 font-bold">
        {title}
      </h2>
      {subtext ? (
        <p className={cn("text-body-lg text-muted-foreground", align === "center" && "max-w-3xl")}>
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

export { Section, SectionHeader, sectionVariants };
