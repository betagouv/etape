import {
  ETABLISSEMENT_SEARCH_MAX_LENGTH,
  ETABLISSEMENT_SEARCH_MIN_LENGTH,
  searchEtablissements,
  type Etablissement,
} from "@etape/api-contract";

import { httpClient } from "@/lib/clients";
import {
  useRemoteSearch,
  type RemoteSearchDefinition,
  type RemoteSearchResults,
  type UseRemoteSearchResult,
} from "../../hooks/use-remote-search";
import { EMPLOYEUR_SEARCH_TEXTS } from "../domain/employeur-search";
import { SITUATION_PROFESSIONNELLE_FIELD_LABEL } from "../schema";

/** Le résumé d'erreurs mène à `#employeur`. */
const EMPLOYEUR_FIELD_ID = "employeur";

async function fetchEtablissements(search: string): Promise<RemoteSearchResults<Etablissement>> {
  const response = await httpClient.get<unknown>(searchEtablissements.path, {
    params: { search },
  });
  const { etablissements, etablissementCount } = searchEtablissements.response.parse(response.data);
  return { items: etablissements, totalCount: etablissementCount };
}

/** La recherche de l'employeur dans Sirene : son champ, ses textes et son appel. */
export const EMPLOYEUR_SEARCH: RemoteSearchDefinition<Etablissement> = {
  id: EMPLOYEUR_FIELD_ID,
  label: SITUATION_PROFESSIONNELLE_FIELD_LABEL.employeur,
  maxLength: ETABLISSEMENT_SEARCH_MAX_LENGTH,
  optionId: ({ siret }) => `${EMPLOYEUR_FIELD_ID}-option-${siret}`,
  texts: EMPLOYEUR_SEARCH_TEXTS,
  queryKey: "etablissement",
  minLength: ETABLISSEMENT_SEARCH_MIN_LENGTH,
  fetchResults: fetchEtablissements,
};

/** Recherche de l'employeur dans Sirene, au fil de la saisie. */
export function useEmployeurSearch(
  onSelect: (etablissement: Etablissement) => void,
): UseRemoteSearchResult<Etablissement> {
  return useRemoteSearch(EMPLOYEUR_SEARCH, onSelect);
}
