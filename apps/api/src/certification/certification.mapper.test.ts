import { describe, expect, it } from "vitest";

import { toSearchCertificationsResponse } from "./certification.mapper.js";
import { REPERTOIRE_CERTIFICATION, STATUT_CERTIFICATION } from "./certification.types.js";

describe("toSearchCertificationsResponse", () => {
  it("ne laisse sortir que les champs du contrat", () => {
    const certificateur = { siret: "11000007200014", nom: "Ministère de l'Éducation nationale" };
    const certificateurWithExtraField = { ...certificateur, statut: STATUT_CERTIFICATION.ACTIVE };
    const response = toSearchCertificationsResponse({
      certificationCount: 3,
      certifications: [
        {
          numeroFiche: "RNCP41937",
          repertoire: REPERTOIRE_CERTIFICATION.RNCP,
          intitule: "Boulanger",
          abrege: "BP",
          niveau: 4,
          certificateurs: [certificateurWithExtraField],
        },
      ],
    });

    expect(response).toEqual({
      certificationCount: 3,
      certifications: [
        {
          numeroFiche: "RNCP41937",
          repertoire: REPERTOIRE_CERTIFICATION.RNCP,
          intitule: "Boulanger",
          abrege: "BP",
          niveau: 4,
          certificateurs: [certificateur],
        },
      ],
    });
  });
});
