import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EditRemoveActions } from "@etape/ui/components/edit-remove-actions";

afterEach(cleanup);

const EDIT_LABEL = "Modifier la démarche 1";
const REMOVE_LABEL = "Supprimer la démarche 1";

describe("EditRemoveActions", () => {
  it("affiche « Modifier » puis la corbeille, sous leurs noms accessibles", () => {
    render(
      <EditRemoveActions
        edit={{ label: "Modifier", accessibleLabel: EDIT_LABEL, onClick: vi.fn() }}
        remove={{ accessibleLabel: REMOVE_LABEL, onClick: vi.fn() }}
      />,
    );

    const [edit, remove] = screen.getAllByRole("button");
    expect(edit?.textContent).toBe("Modifier");
    expect(edit?.getAttribute("aria-label")).toBe(EDIT_LABEL);
    expect(remove?.getAttribute("aria-label")).toBe(REMOVE_LABEL);
  });

  it("transmet chaque clic à son action", () => {
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    render(
      <EditRemoveActions
        edit={{ label: "Modifier", accessibleLabel: EDIT_LABEL, onClick: onEdit }}
        remove={{ accessibleLabel: REMOVE_LABEL, onClick: onRemove }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: EDIT_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: REMOVE_LABEL }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("grise « Modifier » sans le désactiver, et le relie au texte qui dit pourquoi", () => {
    const onEdit = vi.fn();
    render(
      <>
        <EditRemoveActions
          edit={{
            label: "Modifier",
            accessibleLabel: EDIT_LABEL,
            onClick: onEdit,
            isDisabled: true,
            describedBy: "raison",
          }}
          remove={{ accessibleLabel: REMOVE_LABEL, onClick: vi.fn() }}
        />
        <p id="raison">Validez d’abord la démarche en cours.</p>
      </>,
    );
    const edit = screen.getByRole("button", { name: EDIT_LABEL });

    expect(edit.getAttribute("aria-disabled")).toBe("true");
    expect(edit.getAttribute("aria-describedby")).toBe("raison");
    expect(edit).toHaveProperty("disabled", false);

    fireEvent.click(edit);
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("donne à l'écran la référence de chaque bouton", () => {
    const editRef = { current: null as HTMLButtonElement | null };
    const removeRef = { current: null as HTMLButtonElement | null };
    render(
      <EditRemoveActions
        edit={{ label: "Modifier", accessibleLabel: EDIT_LABEL, onClick: vi.fn() }}
        remove={{ accessibleLabel: REMOVE_LABEL, onClick: vi.fn() }}
        editRef={editRef}
        removeRef={removeRef}
      />,
    );

    expect(editRef.current).toBe(screen.getByRole("button", { name: EDIT_LABEL }));
    expect(removeRef.current).toBe(screen.getByRole("button", { name: REMOVE_LABEL }));
  });
});
