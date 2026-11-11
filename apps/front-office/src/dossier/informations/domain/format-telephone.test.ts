import { describe, expect, it } from "vitest";

import { formatTelephone } from "./format-telephone";

describe("formatTelephone", () => {
  it("groupe les chiffres par deux", () => {
    expect(formatTelephone("0612345678")).toBe("06 12 34 56 78");
    expect(formatTelephone("061")).toBe("06 1");
  });

  it("remplace tirets, points et espaces par le groupement", () => {
    expect(formatTelephone("06-12-34-56-78")).toBe("06 12 34 56 78");
    expect(formatTelephone("06.12.34.56.78")).toBe("06 12 34 56 78");
    expect(formatTelephone(" 06 12  34 56 78 ")).toBe("06 12 34 56 78");
  });

  it("tronque à 10 chiffres", () => {
    expect(formatTelephone("061234567899")).toBe("06 12 34 56 78");
  });

  it("ramène un numéro français au format international au format national", () => {
    expect(formatTelephone("+33 6 12 34 56 78")).toBe("06 12 34 56 78");
    expect(formatTelephone("+33612345678")).toBe("06 12 34 56 78");
    expect(formatTelephone("0033612345678")).toBe("06 12 34 56 78");
    expect(formatTelephone("+33 (0)6 12 34 56 78")).toBe("06 12 34 56 78");
  });

  it("garde le préfixe international pendant sa saisie au clavier", () => {
    const typed = "+33612345678";
    let value = "";
    const steps: string[] = [];
    for (const char of typed) {
      value = formatTelephone(value + char);
      steps.push(value);
    }
    expect(steps.slice(0, 4)).toEqual(["+", "+3", "0", "06"]);
    expect(value).toBe("06 12 34 56 78");
  });

  it("garde le préfixe 0033 pendant sa saisie au clavier", () => {
    let value = "";
    for (const char of "0033612345678") value = formatTelephone(value + char);
    expect(value).toBe("06 12 34 56 78");
  });

  it("ne touche pas à un autre indicatif", () => {
    expect(formatTelephone("+32 470 12 34 56")).toBe("32 47 01 23 45");
  });
});
