"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlertIcon, FileDownIcon, UploadIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@etape/ui/components/alert";
import { Button } from "@etape/ui/components/button";
import { FileUploadContext, useFileUpload } from "@etape/ui/hooks/use-file-upload";
import { hasDraggedFiles } from "@etape/ui/lib/dragged-files";
import { keepFocus } from "@etape/ui/lib/keep-focus";
import { cn } from "@etape/ui/lib/utils";

/*
 * Dépôt de fichiers : `upload-file` du kit (page « Document card »). Le composant affiche et
 * transmet les fichiers choisis ou glissés ; l'écran décide lesquels il garde, et lui fournit
 * les lignes, les erreurs et tous les textes.
 */
const fileUploadVariants = cva("group/file-upload flex flex-col gap-3 rounded-xl", {
  variants: {
    variant: {
      /**
       * La carte du kit, pour une pièce attendue : fond, bordure, étiquette de statut dans
       * l'en-tête. Pendant un glisser-déposer, sa bordure passe en pointillés (« Type=Glisser-déposer »).
       */
      card: "border-border bg-secondary data-[dragging=true]:border-primary border p-4 data-[dragging=true]:border-dashed",
      /**
       * Dans une carte de saisie (maquette FRONT-OFFICE, « Démarche 1 ») : ni fond ni bordure.
       * Le contour du glisser-déposer est un `outline`, qui ne décale pas le contenu.
       */
      plain:
        "data-[dragging=true]:bg-secondary data-[dragging=true]:outline-primary data-[dragging=true]:outline-1 data-[dragging=true]:outline-offset-4 data-[dragging=true]:outline-dashed",
    },
  },
  defaultVariants: {
    variant: "card",
  },
});

/** Ce que reçoit `FileUpload` : son apparence, les formats proposés au choix et la suite d'un ajout. */
interface FileUploadProps
  extends Omit<React.ComponentProps<"div">, "onDrop">, VariantProps<typeof fileUploadVariants> {
  /** L'attribut `accept` du sélecteur de fichiers : il filtre le choix, pas le glisser-déposer. */
  accept?: string;
  /** Les fichiers choisis ou déposés, tels quels : c'est l'écran qui les contrôle. */
  onFilesAdd: (files: File[]) => void;
}

function FileUpload({
  className,
  variant = "card",
  accept,
  onFilesAdd,
  ...props
}: FileUploadProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  // `dragenter` et `dragleave` se déclenchent aussi à chaque enfant survolé : on les compte.
  const [dragDepth, setDragDepth] = React.useState(0);
  const isDragging = dragDepth > 0;

  return (
    <FileUploadContext value={{ isDragging, accept, titleId, descriptionId, onFilesAdd }}>
      <div
        data-slot="file-upload"
        data-variant={variant}
        data-dragging={isDragging}
        role="group"
        aria-labelledby={titleId}
        className={cn(fileUploadVariants({ variant }), className)}
        onDragEnter={(event) => {
          if (hasDraggedFiles(event.dataTransfer.types)) setDragDepth((depth) => depth + 1);
        }}
        onDragLeave={(event) => {
          if (hasDraggedFiles(event.dataTransfer.types))
            setDragDepth((depth) => Math.max(0, depth - 1));
        }}
        // Sans `preventDefault`, le navigateur refuse le dépôt et ouvre le fichier.
        onDragOver={(event) => {
          if (hasDraggedFiles(event.dataTransfer.types)) event.preventDefault();
        }}
        onDrop={(event) => {
          if (!hasDraggedFiles(event.dataTransfer.types)) return;
          event.preventDefault();
          setDragDepth(0);
          onFilesAdd([...event.dataTransfer.files]);
        }}
        {...props}
      />
    </FileUploadContext>
  );
}

/** Le titre et sa description, à gauche ; l'étiquette de statut de la carte, à droite. */
function FileUploadHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="file-upload-header"
      className={cn("flex items-center justify-between gap-4", className)}
      {...props}
    />
  );
}

function FileUploadHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="file-upload-heading"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function FileUploadTitle({ className, ...props }: React.ComponentProps<"p">) {
  const { titleId } = useFileUpload();
  return (
    <p
      id={titleId}
      data-slot="file-upload-title"
      className={cn("text-foreground text-sm leading-5 font-semibold", className)}
      {...props}
    />
  );
}

function FileUploadDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useFileUpload();
  return (
    <p
      id={descriptionId}
      data-slot="file-upload-description"
      className={cn("text-muted-foreground text-sm leading-5", className)}
      {...props}
    />
  );
}

function FileUploadList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-slot="file-upload-list" className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

/** Ce que reçoit `FileUploadItem` : le nom du fichier, ses détails et ses actions, en enfants. */
interface FileUploadItemProps extends React.ComponentProps<"li"> {
  name: string;
  /** Sous le nom : « PDF · 1,2 Mo · Déposé le 24/09/2026 ». */
  details: string;
}

/** Un fichier déposé. Sur le fond blanc de l'apparence `plain`, la ligne prend une bordure. */
function FileUploadItem({ className, name, details, children, ...props }: FileUploadItemProps) {
  return (
    <li
      data-slot="file-upload-item"
      className={cn(
        "bg-background flex items-center gap-4 rounded-lg p-4",
        // Un liseré intérieur, comme le trait du kit : la ligne garde ses 70 px.
        "group-data-[variant=plain]/file-upload:inset-ring-border group-data-[variant=plain]/file-upload:inset-ring",
        className,
      )}
      {...props}
    >
      <span className="bg-secondary text-primary flex size-9.5 shrink-0 items-center justify-center rounded-md">
        <FileDownIcon aria-hidden="true" className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-primary truncate text-sm leading-5 font-medium">{name}</span>
        <span className="text-muted-foreground text-xs leading-4">{details}</span>
      </span>
      {children && <span className="flex shrink-0 items-center gap-2">{children}</span>}
    </li>
  );
}

/** Ce que reçoit `FileUploadLine` : le nom du fichier cité. */
interface FileUploadLineProps extends React.ComponentProps<"li"> {
  name: string;
}

/** Un fichier simplement cité, sans action : son icône et son nom, dans une `FileUploadList`. */
function FileUploadLine({ className, name, ...props }: FileUploadLineProps) {
  return (
    <li
      data-slot="file-upload-line"
      className={cn("text-primary flex items-center gap-1 text-sm leading-5", className)}
      {...props}
    >
      <FileDownIcon aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0 truncate">{name}</span>
    </li>
  );
}

/** Ce que reçoit `FileUploadError` : le fichier refusé, la raison en enfants et la fermeture de l'alerte. */
interface FileUploadErrorProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Le nom du fichier refusé. */
  title: string;
  /** Nom accessible du bouton de fermeture : « Fermer le message sur x.pdf ». */
  dismissLabel: string;
  onDismiss: () => void;
}

/** Un fichier refusé (kit, « Type=Fichier trop lourd » et « Type=Format refusé »). */
function FileUploadError({
  className,
  title,
  dismissLabel,
  onDismiss,
  children,
  ...props
}: FileUploadErrorProps) {
  return (
    <Alert
      data-slot="file-upload-error"
      variant="destructive-subdued"
      // La place du bouton de fermeture, posé dans l'angle de l'alerte.
      className={cn("pr-12", className)}
      {...props}
    >
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle className="break-all">{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
      <Button
        type="button"
        variant="destructive-subdued"
        size="icon"
        className="absolute top-2 right-2.5"
        aria-label={dismissLabel}
        onClick={onDismiss}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </Alert>
  );
}

/** Ce que reçoit `FileUploadTrigger` : ses trois textes et, au besoin, une référence vers son bouton. */
interface FileUploadTriggerProps {
  /** Le bouton : « Ajouter un fichier ». */
  label: string;
  /** À côté du bouton : « ou glissez vos fichiers ici ». */
  hint: string;
  /** À la place du bouton pendant un glisser-déposer : « Relâchez pour ajouter vos fichiers ». */
  dropLabel: string;
  /** Pour y ramener le focus quand un fichier ou un message disparaît. */
  ref?: React.Ref<HTMLButtonElement>;
  className?: string;
}

/** Le bouton qui ouvre le sélecteur de fichiers du navigateur, et l'invitation à glisser-déposer. */
function FileUploadTrigger({ label, hint, dropLabel, ref, className }: FileUploadTriggerProps) {
  const { isDragging, accept, descriptionId, onFilesAdd } = useFileUpload();
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div data-slot="file-upload-trigger" className={className}>
      {/* Le bouton reste monté pendant le glisser-déposer : le démonter ferait perdre le focus. */}
      <div className={cn("flex flex-wrap items-center gap-1", isDragging && "sr-only")}>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          aria-describedby={descriptionId}
          onMouseDown={keepFocus}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon aria-hidden="true" className="size-5" />
          {label}
        </Button>
        <span className="text-secondary-foreground flex h-8 items-center px-3 text-sm font-medium">
          {hint}
        </span>
        {/* Le bouton tient lieu de champ : le sélecteur natif n'est ni visible ni atteint au clavier. */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          hidden
          tabIndex={-1}
          onChange={(event) => {
            onFilesAdd([...(event.target.files ?? [])]);
            // Sans remise à zéro, choisir de nouveau le même fichier ne déclenche rien.
            event.target.value = "";
          }}
        />
      </div>
      {isDragging && (
        <div
          data-slot="file-upload-dropzone"
          className="bg-background text-secondary-foreground flex h-17.5 items-center justify-center gap-2 rounded-lg p-4 text-sm font-medium"
        >
          <UploadIcon aria-hidden="true" className="size-4" />
          {dropLabel}
        </div>
      )}
    </div>
  );
}

export {
  FileUpload,
  FileUploadDescription,
  FileUploadError,
  FileUploadHeader,
  FileUploadHeading,
  FileUploadItem,
  FileUploadLine,
  FileUploadList,
  FileUploadTitle,
  FileUploadTrigger,
};
export type {
  FileUploadErrorProps,
  FileUploadItemProps,
  FileUploadLineProps,
  FileUploadProps,
  FileUploadTriggerProps,
};
