// @vitest-environment jsdom
import type { ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DossierVoletsContext, type DossierVolets } from "../../dossier-volets-context";
import type { Demarche } from "../../domain/demarche";
import { OUI_NON } from "../../domain/oui-non";
import type { PieceJustificative } from "../../domain/piece-justificative";
import { VOLET_ID } from "../../domain/volet-id";
import { TYPE_DEMARCHE, type TypeDemarche } from "../../futur-metier/domain/type-demarche";
import { useFuturMetierForm } from "../../futur-metier/hooks/use-futur-metier-form";
import { FUTUR_METIER_FIELD } from "../../futur-metier/schema";
import { useDossierVolets } from "../../hooks/use-dossier-volets";
import { useProjetForm } from "../../projet/hooks/use-projet-form";
import { PROJET_FIELD } from "../../projet/schema";
import { DEMARCHES_DISPLAY } from "../domain/document-demarche";
import { useDemarchesGroups } from "./use-documents-demarches";

afterEach(cleanup);

/** Les formulaires des deux volets, mis en contexte comme le fait `DossierScreen`. */
function DossierVoletsProvider({ children }: { children: ReactNode }) {
  const futurMetier = useFuturMetierForm();
  const projet = useProjetForm();
  return (
    <DossierVoletsContext value={{ futurMetier, projet } as DossierVolets}>
      {children}
    </DossierVoletsContext>
  );
}

function renderGroups() {
  const { result } = renderHook(
    () => ({ groups: useDemarchesGroups(), volets: useDossierVolets() }),
    { wrapper: DossierVoletsProvider },
  );
  return result;
}

function createDemarche(id: string, typeDemarche: TypeDemarche): Demarche<TypeDemarche> {
  return {
    id,
    typeDemarche,
    precisionTypeDemarche: "",
    apportDemarche: "J’ai découvert le métier.",
    piecesJustificatives: [],
  };
}

const ATTESTATION: PieceJustificative = {
  id: "attestation",
  fichier: new File(["x"], "attestation-immersion.pdf"),
  dateDepot: new Date(2026, 10, 26),
};

/** Une pièce ajoutée à la saisie d'une démarche modifiée, pas encore validée. */
const SAISIE: PieceJustificative = {
  id: "saisie",
  fichier: new File(["x"], "saisie.pdf"),
  dateDepot: new Date(2026, 10, 26),
};

describe("useDemarchesGroups", () => {
  it("ne montre aucun groupe tant qu'aucun volet n'a « oui »", () => {
    const result = renderGroups();

    expect(result.current.groups).toEqual([]);

    act(() =>
      result.current.volets.projet.form.setValue(PROJET_FIELD.DEMARCHE_CONSTRUCTION, OUI_NON.NON),
    );
    expect(result.current.groups).toEqual([]);
  });

  it("montre le texte vide du volet qui a « oui » sans démarche validée, et rien de l'autre", () => {
    const result = renderGroups();

    act(() =>
      result.current.volets.projet.form.setValue(PROJET_FIELD.DEMARCHE_CONSTRUCTION, OUI_NON.OUI),
    );

    expect(result.current.groups).toMatchObject([
      { voletId: VOLET_ID.PROJET, display: DEMARCHES_DISPLAY.EMPTY, documents: [] },
    ]);
  });

  it("montre un document par démarche validée, futur métier d'abord, avec le titre et la description de son type", () => {
    const result = renderGroups();
    const immersion = createDemarche("immersion", TYPE_DEMARCHE.IMMERSION);

    act(() => {
      const { form } = result.current.volets.futurMetier;
      form.setValue(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE, OUI_NON.OUI);
      form.setValue(FUTUR_METIER_FIELD.DEMARCHES, [immersion]);
      result.current.volets.projet.form.setValue(PROJET_FIELD.DEMARCHE_CONSTRUCTION, OUI_NON.OUI);
    });

    const [futurMetier, projet] = result.current.groups;
    expect(futurMetier).toMatchObject({
      voletId: VOLET_ID.FUTUR_METIER,
      display: DEMARCHES_DISPLAY.DOCUMENTS,
      documents: [
        {
          demarche: immersion,
          title: "Immersion en entreprise (stage d’observation, PMSMP)",
          description:
            "Une synthèse de votre expérience, la convention de stage ou de PMSMP, une attestation de l’entreprise d’accueil, etc.",
        },
      ],
    });
    expect(projet).toMatchObject({ voletId: VOLET_ID.PROJET, display: DEMARCHES_DISPLAY.EMPTY });
  });

  it("écrit les pièces dans la démarche de son volet, sans toucher aux autres", () => {
    const result = renderGroups();
    const immersion = createDemarche("immersion", TYPE_DEMARCHE.IMMERSION);
    const salon = createDemarche("salon", TYPE_DEMARCHE.SALON);
    act(() => {
      const { form } = result.current.volets.futurMetier;
      form.setValue(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE, OUI_NON.OUI);
      form.setValue(FUTUR_METIER_FIELD.DEMARCHES, [immersion, salon]);
      form.setValue(FUTUR_METIER_FIELD.HAS_CURRENT_DEMARCHE, false);
    });

    act(() => result.current.groups[0]?.changePieces(immersion.id, [ATTESTATION]));

    const { form } = result.current.volets.futurMetier;
    expect(form.getValues(FUTUR_METIER_FIELD.DEMARCHES)).toEqual([
      { ...immersion, piecesJustificatives: [ATTESTATION] },
      salon,
    ]);
    // La saisie en cours, qui ne modifie pas cette démarche, garde ses propres pièces.
    expect(form.getValues(FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES)).toEqual([]);
    expect(result.current.groups[0]?.documents[0]?.demarche.piecesJustificatives).toEqual([
      ATTESTATION,
    ]);
  });

  it("donne aussi les pièces à la saisie d'une démarche en cours de modification", () => {
    const result = renderGroups();
    const immersion = createDemarche("immersion", TYPE_DEMARCHE.IMMERSION);
    act(() => {
      const { form } = result.current.volets.futurMetier;
      form.setValue(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE, OUI_NON.OUI);
      form.setValue(FUTUR_METIER_FIELD.DEMARCHES, [immersion]);
      form.setValue(FUTUR_METIER_FIELD.CURRENT_DEMARCHE_ID, immersion.id);
      form.setValue(FUTUR_METIER_FIELD.TYPE_DEMARCHE, immersion.typeDemarche);
      form.setValue(FUTUR_METIER_FIELD.APPORT_DEMARCHE, "Saisie en cours de modification.");
    });

    act(() => result.current.groups[0]?.changePieces(immersion.id, [ATTESTATION]));

    const { form } = result.current.volets.futurMetier;
    expect(form.getValues(FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES)).toEqual([ATTESTATION]);
    // Le reste de la saisie n'a pas bougé.
    expect(form.getValues(FUTUR_METIER_FIELD.APPORT_DEMARCHE)).toBe(
      "Saisie en cours de modification.",
    );
    expect(form.getValues(FUTUR_METIER_FIELD.CURRENT_DEMARCHE_ID)).toBe(immersion.id);
  });

  it("garde dans la saisie d'une démarche en cours de modification les pièces qu'elle n'a pas encore validées", () => {
    const result = renderGroups();
    const immersion = createDemarche("immersion", TYPE_DEMARCHE.IMMERSION);
    act(() => {
      const { form } = result.current.volets.futurMetier;
      form.setValue(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE, OUI_NON.OUI);
      form.setValue(FUTUR_METIER_FIELD.DEMARCHES, [immersion]);
      form.setValue(FUTUR_METIER_FIELD.CURRENT_DEMARCHE_ID, immersion.id);
      form.setValue(FUTUR_METIER_FIELD.TYPE_DEMARCHE, immersion.typeDemarche);
      form.setValue(FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES, [SAISIE]);
    });
    const { form } = result.current.volets.futurMetier;

    act(() => result.current.groups[0]?.changePieces(immersion.id, [ATTESTATION]));
    expect(form.getValues(FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES)).toEqual([SAISIE, ATTESTATION]);
    expect(form.getValues(FUTUR_METIER_FIELD.DEMARCHES)[0]?.piecesJustificatives).toEqual([
      ATTESTATION,
    ]);

    act(() => result.current.groups[0]?.changePieces(immersion.id, []));
    expect(form.getValues(FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES)).toEqual([SAISIE]);
    expect(form.getValues(FUTUR_METIER_FIELD.DEMARCHES)[0]?.piecesJustificatives).toEqual([]);
  });

  it("retire le document d'une démarche supprimée, et ignore les pièces d'une démarche qui n'existe plus", () => {
    const result = renderGroups();
    const immersion = createDemarche("immersion", TYPE_DEMARCHE.IMMERSION);
    const salon = createDemarche("salon", TYPE_DEMARCHE.SALON);
    act(() => {
      const { form } = result.current.volets.futurMetier;
      form.setValue(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE, OUI_NON.OUI);
      form.setValue(FUTUR_METIER_FIELD.DEMARCHES, [immersion, salon]);
    });
    const changePieces = result.current.groups[0]?.changePieces;

    act(() =>
      result.current.volets.futurMetier.form.setValue(FUTUR_METIER_FIELD.DEMARCHES, [salon]),
    );
    expect(result.current.groups[0]?.documents.map(({ demarche }) => demarche.id)).toEqual([
      salon.id,
    ]);

    act(() => changePieces?.(immersion.id, [ATTESTATION]));
    expect(result.current.volets.futurMetier.form.getValues(FUTUR_METIER_FIELD.DEMARCHES)).toEqual([
      salon,
    ]);
  });
});
