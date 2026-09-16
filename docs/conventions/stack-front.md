# Stack front — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/site`, `apps/simulateur`, `packages/ui`

Ce document valide les outils du front. La façon d'écrire le code relève de [`react.md`](./react.md), le nommage de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md), l'accessibilité de [`accessibilite.md`](./accessibilite.md).

Chaque décision est suivie de ses **principes** quand il y en a, et d'un **exemple** dépliable : code réel du dépôt, ou proposition explicitement marquée.

## En place, acté

| Brique               | Version     | Rôle                                                       |
| -------------------- | ----------- | ---------------------------------------------------------- |
| Next.js              | 16.3.4      | Les deux apps en **export statique** (`output: "export"`)  |
| React                | 19.2.8      | —                                                          |
| TypeScript           | 5.9.3       | `strict` activé                                            |
| Tailwind CSS         | 4.3.3       | Thème par tokens dans `packages/ui/src/styles/globals.css` |
| shadcn/ui sur Radix  | radix 1.6.7 | Composants copiés dans `packages/ui/src/components/`       |
| lucide-react, sonner | 1.44, 2.0.8 | Icônes, notifications                                      |
| next-themes          | 0.4.6       | Thème clair / sombre                                       |
| Turborepo            | 2.10.12     | Orchestration du monorepo                                  |
| ESLint, Prettier     | 9.39, 3.9   | Configs partagées dans `packages/`                         |

**Conséquence structurante de l'export statique** : aucune Server Action, aucun endpoint Next. Ce qui n'est pas calculable au build se fait dans le navigateur, ou via l'API NestJS. Les recommandations React 19 autour de `useActionState` et des actions serveur ne s'appliquent donc pas ici.

## Décision 1 — Bibliothèque de formulaires

### La situation à trancher

Le dépôt contient **deux approches, dont une n'a jamais servi** :

- `packages/ui` déclare `react-hook-form` ^7.87, `@hookform/resolvers` ^5.9 et `zod` ^4.5, et contient le composant shadcn `form.tsx`. **Aucune app ne l'importe.**
- Le simulateur n'utilise aucune bibliothèque : ses questions sont des données, validées par un `switch` maison.

Ce n'est pas un détail de goût : tant que rien n'est écrit, le prochain formulaire partira dans une direction ou dans l'autre selon qui l'écrit.

<details><summary><strong>Exemple — à quoi ressemblent les deux approches</strong></summary>

**Ce que fait le simulateur aujourd'hui** (code réel). Une question est une **donnée**, pas du JSX : c'est ce qui permet à la PO de relire le parcours, et au moteur de dériver d'une seule déclaration la progression, la validation et le récapitulatif.

```ts
{
  id: "Q4",
  fields: [{ name: FIELD_ANCIENNETE, type: "month", label: "Depuis quand ?" }],
  quand: (answers) => aUnEmployeur(answers),
}
```

La validation est un `switch` sur le type de champ, écrit une fois pour les six types existants :

```ts
function isFieldComplete(field: Field, answers: Answers): boolean {
  switch (field.type) {
    case "number":
      return /^\d+$/.test(String(answers[field.name] ?? ""));
    case "month":
      return parseMonth(answers[field.name]) !== null;
    // …
  }
}
```

**Ce que donnerait react-hook-form + zod** sur un futur formulaire de dépôt (proposition). Ici les champs sont fixes, connus à l'avance, et écrits directement en JSX :

```tsx
const schema = z.object({
  dateEntretien: z.iso.date(),
  nomConseiller: z.string().min(1, "Indiquez le nom du conseiller."),
});

<FormField
  control={form.control}
  name="nomConseiller"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nom du conseiller</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>;
```

**Ce que l'exemple montre** : `FormLabel`, `FormControl` et `FormMessage` génèrent et relient `id`, `aria-describedby` et `aria-invalid` entre eux. C'est exactement le travail que le simulateur fait à la main dans `fields/aria.ts` — une vingtaine de lignes qu'il faudrait réécrire, et surtout ne pas oublier, sur chaque nouveau formulaire.

</details>

### Options

| Option                                                                                    | Coût                                                                                         |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A.** Tout en maison ; retirer react-hook-form et `form.tsx`                             | Jeter un composant déjà là ; réécrire à la main le câblage ARIA pour chaque futur formulaire |
| **B.** react-hook-form + zod pour les nouveaux formulaires ; le simulateur reste tel quel | Deux approches cohabitent, avec un critère écrit pour savoir laquelle s'applique             |
| **C.** Tout migrer sur react-hook-form, simulateur compris                                | Réécrire un moteur qui fonctionne, sans bénéfice utilisateur                                 |

### Proposition : option B, avec un critère explicite

**react-hook-form + zod, via `form.tsx`**, dès qu'un écran réunit ces trois traits : plusieurs champs saisis librement sur une même page, des erreurs affichées par champ, et une soumission à l'API.

**Le simulateur garde son moteur déclaratif.** Ce n'est pas un formulaire : une question par écran, une navigation dérivée de l'URL, des réponses persistées entre les sessions, des règles de cohérence entre questions. react-hook-form gère l'état d'un formulaire monté — il n'a rien à apporter ici, et ferait perdre le caractère déclaratif des questions.

**Pourquoi react-hook-form plutôt que TanStack Form** : le composant `Form` de shadcn/ui, sur lequel repose déjà notre bibliothèque, est écrit pour react-hook-form. Choisir TanStack Form (1.33.5, projet actif et sérieux) voudrait dire réécrire ce câblage nous-mêmes, pour un gain que nous ne savons pas nommer aujourd'hui.

**Ce qui reste à notre charge dans les deux cas** : react-hook-form ne fournit ni style ni ARIA, et `form.tsx` ne déplace pas le focus vers le premier champ en erreur — ce que le simulateur, lui, fait déjà (`QuestionScreen`, `focusFirstInvalid`).

## Décision 2 — Validation de schéma : zod

**zod v4**, déjà présent côté `packages/ui` (^4.5) et côté API (^4.1, pour l'environnement). Une seule bibliothèque de schémas des deux côtés : c'est la condition du contrat de route partagé (décision 5), qui suppose qu'API et front lisent le même objet.

**Alternative écartée pour l'instant** : valibot (1.5.0) pèse de l'ordre du kilo-octet une fois compressé, contre plusieurs pour zod. À reconsidérer seulement si une mesure du bundle du simulateur — pensé comme un widget embarquable — montre que zod y pèse. Aujourd'hui, le simulateur n'embarque ni l'un ni l'autre.

<details><summary><strong>Exemple — un schéma qui sert des deux côtés</strong> (proposition)</summary>

```ts
// packages/api-contract/src/dossier/dossier.schema.ts
export const DepotDossierSchema = z.object({
  dateEntretien: z.iso.date(),
  nomConseiller: z.string().min(1),
  operateurCep: z.enum(["avenir_actifs", "apec", "cap_emploi"]),
});

export type DepotDossier = z.infer<typeof DepotDossierSchema>;
```

**Ce que ça change** : le front s'en sert comme resolver de formulaire — les messages d'erreur s'affichent sous les champs sans appel réseau —, l'API s'en sert comme pipe de validation. La règle « l'opérateur CEP fait partie de ces trois-là » est écrite **une fois**.

**Le scénario que ça évite** : la PO ajoute un opérateur. Sans schéma partagé, on le liste côté front, on oublie côté API, et la soumission échoue en 400 sur un choix que le formulaire proposait lui-même. Avec, l'oubli n'est pas possible : c'est le même fichier.

</details>

## Décision 3 — Données venant de l'API : TanStack Query

**Brique retenue par l'équipe** pour tout ce qui vient de l'API : cache, revalidation, déduplication des requêtes, états de chargement et d'erreur, nouvelle tentative.

**Point de fait à connaître avant d'en parler** : elle n'est **pas encore installée** — aucune déclaration dans un `package.json`, aucune entrée dans `package-lock.json`, aucun `useQuery` dans le code. C'est normal, aucun écran n'appelle encore l'API. Version actuelle : `@tanstack/react-query` 5.103.0.

### Les principes

1. **Toute donnée qui vient de l'API passe par TanStack Query.** Pas de `fetch` dans un `useEffect`.
2. **Le store maison ne stocke jamais de donnée serveur** (décision 4) : une donnée a un seul propriétaire.
3. **Les clés de requête d'un module sont déclarées au même endroit.**
4. **Une écriture invalide explicitement ce qu'elle a rendu faux**, sinon l'écran continue d'afficher l'ancien état.

<details><summary><strong>Exemple — les clés au même endroit, et pourquoi</strong> (proposition)</summary>

```ts
// dossier/api/dossier.queries.ts
export const dossierKeys = {
  tous: ["dossier"] as const,
  detail: (id: string) => [...dossierKeys.tous, id] as const,
};

export function useDossier(id: string) {
  return useQuery({
    queryKey: dossierKeys.detail(id),
    queryFn: () => callApi(getDossier, { params: { id } }),
  });
}

export function useDeposerDossier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: DepotDossier) => callApi(depotDossier, { body: corps }),
    onSuccess: () => client.invalidateQueries({ queryKey: dossierKeys.tous }),
  });
}
```

**Pourquoi centraliser les clés** : une clé est une valeur écrite à deux endroits — là où on lit, là où on invalide après une écriture. Écrites de mémoire, elles finissent par diverger (`["dossiers"]` d'un côté, `["dossier"]` de l'autre) et l'invalidation ne fait plus rien. Le symptôme est déroutant : le dépôt fonctionne, mais la liste ne se met à jour qu'au rechargement, et rien n'échoue. Déclarées une fois, les deux usages ne peuvent plus se désynchroniser.

**À noter sur le nommage** : `dossierKeys` mélange un nom métier français et un mot technique anglais — c'est exactement ce que la convention autorise (grammaire anglaise, nom métier français).

</details>

## Décision 4 — État local : le store maison reste

Le store du simulateur est conservé pour l'état de l'écran et du parcours. Ni Redux, ni Zustand, ni Jotai : l'état tient en un reducer et une clé de stockage.

<details><summary><strong>Exemple — ce que fait le store, et ce qu'il ne fera jamais</strong></summary>

Code réel (`questionnaire/state/flow-store.ts`) : un module singleton, lu par `useSyncExternalStore`, persisté en `sessionStorage` sous une clé **versionnée**.

```ts
/** À incrémenter dès que la forme de `FlowState` change. */
const STORAGE_KEY = "etape.flow.v3";

export const flowStore = { subscribe, getSnapshot, getServerSnapshot, dispatch };
```

**Pourquoi la clé porte un numéro** : les réponses survivent au rechargement. Si la forme de l'état change — un champ renommé, un type modifié —, une session ouverte avant le déploiement relirait un objet qu'elle ne sait plus interpréter. Incrémenter la clé revient à déclarer l'ancien contenu illisible : la personne repart d'un questionnaire vierge plutôt que de tomber sur un écran cassé.

**La frontière avec la décision 3** : ce store porte ce que la personne a saisi et où elle en est — des données qui n'existent que dans son navigateur, dont personne d'autre ne détient la vérité. Un dossier renvoyé par l'API, lui, appartient au cache de TanStack Query, qui sait quand il est périmé. Recopier l'un dans l'autre créerait deux vérités, et la question « laquelle est à jour ? » n'aurait pas de réponse.

</details>

## Décision 5 — Comment le front appelle l'API

Le front est statique : il parle à l'API NestJS en HTTP, avec un cookie de session. **Le contrat de chaque route vient du paquet partagé `packages/api-contract`** — méthode, chemin, schémas des paramètres, du corps et de la réponse — décrit dans [`architecture-api.md`](./architecture-api.md), décision 3.

Le front n'ajoute par-dessus qu'**une seule fonction**, et c'est volontaire : un seul endroit sait où est l'API, comment s'envoient les cookies, et ce qu'on fait d'un 401.

<details><summary><strong>Exemple — la fonction d'appel, en entier</strong> (proposition)</summary>

```ts
// src/api/call-api.ts
export async function callApi<R extends RouteDefinition>(
  route: R,
  options: { params?: RouteParams<R>; query?: RouteQuery<R>; body?: RouteBody<R> } = {},
): Promise<RouteResponse<R>> {
  const reponse = await fetch(`${API_BASE_URL}${buildRoutePath(route, options)}`, {
    method: route.method,
    credentials: "include", // le cookie de session, jamais un jeton
    headers: options.body ? { "content-type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (reponse.status === 401) {
    redirectToLogin();
    throw new ApiError("Session expirée", 401);
  }

  if (!reponse.ok) throw await ApiError.from(reponse);

  return route.response.parse(await reponse.json());
}
```

**Ce que chaque ligne règle, et qu'il faudrait réécrire sinon :**

- `credentials: "include"` — la session est un cookie `httpOnly`. Oublié une fois, l'appel part anonyme et répond 401 sans raison apparente.
- Le traitement du 401 au même endroit — sinon chaque écran invente sa façon de réagir à une session expirée.
- `route.response.parse(...)` — la réponse est **validée à la frontière**. Une API qui change sans prévenir échoue ici, avec un message qui nomme le champ fautif, au lieu de produire un `undefined` qui plantera trois composants plus loin, au milieu d'un rendu, sans indice sur l'origine.

**Le nom** : `callApi`, et non `appelApi`. La convention réserve le français aux noms métier ; une fonction d'appel HTTP est purement technique, donc anglaise — au même titre que `database` ou `interceptor`.

</details>

**Pas de client généré depuis l'OpenAPI** : le contrat partagé rend la génération inutile tant que l'API n'a qu'un seul consommateur, qui est ce dépôt.

## Décision 6 — Composants : une seule bibliothèque, dans `packages/ui`

**shadcn/ui sur Radix, copié dans `packages/ui/src/components/`** — c'est l'existant. Ce qui se décide ici, c'est la règle d'ajout : un composant utilisé par plus d'une app va dans `packages/ui` ; **pas de seconde bibliothèque de composants** ; les tokens de `globals.css` sont la seule source de couleur.

<details><summary><strong>Exemple — étendre par variante, comme le dépôt le fait déjà</strong></summary>

Code réel, `packages/ui/src/components/button.tsx`. Deux variantes n'existent pas chez shadcn ; le commentaire dit d'où elles viennent, ce qui évite qu'on les prenne un jour pour une erreur de copie.

```ts
// Variantes ETAPE (hors shadcn) : surface claire, libellé teal, pour les
// CTA posés sur un fond coloré.
inverse: "bg-background text-primary shadow-xs hover:bg-background/90",
"outline-primary": "border border-primary bg-background text-primary hover:bg-secondary",
```

Et les tokens qu'elles utilisent portent leur équivalent Figma :

```css
--primary: #00796b; /* Action/Primary/Default (Teal-700) */
--secondary: #e0f2f1; /* Surface/Base/Secondary (Teal-50) */
```

**Ce que le commentaire Figma permet concrètement** : devant une maquette, on retrouve le token par son nom au lieu de comparer des codes hexadécimaux à l'œil. Et le jour où la charte change une couleur, une seule ligne bouge — tous les composants suivent, thème sombre compris.

**Le contre-exemple correspondant** — un `className` d'app qui recrée l'apparence complète d'un bouton — est détaillé dans [`react.md`](./react.md), section 4.2.

</details>

## Décision 7 — Accessibilité outillée

Le [document d'accessibilité](./accessibilite.md) fixe les règles ; il manquait de quoi les vérifier.

**Constat mesuré** : `eslint-config-next` n'activait que **6 règles `jsx-a11y`**, toutes en avertissement — donc invisibles en CI, qui n'échoue que sur les erreurs. Le plugin complet était déjà installé, en dépendance transitive.

**Mise en œuvre** (voir [`outillage-agent.md`](./outillage-agent.md)) : 22 règles activées **en erreur**, `@axe-core/playwright` sur les parcours une fois Playwright installé, et pas de `vitest-axe` (0.1.0, projet immature).

<details><summary><strong>Exemple — ce que les nouvelles règles attrapent, et ce qu'elles ne verront jamais</strong></summary>

```tsx
// Refusé : click-events-have-key-events, no-static-element-interactions
<div onClick={ouvrir}>Voir le détail</div>

// Accepté : focusable, actionnable au clavier, annoncé comme bouton
<button type="button" onClick={ouvrir}>Voir le détail</button>
```

Le premier cas est le plus fréquent et le plus coûteux : à la souris tout fonctionne, donc le défaut passe la recette. Au clavier, l'élément n'est pas atteignable ; au lecteur d'écran, un texte est annoncé sans qu'on sache qu'il est cliquable.

```tsx
// Refusé : label-has-associated-control
<label>Ancienneté</label>
<input id="anciennete" />

// Accepté
<label htmlFor="anciennete">Ancienneté</label>
```

Sans l'association, le champ n'a **pas de nom accessible** : le lecteur d'écran annonce « zone de saisie », sans dire laquelle.

**Fait vérifié** : aucune de ces 22 règles ne produit d'erreur sur le code existant. Le durcissement ne coûte rien aujourd'hui ; il empêche la régression demain.

**Ce que ces règles ne verront jamais** : la perte du focus après une action, l'ordre de tabulation, la pertinence d'une annonce. Elles vérifient la structure, pas l'expérience — d'où le test clavier en revue.

</details>

## Décision 8 — Tests : à installer

**Il n'existe aujourd'hui aucun test dans le dépôt** : aucun runner, aucun fichier, et la CI ne fait que `format:check`, `lint`, `typecheck` et `build`.

| Besoin                                                                                  | Outil                                                |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Domaine du simulateur (fonctions pures : validation, parcours, sélection des résultats) | **Vitest** 5                                         |
| Composants (rendu, clavier, ARIA)                                                       | **Vitest** + **@testing-library/react** 16 + jsdom   |
| Parcours complet dans un navigateur                                                     | **Playwright** 1.63, sur quelques parcours seulement |

<details><summary><strong>Exemple — le premier test à écrire, et pourquoi celui-là</strong> (proposition)</summary>

```ts
// resultats/domain/selection.test.ts
it("n'affiche pas le CEP à un demandeur d'emploi", () => {
  // France Travail y est l'opérateur CEP : la carte ferait doublon
  // et enverrait au mauvais guichet.
  const profil = buildProfil({ [FIELD_SITUATION]: SITUATION_DEMANDEUR_EMPLOI });

  const ids = selectResultats(profil).map((resultat) => resultat.id);

  expect(ids).not.toContain("cep");
  expect(ids).toContain("france-travail");
});
```

**Pourquoi commencer ici plutôt que par les composants :**

- **C'est ce qui fait mal en cas de régression.** Un défaut de style se voit ; une carte affichée au mauvais public ne se voit pas, et envoie quelqu'un au mauvais guichet.
- **C'est déjà testable sans effort** : `selectResultats` est une fonction pure, sans React, sans DOM, sans store. Aucune infrastructure de test à inventer.
- **Le test dit la règle métier dans le vocabulaire de la PO**, et sert de documentation vérifiée : `catalogue.ts` porte les neuf scénarios du ticket, et rien ne les contrôle aujourd'hui.

</details>

**Condition pour que ça tienne** : ajouter `npm run test` à la CI dans la même PR que les premiers tests, sinon ils pourrissent sans que personne ne le voie.

## Décision 9 — Langue de l'interface : français uniquement

Aucune bibliothèque d'internationalisation. Les textes sont écrits en français dans les composants et les données de contenu ; les accents vivent dans les libellés, jamais dans les identifiants ([`nommage.md`](./nommage.md)).

**Ce que ça engage** : le jour où une autre langue est demandée, c'est une PR dédiée qui extrait les textes. Poser une bibliothèque d'i18n « au cas où » coûterait aujourd'hui une indirection sur chaque libellé — `t("resultats.titre")` au lieu du texte lisible — pour un besoin qui n'est pas au programme.

## Questions à trancher

1. Option B pour les formulaires, avec le critère écrit ci-dessus ?
2. Le simulateur reste-t-il sur son moteur déclaratif ? Cela fige deux approches dans le dépôt, assumées.
3. zod partout, ou mesure préalable du bundle avant de fixer zod plutôt que valibot ?
4. TanStack Query est acté : qui l'installe, et sur quelle première PR ?
5. Contrat de route partagé et fonction `callApi` unique : validé ? Se tranche avec la décision 3 de [`architecture-api.md`](./architecture-api.md).
6. Les 22 règles `jsx-a11y` en erreur : validées ?
7. Vitest + Testing Library + Playwright : qui écrit les premiers tests, et sur quel périmètre ?
8. Français uniquement, sans bibliothèque d'i18n : validé ?
9. Si l'option A est retenue en décision 1, il faut retirer `react-hook-form`, `@hookform/resolvers`, `zod` et `form.tsx` de `packages/ui` dans la foulée.
