import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@etape/ui/components/input-otp";

afterEach(cleanup);

function renderYear(onChange = vi.fn(), value = "") {
  render(
    <InputOTP maxLength={4} value={value} onChange={onChange} aria-label="Année">
      <InputOTPGroup>
        {[0, 1, 2, 3].map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>,
  );
}

describe("InputOTP", () => {
  it("n'expose qu'un champ, nommé, dont les cases sont masquées", () => {
    renderYear(vi.fn(), "19");

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Année" })).toBeTruthy();
    const group = document.querySelector("[data-slot=input-otp-group]");
    expect(group?.getAttribute("aria-hidden")).toBe("true");
    expect(group?.textContent).toBe("19");
  });

  it("transmet la saisie collée d'un coup", () => {
    const onChange = vi.fn();
    renderYear(onChange);

    fireEvent.change(screen.getByRole("textbox", { name: "Année" }), {
      target: { value: "1990" },
    });

    expect(onChange).toHaveBeenCalledWith("1990");
  });
});
