import type { SearchAppellationsRomeResponse } from "@etape/api-contract";

import type { AppellationRomeSearchResult } from "./metier-rome.types.js";

export function toSearchAppellationsRomeResponse(
  result: AppellationRomeSearchResult,
): SearchAppellationsRomeResponse {
  return {
    appellationRomeCount: result.appellationRomeCount,
    appellationsRome: result.appellationsRome.map(({ code, libelle, metierRome }) => ({
      code,
      libelle,
      metierRome: { code: metierRome.code, libelle: metierRome.libelle },
    })),
  };
}
