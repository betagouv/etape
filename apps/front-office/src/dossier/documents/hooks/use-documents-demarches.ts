import { useWatch, type UseFormReturn } from "react-hook-form";

import { replaceDemarche, type DemarchesValues } from "../../domain/demarche";
import { applyPiecesChange, type PieceJustificative } from "../../domain/piece-justificative";
import { VOLET_ID } from "../../domain/volet-id";
import {
  TYPE_DEMARCHE_LABEL as TYPE_DEMARCHE_DECOUVERTE_LABEL,
  TYPE_DEMARCHE_PIECES_DESCRIPTION as TYPE_DEMARCHE_DECOUVERTE_PIECES_DESCRIPTION,
  type TypeDemarche as TypeDemarcheDecouverte,
} from "../../futur-metier/domain/type-demarche";
import { createDemarchesDecouverteBinding } from "../../futur-metier/hooks/use-demarches-decouverte";
import type { DemarchesBinding } from "../../hooks/use-demarches";
import { useDossierVolets } from "../../hooks/use-dossier-volets";
import {
  TYPE_DEMARCHE_LABEL as TYPE_DEMARCHE_CONSTRUCTION_LABEL,
  TYPE_DEMARCHE_PIECES_DESCRIPTION as TYPE_DEMARCHE_CONSTRUCTION_PIECES_DESCRIPTION,
  type TypeDemarche as TypeDemarcheConstruction,
} from "../../projet/domain/type-demarche";
import { createDemarchesConstructionBinding } from "../../projet/hooks/use-demarches-construction";
import {
  DEMARCHES_DISPLAY,
  findDemarchesDisplay,
  listDocumentsDemarches,
  type DemarchesDisplay,
  type DemarchesTexts,
  type DemarchesVoletId,
  type DocumentDemarche,
} from "../domain/document-demarche";

/** Ce que renvoie `useDocumentsDemarches` : ce que « Mes documents » montre des démarches d'un volet, et l'écriture de leurs pièces. */
export interface UseDocumentsDemarchesResult {
  display: DemarchesDisplay;
  documents: readonly DocumentDemarche[];
  /** Les pièces d'une démarche, écrites dans le formulaire de son volet. */
  changePieces: (demarcheId: string, pieces: PieceJustificative[]) => void;
}

/**
 * Les justificatifs des démarches d'un volet, vus depuis « Mes documents ». Ils vivent dans le
 * formulaire du volet : un fichier déposé d'un côté se retrouve de l'autre, et un document
 * disparaît avec sa démarche.
 */
export function useDocumentsDemarches<
  TFieldValues extends DemarchesValues<TType>,
  TType extends string,
>(
  form: UseFormReturn<TFieldValues>,
  binding: DemarchesBinding<TFieldValues, TType>,
  texts: DemarchesTexts<TType>,
): UseDocumentsDemarchesResult {
  const answer = useWatch({ control: form.control, compute: binding.readAnswer });
  const demarches = useWatch({
    control: form.control,
    compute: (values: TFieldValues) => values.demarches,
  });

  const changePieces = (demarcheId: string, pieces: PieceJustificative[]): void => {
    const values = form.getValues();
    const demarche = values.demarches.find(({ id }) => id === demarcheId);
    if (!demarche) return;
    binding.setDemarches(
      replaceDemarche(values.demarches, { ...demarche, piecesJustificatives: pieces }),
    );
    // Sans cela, « Valider » remettrait dans la démarche les pièces de sa saisie ; celles que la
    // saisie a gagnées sans être validées y restent.
    if (values.currentDemarcheId !== demarcheId) return;
    const { typeDemarche, precisionTypeDemarche, apportDemarche, piecesJustificatives } = values;
    binding.setCurrentDemarche(
      {
        typeDemarche,
        precisionTypeDemarche,
        apportDemarche,
        piecesJustificatives: applyPiecesChange(
          piecesJustificatives,
          demarche.piecesJustificatives,
          pieces,
        ),
      },
      demarcheId,
    );
  };

  return {
    display: findDemarchesDisplay(answer, demarches.length),
    documents: listDocumentsDemarches(demarches, texts),
    changePieces,
  };
}

const DECOUVERTE_TEXTS: DemarchesTexts<TypeDemarcheDecouverte> = {
  typeLabels: TYPE_DEMARCHE_DECOUVERTE_LABEL,
  pieceDescriptions: TYPE_DEMARCHE_DECOUVERTE_PIECES_DESCRIPTION,
};

const CONSTRUCTION_TEXTS: DemarchesTexts<TypeDemarcheConstruction> = {
  typeLabels: TYPE_DEMARCHE_CONSTRUCTION_LABEL,
  pieceDescriptions: TYPE_DEMARCHE_CONSTRUCTION_PIECES_DESCRIPTION,
};

/** Un groupe de « Justificatifs de vos démarches » : un volet, et ce qu'il montre. */
export interface DemarchesGroup extends UseDocumentsDemarchesResult {
  voletId: DemarchesVoletId;
}

/** Les démarches de « Mon futur métier » puis de « Mon projet », sans celles d'un volet qui n'a pas « oui ». */
export function useDemarchesGroups(): DemarchesGroup[] {
  const { futurMetier, projet } = useDossierVolets();
  const decouverte = useDocumentsDemarches(
    futurMetier.form,
    createDemarchesDecouverteBinding(futurMetier.form),
    DECOUVERTE_TEXTS,
  );
  const construction = useDocumentsDemarches(
    projet.form,
    createDemarchesConstructionBinding(projet.form),
    CONSTRUCTION_TEXTS,
  );
  const groups: DemarchesGroup[] = [
    { voletId: VOLET_ID.FUTUR_METIER, ...decouverte },
    { voletId: VOLET_ID.PROJET, ...construction },
  ];
  return groups.filter(({ display }) => display !== DEMARCHES_DISPLAY.HIDDEN);
}
