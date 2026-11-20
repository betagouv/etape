// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadFile } from "./download-file";

const FILE_URL = "blob:http://localhost/compte-rendu";

describe("downloadFile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom n'a pas d'adresses d'objet.
    URL.createObjectURL = vi.fn(() => FILE_URL);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("télécharge le fichier sous son propre nom, puis libère son adresse", () => {
    const file = new File(["x"], "compte-rendu été.docx");
    const clicked: { href: string; download: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });

    downloadFile(file);

    expect(URL.createObjectURL).toHaveBeenCalledExactlyOnceWith(file);
    expect(clicked).toEqual([{ href: FILE_URL, download: "compte-rendu été.docx" }]);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(FILE_URL);
  });
});
