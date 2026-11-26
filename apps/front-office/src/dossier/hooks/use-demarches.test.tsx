// @vitest-environment jsdom
import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  currentDemarcheSchema,
  DEMARCHE_REQUIRED_MESSAGES,
  demarcheSchema,
} from "../demarche-schema";
import {
  findOpenDemarcheFields,
  NOMBRE_MAX_DEMARCHES,
  TYPE_DEMARCHE_AUTRE,
  type Demarche,
} from "../domain/demarche";
import { OUI_NON } from "../domain/oui-non";
import { requireFilled } from "../domain/require-filled";
import { VOLET_FORM_OPTIONS } from "../volet-form-options";
import { useDemarches, type DemarchesFieldNames, type UseDemarchesResult } from "./use-demarches";

afterEach(cleanup);

/** La liste des types d'un volet, réduite à ce que le hook distingue. */
const TYPE_DEMARCHE = {
  IMMERSION: "immersion",
  SALON: "salon",
  AUTRE: TYPE_DEMARCHE_AUTRE,
} as const;

type TypeDemarche = (typeof TYPE_DEMARCHE)[keyof typeof TYPE_DEMARCHE];

const AUTRE_CHAMP_MESSAGE = "Veuillez remplir l’autre champ.";

/** Le formulaire d'un volet réduit à sa question, ses démarches et un autre champ exigé. */
const schema = z
  .object({
    answer: z.enum(OUI_NON).optional(),
    autreChamp: z.string(),
    typeDemarche: z.enum(TYPE_DEMARCHE).optional(),
    ...currentDemarcheSchema.shape,
    demarches: z.array(demarcheSchema.extend({ typeDemarche: z.enum(TYPE_DEMARCHE) })),
  })
  .superRefine((data, ctx) => {
    requireFilled(ctx, data, ["autreChamp"], { autreChamp: AUTRE_CHAMP_MESSAGE });
    requireFilled(ctx, data, findOpenDemarcheFields(data.answer, data), DEMARCHE_REQUIRED_MESSAGES);
  });

type FormData = z.infer<typeof schema>;

const FIELD = {
  ANSWER: "answer",
  TYPE_DEMARCHE: "typeDemarche",
  PRECISION_TYPE_DEMARCHE: "precisionTypeDemarche",
  APPORT_DEMARCHE: "apportDemarche",
  PIECES_JUSTIFICATIVES: "piecesJustificatives",
  HAS_CURRENT_DEMARCHE: "hasCurrentDemarche",
  CURRENT_DEMARCHE_ID: "currentDemarcheId",
  DEMARCHES: "demarches",
} as const satisfies Record<string, keyof FormData>;

const FIELDS: DemarchesFieldNames<FormData, TypeDemarche> = {
  answer: FIELD.ANSWER,
  typeDemarche: FIELD.TYPE_DEMARCHE,
  precisionTypeDemarche: FIELD.PRECISION_TYPE_DEMARCHE,
  apportDemarche: FIELD.APPORT_DEMARCHE,
  piecesJustificatives: FIELD.PIECES_JUSTIFICATIVES,
};

interface Result extends UseDemarchesResult<TypeDemarche> {
  form: UseFormReturn<FormData>;
  errors: FieldErrors<FormData>;
}

/** Le formulaire et ses démarches, reliés comme le fait un volet. */
function useVoletDemarches(): Result {
  const form = useForm<FormData>({
    ...VOLET_FORM_OPTIONS,
    resolver: zodResolver(schema),
    defaultValues: {
      answer: undefined,
      autreChamp: "",
      typeDemarche: undefined,
      precisionTypeDemarche: "",
      apportDemarche: "",
      piecesJustificatives: [],
      hasCurrentDemarche: true,
      currentDemarcheId: null,
      demarches: [],
    },
  });
  const demarches = useDemarches(form, {
    fields: FIELDS,
    readAnswer: (values) => values.answer,
    setAnswer: (answer, options) => form.setValue(FIELD.ANSWER, answer, options),
    setDemarches: (nextDemarches) => form.setValue(FIELD.DEMARCHES, nextDemarches),
    setCurrentDemarche: (current, demarcheId) => {
      form.setValue(FIELD.CURRENT_DEMARCHE_ID, demarcheId);
      form.setValue(FIELD.TYPE_DEMARCHE, current.typeDemarche);
      form.setValue(FIELD.PRECISION_TYPE_DEMARCHE, current.precisionTypeDemarche);
      form.setValue(FIELD.APPORT_DEMARCHE, current.apportDemarche);
      form.setValue(FIELD.PIECES_JUSTIFICATIVES, current.piecesJustificatives);
    },
    setHasCurrentDemarche: (hasCurrentDemarche) =>
      form.setValue(FIELD.HAS_CURRENT_DEMARCHE, hasCurrentDemarche),
  });
  // Lues au rendu, comme le fait un volet : react-hook-form ne tient à jour que ce qui est lu.
  return { form, errors: form.formState.errors, ...demarches };
}

/** « Oui » répondu et saisie en cours remplie de `values`. */
function renderDemarches(values: Partial<FormData> = {}): { current: Result } {
  const { result } = renderHook(() => useVoletDemarches());
  act(() => {
    const { form } = result.current;
    form.reset({ ...form.getValues(), answer: OUI_NON.OUI, ...values });
  });
  return result;
}

const IMMERSION: Partial<FormData> = {
  typeDemarche: TYPE_DEMARCHE.IMMERSION,
  apportDemarche: "J’ai vérifié que je tenais ce rythme.",
};

function createDemarches(count: number): Demarche<TypeDemarche>[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    typeDemarche: TYPE_DEMARCHE.SALON,
    precisionTypeDemarche: "",
    apportDemarche: "J’ai rencontré trois artisans.",
    piecesJustificatives: [],
  }));
}

describe("useDemarches", () => {
  it("part d'une carte de saisie ouverte, bouton de validation grisé", () => {
    const result = renderDemarches();

    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.isCurrentDemarcheFilled).toBe(false);
  });

  it("montre ce qui manque quand on valide une saisie incomplète, sans rien ajouter", async () => {
    const result = renderDemarches({ typeDemarche: TYPE_DEMARCHE.AUTRE });

    await act(() => result.current.validateDemarche());

    const { errors } = result.current;
    expect(errors.precisionTypeDemarche?.message).toBe("Veuillez préciser le type de démarche.");
    expect(errors.apportDemarche?.message).toBe(
      "Veuillez indiquer ce que la démarche vous a apporté.",
    );
    // Les autres champs du volet, vides eux aussi, ne sont pas signalés par ce bouton.
    expect(errors.autreChamp).toBeUndefined();
    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
  });

  it("valide la saisie : la démarche rejoint la liste, la carte se referme et la saisie se vide", async () => {
    const result = renderDemarches(IMMERSION);
    expect(result.current.isCurrentDemarcheFilled).toBe(true);

    await act(() => result.current.validateDemarche());

    expect(result.current.demarches).toHaveLength(1);
    expect(result.current.demarches[0]).toMatchObject({
      typeDemarche: TYPE_DEMARCHE.IMMERSION,
      apportDemarche: "J’ai vérifié que je tenais ce rythme.",
    });
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.announcement).toBe("Démarche 1 enregistrée.");
    expect(result.current.form.getValues()).toMatchObject({
      typeDemarche: undefined,
      precisionTypeDemarche: "",
      apportDemarche: "",
      piecesJustificatives: [],
    });
  });

  it("fait ressortir la carte d'une démarche de plus, jusqu'à ce que le focus la quitte", async () => {
    const result = renderDemarches(IMMERSION);
    expect(result.current.isHighlighted).toBe(false);
    expect(result.current.canCancel).toBe(false);
    await act(() => result.current.validateDemarche());

    act(() => result.current.addDemarche());
    expect(result.current.isHighlighted).toBe(true);
    expect(result.current.canCancel).toBe(true);

    act(() => result.current.removeHighlight());
    expect(result.current.isHighlighted).toBe(false);
  });

  it("annule la saisie d'une démarche de plus : carte refermée, saisie et erreurs effacées, sans toucher aux démarches validées", async () => {
    const result = renderDemarches(IMMERSION);
    await act(() => result.current.validateDemarche());
    act(() => result.current.addDemarche());
    act(() => result.current.form.setValue(FIELD.TYPE_DEMARCHE, TYPE_DEMARCHE.AUTRE));
    await act(() => result.current.validateDemarche());
    expect(result.current.errors.apportDemarche).toBeDefined();

    act(() => result.current.cancelDemarche());

    expect(result.current.demarches).toHaveLength(1);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.isHighlighted).toBe(false);
    expect(result.current.announcement).toBe("Saisie de la démarche 2 annulée.");
    expect(result.current.form.getValues(FIELD.TYPE_DEMARCHE)).toBeUndefined();
    expect(result.current.errors.apportDemarche).toBeUndefined();
  });

  it("rouvre une démarche validée en saisie, préremplie, à son rang", () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });

    act(() => result.current.editDemarche(salon));

    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.currentDemarcheId).toBe(salon.id);
    expect(result.current.currentDemarcheIndex).toBe(0);
    expect(result.current.canCancel).toBe(true);
    expect(result.current.isHighlighted).toBe(false);
    expect(result.current.form.getValues()).toMatchObject({
      typeDemarche: TYPE_DEMARCHE.SALON,
      apportDemarche: "J’ai rencontré trois artisans.",
    });
  });

  it("valide une modification : la démarche est mise à jour à sa place, sans en ajouter", async () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });
    act(() => result.current.editDemarche(salon));
    act(() => result.current.form.setValue(FIELD.APPORT_DEMARCHE, "J’en ai rencontré cinq."));

    await act(() => result.current.validateDemarche());

    expect(result.current.demarches).toEqual([
      { ...salon, apportDemarche: "J’en ai rencontré cinq." },
      autre,
    ]);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.currentDemarcheId).toBeNull();
    expect(result.current.announcement).toBe("Démarche 1 modifiée.");
    expect(result.current.form.getValues(FIELD.APPORT_DEMARCHE)).toBe("");
  });

  it("annule une modification : la démarche reste telle qu'elle était", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });
    act(() => result.current.editDemarche(demarches[1]));
    act(() => result.current.form.setValue(FIELD.APPORT_DEMARCHE, "Autre chose."));

    act(() => result.current.cancelDemarche());

    expect(result.current.demarches).toEqual(demarches);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.currentDemarcheId).toBeNull();
    expect(result.current.announcement).toBe("Modification de la démarche 2 annulée.");
  });

  it("ne rouvre pas une démarche tant qu'une autre saisie est ouverte, et dit quoi faire d'abord", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], ...IMMERSION });

    act(() => result.current.editDemarche(salon));

    expect(result.current.currentDemarcheId).toBeNull();
    expect(result.current.blockedDemarcheId).toBe(salon.id);
    expect(result.current.announcement).toBe(
      "Validez ou annulez la démarche en cours avant de modifier celle-ci.",
    );
    // La saisie en cours n'a pas bougé.
    expect(result.current.form.getValues(FIELD.TYPE_DEMARCHE)).toBe(TYPE_DEMARCHE.IMMERSION);

    act(() => result.current.cancelDemarche());
    expect(result.current.blockedDemarcheId).toBeNull();
  });

  it("demande confirmation avant de supprimer une démarche, et ne touche à rien si on abandonne", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });

    act(() => result.current.requestRemoval(demarches[1]));
    expect(result.current.isRemovalOpen).toBe(true);
    expect(result.current.removal).toEqual({
      items: [{ demarche: demarches[1], index: 1 }],
      isAnswerNon: false,
      isCurrentDemarcheRemoved: false,
    });

    act(() => result.current.cancelRemoval());
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.demarches).toEqual(demarches);
  });

  it("supprime la démarche confirmée, une seule, et l'annonce par son rang", () => {
    const [salon, autre, derniere] = createDemarches(3);
    const result = renderDemarches({
      demarches: [salon, autre, derniere],
      hasCurrentDemarche: false,
    });
    act(() => result.current.requestRemoval(autre));

    act(() => result.current.confirmRemoval());

    expect(result.current.demarches).toEqual([salon, derniere]);
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.announcement).toBe("Démarche 2 supprimée.");
  });

  it("rouvre la saisie de la première démarche quand la dernière est supprimée", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], hasCurrentDemarche: false });
    act(() => result.current.requestRemoval(salon));

    act(() => result.current.confirmRemoval());

    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.currentDemarcheIndex).toBe(0);
    expect(result.current.canCancel).toBe(false);
  });

  it("supprime une démarche sans toucher à la saisie en cours", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], ...IMMERSION });
    act(() => result.current.requestRemoval(salon));

    act(() => result.current.confirmRemoval());

    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.form.getValues(FIELD.TYPE_DEMARCHE)).toBe(TYPE_DEMARCHE.IMMERSION);
  });

  /** Le formulaire reçoit la réponse, puis le hook en est prévenu, comme le fait `FormRadioGroup`. */
  function answer(result: { current: Result }, value: NonNullable<FormData["answer"]>): void {
    act(() => {
      result.current.form.setValue(FIELD.ANSWER, value);
      result.current.changeAnswer(value);
    });
  }

  it("fait confirmer un « non » qui emporterait des démarches validées : la réponse reste « oui »", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });

    answer(result, OUI_NON.NON);

    expect(result.current.form.getValues(FIELD.ANSWER)).toBe(OUI_NON.OUI);
    expect(result.current.isRemovalOpen).toBe(true);
    expect(result.current.removal).toEqual({
      items: [
        { demarche: demarches[0], index: 0 },
        { demarche: demarches[1], index: 1 },
      ],
      isAnswerNon: true,
      isCurrentDemarcheRemoved: false,
    });

    act(() => result.current.cancelRemoval());
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.form.getValues(FIELD.ANSWER)).toBe(OUI_NON.OUI);
    expect(result.current.demarches).toEqual(demarches);
  });

  it("prévient qu'un « non » emporte aussi une saisie commencée, puis la supprime avec les démarches", () => {
    const result = renderDemarches({ demarches: createDemarches(1), ...IMMERSION });

    answer(result, OUI_NON.NON);
    expect(result.current.removal?.isCurrentDemarcheRemoved).toBe(true);

    act(() => result.current.confirmRemoval());
    expect(result.current.form.getValues()).toMatchObject({
      demarches: [],
      typeDemarche: undefined,
      apportDemarche: "",
    });
  });

  it("ne prévient pas pour une carte de saisie ouverte mais vide, ni pour une modification en cours", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon] });

    answer(result, OUI_NON.NON);
    expect(result.current.removal?.isCurrentDemarcheRemoved).toBe(false);

    act(() => result.current.cancelRemoval());
    act(() => result.current.cancelDemarche());
    act(() => result.current.editDemarche(salon));
    answer(result, OUI_NON.NON);
    expect(result.current.removal?.isCurrentDemarcheRemoved).toBe(false);
  });

  it("supprime toutes les démarches quand le « non » est confirmé, et repart d'une saisie vide", () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });
    act(() => result.current.editDemarche(salon));
    answer(result, OUI_NON.NON);

    act(() => result.current.confirmRemoval());

    expect(result.current.form.getValues()).toMatchObject({
      answer: OUI_NON.NON,
      demarches: [],
      currentDemarcheId: null,
      hasCurrentDemarche: true,
      typeDemarche: undefined,
      apportDemarche: "",
    });
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.announcement).toBe("Vos démarches ont été supprimées.");
  });

  it("accepte un « non » sans fenêtre quand aucune démarche n'est validée, en gardant la saisie en cours", () => {
    const result = renderDemarches(IMMERSION);

    answer(result, OUI_NON.NON);

    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.form.getValues()).toMatchObject({
      answer: OUI_NON.NON,
      typeDemarche: TYPE_DEMARCHE.IMMERSION,
    });
  });

  it("n'ajoute pas une saisie restée ouverte quand le maximum est déjà atteint", async () => {
    const demarches = createDemarches(NOMBRE_MAX_DEMARCHES);
    const result = renderDemarches({ demarches, ...IMMERSION });

    await act(() => result.current.validateDemarche());

    expect(result.current.demarches).toHaveLength(NOMBRE_MAX_DEMARCHES);
  });

  it("ne demande pas de supprimer une démarche qui n'est pas dans la liste", () => {
    const [salon, absente] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon], hasCurrentDemarche: false });

    act(() => result.current.requestRemoval(absente));

    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.removal).toBeNull();
  });

  it("redit une annonce identique à la précédente", () => {
    const demarches = createDemarches(3);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });
    act(() => result.current.requestRemoval(demarches[0]));
    act(() => result.current.confirmRemoval());
    const first = result.current.announcement;

    act(() => result.current.requestRemoval(demarches[1]));
    act(() => result.current.confirmRemoval());

    expect(first).toBe("Démarche 1 supprimée.");
    expect(result.current.announcement).not.toBe(first);
    expect(result.current.announcement.trim()).toBe(first);
  });

  it("n'ouvre plus de saisie quand le nombre maximal de démarches est atteint", () => {
    const result = renderDemarches({
      demarches: createDemarches(NOMBRE_MAX_DEMARCHES),
      hasCurrentDemarche: false,
    });
    expect(result.current.canAdd).toBe(false);

    act(() => result.current.addDemarche());

    expect(result.current.hasCurrentDemarche).toBe(false);
  });
});
