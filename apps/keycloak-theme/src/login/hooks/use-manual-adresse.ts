import { useEffect, useState } from "react";

import {
  type Adresse,
  buildManualAdresse,
  type Commune,
  isCodePostalComplete,
  type ManualAdresseFields,
  toCodePostal,
} from "../components/adresse/adresse";
import { findCommunes } from "../components/adresse/adresse-api";
import { createDebouncedRequest } from "./debounced-request";

const NO_DELAY_MS = 0;
const SINGLE_COMMUNE = 1;

/** États du chargement des communes d'un code postal. */
export const COMMUNES_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  UNAVAILABLE: "unavailable",
} as const;

/** État du chargement des communes. */
export type CommunesStatus = (typeof COMMUNES_STATUS)[keyof typeof COMMUNES_STATUS];

/** Identifiants des champs de la saisie manuelle, cibles du focus. */
export const MANUAL_FIELD_ID = {
  NUMERO_VOIE: "adresse-numero-voie",
  TYPE_VOIE: "adresse-type-voie",
  NOM_VOIE: "adresse-nom-voie",
  COMPLEMENT: "adresse-complement",
  CODE_POSTAL: "adresse-code-postal",
  COMMUNE: "adresse-commune",
} as const;

/** Identifiant d'un champ de la saisie manuelle. */
export type ManualFieldId = (typeof MANUAL_FIELD_ID)[keyof typeof MANUAL_FIELD_ID];

/** Champs texte de la saisie manuelle, passés à `changeField`. */
export const MANUAL_FIELD = {
  NUMERO_VOIE: "numeroVoie",
  TYPE_VOIE: "typeVoie",
  NOM_VOIE: "nomVoie",
  COMPLEMENT: "complement",
} as const satisfies Record<string, keyof ManualAdresseFields>;

const EMPTY_FIELDS: ManualAdresseFields = {
  numeroVoie: "",
  typeVoie: "",
  nomVoie: "",
  complement: "",
  codePostal: "",
};

/** Premier champ à compléter, dans l'ordre de l'écran. */
export function findFirstMissingField(
  fields: ManualAdresseFields,
  communes: readonly Commune[],
  isCommuneChosen: boolean,
): ManualFieldId | undefined {
  if (fields.typeVoie.trim() === "") return MANUAL_FIELD_ID.TYPE_VOIE;
  if (fields.nomVoie.trim() === "") return MANUAL_FIELD_ID.NOM_VOIE;
  if (!isCodePostalComplete(fields.codePostal) || communes.length === 0) {
    return MANUAL_FIELD_ID.CODE_POSTAL;
  }
  return isCommuneChosen ? undefined : MANUAL_FIELD_ID.COMMUNE;
}

/** État de la saisie manuelle de l'adresse. */
export interface UseManualAdresseResult {
  fields: ManualAdresseFields;
  communes: readonly Commune[];
  communesStatus: CommunesStatus;
  codeCommune: string;
  adresse: Adresse | null;
  firstMissingFieldId: ManualFieldId | undefined;
  changeField: (field: keyof ManualAdresseFields, value: string) => void;
  changeCodePostal: (value: string) => void;
  changeCodeCommune: (value: string) => void;
  retryCommunes: () => void;
}

/** Saisie manuelle : charge les communes du code postal et assemble l'adresse. */
export function useManualAdresse(): UseManualAdresseResult {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [communes, setCommunes] = useState<readonly Commune[]>([]);
  const [communesStatus, setCommunesStatus] = useState<CommunesStatus>(COMMUNES_STATUS.IDLE);
  const [codeCommune, setCodeCommune] = useState("");
  const [request] = useState(createDebouncedRequest);

  useEffect(() => request.cancel, [request]);

  const loadCommunes = (codePostal: string): void => {
    setCommunesStatus(COMMUNES_STATUS.LOADING);
    request.run((signal) => {
      findCommunes(codePostal, signal)
        .then((found) => {
          if (signal.aborted) return;
          setCommunes(found);
          setCommunesStatus(COMMUNES_STATUS.READY);
          const [onlyCommune] = found;
          if (found.length === SINGLE_COMMUNE && onlyCommune !== undefined) {
            setCodeCommune(onlyCommune.code);
          }
        })
        .catch(() => {
          if (signal.aborted) return;
          setCommunes([]);
          setCommunesStatus(COMMUNES_STATUS.UNAVAILABLE);
        });
    }, NO_DELAY_MS);
  };

  const commune = communes.find((candidate) => candidate.code === codeCommune);

  return {
    fields,
    communes,
    communesStatus,
    codeCommune,
    adresse: buildManualAdresse(fields, commune),
    firstMissingFieldId: findFirstMissingField(fields, communes, commune !== undefined),
    changeField: (field, value) => setFields((current) => ({ ...current, [field]: value })),
    changeCodePostal: (input) => {
      const value = toCodePostal(input);
      setFields((current) => ({ ...current, codePostal: value }));
      setCodeCommune("");
      setCommunes([]);
      if (isCodePostalComplete(value)) {
        loadCommunes(value);
        return;
      }
      request.cancel();
      setCommunesStatus(COMMUNES_STATUS.IDLE);
    },
    changeCodeCommune: setCodeCommune,
    retryCommunes: () => loadCommunes(fields.codePostal),
  };
}
