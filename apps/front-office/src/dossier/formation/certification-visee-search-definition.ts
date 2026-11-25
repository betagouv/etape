import {
  CERTIFICATION_SEARCH_MAX_LENGTH,
  CERTIFICATION_SEARCH_MIN_LENGTH,
  searchCertifications,
  type Certification,
} from "@etape/api-contract";

import { httpClient } from "@/lib/clients";
import type { RemoteSearchDefinition, RemoteSearchResults } from "../hooks/use-remote-search";
import { CERTIFICATION_VISEE_SEARCH_TEXTS } from "./domain/certification-visee-search";
import { FORMATION_FIELD, FORMATION_FIELD_LABEL } from "./schema";

/** Le résumé d'erreurs mène à `#certificationVisee`. */
const CERTIFICATION_VISEE_FIELD_ID = FORMATION_FIELD.CERTIFICATION_VISEE;

async function fetchCertifications(search: string): Promise<RemoteSearchResults<Certification>> {
  const response = await httpClient.get<unknown>(searchCertifications.path, {
    params: { search },
  });
  const { certifications, certificationCount } = searchCertifications.response.parse(response.data);
  return { items: certifications, totalCount: certificationCount };
}

/** La recherche du diplôme dans les répertoires RNCP et RS : son champ, ses textes et son appel. */
export const CERTIFICATION_VISEE_SEARCH: RemoteSearchDefinition<Certification> = {
  id: CERTIFICATION_VISEE_FIELD_ID,
  label: FORMATION_FIELD_LABEL.certificationVisee,
  maxLength: CERTIFICATION_SEARCH_MAX_LENGTH,
  optionId: ({ numeroFiche }) => `${CERTIFICATION_VISEE_FIELD_ID}-option-${numeroFiche}`,
  texts: CERTIFICATION_VISEE_SEARCH_TEXTS,
  queryKey: "certification",
  minLength: CERTIFICATION_SEARCH_MIN_LENGTH,
  fetchResults: fetchCertifications,
};
