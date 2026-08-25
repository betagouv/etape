import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@etape/ui/lib/utils";
import { Container, type ContainerSize } from "@etape/ui/components/container";

/** Bande de contenu pleine largeur : fond bord à bord, contenu borné et centré. */
const sectionVariants = cva("py-12 lg:py-16", {
  variants: {
    surface: {
      default: "bg-background text-foreground",
      grey: "bg-muted text-foreground",
      /** Le contenu reste en `Content/Primary` : la maquette ne le teinte pas. */
      secondary: "bg-secondary text-foreground",
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
    width?: ContainerSize;
    containerClassName?: string;
  }) {
  return (
    <section
      data-slot="section"
      data-surface={surface}
      // Sans ce décalage, l'en-tête collant recouvre le haut de la section
      // quand on suit une ancre.
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
 * En-tête de section. Le chapô est un `<p>` et jamais un titre : il n'ouvre pas
 * de niveau dans le plan du document.
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
