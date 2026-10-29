import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { focusRing } from "@etape/ui/lib/focus";
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

const sectionHeaderVariants = cva("flex flex-col gap-2", {
  variants: {
    variant: {
      default: "lg:gap-4",
      compact: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/** Chapô de `SectionHeader`, exporté pour un libellé de même rang hors en-tête. */
const sectionCaptionVariants = cva("uppercase", {
  variants: {
    variant: {
      default: "text-caption text-primary font-medium tracking-wide",
      compact: "text-muted-foreground text-sm leading-none font-semibold",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const sectionSubtextVariants = cva("text-muted-foreground", {
  variants: {
    variant: {
      default: "text-body-lg",
      compact: "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * En-tête de section. Le chapô est un `<p>` et jamais un titre : il n'ouvre pas
 * de niveau dans le plan du document. Avec `titleRef`, le titre peut recevoir
 * le focus par script, sans entrer dans l'ordre de tabulation.
 */
function SectionHeader({
  caption,
  title,
  titleId,
  titleRef,
  subtext,
  align = "center",
  variant,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof sectionHeaderVariants> & {
    caption?: React.ReactNode;
    title: React.ReactNode;
    titleId: string;
    titleRef?: React.Ref<HTMLHeadingElement>;
    subtext?: React.ReactNode;
    align?: "center" | "start";
  }) {
  const isTitleFocusable = titleRef !== undefined;

  return (
    <div
      data-slot="section-header"
      data-variant={variant}
      className={cn(
        sectionHeaderVariants({ variant }),
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
      {...props}
    >
      {caption ? <p className={sectionCaptionVariants({ variant })}>{caption}</p> : null}
      <h2
        id={titleId}
        ref={titleRef}
        tabIndex={isTitleFocusable ? -1 : undefined}
        className={cn("font-heading text-heading-sm", isTitleFocusable && focusRing)}
      >
        {title}
      </h2>
      {subtext ? (
        <p className={cn(sectionSubtextVariants({ variant }), align === "center" && "max-w-3xl")}>
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

export { Section, SectionHeader, sectionCaptionVariants, sectionVariants };
