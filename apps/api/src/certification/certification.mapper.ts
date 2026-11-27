import type { SearchCertificationsResponse } from "@etape/api-contract";

import type { CertificationSearchResult } from "./certification.types.js";

export function toSearchCertificationsResponse(
  result: CertificationSearchResult,
): SearchCertificationsResponse {
  return {
    certificationCount: result.certificationCount,
    certifications: result.certifications.map(
      ({ numeroFiche, repertoire, intitule, abrege, niveau, certificateurs }) => ({
        numeroFiche,
        repertoire,
        intitule,
        abrege,
        niveau,
        certificateurs: certificateurs.map(({ siret, nom }) => ({ siret, nom })),
      }),
    ),
  };
}
