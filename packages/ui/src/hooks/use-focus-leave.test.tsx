import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFocusLeave } from "@etape/ui/hooks/use-focus-leave";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

interface GroupProps {
  onLeave: () => void;
}

/** Un conteneur à deux champs, dont une liste rendue hors de lui dans la page, et un bouton dehors. */
function Group({ onLeave }: GroupProps) {
  const handlers = useFocusLeave(onLeave);
  return (
    <>
      <div {...handlers}>
        <input aria-label="Premier" />
        <input aria-label="Second" />
        {createPortal(<button type="button">Option de la liste</button>, document.body)}
      </div>
      <button type="button">Dehors</button>
    </>
  );
}

function moveFocus(from: HTMLElement, to: HTMLElement): void {
  fireEvent.blur(from, { relatedTarget: to });
  fireEvent.focus(to, { relatedTarget: from });
}

describe("useFocusLeave", () => {
  it("ne prévient pas quand le focus passe d'un champ à l'autre du conteneur", () => {
    const onLeave = vi.fn();
    render(<Group onLeave={onLeave} />);
    const first = screen.getByLabelText("Premier");
    fireEvent.focus(first);

    moveFocus(first, screen.getByLabelText("Second"));
    vi.runAllTimers();

    expect(onLeave).not.toHaveBeenCalled();
  });

  it("ne prévient pas quand le focus passe dans une liste rendue ailleurs dans la page", () => {
    const onLeave = vi.fn();
    render(<Group onLeave={onLeave} />);
    const first = screen.getByLabelText("Premier");
    fireEvent.focus(first);

    moveFocus(first, screen.getByRole("button", { name: "Option de la liste" }));
    vi.runAllTimers();

    expect(onLeave).not.toHaveBeenCalled();
  });

  it("prévient une fois quand le focus sort du conteneur", () => {
    const onLeave = vi.fn();
    render(<Group onLeave={onLeave} />);
    const first = screen.getByLabelText("Premier");
    fireEvent.focus(first);

    moveFocus(first, screen.getByRole("button", { name: "Dehors" }));
    vi.runAllTimers();

    expect(onLeave).toHaveBeenCalledOnce();
  });

  it("ne prévient plus après le démontage", () => {
    const onLeave = vi.fn();
    const { unmount } = render(<Group onLeave={onLeave} />);
    const first = screen.getByLabelText("Premier");
    fireEvent.focus(first);
    fireEvent.blur(first);

    unmount();
    vi.runAllTimers();

    expect(onLeave).not.toHaveBeenCalled();
  });
});
