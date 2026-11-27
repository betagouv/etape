// @vitest-environment jsdom
import { zodResolver } from "@hookform/resolvers/zod";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Controller, useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  currentDemarcheSchema,
  currentDemarcheStateSchema,
  DEMARCHE_REQUIRED_MESSAGES,
  demarcheSchema,
} from "../demarche-schema";
import {
  CURRENT_DEMARCHE_FIELD,
  CURRENT_DEMARCHE_PATH,
  EMPTY_CURRENT_DEMARCHE,
  findOpenDemarcheFields,
  NOMBRE_MAX_DEMARCHES,
  TYPE_DEMARCHE_AUTRE,
  type CurrentDemarchePath,
  type Demarche,
} from "../domain/demarche";
import { OUI_NON } from "../domain/oui-non";
import { requireFilled } from "../domain/require-filled";
import { VOLET_FORM_OPTIONS } from "../volet-form-options";
import { useDemarches, type DemarchesFieldNames, type UseDemarchesResult } from "./use-demarches";

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

/** Un bouton dans la page, pour suivre le focus. */
function appendButton(): HTMLButtonElement {
  const button = document.createElement("button");
  document.body.append(button);
  return button;
}

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
    currentDemarche: z.object({
      typeDemarche: z.enum(TYPE_DEMARCHE).optional(),
      ...currentDemarcheSchema.shape,
    }),
    ...currentDemarcheStateSchema.shape,
    demarches: z.array(demarcheSchema.extend({ typeDemarche: z.enum(TYPE_DEMARCHE) })),
  })
  .superRefine((data, ctx) => {
    requireFilled(ctx, data, ["autreChamp"], { autreChamp: AUTRE_CHAMP_MESSAGE });
    requireFilled(ctx, data, findOpenDemarcheFields(data.answer, data), DEMARCHE_REQUIRED_MESSAGES);
  });

type FormData = z.infer<typeof schema>;

const FIELD = {
  ANSWER: "answer",
  CURRENT_DEMARCHE: CURRENT_DEMARCHE_FIELD,
  TYPE_DEMARCHE: CURRENT_DEMARCHE_PATH.typeDemarche,
  PRECISION_TYPE_DEMARCHE: CURRENT_DEMARCHE_PATH.precisionTypeDemarche,
  APPORT_DEMARCHE: CURRENT_DEMARCHE_PATH.apportDemarche,
  PIECES_JUSTIFICATIVES: CURRENT_DEMARCHE_PATH.piecesJustificatives,
  HAS_CURRENT_DEMARCHE: "hasCurrentDemarche",
  CURRENT_DEMARCHE_ID: "currentDemarcheId",
  DEMARCHES: "demarches",
} as const satisfies Record<string, keyof FormData | CurrentDemarchePath>;

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
      currentDemarche: {
        typeDemarche: undefined,
        precisionTypeDemarche: "",
        apportDemarche: "",
        piecesJustificatives: [],
      },
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
      form.setValue(FIELD.CURRENT_DEMARCHE, current);
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
  currentDemarche: {
    ...EMPTY_CURRENT_DEMARCHE,
    typeDemarche: TYPE_DEMARCHE.IMMERSION,
    apportDemarche: "J’ai vérifié que je tenais ce rythme.",
  },
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

/** Deux champs de la saisie, branchés comme `FormField` : par `Controller`, et deux actions du hook. */
function CurrentDemarcheFields({ demarche }: { demarche: Demarche<TypeDemarche> }) {
  const { form, currentDemarche, list } = useVoletDemarches();
  return (
    <>
      <Controller
        control={form.control}
        name={FIELD.TYPE_DEMARCHE}
        render={({ field }) => <input aria-label="Type" {...field} value={field.value ?? ""} />}
      />
      <Controller
        control={form.control}
        name={FIELD.APPORT_DEMARCHE}
        render={({ field }) => <textarea aria-label="Apport" {...field} />}
      />
      <button type="button" onClick={() => list.edit(demarche)}>
        Modifier
      </button>
      <button type="button" onClick={currentDemarche.cancel}>
        Annuler
      </button>
    </>
  );
}

describe("useDemarches, champs affichés", () => {
  it("remplit les champs d'une démarche rouverte, puis les vide tous quand la saisie se referme, type compris", () => {
    const [salon] = createDemarches(1);
    render(<CurrentDemarcheFields demarche={salon} />);
    const type = screen.getByLabelText<HTMLInputElement>("Type");
    const apport = screen.getByLabelText<HTMLTextAreaElement>("Apport");
    // La carte de départ se referme : une démarche ne se rouvre pas pendant une autre saisie.
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect(type.value).toBe(TYPE_DEMARCHE.SALON);
    expect(apport.value).toBe("J’ai rencontré trois artisans.");

    // La saisie vide n'a pas de clé `typeDemarche` : le champ du type se vide quand même.
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(type.value).toBe("");
    expect(apport.value).toBe("");
  });
});

describe("useDemarches", () => {
  it("part d'une carte de saisie ouverte, bouton de validation grisé", () => {
    const result = renderDemarches();

    expect(result.current.list.demarches).toEqual([]);
    expect(result.current.currentDemarche.isOpen).toBe(true);
    expect(result.current.currentDemarche.isFilled).toBe(false);
  });

  it("montre ce qui manque quand on valide une saisie incomplète, sans rien ajouter", async () => {
    const result = renderDemarches({
      currentDemarche: { ...EMPTY_CURRENT_DEMARCHE, typeDemarche: TYPE_DEMARCHE.AUTRE },
    });

    await act(() => result.current.currentDemarche.validate());

    const { errors } = result.current;
    expect(errors.currentDemarche?.precisionTypeDemarche?.message).toBe(
      "Veuillez préciser le type de démarche.",
    );
    expect(errors.currentDemarche?.apportDemarche?.message).toBe(
      "Veuillez indiquer ce que la démarche vous a apporté.",
    );
    // Les autres champs du volet, vides eux aussi, ne sont pas signalés par ce bouton.
    expect(errors.autreChamp).toBeUndefined();
    expect(result.current.list.demarches).toEqual([]);
    expect(result.current.currentDemarche.isOpen).toBe(true);
  });

  it("valide la saisie : la démarche rejoint la liste, la carte se referme et la saisie se vide", async () => {
    const result = renderDemarches(IMMERSION);
    expect(result.current.currentDemarche.isFilled).toBe(true);

    await act(() => result.current.currentDemarche.validate());

    expect(result.current.list.demarches).toHaveLength(1);
    expect(result.current.list.demarches[0]).toMatchObject({
      typeDemarche: TYPE_DEMARCHE.IMMERSION,
      apportDemarche: "J’ai vérifié que je tenais ce rythme.",
    });
    expect(result.current.currentDemarche.isOpen).toBe(false);
    expect(result.current.announcement).toBe("Démarche 1 enregistrée.");
    expect(result.current.form.getValues(FIELD.CURRENT_DEMARCHE)).toEqual(EMPTY_CURRENT_DEMARCHE);
  });

  it("fait ressortir la carte d'une démarche de plus, jusqu'à ce que le focus la quitte", async () => {
    const result = renderDemarches(IMMERSION);
    expect(result.current.currentDemarche.isHighlighted).toBe(false);
    expect(result.current.currentDemarche.canCancel).toBe(false);
    await act(() => result.current.currentDemarche.validate());

    act(() => result.current.list.add());
    expect(result.current.currentDemarche.isHighlighted).toBe(true);
    expect(result.current.currentDemarche.canCancel).toBe(true);

    act(() => result.current.currentDemarche.removeHighlight());
    expect(result.current.currentDemarche.isHighlighted).toBe(false);
  });

  it("annule la saisie d'une démarche de plus : carte refermée, saisie et erreurs effacées, sans toucher aux démarches validées", async () => {
    const result = renderDemarches(IMMERSION);
    await act(() => result.current.currentDemarche.validate());
    act(() => result.current.list.add());
    act(() => result.current.form.setValue(FIELD.TYPE_DEMARCHE, TYPE_DEMARCHE.AUTRE));
    await act(() => result.current.currentDemarche.validate());
    expect(result.current.errors.currentDemarche?.apportDemarche).toBeDefined();

    act(() => result.current.currentDemarche.cancel());

    expect(result.current.list.demarches).toHaveLength(1);
    expect(result.current.currentDemarche.isOpen).toBe(false);
    expect(result.current.currentDemarche.isHighlighted).toBe(false);
    expect(result.current.announcement).toBe("Saisie de la démarche 2 annulée.");
    expect(result.current.form.getValues(FIELD.TYPE_DEMARCHE)).toBeUndefined();
    expect(result.current.errors.currentDemarche?.apportDemarche).toBeUndefined();
  });

  it("rouvre une démarche validée en saisie, préremplie, à son rang", () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });

    act(() => result.current.list.edit(salon));

    expect(result.current.currentDemarche.isOpen).toBe(true);
    expect(result.current.currentDemarche.demarcheId).toBe(salon.id);
    expect(result.current.currentDemarche.index).toBe(0);
    expect(result.current.currentDemarche.canCancel).toBe(true);
    expect(result.current.currentDemarche.isHighlighted).toBe(false);
    // Tout ce que porte la démarche, sauf son `id`.
    expect(result.current.form.getValues(FIELD.CURRENT_DEMARCHE)).toEqual({
      typeDemarche: TYPE_DEMARCHE.SALON,
      precisionTypeDemarche: "",
      apportDemarche: "J’ai rencontré trois artisans.",
      piecesJustificatives: [],
    });
  });

  it("valide une modification : la démarche est mise à jour à sa place, sans en ajouter", async () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });
    act(() => result.current.list.edit(salon));
    act(() => result.current.form.setValue(FIELD.APPORT_DEMARCHE, "J’en ai rencontré cinq."));

    await act(() => result.current.currentDemarche.validate());

    expect(result.current.list.demarches).toEqual([
      { ...salon, apportDemarche: "J’en ai rencontré cinq." },
      autre,
    ]);
    expect(result.current.currentDemarche.isOpen).toBe(false);
    expect(result.current.currentDemarche.demarcheId).toBeNull();
    expect(result.current.announcement).toBe("Démarche 1 modifiée.");
    expect(result.current.form.getValues(FIELD.APPORT_DEMARCHE)).toBe("");
  });

  it("annule une modification : la démarche reste telle qu'elle était", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });
    act(() => result.current.list.edit(demarches[1]));
    act(() => result.current.form.setValue(FIELD.APPORT_DEMARCHE, "Autre chose."));

    act(() => result.current.currentDemarche.cancel());

    expect(result.current.list.demarches).toEqual(demarches);
    expect(result.current.currentDemarche.isOpen).toBe(false);
    expect(result.current.currentDemarche.demarcheId).toBeNull();
    expect(result.current.announcement).toBe("Modification de la démarche 2 annulée.");
  });

  it("rend le focus au bouton « Modifier » quand une modification est annulée", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });
    const editButton = appendButton();
    act(() => result.current.list.registerEditButton(demarches[1].id)(editButton));
    act(() => result.current.list.edit(demarches[1]));

    act(() => result.current.currentDemarche.cancel());

    expect(document.activeElement).toBe(editButton);
  });

  it("ne rouvre pas une démarche tant qu'une autre saisie est ouverte, et dit quoi faire d'abord", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], ...IMMERSION });

    act(() => result.current.list.edit(salon));

    expect(result.current.currentDemarche.demarcheId).toBeNull();
    expect(result.current.list.blockedDemarcheId).toBe(salon.id);
    expect(result.current.announcement).toBe(
      "Validez ou annulez la démarche en cours avant de modifier celle-ci.",
    );
    // La saisie en cours n'a pas bougé.
    expect(result.current.form.getValues(FIELD.TYPE_DEMARCHE)).toBe(TYPE_DEMARCHE.IMMERSION);

    act(() => result.current.currentDemarche.cancel());
    expect(result.current.list.blockedDemarcheId).toBeNull();
  });

  it("demande confirmation avant de supprimer une démarche, et ne touche à rien si on abandonne", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });

    act(() => result.current.removalDialog.requestRemoval(demarches[1]));
    expect(result.current.removalDialog.isRemovalOpen).toBe(true);
    expect(result.current.removalDialog.removal).toEqual({
      items: [{ demarche: demarches[1], index: 1 }],
      isAnswerNon: false,
      isCurrentDemarcheRemoved: false,
    });

    act(() => result.current.removalDialog.cancelRemoval());
    expect(result.current.removalDialog.isRemovalOpen).toBe(false);
    expect(result.current.list.demarches).toEqual(demarches);
  });

  it("supprime la démarche confirmée, une seule, et l'annonce par son rang", () => {
    const [salon, autre, derniere] = createDemarches(3);
    const result = renderDemarches({
      demarches: [salon, autre, derniere],
      hasCurrentDemarche: false,
    });
    act(() => result.current.removalDialog.requestRemoval(autre));

    act(() => result.current.removalDialog.confirmRemoval());

    expect(result.current.list.demarches).toEqual([salon, derniere]);
    expect(result.current.removalDialog.isRemovalOpen).toBe(false);
    expect(result.current.currentDemarche.isOpen).toBe(false);
    expect(result.current.announcement).toBe("Démarche 2 supprimée.");
  });

  it("donne le focus à la démarche qui prend la place de la supprimée, sinon au bouton d'ajout", () => {
    const [salon, autre, derniere] = createDemarches(3);
    const result = renderDemarches({
      demarches: [salon, autre, derniere],
      hasCurrentDemarche: false,
    });
    const editDerniere = appendButton();
    const addButton = appendButton();
    act(() => {
      result.current.list.registerEditButton(derniere.id)(editDerniere);
      result.current.list.addButtonRef.current = addButton;
    });

    act(() => result.current.removalDialog.requestRemoval(autre));
    act(() => result.current.removalDialog.confirmRemoval());
    act(() => result.current.removalDialog.restoreFocusAfterRemoval());
    expect(document.activeElement).toBe(editDerniere);

    act(() => result.current.removalDialog.requestRemoval(derniere));
    act(() => result.current.removalDialog.confirmRemoval());
    act(() => result.current.removalDialog.restoreFocusAfterRemoval());
    expect(document.activeElement).toBe(addButton);
  });

  it("rouvre la saisie de la première démarche quand la dernière est supprimée", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], hasCurrentDemarche: false });
    act(() => result.current.removalDialog.requestRemoval(salon));

    act(() => result.current.removalDialog.confirmRemoval());

    expect(result.current.list.demarches).toEqual([]);
    expect(result.current.currentDemarche.isOpen).toBe(true);
    expect(result.current.currentDemarche.index).toBe(0);
    expect(result.current.currentDemarche.canCancel).toBe(false);
  });

  it("supprime une démarche sans toucher à la saisie en cours", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], ...IMMERSION });
    act(() => result.current.removalDialog.requestRemoval(salon));

    act(() => result.current.removalDialog.confirmRemoval());

    expect(result.current.list.demarches).toEqual([]);
    expect(result.current.currentDemarche.isOpen).toBe(true);
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
    expect(result.current.removalDialog.isRemovalOpen).toBe(true);
    expect(result.current.removalDialog.removal).toEqual({
      items: [
        { demarche: demarches[0], index: 0 },
        { demarche: demarches[1], index: 1 },
      ],
      isAnswerNon: true,
      isCurrentDemarcheRemoved: false,
    });

    act(() => result.current.removalDialog.cancelRemoval());
    expect(result.current.removalDialog.isRemovalOpen).toBe(false);
    expect(result.current.form.getValues(FIELD.ANSWER)).toBe(OUI_NON.OUI);
    expect(result.current.list.demarches).toEqual(demarches);
  });

  it("prévient qu'un « non » emporte aussi une saisie commencée, puis la supprime avec les démarches", () => {
    const result = renderDemarches({ demarches: createDemarches(1), ...IMMERSION });

    answer(result, OUI_NON.NON);
    expect(result.current.removalDialog.removal?.isCurrentDemarcheRemoved).toBe(true);

    act(() => result.current.removalDialog.confirmRemoval());
    expect(result.current.form.getValues(FIELD.DEMARCHES)).toEqual([]);
    expect(result.current.form.getValues(FIELD.CURRENT_DEMARCHE)).toEqual(EMPTY_CURRENT_DEMARCHE);
  });

  it("ne prévient pas pour une carte de saisie ouverte mais vide, ni pour une modification en cours", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon] });

    answer(result, OUI_NON.NON);
    expect(result.current.removalDialog.removal?.isCurrentDemarcheRemoved).toBe(false);

    act(() => result.current.removalDialog.cancelRemoval());
    act(() => result.current.currentDemarche.cancel());
    act(() => result.current.list.edit(salon));
    answer(result, OUI_NON.NON);
    expect(result.current.removalDialog.removal?.isCurrentDemarcheRemoved).toBe(false);
  });

  it("supprime toutes les démarches quand le « non » est confirmé, et repart d'une saisie vide", () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });
    act(() => result.current.list.edit(salon));
    answer(result, OUI_NON.NON);

    act(() => result.current.removalDialog.confirmRemoval());

    expect(result.current.form.getValues()).toMatchObject({
      answer: OUI_NON.NON,
      demarches: [],
      currentDemarcheId: null,
      hasCurrentDemarche: true,
    });
    expect(result.current.form.getValues(FIELD.CURRENT_DEMARCHE)).toEqual(EMPTY_CURRENT_DEMARCHE);
    expect(result.current.removalDialog.isRemovalOpen).toBe(false);
    expect(result.current.announcement).toBe("Vos démarches ont été supprimées.");
  });

  it("accepte un « non » sans fenêtre quand aucune démarche n'est validée, en gardant la saisie en cours", () => {
    const result = renderDemarches(IMMERSION);

    answer(result, OUI_NON.NON);

    expect(result.current.removalDialog.isRemovalOpen).toBe(false);
    expect(result.current.form.getValues()).toMatchObject({
      answer: OUI_NON.NON,
      currentDemarche: { typeDemarche: TYPE_DEMARCHE.IMMERSION },
    });
  });

  it("n'ajoute pas une saisie restée ouverte quand le maximum est déjà atteint", async () => {
    const demarches = createDemarches(NOMBRE_MAX_DEMARCHES);
    const result = renderDemarches({ demarches, ...IMMERSION });

    await act(() => result.current.currentDemarche.validate());

    expect(result.current.list.demarches).toHaveLength(NOMBRE_MAX_DEMARCHES);
  });

  it("ne demande pas de supprimer une démarche qui n'est pas dans la liste", () => {
    const [salon, absente] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon], hasCurrentDemarche: false });

    act(() => result.current.removalDialog.requestRemoval(absente));

    expect(result.current.removalDialog.isRemovalOpen).toBe(false);
    expect(result.current.removalDialog.removal).toBeNull();
  });

  it("redit une annonce identique à la précédente", () => {
    const demarches = createDemarches(3);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });
    act(() => result.current.removalDialog.requestRemoval(demarches[0]));
    act(() => result.current.removalDialog.confirmRemoval());
    const first = result.current.announcement;

    act(() => result.current.removalDialog.requestRemoval(demarches[1]));
    act(() => result.current.removalDialog.confirmRemoval());

    expect(first).toBe("Démarche 1 supprimée.");
    expect(result.current.announcement).not.toBe(first);
    expect(result.current.announcement.trim()).toBe(first);
  });

  it("n'ouvre plus de saisie quand le nombre maximal de démarches est atteint", () => {
    const result = renderDemarches({
      demarches: createDemarches(NOMBRE_MAX_DEMARCHES),
      hasCurrentDemarche: false,
    });
    expect(result.current.list.canAdd).toBe(false);

    act(() => result.current.list.add());

    expect(result.current.currentDemarche.isOpen).toBe(false);
  });
});
