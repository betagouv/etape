"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Label } from "@etape/ui/components/label";
import { Separator } from "@etape/ui/components/separator";
import { cn } from "@etape/ui/lib/utils";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  );
}

const fieldLegendVariants = cva("mb-3 font-medium", {
  variants: {
    variant: {
      legend: "text-base",
      label: "text-sm",
    },
  },
  defaultVariants: {
    variant: "legend",
  },
});

function FieldLegend({
  className,
  variant = "legend",
  required = false,
  children,
  ...props
}: React.ComponentProps<"legend"> &
  VariantProps<typeof fieldLegendVariants> & { required?: boolean }) {
  return (
    <legend
      data-slot="field-legend"
      // `FieldDescription` s'en sert comme sélecteur.
      data-variant={variant}
      data-required={required || undefined}
      className={cn(fieldLegendVariants({ variant }), className)}
      {...props}
    >
      {required ? <FieldRequiredContent>{children}</FieldRequiredContent> : children}
    </legend>
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

// Pas de `data-[invalid=true]:text-destructive` de la source shadcn : dans le kit, un
// champ invalide garde son libellé noir ; seule la bordure du contrôle passe en rouge.
const fieldVariants = cva("group/field flex w-full gap-3", {
  variants: {
    orientation: {
      vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        "flex-row items-center",
        "[&>[data-slot=field-label]]:flex-auto",
        "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      responsive: [
        "flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto",
        "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
        "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", className)}
      {...props}
    />
  );
}

/**
 * Marque « obligatoire » du kit (`Field`, propriété `Required`) : étoile `destructive` à
 * 2 px du libellé. Elle est visuelle seulement, les lecteurs d'écran entendent la mention
 * en clair (RGAA 11.10).
 */
function FieldRequiredContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="inline-flex gap-0.5">
        {children}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </span>
      <span className="sr-only"> (obligatoire)</span>
    </>
  );
}

function FieldLabel({
  className,
  required = false,
  children,
  ...props
}: React.ComponentProps<typeof Label> & { required?: boolean }) {
  return (
    <Label
      data-slot="field-label"
      data-required={required || undefined}
      // Sans la carte de choix de la source shadcn : c'est le rôle de `ChoiceCard`.
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    >
      {required ? <FieldRequiredContent>{children}</FieldRequiredContent> : children}
    </Label>
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

/*
 * En gris et sans `role="alert"`, contrairement à la source shadcn, comme le
 * message d'un champ invalide du kit. L'annonce passe par le résumé d'erreurs de
 * l'écran (`VoletErrorsAlert` au front-office), focalisé à la soumission ; chaque
 * champ relie ensuite son message par `aria-describedby`.
 */
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const uniqueErrors = [...new Map(errors?.map((error) => [error?.message, error])).values()];
  const content =
    children ??
    (uniqueErrors.length === 1 ? (
      uniqueErrors[0]?.message
    ) : uniqueErrors.length > 1 ? (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    ) : null);

  if (!content) {
    return null;
  }

  return (
    <div
      data-slot="field-error"
      className={cn("text-muted-foreground text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
