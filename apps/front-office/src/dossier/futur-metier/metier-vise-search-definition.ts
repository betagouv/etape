import {
  APPELLATION_ROME_SEARCH_MAX_LENGTH,
  APPELLATION_ROME_SEARCH_MIN_LENGTH,
  searchAppellationsRome,
  type AppellationRome,
} from "@etape/api-contract";

import { httpClient } from "@/lib/clients";
import type { RemoteSearchDefinition, RemoteSearchResults } from "../hooks/use-remote-search";
import { METIER_VISE_SEARCH_TEXTS } from "./domain/metier-vise-search";
import { FUTUR_METIER_FIELD, FUTUR_METIER_FIELD_LABEL } from "./schema";

/** Le résumé d'erreurs mène à `#metierVise`. */
const METIER_VISE_FIELD_ID = FUTUR_METIER_FIELD.METIER_VISE;

async function fetchAppellationsRome(
  search: string,
): Promise<RemoteSearchResults<AppellationRome>> {
  const response = await httpClient.get<unknown>(searchAppellationsRome.path, {
    params: { search },
  });
  const { appellationsRome, appellationRomeCount } = searchAppellationsRome.response.parse(
    response.data,
  );
  return { items: appellationsRome, totalCount: appellationRomeCount };
}

/** La recherche du métier visé parmi les appellations du ROME : son champ, ses textes et son appel. */
export const METIER_VISE_SEARCH: RemoteSearchDefinition<AppellationRome> = {
  id: METIER_VISE_FIELD_ID,
  label: FUTUR_METIER_FIELD_LABEL.metierVise,
  maxLength: APPELLATION_ROME_SEARCH_MAX_LENGTH,
  optionId: ({ code }) => `${METIER_VISE_FIELD_ID}-option-${code}`,
  texts: METIER_VISE_SEARCH_TEXTS,
  queryKey: "appellation-rome",
  minLength: APPELLATION_ROME_SEARCH_MIN_LENGTH,
  fetchResults: fetchAppellationsRome,
};
