import { cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "@etape/ui/components/button";
import {
  FileUpload,
  FileUploadDescription,
  FileUploadError,
  FileUploadHeader,
  FileUploadHeading,
  FileUploadItem,
  FileUploadList,
  FileUploadTitle,
  FileUploadTrigger,
} from "@etape/ui/components/file-upload";

afterEach(cleanup);

const ATTESTATION = new File(["x"], "attestation.pdf", { type: "application/pdf" });
const PHOTO = new File(["x"], "photo.heic", { type: "image/heic" });

interface JustificatifsProps {
  onFilesAdd?: (files: File[]) => void;
  onDismiss?: () => void;
  variant?: "card" | "plain";
}

function Justificatifs({ onFilesAdd = () => undefined, onDismiss, variant }: JustificatifsProps) {
  return (
    <FileUpload variant={variant} accept=".pdf,.png" onFilesAdd={onFilesAdd}>
      <FileUploadHeader>
        <FileUploadHeading>
          <FileUploadTitle>Justificatifs</FileUploadTitle>
          <FileUploadDescription>Attestation ou compte-rendu.</FileUploadDescription>
        </FileUploadHeading>
      </FileUploadHeader>
      <FileUploadList aria-label="Fichiers déposés">
        <FileUploadItem name="attestation.pdf" details="PDF · 1,2 Mo · Déposé le 24/09/2026">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Retirer attestation.pdf"
          />
        </FileUploadItem>
      </FileUploadList>
      {onDismiss && (
        <FileUploadError
          title="photo.heic"
          dismissLabel="Fermer le message sur photo.heic"
          onDismiss={onDismiss}
        >
          Ce format n’est pas accepté.
        </FileUploadError>
      )}
      <FileUploadTrigger
        label="Ajouter un fichier"
        hint="ou glissez vos fichiers ici"
        dropLabel="Relâchez pour ajouter vos fichiers"
      />
    </FileUpload>
  );
}

function getGroup(): HTMLElement {
  return screen.getByRole("group", { name: "Justificatifs" });
}

const DRAG = {
  ENTER: "dragEnter",
  LEAVE: "dragLeave",
  OVER: "dragOver",
  DROP: "drop",
} as const;

/** Un événement de glisser-déposer qui porte des fichiers, ou seulement du texte. */
function drag(type: (typeof DRAG)[keyof typeof DRAG], files: File[]): Event {
  const event = createEvent[type](getGroup());
  Object.defineProperty(event, "dataTransfer", {
    value: { types: files.length > 0 ? ["Files"] : ["text/plain"], files },
  });
  fireEvent(getGroup(), event);
  return event;
}

describe("FileUpload", () => {
  it("nomme le groupe par son titre et décrit le bouton par sa description", () => {
    render(<Justificatifs />);

    const button = screen.getByRole("button", { name: "Ajouter un fichier" });
    expect(getGroup().getAttribute("data-variant")).toBe("card");
    expect(button.getAttribute("aria-describedby")).toBe(
      screen.getByText("Attestation ou compte-rendu.").id,
    );
  });

  it("porte son apparence, que les lignes lisent pour leur bordure", () => {
    render(<Justificatifs variant="plain" />);

    expect(getGroup().getAttribute("data-variant")).toBe("plain");
  });

  it("liste les fichiers déposés avec leurs détails et leurs actions", () => {
    render(<Justificatifs />);

    const item = screen.getByRole("listitem");
    expect(item.textContent).toContain("attestation.pdf");
    expect(item.textContent).toContain("PDF · 1,2 Mo · Déposé le 24/09/2026");
    expect(screen.getByRole("button", { name: "Retirer attestation.pdf" })).toBeDefined();
  });

  it("transmet les fichiers choisis et vide le sélecteur, pour qu'on puisse rechoisir le même", () => {
    const onFilesAdd = vi.fn();
    const { container } = render(<Justificatifs onFilesAdd={onFilesAdd} />);
    const input = container.querySelector<HTMLInputElement>("input[type=file]");
    if (input === null) throw new Error("sélecteur de fichiers absent");

    expect(input.accept).toBe(".pdf,.png");
    expect(input.multiple).toBe(true);
    expect(input.tabIndex).toBe(-1);

    fireEvent.change(input, { target: { files: [ATTESTATION, PHOTO] } });

    expect(onFilesAdd).toHaveBeenCalledExactlyOnceWith([ATTESTATION, PHOTO]);
    expect(input.value).toBe("");
  });

  it("ouvre le sélecteur de fichiers au clic sur le bouton", () => {
    const { container } = render(<Justificatifs />);
    const input = container.querySelector<HTMLInputElement>("input[type=file]");
    if (input === null) throw new Error("sélecteur de fichiers absent");
    const click = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: "Ajouter un fichier" }));

    expect(click).toHaveBeenCalledOnce();
  });

  it("invite à relâcher pendant un glisser-déposer de fichiers, sans démonter le bouton", () => {
    render(<Justificatifs />);

    drag(DRAG.ENTER, [ATTESTATION]);

    expect(getGroup().getAttribute("data-dragging")).toBe("true");
    expect(screen.getByText("Relâchez pour ajouter vos fichiers")).toBeDefined();
    expect(screen.getByRole("button", { name: "Ajouter un fichier" })).toBeDefined();

    drag(DRAG.LEAVE, [ATTESTATION]);

    expect(getGroup().getAttribute("data-dragging")).toBe("false");
    expect(screen.queryByText("Relâchez pour ajouter vos fichiers")).toBeNull();
  });

  it("reste en glisser-déposer tant qu'on survole un de ses enfants", () => {
    render(<Justificatifs />);

    drag(DRAG.ENTER, [ATTESTATION]);
    drag(DRAG.ENTER, [ATTESTATION]);
    drag(DRAG.LEAVE, [ATTESTATION]);

    expect(getGroup().getAttribute("data-dragging")).toBe("true");
  });

  it("transmet les fichiers déposés et quitte l'état de glisser-déposer", () => {
    const onFilesAdd = vi.fn();
    render(<Justificatifs onFilesAdd={onFilesAdd} />);
    drag(DRAG.ENTER, [ATTESTATION]);

    expect(drag(DRAG.OVER, [ATTESTATION]).defaultPrevented).toBe(true);
    const drop = drag(DRAG.DROP, [ATTESTATION]);

    expect(drop.defaultPrevented).toBe(true);
    expect(onFilesAdd).toHaveBeenCalledExactlyOnceWith([ATTESTATION]);
    expect(getGroup().getAttribute("data-dragging")).toBe("false");
  });

  it("ignore le texte ou le lien qu'on glisse au-dessus", () => {
    const onFilesAdd = vi.fn();
    render(<Justificatifs onFilesAdd={onFilesAdd} />);

    drag(DRAG.ENTER, []);
    expect(getGroup().getAttribute("data-dragging")).toBe("false");
    expect(drag(DRAG.OVER, []).defaultPrevented).toBe(false);

    drag(DRAG.DROP, []);
    expect(onFilesAdd).not.toHaveBeenCalled();
  });

  it("affiche un fichier refusé, avec un bouton qui ferme le message", () => {
    const onDismiss = vi.fn();
    render(<Justificatifs onDismiss={onDismiss} />);

    expect(screen.getByText("photo.heic")).toBeDefined();
    expect(screen.getByText("Ce format n’est pas accepté.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Fermer le message sur photo.heic" }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
