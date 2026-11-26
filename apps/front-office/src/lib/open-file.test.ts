// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openFile } from "./open-file";

const FILE_URL = "blob:http://localhost/attestation";

describe("openFile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom n'a pas d'adresses d'objet.
    URL.createObjectURL = vi.fn(() => FILE_URL);
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(window, "open").mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("ouvre le fichier dans un nouvel onglet, sans lien vers la page d'origine", () => {
    const file = new File(["x"], "attestation.pdf");

    openFile(file);

    expect(URL.createObjectURL).toHaveBeenCalledExactlyOnceWith(file);
    expect(window.open).toHaveBeenCalledExactlyOnceWith(FILE_URL, "_blank", "noopener");
  });

  it("libère l'adresse du fichier une fois l'onglet chargé, pas avant", () => {
    openFile(new File(["x"], "attestation.pdf"));

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(FILE_URL);
  });
});
