import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Criterion, CRITERION_STATUS } from "@etape/ui/components/criterion";

afterEach(cleanup);

describe("Criterion", () => {
  it.each([
    [CRITERION_STATUS.MET, "satisfait"],
    [CRITERION_STATUS.UNMET, "non satisfait"],
  ])("lit le libellé puis l'état %s, sans la pastille", (status, statusLabel) => {
    render(
      <ul>
        <Criterion status={status} statusLabel={statusLabel}>
          12 caractères
        </Criterion>
      </ul>,
    );

    const item = screen.getByRole("listitem");
    expect(item.dataset.status).toBe(status);
    expect(item.textContent).toBe(`12 caractères${statusLabel}`);
    expect(item.querySelector('[data-slot="criterion-mark"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});
