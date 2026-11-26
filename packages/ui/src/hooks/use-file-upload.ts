"use client";

import * as React from "react";

/** Ce que les parties lisent de `FileUpload` : son état de glisser-déposer et ce qui relie le bouton à son titre. */
export interface FileUploadContextValue {
  isDragging: boolean;
  accept: string | undefined;
  titleId: string;
  descriptionId: string;
  onFilesAdd: (files: File[]) => void;
}

// Un contexte plutôt que des props : les parties sont composées librement par l'écran, à des
// profondeurs qui varient (en-tête, liste, bouton), comme celles d'un composant Radix.
export const FileUploadContext = React.createContext<FileUploadContextValue | null>(null);

/** L'état de `FileUpload`, pour ses parties (`components/file-upload.tsx`). */
export function useFileUpload(): FileUploadContextValue {
  const context = React.useContext(FileUploadContext);
  if (context === null) throw new Error("Une partie de FileUpload est rendue hors de FileUpload.");
  return context;
}
