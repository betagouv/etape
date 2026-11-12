import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useListboxNavigation } from "@etape/ui/hooks/use-listbox-navigation";
import { KEY } from "@etape/ui/lib/keys";

const REGIONS = ["Bretagne", "Corse", "Normandie"];

interface HarnessProps {
  items?: string[];
  isOpen?: boolean;
  onSelect?: (item: string) => void;
  onEscape?: () => void;
}

function Harness({ items = REGIONS, isOpen, onSelect = vi.fn(), onEscape }: HarnessProps) {
  const navigation = useListboxNavigation({
    items,
    optionId: (item) => item,
    isOpen,
    onSelect,
    onEscape,
  });

  return (
    <>
      <input
        aria-label="Votre région"
        aria-activedescendant={navigation.active ?? undefined}
        onKeyDown={navigation.onKeyDown}
      />
      <ul>
        {items.map((item) => (
          <li key={item} id={item}>
            {item}
          </li>
        ))}
      </ul>
      <button type="button" onClick={navigation.reset}>
        Effacer
      </button>
    </>
  );
}

function getInput(): HTMLElement {
  return screen.getByRole("textbox", { name: "Votre région" });
}

/** Vrai quand la touche a été laissée au navigateur (aucun `preventDefault`). */
function press(key: string): boolean {
  return fireEvent.keyDown(getInput(), { key });
}

function getActive(): string | null {
  return getInput().getAttribute("aria-activedescendant");
}

beforeEach(() => {
  // jsdom ne fait pas défiler.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

describe("useListboxNavigation", () => {
  it("désigne la première option à la flèche bas et s'arrête à la dernière", () => {
    render(<Harness />);

    expect(getActive()).toBeNull();
    press(KEY.ARROW_DOWN);
    expect(getActive()).toBe("Bretagne");
    press(KEY.ARROW_DOWN);
    press(KEY.ARROW_DOWN);
    press(KEY.ARROW_DOWN);
    expect(getActive()).toBe("Normandie");
  });

  it("reboucle sur la dernière option à la flèche haut, sans option désignée comme depuis la première", () => {
    render(<Harness />);

    press(KEY.ARROW_UP);
    expect(getActive()).toBe("Normandie");
    press(KEY.ARROW_UP);
    press(KEY.ARROW_UP);
    expect(getActive()).toBe("Bretagne");
    press(KEY.ARROW_UP);
    expect(getActive()).toBe("Normandie");
  });

  it("fait défiler la liste jusqu'à l'option désignée, sans déplacer le curseur du champ", () => {
    render(<Harness />);

    expect(press(KEY.ARROW_DOWN)).toBe(false);
    expect(document.getElementById("Bretagne")?.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
    });
  });

  it("choisit l'option désignée à Entrée, sans envoyer le formulaire", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    press(KEY.ARROW_DOWN);
    expect(press(KEY.ENTER)).toBe(false);
    expect(onSelect).toHaveBeenCalledWith("Bretagne");
    expect(getActive()).toBeNull();
  });

  it("laisse Entrée au formulaire quand aucune option n'est désignée", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    expect(press(KEY.ENTER)).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("ne désigne ni ne choisit une option masquée quand la liste est fermée", () => {
    const onSelect = vi.fn();
    const { rerender } = render(<Harness onSelect={onSelect} />);

    press(KEY.ARROW_DOWN);
    rerender(<Harness onSelect={onSelect} isOpen={false} />);
    expect(press(KEY.ENTER)).toBe(true);
    expect(press(KEY.ARROW_DOWN)).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
    expect(getActive()).toBe("Bretagne");
  });

  it("à Échap, ne désigne plus d'option et prévient l'appelant, liste ouverte ou non", () => {
    const onEscape = vi.fn();
    const { rerender } = render(<Harness onEscape={onEscape} />);

    press(KEY.ARROW_DOWN);
    press(KEY.ESCAPE);
    expect(getActive()).toBeNull();
    expect(onEscape).toHaveBeenCalledTimes(1);

    rerender(<Harness onEscape={onEscape} isOpen={false} />);
    press(KEY.ESCAPE);
    expect(onEscape).toHaveBeenCalledTimes(2);
  });

  it("ne désigne plus une option disparue de la liste", () => {
    const { rerender } = render(<Harness />);

    press(KEY.ARROW_DOWN);
    rerender(<Harness items={["Corse", "Normandie"]} />);
    expect(getActive()).toBeNull();
    press(KEY.ARROW_DOWN);
    expect(getActive()).toBe("Corse");
  });

  it("ne désigne plus d'option après une remise à zéro", () => {
    render(<Harness />);

    press(KEY.ARROW_DOWN);
    fireEvent.click(screen.getByRole("button", { name: "Effacer" }));
    expect(getActive()).toBeNull();
  });
});
