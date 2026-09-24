# Stack front — ETAPE

**Statut** : Décidé · **Décidé le** : 2026-09-22 · **Par** : l'équipe, en réunion d'arbitrage
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

### La situation qui a motivé la décision

Le dépôt contient **deux approches, dont une n'a jamais servi** :

- `packages/ui` déclare `react-hook-form` ^7.87, `@hookform/resolvers` ^5.9 et `zod` ^4.5, et contient le composant shadcn `form.tsx`. **Aucune app ne l'importe.**
- Le simulateur n'utilise aucune bibliothèque : ses questions sont des données, validées par un `switch` maison.

Ce n'était pas un détail de goût : tant que rien n'était écrit, le prochain formulaire partait dans une direction ou dans l'autre selon qui l'écrivait.

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

### Options écartées, et pourquoi

Écrites ici pour que le débat ne se rouvre pas dans six mois.

| Option écartée                                                | Pourquoi                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A.** Tout en maison ; retirer react-hook-form et `form.tsx` | Jeter un composant déjà là ; réécrire à la main le câblage ARIA pour chaque futur formulaire |
| **C.** Tout migrer sur react-hook-form, simulateur compris    | Réécrire un moteur qui fonctionne, sans bénéfice utilisateur                                 |

**Conséquence de l'abandon de l'option A** : `react-hook-form`, `@hookform/resolvers`, `zod` et `form.tsx` **restent dans `packages/ui`**. Ils n'ont pas encore de consommateur, et c'est normal : aucun écran de dépôt n'existe. Ce n'est pas du code mort à nettoyer.

### La règle : react-hook-form + zod, avec un critère explicite

Deux approches cohabitent donc dans le dépôt, assumées, avec un critère écrit pour savoir laquelle s'applique.

**react-hook-form + zod, via `form.tsx`**, dès qu'un écran réunit ces trois traits : plusieurs champs saisis librement sur une même page, des erreurs affichées par champ, et une soumission à l'API.

**Le simulateur garde son moteur déclaratif.** Ce n'est pas un formulaire : une question par écran, une navigation dérivée de l'URL, des réponses persistées entre les sessions, des règles de cohérence entre questions. react-hook-form gère l'état d'un formulaire monté — il n'a rien à apporter ici, et ferait perdre le caractère déclaratif des questions.

**Pourquoi react-hook-form plutôt que TanStack Form** : le composant `Form` de shadcn/ui, sur lequel repose déjà notre bibliothèque, est écrit pour react-hook-form. Choisir TanStack Form (1.33.5, projet actif et sérieux) voudrait dire réécrire ce câblage nous-mêmes, pour un gain que nous ne savons pas nommer aujourd'hui.

**Ce qui reste à notre charge dans les deux cas** : react-hook-form ne fournit ni style ni ARIA, et `form.tsx` ne déplace pas le focus vers le premier champ en erreur — ce que le simulateur, lui, fait déjà (`QuestionScreen`, `focusFirstInvalid`).

## Décision 2 — Validation de schéma : zod

**zod v4**, déjà présent côté `packages/ui` (^4.5) et côté API (^4.1.13, pour l'environnement). Une seule bibliothèque de schémas des deux côtés : c'est la condition du contrat de route partagé (décision 5), qui suppose qu'API et front lisent le même objet.

**Alternative écartée** : valibot (1.5.0) pèse de l'ordre du kilo-octet une fois compressé, contre plusieurs pour zod. L'équipe a tranché **zod partout, sans mesure préalable du bundle** : le gain hypothétique ne justifiait pas de retarder le contrat partagé, ni d'entretenir deux bibliothèques de schémas. Le sujet ne se rouvre que si une mesure du bundle du simulateur — pensé comme un widget embarquable — montre un jour que zod y pèse. Aujourd'hui, le simulateur n'embarque ni l'un ni l'autre.

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

**Brique actée** pour tout ce qui vient de l'API : cache, revalidation, déduplication des requêtes, états de chargement et d'erreur, nouvelle tentative.

**Point de fait à connaître avant d'en parler** : elle n'est **pas encore installée** — aucune déclaration dans un `package.json`, aucune entrée dans `package-lock.json`, aucun `useQuery` dans le code. C'est normal, aucun écran n'appelle encore l'API. Version actuelle : `@tanstack/react-query` 5.103.0.

**Reste à attribuer** : qui l'installe, et sur quelle première PR. L'arbitrage a validé la brique sans désigner de porteur.

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

Le store du simulateur est conservé pour l'état de l'écran et du parcours. Aucune bibliothèque d'état aujourd'hui : l'état tient en un reducer et une clé de stockage.

**La réserve posée en arbitrage** — la seule de toute la séance : **si le store prend de l'importance, on passe à Zustand** plutôt que de faire grossir le store maison. Le signal de bascule n'est pas la taille du fichier mais la nature de l'état : le jour où il cesse d'être local au questionnaire — plusieurs modules qui y écrivent, plusieurs tranches d'état indépendantes, un besoin de sélecteurs pour éviter les rendus inutiles —, un reducer maison devient un mauvais choix par rapport à une bibliothèque qui fait ce travail depuis longtemps.

**Ce qu'il faudra regarder ce jour-là** : la persistance. Le store actuel est lu par `useSyncExternalStore` et persisté en `sessionStorage` sous une clé versionnée ; Zustand couvre les deux (son `persist` accepte `sessionStorage` comme `storage`, et son store s'abonne sans passer par `useSyncExternalStore` à la main), mais **le versionnement de la clé doit être reporté**, sans quoi une session ouverte avant le déploiement relira un état qu'elle ne sait plus interpréter. La PR de Louis, à venir, servira de référence sur ce point.

Ni Redux ni Jotai ne sont en discussion.

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
  const response = await fetch(`${API_BASE_URL}${buildRoutePath(route, options)}`, {
    method: route.method,
    credentials: "include", // le cookie de session, jamais un jeton
    headers: options.body ? { "content-type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    redirectToLogin();
    throw new ApiError("Session expirée", 401);
  }

  if (!response.ok) throw await ApiError.from(response);

  return route.response.parse(await response.json());
}
```

**Ce que chaque ligne règle, et qu'il faudrait réécrire sinon :**

- `credentials: "include"` — la session est un cookie `httpOnly`. Oublié une fois, l'appel part anonyme et répond 401 sans raison apparente.
- Le traitement du 401 au même endroit — sinon chaque écran invente sa façon de réagir à une session expirée.
- `route.response.parse(...)` — la réponse est **validée à la frontière**. Une API qui change sans prévenir échoue ici, avec un message qui nomme le champ fautif, au lieu de produire un `undefined` qui plantera trois composants plus loin, au milieu d'un rendu, sans indice sur l'origine.

**Le nom** : `callApi`, et surtout pas sa traduction française. La convention réserve le français aux noms métier ; une fonction d'appel HTTP est purement technique, donc anglaise — au même titre que `database` ou `interceptor`.

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

**Mise en œuvre, validée en arbitrage** (voir [`outillage-agent.md`](./outillage-agent.md)) : **21 règles activées en erreur**, listées explicitement dans `packages/eslint-config/next.js`. `@axe-core/playwright` viendra avec Playwright, dont l'installation est différée (décision 8) ; pas de `vitest-axe` (0.1.0, projet immature).

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

**Ce que le durcissement a coûté, mesuré** : une seule erreur sur tout le dépôt, dans `apps/site/src/components/main-nav.tsx` — un `onKeyDown` posé sur la `nav`, donc sur un élément non interactif. La règle avait raison sur le fond : la touche Échap ne refermait le menu que si le focus était resté dans le panneau. L'écouteur a rejoint le `document`, à côté du `pointerdown` qui s'y trouvait déjà.

Le reste des 21 règles ne produit aucune violation.

**Ce que ces règles ne verront jamais** : la perte du focus après une action, l'ordre de tabulation, la pertinence d'une annonce. Elles vérifient la structure, pas l'expérience — d'où le test clavier en revue.

</details>

## Décision 8 — Tests : le domaine et les composants maintenant, l'E2E ensuite

**Il n'existe aujourd'hui aucun test du front** : ni dans `apps/site`, ni dans `apps/simulateur`, ni dans `packages/ui`. L'outillage, lui, existe déjà — `apps/api` est testé avec Vitest, `turbo.json` porte une tâche `test` et la CI lance `npm run test` de façon bloquante. **Il n'y a donc pas d'infrastructure à monter, seulement des tests à écrire** et Vitest à déclarer dans les workspaces du front.

L'arbitrage a tranché le **périmètre**, et il est volontairement en deux temps :

| Besoin                                                                                  | Outil                                              | Quand                                                 |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| Domaine du simulateur (fonctions pures : validation, parcours, sélection des résultats) | **Vitest** 5                                       | **Maintenant**                                        |
| Composants (rendu, clavier, ARIA)                                                       | **Vitest** + **@testing-library/react** 16 + jsdom | **Maintenant**                                        |
| Parcours complet dans un navigateur                                                     | **Playwright** 1.63                                | **Différé**, et seulement sur les scénarios critiques |

**Pourquoi ce découpage** : les deux premiers s'écrivent sans infrastructure et couvrent ce qui fait mal en cas de régression. L'E2E coûte un navigateur en CI et se périme vite ; le réserver aux scénarios critiques, une fois qu'ils sont identifiés, évite d'entretenir une suite fragile avant d'avoir des tests utiles.

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

**Condition pour que ça tienne** : elle est déjà remplie côté CI — `npm run test` y est une étape bloquante. Un test de front écrit dans un workspace qui déclare Vitest sera donc exécuté et bloquant dès sa première PR, sans rien ajouter au pipeline.

## Décision 9 — Langue de l'interface : français uniquement

Aucune bibliothèque d'internationalisation. Les textes sont écrits en français dans les composants et les données de contenu ; les accents vivent dans les libellés, jamais dans les identifiants ([`nommage.md`](./nommage.md)).

**Ce que ça engage** : le jour où une autre langue est demandée, c'est une PR dédiée qui extrait les textes. Poser une bibliothèque d'i18n « au cas où » coûterait aujourd'hui une indirection sur chaque libellé — `t("resultats.titre")` au lieu du texte lisible — pour un besoin qui n'est pas au programme.

## Décision 10 — Mesure d'audience : Matomo

**Brique retenue par l'équipe.** Elle n'est pas encore installée : aucune dépendance, aucune variable d'environnement, aucun appel dans le code. La convention de nommage, elle, l'anticipait déjà — un event analytics s'écrit en `snake_case` et en français (`simulateur_resultat`).

**Paquet** : `@socialgouv/matomo-next` (1.14.2, juillet 2026), maintenu par la fabrique numérique des ministères sociaux. Il injecte le script côté client et suit les changements de route : c'est ce qu'il faut pour un site **exporté statiquement**, où aucun code ne tourne côté serveur.

### Le vrai sujet n'est pas l'outil, c'est le consentement

La CNIL publie un [guide de configuration de Matomo](https://www.cnil.fr/sites/cnil/files/atoms/files/matomo_analytics_-_exemption_-_guide_de_configuration.pdf) permettant à la mesure d'audience d'être **exemptée de consentement**. Configuré ainsi, le site n'a **pas besoin de bandeau cookies** — ce qui, sur un service public destiné à des personnes en transition professionnelle, est un gain d'usage direct : pas de fenêtre à écarter avant de commencer le questionnaire.

Ce que l'exemption impose en contrepartie, d'après le guide (à relire en entier avant de configurer) : cookie de première partie uniquement, finalité strictement limitée à la mesure d'audience, aucun identifiant utilisateur, aucun recoupement avec d'autres traitements ni suivi entre sites, durées de vie et de conservation bornées, et un moyen d'opposition accessible.

**Conséquence assumée** : on renonce au suivi individuel — pas de parcours nominatif, pas de `userId`. On saura combien de personnes atteignent les résultats, pas qui.

### Les principes

1. **Aucune donnée personnelle dans un event**, ni dans son nom ni dans ses propriétés.
2. **Les noms d'events suivent la convention** : `snake_case`, en français.
3. **Ce qu'on mesure est décidé avec la PO**, et listé quelque part : un event sans question à laquelle il répond ne sert à rien.
4. **La configuration d'exemption est vérifiée**, pas supposée : c'est elle qui dispense du bandeau.

### L'instance : celle de betagouv

**Décidé** : ni Matomo Cloud, ni auto-hébergement — on utilise l'**instance mutualisée de betagouv**, [`stats.beta.gouv.fr`](https://stats.beta.gouv.fr).

Ce choix règle trois choses d'un coup :

- **Il ne coûte rien à la pile.** L'auto-hébergement aurait ajouté un service PHP et une base MySQL à une infrastructure qui compte déjà six conteneurs.
- **Il conforte l'exemption plutôt que de la fragiliser.** beta.gouv.fr annonce son instance comme paramétrée pour la recommandation « Cookies » de la CNIL, avec anonymisation de l'adresse IP avant enregistrement. La configuration d'exemption n'est donc pas à construire de zéro, mais à **vérifier** pour notre site — c'est le principe 4 ci-dessus, et il reste entier.
- **Il évite un transfert vers un tiers commercial**, donc un paragraphe de plus dans la politique de confidentialité.

**Ce qu'il reste à faire à l'installation** : demander un compte et un site à l'incubateur (canal `#incubateur-ops`), puis renseigner le `MATOMO_URL` et le `SITE_ID` obtenus. `@socialgouv/matomo-next` n'est pas remis en cause : il pointe vers l'instance qu'on lui donne.

**Point à reprendre** : les mentions légales actuelles annoncent que des cookies de mesure d'audience « peuvent être déposés […] après recueil du consentement lorsque cela est requis » — l'inverse de ce qui est décidé ici. Ce texte vient de la maquette. Son alignement a été **explicitement différé** en arbitrage (« à voir dans un second temps »), mais il doit précéder la mise en production de la mesure d'audience : annoncer un consentement qu'on ne recueille pas est un écart, pas une approximation.

## Décision 11 — Suivi des erreurs : Sentry

**Brique actée**, elle non plus pas encore installée. Elle répond à une question que ni les journaux ni la mesure d'audience ne traitent : **qu'est-ce qui a cassé, chez qui, et dans quel contexte**.

**Paquet, côté front — décidé** : `@sentry/browser` (10.74.0) plutôt que `@sentry/nextjs`. En export statique il n'y a aucun runtime Next : le SDK Next embarquerait du code serveur et edge sans usage ici — c'était l'objet de l'[issue #12420](https://github.com/getsentry/sentry-javascript/issues/12420), close depuis. `@sentry/browser` fait exactement ce dont on a besoin, sans cette zone grise.

**Ce qu'on perd** en n'utilisant pas `@sentry/nextjs` : le téléversement automatique des source maps et quelques intégrations de routage. Le premier se rattrape avec `sentry-cli` dans la CI — à instruire au moment de l'installation.

### Les principes

1. **`sendDefaultPii: false`**, et masquage explicite : une erreur ne doit pas emporter le courriel ou les claims de la personne.
2. **Le `correlationId` est envoyé en étiquette** : c'est ce qui relie une erreur vue par l'utilisateur à la requête côté API (voir [`architecture-api.md`](./architecture-api.md), décision 7).
3. **Une erreur attendue n'est pas envoyée** : un 400 de validation est un fonctionnement normal, pas un incident.
4. **L'échantillonnage des traces est réglé bas** au départ : on cherche des erreurs, pas des performances.

### Question ouverte — l'instance

Le SDK est tranché, **l'hébergement ne l'est pas** — la question est posée à betagouv et au coaching dans l'issue #64. L'auto-hébergement complet est en revanche écarté : il demande une vingtaine de conteneurs et de l'ordre de 16 Go de mémoire d'après la documentation de Sentry, sans commune mesure avec la pile actuelle. Restent deux options :

| Option                                                                                        | Ce qu'elle apporte                                                                                                                 | Ce qu'elle coûte                                                                                                                        |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Sentry SaaS**, région européenne                                                            | Toutes les fonctionnalités, dont Sentry Logs ; aucune limite de débit à anticiper                                                  | Un transfert vers un tiers, que la règle 1 rend acceptable mais qui **doit être écrit dans la politique de confidentialité**            |
| **Instance mutualisée de betagouv**, [`sentry.incubateur.net`](https://sentry.incubateur.net) | Pas de tiers commercial, donc rien à ajouter à la politique de confidentialité ; accès demandé par l'espace membre de l'incubateur | Une limite de débit annoncée à **10 événements/s par IP**, rafale de 20, **les événements excédentaires sont perdus sans mise en file** |

**Ce point commande une autre décision, et c'est pour cela qu'il ne peut pas rester en suspens longtemps** : la décision 7 de [`architecture-api.md`](./architecture-api.md) retient **Sentry Logs** pour consulter les journaux. Rien n'établit à ce jour que l'instance de betagouv expose cette fonctionnalité. Si elle ne l'expose pas, c'est l'option Loki + Grafana qui redevient la réponse côté API — **à vérifier avant d'installer quoi que ce soit**.

## Relevé d'arbitrage du 22 septembre 2026

Les douze questions que portait ce document, et ce que l'équipe a répondu.

| Question posée                                                         | Réponse                                                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Option B pour les formulaires, avec le critère écrit                   | **Oui** — décision 1                                                                                                |
| Le simulateur garde-t-il son moteur déclaratif                         | **Oui** — les deux approches cohabitent, assumées                                                                   |
| zod partout, ou mesure du bundle avant de trancher contre valibot      | **zod partout**, sans mesure préalable — décision 2                                                                 |
| TanStack Query : qui l'installe, sur quelle PR                         | Brique confirmée ; **porteur et PR restent à attribuer**                                                            |
| Contrat de route partagé et `callApi` unique                           | **Oui** — avec la décision 3 de [`architecture-api.md`](./architecture-api.md)                                      |
| Les règles `jsx-a11y` en erreur                                        | **Oui** — les 21 règles, listées explicitement                                                                      |
| Qui écrit les premiers tests, et sur quel périmètre                    | **Périmètre tranché** : domaine et composants maintenant, E2E différé aux scénarios critiques ; porteur non désigné |
| Français uniquement, sans i18n                                         | **Oui** — décision 9                                                                                                |
| Retirer react-hook-form si l'option A est retenue                      | **Sans objet** : l'option B a été retenue, donc `react-hook-form` et `form.tsx` restent                             |
| Matomo exempté de consentement, sans bandeau ; Cloud ou auto-hébergé   | **Oui** pour l'exemption ; **instance de betagouv** pour l'hébergement                                              |
| `@sentry/browser` plutôt que `@sentry/nextjs` ; SaaS ou auto-hébergé   | **Oui** pour le SDK ; **l'instance reste à trancher** (décision 11)                                                 |
| Qui met à jour les mentions légales et la politique de confidentialité | **Différé** — « à voir dans un second temps »                                                                       |

### Ce qui reste ouvert

1. **L'instance Sentry** : SaaS en région européenne ou `sentry.incubateur.net` (décision 11) — **issue #64**, qui pose la question à betagouv. Ce choix commande la décision 7 de [`architecture-api.md`](./architecture-api.md), qui suppose Sentry Logs.
2. **Le porteur de l'installation de TanStack Query**, et la PR sur laquelle elle se fait.
3. **Les mentions légales et la politique de confidentialité**, à aligner avant la mise en production de la mesure d'audience.

Suites ouvertes par ailleurs : **#60** (purge planifiée), **#61** (repository d'`AccountService`), **#62** (premiers tests du front).
