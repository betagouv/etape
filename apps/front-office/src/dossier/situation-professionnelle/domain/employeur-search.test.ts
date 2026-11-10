import { describe, expect, it } from "vitest";

import {
  findSearchAnnouncement,
  findSearchStatus,
  NO_RESULT_TITLE,
  RETRYING_ANNOUNCEMENT,
  SEARCH_ERROR_TITLE,
  SEARCH_STATUS,
} from "./employeur-search";

describe("findSearchStatus", () => {
  it("reste au repos tant que la saisie est trop courte, même avec une réponse en mémoire", () => {
    expect(findSearchStatus(false, false, false, 12)).toBe(SEARCH_STATUS.IDLE);
    expect(findSearchStatus(false, true, false)).toBe(SEARCH_STATUS.IDLE);
  });

  it("reste au repos tant qu'aucune réponse n'est arrivée", () => {
    expect(findSearchStatus(true, false, true)).toBe(SEARCH_STATUS.IDLE);
  });

  it("distingue une recherche sans résultat d'une recherche qui en a", () => {
    expect(findSearchStatus(true, false, false, 0)).toBe(SEARCH_STATUS.NO_RESULT);
    expect(findSearchStatus(true, false, false, 1)).toBe(SEARCH_STATUS.RESULTS);
  });

  it("garde les résultats affichés pendant l'appel suivant", () => {
    expect(findSearchStatus(true, false, true, 20)).toBe(SEARCH_STATUS.RESULTS);
  });

  it("fait passer l'échec avant les résultats de la recherche précédente", () => {
    expect(findSearchStatus(true, true, false, 20)).toBe(SEARCH_STATUS.ERROR);
  });

  it("garde l'alerte d'erreur pendant la relance", () => {
    expect(findSearchStatus(true, true, true)).toBe(SEARCH_STATUS.RETRYING);
  });
});

describe("findSearchAnnouncement", () => {
  const LABEL = "20 établissements trouvés sur 45 451";
  const MORE = "Précisez votre recherche pour voir les autres établissements.";

  it("n'annonce rien au repos", () => {
    expect(findSearchAnnouncement(SEARCH_STATUS.IDLE, LABEL, MORE)).toBe("");
  });

  it("annonce le compte des résultats, suivi de l'invitation à préciser quand la liste est partielle", () => {
    expect(findSearchAnnouncement(SEARCH_STATUS.RESULTS, LABEL, MORE)).toBe(`${LABEL} ${MORE}`);
    expect(findSearchAnnouncement(SEARCH_STATUS.RESULTS, "3 établissements trouvés", "")).toBe(
      "3 établissements trouvés",
    );
  });

  it("annonce le titre de l'alerte affichée, pas le compte", () => {
    expect(findSearchAnnouncement(SEARCH_STATUS.NO_RESULT, LABEL, MORE)).toBe(NO_RESULT_TITLE);
    expect(findSearchAnnouncement(SEARCH_STATUS.ERROR, LABEL, MORE)).toBe(SEARCH_ERROR_TITLE);
  });

  it("annonce la relance en cours", () => {
    expect(findSearchAnnouncement(SEARCH_STATUS.RETRYING, LABEL, MORE)).toBe(RETRYING_ANNOUNCEMENT);
  });
});
