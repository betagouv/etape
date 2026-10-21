import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { useAnnounce, useAnnouncement } from "./announcer";

afterEach(cleanup);

function Region() {
  return <p role="status">{useAnnouncement()}</p>;
}

function Screen({ message, children }: { message: string; children?: ReactNode }) {
  useAnnounce(message);
  return <>{children}</>;
}

describe("useAnnounce", () => {
  it("garde l'annonce d'un écran enfant quand son parent n'a rien à dire", () => {
    render(
      <>
        <Screen message="">
          <Screen message="Page introuvable." />
        </Screen>
        <Region />
      </>,
    );

    expect(screen.getByRole("status").textContent).toBe("Page introuvable.");
  });

  it("vide la région quand l'écran qui l'a remplie disparaît", () => {
    const { rerender } = render(
      <>
        <Screen message="Page introuvable." />
        <Region />
      </>,
    );

    rerender(<Region />);

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("annonce de nouveau un écran qui revient", () => {
    const { rerender } = render(
      <>
        <Screen message="Page introuvable." />
        <Region />
      </>,
    );
    rerender(<Region />);
    rerender(
      <>
        <Screen message="Page introuvable." />
        <Region />
      </>,
    );

    expect(screen.getByRole("status").textContent).toBe("Page introuvable.");
  });
});
