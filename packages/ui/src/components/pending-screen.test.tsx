import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PendingScreen } from "@etape/ui/components/pending-screen";

afterEach(cleanup);

describe("PendingScreen", () => {
  it("annonce l'attente dans une région de statut", () => {
    render(<PendingScreen message="Vérification de votre session…" />);

    expect(screen.getByRole("status").textContent).toBe("Vérification de votre session…");
  });
});
