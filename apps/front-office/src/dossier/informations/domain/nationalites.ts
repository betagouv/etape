import { normalizeForSearch } from "@etape/utils/text";

export interface Nationalite {
  label: string;
  /** Les deux lettres du pays, en minuscules : la valeur enregistrée, et le nom de son drapeau. */
  code: string;
}

/** Le code de la nationalité proposée en tête de liste. */
export const SUGGESTION_NATIONALITE = "fr";

export const NO_NATIONALITE_MESSAGE = "Aucune nationalité ne correspond.";

export const NATIONALITES: readonly Nationalite[] = [
  { label: "Afghane", code: "af" },
  { label: "Albanaise", code: "al" },
  { label: "Algérienne", code: "dz" },
  { label: "Allemande", code: "de" },
  { label: "Américaine", code: "us" },
  { label: "Andorrane", code: "ad" },
  { label: "Angolaise", code: "ao" },
  { label: "Antiguaise-et-Barbudienne", code: "ag" },
  { label: "Argentine", code: "ar" },
  { label: "Arménienne", code: "am" },
  { label: "Australienne", code: "au" },
  { label: "Autrichienne", code: "at" },
  { label: "Azerbaïdjanaise", code: "az" },
  { label: "Bahaméenne", code: "bs" },
  { label: "Bahreïnienne", code: "bh" },
  { label: "Bangladaise", code: "bd" },
  { label: "Barbadienne", code: "bb" },
  { label: "Belge", code: "be" },
  { label: "Bélizienne", code: "bz" },
  { label: "Béninoise", code: "bj" },
  { label: "Bhoutanaise", code: "bt" },
  { label: "Biélorusse", code: "by" },
  { label: "Birmane", code: "mm" },
  { label: "Bissau-Guinéenne", code: "gw" },
  { label: "Bolivienne", code: "bo" },
  { label: "Bosnienne", code: "ba" },
  { label: "Botswanaise", code: "bw" },
  { label: "Brésilienne", code: "br" },
  { label: "Britannique", code: "gb" },
  { label: "Brunéienne", code: "bn" },
  { label: "Bulgare", code: "bg" },
  { label: "Burkinabè", code: "bf" },
  { label: "Burundaise", code: "bi" },
  { label: "Cambodgienne", code: "kh" },
  { label: "Camerounaise", code: "cm" },
  { label: "Canadienne", code: "ca" },
  { label: "Cap-Verdienne", code: "cv" },
  { label: "Centrafricaine", code: "cf" },
  { label: "Chilienne", code: "cl" },
  { label: "Chinoise", code: "cn" },
  { label: "Chypriote", code: "cy" },
  { label: "Colombienne", code: "co" },
  { label: "Comorienne", code: "km" },
  { label: "Congolaise (Congo)", code: "cg" },
  { label: "Congolaise (RD Congo)", code: "cd" },
  { label: "Costaricaine", code: "cr" },
  { label: "Croate", code: "hr" },
  { label: "Cubaine", code: "cu" },
  { label: "Danoise", code: "dk" },
  { label: "Djiboutienne", code: "dj" },
  { label: "Dominicaine", code: "do" },
  { label: "Dominiquaise", code: "dm" },
  { label: "Égyptienne", code: "eg" },
  { label: "Émirienne", code: "ae" },
  { label: "Équatoguinéenne", code: "gq" },
  { label: "Équatorienne", code: "ec" },
  { label: "Érythréenne", code: "er" },
  { label: "Espagnole", code: "es" },
  { label: "Estonienne", code: "ee" },
  { label: "Eswatinienne", code: "sz" },
  { label: "Éthiopienne", code: "et" },
  { label: "Fidjienne", code: "fj" },
  { label: "Finlandaise", code: "fi" },
  { label: "Française", code: "fr" },
  { label: "Gabonaise", code: "ga" },
  { label: "Gambienne", code: "gm" },
  { label: "Géorgienne", code: "ge" },
  { label: "Ghanéenne", code: "gh" },
  { label: "Grecque", code: "gr" },
  { label: "Grenadienne", code: "gd" },
  { label: "Guatémaltèque", code: "gt" },
  { label: "Guinéenne", code: "gn" },
  { label: "Guyanienne", code: "gy" },
  { label: "Haïtienne", code: "ht" },
  { label: "Hondurienne", code: "hn" },
  { label: "Hongroise", code: "hu" },
  { label: "Indienne", code: "in" },
  { label: "Indonésienne", code: "id" },
  { label: "Irakienne", code: "iq" },
  { label: "Iranienne", code: "ir" },
  { label: "Irlandaise", code: "ie" },
  { label: "Islandaise", code: "is" },
  { label: "Israélienne", code: "il" },
  { label: "Italienne", code: "it" },
  { label: "Ivoirienne", code: "ci" },
  { label: "Jamaïcaine", code: "jm" },
  { label: "Japonaise", code: "jp" },
  { label: "Jordanienne", code: "jo" },
  { label: "Kazakhstanaise", code: "kz" },
  { label: "Kényane", code: "ke" },
  { label: "Kirghize", code: "kg" },
  { label: "Kiribatienne", code: "ki" },
  { label: "Kittitienne-et-Névicienne", code: "kn" },
  { label: "Koweïtienne", code: "kw" },
  { label: "Laotienne", code: "la" },
  { label: "Lesothane", code: "ls" },
  { label: "Lettone", code: "lv" },
  { label: "Libanaise", code: "lb" },
  { label: "Libérienne", code: "lr" },
  { label: "Libyenne", code: "ly" },
  { label: "Liechtensteinoise", code: "li" },
  { label: "Lituanienne", code: "lt" },
  { label: "Luxembourgeoise", code: "lu" },
  { label: "Macédonienne", code: "mk" },
  { label: "Malaisienne", code: "my" },
  { label: "Malawienne", code: "mw" },
  { label: "Maldivienne", code: "mv" },
  { label: "Malgache", code: "mg" },
  { label: "Malienne", code: "ml" },
  { label: "Maltaise", code: "mt" },
  { label: "Marocaine", code: "ma" },
  { label: "Marshallaise", code: "mh" },
  { label: "Mauricienne", code: "mu" },
  { label: "Mauritanienne", code: "mr" },
  { label: "Mexicaine", code: "mx" },
  { label: "Micronésienne", code: "fm" },
  { label: "Moldave", code: "md" },
  { label: "Monégasque", code: "mc" },
  { label: "Mongole", code: "mn" },
  { label: "Monténégrine", code: "me" },
  { label: "Mozambicaine", code: "mz" },
  { label: "Namibienne", code: "na" },
  { label: "Nauruane", code: "nr" },
  { label: "Néerlandaise", code: "nl" },
  { label: "Néo-Zélandaise", code: "nz" },
  { label: "Népalaise", code: "np" },
  { label: "Nicaraguayenne", code: "ni" },
  { label: "Nigériane", code: "ng" },
  { label: "Nigérienne", code: "ne" },
  { label: "Nord-Coréenne", code: "kp" },
  { label: "Norvégienne", code: "no" },
  { label: "Omanaise", code: "om" },
  { label: "Ougandaise", code: "ug" },
  { label: "Ouzbèke", code: "uz" },
  { label: "Pakistanaise", code: "pk" },
  { label: "Palaosienne", code: "pw" },
  { label: "Palestinienne", code: "ps" },
  { label: "Panaméenne", code: "pa" },
  { label: "Papouane-Néo-Guinéenne", code: "pg" },
  { label: "Paraguayenne", code: "py" },
  { label: "Péruvienne", code: "pe" },
  { label: "Philippine", code: "ph" },
  { label: "Polonaise", code: "pl" },
  { label: "Portugaise", code: "pt" },
  { label: "Qatarienne", code: "qa" },
  { label: "Roumaine", code: "ro" },
  { label: "Russe", code: "ru" },
  { label: "Rwandaise", code: "rw" },
  { label: "Saint-Lucienne", code: "lc" },
  { label: "Saint-Marinaise", code: "sm" },
  { label: "Saint-Vincentaise", code: "vc" },
  { label: "Salomonaise", code: "sb" },
  { label: "Salvadorienne", code: "sv" },
  { label: "Samoane", code: "ws" },
  { label: "Santoméenne", code: "st" },
  { label: "Saoudienne", code: "sa" },
  { label: "Sénégalaise", code: "sn" },
  { label: "Serbe", code: "rs" },
  { label: "Seychelloise", code: "sc" },
  { label: "Sierra-Léonaise", code: "sl" },
  { label: "Singapourienne", code: "sg" },
  { label: "Slovaque", code: "sk" },
  { label: "Slovène", code: "si" },
  { label: "Somalienne", code: "so" },
  { label: "Soudanaise", code: "sd" },
  { label: "Sri-Lankaise", code: "lk" },
  { label: "Sud-Africaine", code: "za" },
  { label: "Sud-Coréenne", code: "kr" },
  { label: "Sud-Soudanaise", code: "ss" },
  { label: "Suédoise", code: "se" },
  { label: "Suisse", code: "ch" },
  { label: "Surinamaise", code: "sr" },
  { label: "Syrienne", code: "sy" },
  { label: "Tadjike", code: "tj" },
  { label: "Taïwanaise", code: "tw" },
  { label: "Tanzanienne", code: "tz" },
  { label: "Tchadienne", code: "td" },
  { label: "Tchèque", code: "cz" },
  { label: "Thaïlandaise", code: "th" },
  { label: "Timoraise", code: "tl" },
  { label: "Togolaise", code: "tg" },
  { label: "Tonguienne", code: "to" },
  { label: "Trinidadienne", code: "tt" },
  { label: "Tunisienne", code: "tn" },
  { label: "Turkmène", code: "tm" },
  { label: "Turque", code: "tr" },
  { label: "Tuvaluane", code: "tv" },
  { label: "Ukrainienne", code: "ua" },
  { label: "Uruguayenne", code: "uy" },
  { label: "Vanuatuane", code: "vu" },
  { label: "Vénézuélienne", code: "ve" },
  { label: "Vietnamienne", code: "vn" },
  { label: "Yéménite", code: "ye" },
  { label: "Zambienne", code: "zm" },
  { label: "Zimbabwéenne", code: "zw" },
];

const NATIONALITE_BY_CODE = new Map(NATIONALITES.map((n) => [n.code, n]));

/** Les nationalités dont le libellé contient la recherche, sans casse ni accents ; toutes si elle est vide. */
export function findNationalites(query: string): readonly Nationalite[] {
  const trimmed = query.trim();
  if (!trimmed) return NATIONALITES;
  const normalized = normalizeForSearch(trimmed);
  return NATIONALITES.filter((n) => normalizeForSearch(n.label).includes(normalized));
}

/** La nationalité qui porte ce code, sinon `undefined`. */
export function findNationaliteByCode(code: string): Nationalite | undefined {
  return NATIONALITE_BY_CODE.get(code);
}

export interface NationaliteGroups {
  /** La nationalité proposée en tête de liste, quand la recherche la retient. */
  suggestion: Nationalite | null;
  nationalites: readonly Nationalite[];
}

/** Met la suggestion à part des autres nationalités : la liste l'affiche en tête, dans son propre groupe. */
export function splitSuggestion(nationalites: readonly Nationalite[]): NationaliteGroups {
  const suggestion = nationalites.find(({ code }) => code === SUGGESTION_NATIONALITE) ?? null;
  return {
    suggestion,
    nationalites: suggestion
      ? nationalites.filter((nationalite) => nationalite !== suggestion)
      : nationalites,
  };
}

/*
 * Un glob `?url&no-inline` : chaque drapeau reste un fichier chargé à la demande. Un `new URL`
 * à segment dynamique les faisait tous inliner en data URI dans le bundle initial (+400 Ko).
 */
const FLAG_URLS = import.meta.glob<string>("/node_modules/circle-flags/flags/*.svg", {
  query: "?url&no-inline",
  import: "default",
  eager: true,
});

/** L'adresse du drapeau d'un pays, par son code à deux lettres ; vide si le drapeau manque. */
export function flagUrl(code: string): string {
  return FLAG_URLS[`/node_modules/circle-flags/flags/${code}.svg`] ?? "";
}
