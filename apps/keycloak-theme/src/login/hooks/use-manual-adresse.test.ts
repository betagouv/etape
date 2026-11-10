// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { findCommunes } from "../components/adresse/adresse-api";
import {
  COMMUNES_STATUS,
  findFirstMissingField,
  MANUAL_FIELD_ID,
  useManualAdresse,
} from "./use-manual-adresse";

vi.mock("../components/adresse/adresse-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../components/adresse/adresse-api")>()),
  findCommunes: vi.fn(),
}));

const FIELDS = {
  numeroVoie: "",
  typeVoie: "Rue",
  nomVoie: "Victor Hugo",
  complement: "",
  codePostal: "33124",
};
const COMMUNES = [{ nom: "Aillas", code: "33002" }];

describe("findFirstMissingField", () => {
  it("suit l'ordre du formulaire, sans exiger le numéro", () => {
    expect(findFirstMissingField({ ...FIELDS, typeVoie: " " }, COMMUNES, false)).toBe(
      MANUAL_FIELD_ID.TYPE_VOIE,
    );
    expect(findFirstMissingField({ ...FIELDS, nomVoie: "" }, COMMUNES, false)).toBe(
      MANUAL_FIELD_ID.NOM_VOIE,
    );
    expect(findFirstMissingField({ ...FIELDS, codePostal: "331" }, [], false)).toBe(
      MANUAL_FIELD_ID.CODE_POSTAL,
    );
    expect(findFirstMissingField(FIELDS, COMMUNES, false)).toBe(MANUAL_FIELD_ID.COMMUNE);
  });

  it("renvoie au code postal quand il ne correspond à aucune commune", () => {
    expect(findFirstMissingField(FIELDS, [], false)).toBe(MANUAL_FIELD_ID.CODE_POSTAL);
  });

  it("ne signale rien quand tout est rempli", () => {
    expect(findFirstMissingField(FIELDS, COMMUNES, true)).toBeUndefined();
  });
});

const AJACCIO = { nom: "Ajaccio", code: "2A004" };
const BUXEUIL = { nom: "Buxeuil", code: "86042" };
const DESCARTES = { nom: "Descartes", code: "37115" };

const communes = vi.mocked(findCommunes);

const flush = (): Promise<void> =>
  act(async () => {
    await vi.runAllTimersAsync();
  });

describe("useManualAdresse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    communes.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("ne garde que les chiffres du code postal avant de chercher ses communes", async () => {
    communes.mockResolvedValue([BUXEUIL, DESCARTES]);
    const { result } = renderHook(() => useManualAdresse());

    act(() => result.current.changeCodePostal("37 160"));
    expect(result.current.fields.codePostal).toBe("37160");
    expect(result.current.communesStatus).toBe(COMMUNES_STATUS.LOADING);

    await flush();
    expect(communes).toHaveBeenCalledWith("37160", expect.any(AbortSignal));
    expect(result.current.communesStatus).toBe(COMMUNES_STATUS.READY);
    expect(result.current.codeCommune).toBe("");
  });

  it("choisit d'office la seule commune d'un code postal", async () => {
    communes.mockResolvedValue([AJACCIO]);
    const { result } = renderHook(() => useManualAdresse());

    act(() => result.current.changeCodePostal("20000"));
    await flush();

    expect(result.current.codeCommune).toBe(AJACCIO.code);
  });

  it("ignore la réponse d'un code postal modifié entre-temps", async () => {
    communes.mockResolvedValue([AJACCIO]);
    const { result } = renderHook(() => useManualAdresse());

    act(() => result.current.changeCodePostal("20000"));
    act(() => result.current.changeCodePostal("2000"));
    await flush();

    expect(communes).not.toHaveBeenCalled();
    expect(result.current.communesStatus).toBe(COMMUNES_STATUS.IDLE);
    expect(result.current.communes).toEqual([]);
  });

  it("passe en indisponible sur échec, puis réessaie", async () => {
    communes.mockRejectedValueOnce(new Error("panne")).mockResolvedValueOnce([AJACCIO]);
    const { result } = renderHook(() => useManualAdresse());

    act(() => result.current.changeCodePostal("20000"));
    await flush();
    expect(result.current.communesStatus).toBe(COMMUNES_STATUS.UNAVAILABLE);

    act(() => result.current.retryCommunes());
    await flush();
    expect(communes).toHaveBeenCalledTimes(2);
    expect(result.current.communesStatus).toBe(COMMUNES_STATUS.READY);
  });
});
