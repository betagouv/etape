import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Progress } from "@etape/ui/components/progress";

afterEach(cleanup);

describe("Progress", () => {
  it("expose sa valeur et sa lecture au lecteur d'écran", () => {
    render(
      <Progress
        value={40}
        aria-label="Progression du questionnaire"
        getValueLabel={() => "Question 2 sur environ 5"}
      />,
    );

    const bar = screen.getByRole("progressbar", { name: "Progression du questionnaire" });
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.getAttribute("aria-valuetext")).toBe("Question 2 sur environ 5");
  });
});
