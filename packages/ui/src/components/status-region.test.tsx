import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatusRegion } from "@etape/ui/components/status-region";

afterEach(cleanup);

describe("StatusRegion", () => {
  it("reste montée au repos, vide, et prend chaque nouveau message", () => {
    const { rerender } = render(<StatusRegion message="" />);
    const region = screen.getByRole("status");

    expect(region.textContent).toBe("");

    rerender(<StatusRegion message="Votre session est prolongée." />);

    expect(screen.getByRole("status")).toBe(region);
    expect(region.textContent).toBe("Votre session est prolongée.");
  });
});
