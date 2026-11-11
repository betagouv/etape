import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Calendar } from "@etape/ui/components/calendar";

afterEach(cleanup);

const MONTH = new Date(1990, 0);

describe("Calendar", () => {
  it("garde la grille et le focus quand son parent se re-rend", () => {
    const { rerender } = render(<Calendar mode="single" defaultMonth={MONTH} data-render="1" />);
    const day = screen.getByRole("button", { name: /15 janvier 1990/ });
    day.focus();
    const root = document.querySelector("[data-slot=calendar]");

    rerender(<Calendar mode="single" defaultMonth={MONTH} data-render="2" />);

    expect(document.querySelector("[data-slot=calendar]")).toBe(root);
    expect(document.activeElement).toBe(day);
  });

  it("garde le mois affiché quand son parent se re-rend", () => {
    const { rerender } = render(<Calendar mode="single" defaultMonth={MONTH} data-render="1" />);
    fireEvent.click(screen.getByRole("button", { name: "Mois suivant" }));
    expect(screen.getByRole("grid", { name: "février 1990" })).toBeTruthy();

    rerender(<Calendar mode="single" defaultMonth={MONTH} data-render="2" />);

    expect(screen.getByRole("grid", { name: "février 1990" })).toBeTruthy();
  });
});
