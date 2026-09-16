# Stack front — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/site`, `apps/simulateur`, `packages/ui`

Ce document valide les outils du front : ce qui est en place et n'est pas rediscuté, ce qui reste à trancher, et selon quels critères. La façon d'écrire le code relève de [`react.md`](./react.md), le nommage de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md), l'accessibilité de [`accessibilite.md`](./accessibilite.md).

Chaque décision porte un exemple : soit du code réel du dépôt, soit une proposition explicitement marquée comme telle.

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

**Conséquence structurante de l'export statique** : aucune Server Action, aucun endpoint Next. Tout ce qui n'est pas calculable au build se fait dans le navigateur, ou via l'API NestJS. Les recommandations React 19 autour de `useActionState` et des actions serveur ne s'appliquent donc pas ici.

## Décision 1 — Bibliothèque de formulaires

### Situation actuelle : deux approches, dont une inutilisée

- `packages/ui` déclare `react-hook-form` ^7.87, `@hookform/resolvers` ^5.9 et `zod` ^4.5, et contient le composant shadcn `form.tsx`. **Aucune app ne l'importe** à ce jour.
- Le simulateur n'utilise aucune bibliothèque : ses questions sont des données, validées par un `switch` maison.

<details><summary><strong>Exemple — à quoi ressemblent les deux approches</strong></summary>

**Le moteur déclaratif du simulateur** (code réel, `questionnaire/domain/questions.ts` et `domain/validation.ts`) : une question est une donnée, jamais du JSX.

```ts
{
  id: "Q4",
  fields: [{ name: FIELD_ANCIENNETE, type: "month", label: "Depuis quand ?" }],
  quand: (answers) => aUnEmployeur(answers),
}
```

La validation est un `switch` sur `field.type`, partagé par tous les champs :

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

**Ce que donnerait react-hook-form + zod** (proposition, pour un futur formulaire de dépôt) :

```tsx
const schema = z.object({
  dateEntretien: z.iso.date(),
  nomConseiller: z.string().min(1, "Indiquez le nom du conseiller."),
});

const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

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

`FormLabel`, `FormControl` et `FormMessage` câblent `id`, `aria-describedby` et `aria-invalid` entre eux — c'est précisément ce que le simulateur fait à la main dans `fields/aria.ts`.

</details>

### Options

| Option                                                                                    | Coût                                                                                         |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A.** Tout en maison ; retirer react-hook-form et `form.tsx`                             | Jeter un composant déjà là ; réécrire à la main le câblage ARIA pour chaque futur formulaire |
| **B.** react-hook-form + zod pour les nouveaux formulaires ; le simulateur reste tel quel | Deux approches cohabitent, avec un critère écrit pour savoir laquelle s'applique             |
| **C.** Tout migrer sur react-hook-form, simulateur compris                                | Réécrire un moteur qui fonctionne, sans bénéfice utilisateur                                 |

### Proposition : option B, avec un critère explicite

**react-hook-form + zod, via le composant `form.tsx` de `packages/ui`**, dès qu'un écran réunit ces trois traits : plusieurs champs saisis librement sur une même page, des erreurs affichées par champ, et une soumission à l'API.

**Le simulateur garde son moteur déclaratif.** Ce n'est pas un formulaire : une question par écran, une navigation dérivée de l'URL, des réponses persistées entre les sessions, et des règles de cohérence entre questions.

**Pourquoi react-hook-form plutôt que TanStack Form** : le composant `Form` de shadcn/ui, sur lequel repose déjà notre bibliothèque, est écrit pour react-hook-form. Choisir TanStack Form (1.33.5, projet actif et sérieux) voudrait dire réécrire ce câblage nous-mêmes.

**À la charge du développeur** : react-hook-form ne fournit ni style ni ARIA, et `form.tsx` ne déplace pas le focus vers le premier champ en erreur — ce que le simulateur, lui, fait déjà (`QuestionScreen`, `focusFirstInvalid`).

## Décision 2 — Validation de schéma : zod

**zod v4**, déjà présent côté `packages/ui` (^4.5) et côté API (^4.1, pour valider l'environnement). Une seule bibliothèque de schémas des deux côtés — c'est la condition du contrat de route partagé (décision 5).

**Alternative écartée pour l'instant** : valibot (1.5.0) est plus léger — de l'ordre du kilo-octet une fois compressé, contre plusieurs pour zod. À reconsidérer seulement si une mesure du bundle du simulateur, pensé comme un widget embarquable, montre que zod y pèse.

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

Le front s'en sert comme resolver de formulaire, l'API comme pipe de validation. Une règle qui change — un champ devenu obligatoire — casse la compilation des deux côtés, au lieu de produire un 400 en production.

</details>

**Porte de sortie** : zod, valibot et arktype implémentent [Standard Schema](https://standardschema.dev/). `@hookform/resolvers` 5.x et NestJS acceptent cette interface : changer de bibliothèque plus tard ne rejouerait pas le câblage.

## Décision 3 — Données venant de l'API : TanStack Query

**TanStack Query est la brique retenue** pour tout ce qui vient de l'API : cache, revalidation, déduplication des requêtes, états de chargement et d'erreur, nouvelle tentative. C'est l'outil que l'équipe connaît et veut garder.

**Point de fait** : il n'est **pas encore installé dans ce dépôt** — aucune déclaration dans un `package.json`, aucune entrée dans `package-lock.json`, aucun `useQuery` dans le code. Version actuelle : `@tanstack/react-query` 5.103.0.

**Les règles qui en découlent** :

- **Toute donnée qui vient de l'API passe par TanStack Query.** Pas de `fetch` dans un `useEffect`, pas de donnée serveur recopiée dans un state local.
- **Le store maison ne stocke jamais de donnée serveur** (décision 4).
- Les clés de requête sont construites à un seul endroit par module.

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
    queryFn: () => appelApi(getDossier, { params: { id } }),
  });
}

export function useDeposerDossier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: DepotDossier) => appelApi(depotDossier, { body: corps }),
    // Sans clés centralisées, cette ligne s'écrit de mémoire et finit par
    // invalider une clé qui n'existe plus.
    onSuccess: () => client.invalidateQueries({ queryKey: dossierKeys.tous }),
  });
}
```

</details>

## Décision 4 — État local : le store maison reste

Le store du simulateur est conservé pour l'état de l'écran et du parcours. Ni Redux, ni Zustand, ni Jotai.

<details><summary><strong>Exemple — ce que fait le store, et ce qu'il ne fera jamais</strong></summary>

Code réel (`questionnaire/state/flow-store.ts`, `hooks/useFlow.ts`) : un module singleton, lu par `useSyncExternalStore`, persisté en `sessionStorage` sous une clé versionnée.

```ts
/** À incrémenter dès que la forme de `FlowState` change. */
const STORAGE_KEY = "etape.flow.v3";

export const flowStore = { subscribe, getSnapshot, getServerSnapshot, dispatch };
```

**Frontière avec la décision 3** : ce store porte ce que la personne a saisi et où elle en est — des données qui n'existent que dans son navigateur. Un dossier renvoyé par l'API n'y entre jamais : il appartient au cache de TanStack Query, qui sait quand il est périmé. Recopier l'un dans l'autre, c'est créer deux vérités.

</details>

## Décision 5 — Comment le front appelle l'API

Le front est statique : il parle à l'API NestJS en HTTP, avec un cookie de session. **Le contrat de chaque route vient du paquet partagé `packages/api-contract`** — méthode, chemin, schémas des paramètres, du corps et de la réponse — décrit dans [`architecture-api.md`](./architecture-api.md), décision 3.

<details><summary><strong>Exemple — la fonction d'appel, en entier</strong> (proposition)</summary>

```ts
// src/api/appel-api.ts
export async function appelApi<R extends RouteDefinition>(
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
    redirigerVersConnexion();
    throw new ErreurApi("Session expirée", 401);
  }

  if (!reponse.ok) throw await ErreurApi.depuis(reponse);

  // La réponse est validée à la frontière : une API qui change sans prévenir
  // échoue ici, pas trois composants plus loin.
  return route.response.parse(await reponse.json());
}
```

Usage, côté composant : `const dossier = await appelApi(getDossier, { params: { id } });` — et `dossier` est typé sans qu'aucun type ait été réécrit.

</details>

**Pas de client généré depuis l'OpenAPI** : le contrat partagé rend la génération inutile tant que l'API n'a qu'un seul consommateur, qui est ce dépôt.

## Décision 6 — Composants : une seule bibliothèque, dans `packages/ui`

**shadcn/ui sur Radix, copié dans `packages/ui/src/components/`** — c'est l'existant. Ce qui se décide ici, c'est la règle d'ajout : un composant utilisé par plus d'une app va dans `packages/ui` ; **pas de seconde bibliothèque** ; les tokens de `globals.css` sont la seule source de couleur.

<details><summary><strong>Exemple — étendre par variante, comme le dépôt le fait déjà</strong></summary>

Code réel, `packages/ui/src/components/button.tsx` : deux variantes n'existent pas chez shadcn, et le commentaire dit d'où elles viennent.

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

C'est le motif à suivre : le besoin d'apparence entre **dans** le composant, une fois, et devient disponible partout. Le contre-exemple est dans [`react.md`](./react.md) §4.2.

</details>

## Décision 7 — Accessibilité outillée

Le [document d'accessibilité](./accessibilite.md) fixe les règles ; il manquait de quoi les vérifier.

**Constat mesuré** : `eslint-config-next` n'activait que **6 règles `jsx-a11y`**, toutes en avertissement. Le plugin complet est déjà installé, en dépendance transitive.

**Proposition, mise en œuvre dans [`outillage-agent.md`](./outillage-agent.md)** : 22 règles activées en erreur, `@axe-core/playwright` sur les parcours une fois Playwright installé, et pas de `vitest-axe` (0.1.0, projet immature).

<details><summary><strong>Exemple — ce que les nouvelles règles attrapent</strong></summary>

```tsx
// Refusé par jsx-a11y/click-events-have-key-events et no-static-element-interactions
<div onClick={ouvrir}>Voir le détail</div>

// Accepté : un bouton est focusable, actionnable au clavier, et annoncé comme tel
<button type="button" onClick={ouvrir}>Voir le détail</button>
```

```tsx
// Refusé par jsx-a11y/label-has-associated-control
<label>Ancienneté</label>
<input id="anciennete" />

// Accepté
<label htmlFor="anciennete">Ancienneté</label>
<input id="anciennete" />
```

**Fait vérifié** : aucune de ces 22 règles ne produit d'erreur sur le code existant. Le durcissement ne coûte rien aujourd'hui, et empêche la régression demain.

</details>

## Décision 8 — Tests : à installer

**Il n'existe aujourd'hui aucun test dans le dépôt** : aucun runner, aucun fichier, et la CI ne fait que `format:check`, `lint`, `typecheck` et `build`.

| Besoin                                                                                  | Outil                                                |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Domaine du simulateur (fonctions pures : validation, parcours, sélection des résultats) | **Vitest** 5                                         |
| Composants (rendu, clavier, ARIA)                                                       | **Vitest** + **@testing-library/react** 16 + jsdom   |
| Parcours complet dans un navigateur                                                     | **Playwright** 1.63, sur quelques parcours seulement |

<details><summary><strong>Exemple — le premier test à écrire</strong> (proposition)</summary>

Les règles métier sont des fonctions pures : elles se testent sans React, sans DOM, sans store.

```ts
// resultats/domain/selection.test.ts
it("n'affiche pas le CEP à un demandeur d'emploi", () => {
  // France Travail y est l'opérateur CEP : la carte ferait doublon.
  const profil = buildProfil({ [FIELD_SITUATION]: SITUATION_DEMANDEUR_EMPLOI });

  const ids = selectResultats(profil).map((resultat) => resultat.id);

  expect(ids).not.toContain("cep");
  expect(ids).toContain("france-travail");
});
```

Ce test dit une règle écrite avec la PO, dans son vocabulaire. C'est le meilleur rapport valeur/effort du dépôt : `catalogue.ts` et `selection.ts` portent les neuf scénarios du ticket, et rien ne les vérifie aujourd'hui.

</details>

**Condition pour que ça tienne** : ajouter `npm run test` à la CI dans la même PR que les premiers tests.

## Décision 9 — Langue de l'interface : français uniquement

Aucune bibliothèque d'internationalisation. Les textes sont écrits en français dans les composants et les données de contenu ; les accents vivent dans les libellés, jamais dans les identifiants ([`nommage.md`](./nommage.md)).

**Ce que ça engage** : le jour où une autre langue est demandée, c'est une PR dédiée qui extrait les textes. Poser une bibliothèque d'i18n « au cas où » coûterait aujourd'hui une indirection sur chaque libellé, sans bénéfice.

## Questions à trancher

1. Option B pour les formulaires, avec le critère écrit ci-dessus ?
2. Le simulateur reste-t-il sur son moteur déclaratif ? Cela fige deux approches dans le dépôt, assumées.
3. zod partout, ou mesure préalable du bundle avant de fixer zod plutôt que valibot ?
4. TanStack Query est acté : qui l'installe, et sur quelle première PR ?
5. Contrat de route partagé et fonction `appelApi` unique : validé ? Se tranche avec la décision 3 de [`architecture-api.md`](./architecture-api.md).
6. Les 22 règles `jsx-a11y` en erreur : validées ?
7. Vitest + Testing Library + Playwright : qui écrit les premiers tests, et sur quel périmètre ?
8. Français uniquement, sans bibliothèque d'i18n : validé ?
9. Si l'option A est retenue en décision 1, il faut retirer `react-hook-form`, `@hookform/resolvers`, `zod` et `form.tsx` de `packages/ui` dans la foulée.
