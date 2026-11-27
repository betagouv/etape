import { describe, expect, it } from "vitest";

import { joinAnnouncements } from "./join-announcements";

describe("joinAnnouncements", () => {
  it("met les annonces bout à bout, séparées d'une espace", () => {
    expect(joinAnnouncements("programme.pdf ajouté.", "Mes documents : complet.")).toBe(
      "programme.pdf ajouté. Mes documents : complet.",
    );
  });

  it("omet les annonces vides", () => {
    expect(joinAnnouncements("", "programme.pdf retiré.", "")).toBe("programme.pdf retiré.");
    expect(joinAnnouncements("", "")).toBe("");
  });
});
