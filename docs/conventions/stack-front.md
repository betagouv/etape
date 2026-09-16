# Stack front — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/site`, `apps/simulateur`, `packages/ui`

Ce document valide les outils du front : ce qui est en place et n'est pas rediscuté, ce qui reste à trancher, et selon quels critères. Le nommage relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md), l'accessibilité de [`accessibilite.md`](./accessibilite.md). Le pendant côté API est [`architecture-api.md`](./architecture-api.md).

## En place, acté

Ces briques sont installées, utilisées, et ne sont pas remises en question ici.

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

- `packages/ui` déclare `react-hook-form` ^7.87, `@hookform/resolvers` ^5.9 et `zod` ^4.5, et contient le composant shadcn `form.tsx` (câblage `FormField` / `FormLabel` / `FormMessage`). **Aucune app ne l'importe** à ce jour.
- Le simulateur n'utilise aucune bibliothèque : ses questions sont des données (`questionnaire/domain/questions.ts`), rendues par `FieldRenderer`, validées par un `switch` maison (`questionnaire/domain/validation.ts`), et stockées dans un store maison persisté en `sessionStorage`.

### Options

| Option                                                                                    | Coût                                                                                         |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A.** Tout en maison ; retirer react-hook-form et `form.tsx`                             | Jeter un composant déjà là ; réécrire à la main le câblage ARIA pour chaque futur formulaire |
| **B.** react-hook-form + zod pour les nouveaux formulaires ; le simulateur reste tel quel | Deux approches cohabitent, avec un critère écrit pour savoir laquelle s'applique             |
| **C.** Tout migrer sur react-hook-form, simulateur compris                                | Réécrire un moteur qui fonctionne, sans bénéfice utilisateur                                 |

### Proposition : option B, avec un critère explicite

**react-hook-form + zod, via le composant `form.tsx` de `packages/ui`**, dès qu'un écran réunit ces trois traits : plusieurs champs saisis librement sur une même page, des erreurs affichées par champ, et une soumission à l'API. C'est le cas des futurs formulaires de dépôt de dossier.

**Le simulateur garde son moteur déclaratif.** Ce n'est pas un formulaire : une question par écran, une navigation dérivée de l'URL, des réponses persistées entre les sessions, et des règles de cohérence entre questions. react-hook-form gère l'état d'un formulaire monté ; il n'apporterait rien ici et supprimerait le caractère déclaratif des questions.

**Pourquoi react-hook-form plutôt que TanStack Form** : le composant `Form` de shadcn/ui, sur lequel repose déjà notre bibliothèque de composants, est écrit pour react-hook-form. Choisir TanStack Form (1.33.5, projet actif et sérieux) voudrait dire réécrire ce câblage nous-mêmes, pour un gain que nous ne savons pas justifier aujourd'hui.

**À la charge du développeur, quoi qu'il arrive** : react-hook-form ne fournit ni style ni ARIA. Le composant `form.tsx` relie libellé, message d'erreur et champ ; il ne gère pas le déplacement du focus vers le premier champ en erreur, qui reste à écrire.

## Décision 2 — Validation de schéma : zod

**zod v4**, déjà présent côté `packages/ui` (^4.5) et côté API (^4.1, pour valider l'environnement). Une seule bibliothèque de schémas des deux côtés, donc un seul vocabulaire et, le jour où un schéma décrit un échange, une seule source.

**Alternative écartée pour l'instant** : valibot (1.5.0) est plus léger — de l'ordre du kilo-octet une fois compressé, contre plusieurs pour zod. À reconsidérer seulement si une mesure du bundle du simulateur, pensé comme un widget embarquable, montre que zod y pèse. Le simulateur n'embarque aujourd'hui aucune des deux.

**Porte de sortie** : zod, valibot et arktype implémentent [Standard Schema](https://standardschema.dev/). `@hookform/resolvers` 5.x et NestJS acceptent cette interface. Changer de bibliothèque de schémas plus tard ne rejouerait donc pas le câblage.

## Décision 3 — Données venant de l'API : TanStack Query

**TanStack Query est la brique retenue** pour tout ce qui vient de l'API : cache, revalidation, déduplication des requêtes, états de chargement et d'erreur, nouvelle tentative. C'est l'outil que l'équipe connaît et veut garder ; le document acte ce choix plutôt que de le rouvrir.

**Point de fait** : il n'est **pas encore installé dans ce dépôt** — aucune déclaration dans un `package.json`, aucune entrée dans `package-lock.json`, aucun `useQuery` dans le code. C'est normal : aucun écran n'appelle encore l'API. Version actuelle au moment d'écrire : `@tanstack/react-query` 5.103.0.

**La règle qui en découle** :

- **Toute donnée qui vient de l'API passe par TanStack Query.** Pas de `fetch` dans un `useEffect`, pas de donnée serveur recopiée dans un state local « pour l'avoir sous la main ».
- **Le store maison ne stocke jamais de donnée serveur** (voir décision 4). L'un porte l'état de l'écran, l'autre le cache du serveur.
- Les clés de requête sont construites à un seul endroit par module, pour que l'invalidation après une écriture reste lisible.

**À installer** dans la première PR qui appelle l'API, avec le client décrit à la décision 5.

## Décision 4 — État local : le store maison reste

Le store du simulateur — module singleton lu par `useSyncExternalStore`, persisté en `sessionStorage` — est conservé pour l'état de l'écran et du parcours. Ni Redux, ni Zustand, ni Jotai : l'état tient en un reducer et une clé de stockage.

**Frontière avec la décision 3** : ce store porte ce que la personne a saisi et où elle en est. Dès qu'une donnée vient du serveur, elle appartient à TanStack Query.

## Décision 5 — Comment le front appelle l'API

Le front est statique : il parle à l'API NestJS en HTTP, avec un cookie de session (`credentials: "include"`). Deux façons de tenir ce contrat :

| Approche                                                         | Ce que ça implique                                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **A.** Une fine couche `fetch` maison + schémas zod des réponses | Quelques dizaines de lignes, types sous notre contrôle, mais le contrat se maintient à la main des deux côtés  |
| **B.** Un client généré depuis l'OpenAPI de l'API                | Contrat toujours juste, mais une génération à brancher dans la CI et un client à régénérer à chaque changement |

**Proposition : A maintenant, B quand le contrat grossit.** Un module `src/api/` par app : une fonction qui pose l'URL de base, les cookies et la gestion du 401, et un schéma zod par réponse, validé à la frontière. Le jour où l'API expose son OpenAPI (voir [`architecture-api.md`](./architecture-api.md), décision 4), on génère.

**Ce que ça règle tout de suite** : une réponse inattendue est détectée à la frontière, pas trois composants plus loin.

## Décision 6 — Composants : une seule bibliothèque, dans `packages/ui`

**shadcn/ui sur Radix, copié dans `packages/ui/src/components/`** — c'est l'existant, il est acté. Ce qui se décide ici, c'est la règle d'ajout :

- un composant utilisé par plus d'une app va dans `packages/ui` ; un composant propre à un écran reste dans son app ;
- **pas de seconde bibliothèque de composants** (MUI, Ant, Chakra…). Un besoin non couvert se résout avec Radix, qui fournit le comportement et l'accessibilité, puis nos styles Tailwind ;
- les tokens de couleur, d'espacement et de typographie vivent dans `globals.css` ; aucune valeur de couleur en dur dans un composant.

**Le cas du PDF est l'exception assumée** : `@react-pdf/renderer` a son propre moteur de styles et ne lit pas les tokens CSS ; ses couleurs sont donc recopiées dans `pdf-styles.ts`, avec le commentaire qui l'explique.

## Décision 7 — Accessibilité outillée

Le [document d'accessibilité](./accessibilite.md) fixe les règles ; il manque de quoi les vérifier.

**Constat mesuré** : `eslint-config-next` n'active aujourd'hui que **6 règles `jsx-a11y`** (`alt-text`, `aria-props`, `aria-proptypes`, `aria-unsupported-elements`, `role-has-required-aria-props`, `role-supports-aria-props`). Le plugin complet est déjà installé, en dépendance transitive.

**Proposition** :

- activer le preset recommandé d'`eslint-plugin-jsx-a11y` dans `packages/eslint-config/next.js`, en traitant les écarts constatés dans la même PR ;
- ajouter `@axe-core/playwright` (4.13.0) aux parcours end-to-end, une fois Playwright installé — un scan par écran clé ;
- ne pas compter sur `vitest-axe` (0.1.0, projet immature) : l'analyse automatique se fait dans un vrai navigateur.

**Ce que l'outillage ne dira jamais** : la perte du focus, l'ordre de tabulation, la pertinence d'une annonce. Ça reste la revue et le test clavier.

## Décision 8 — Tests

**Il n'existe aujourd'hui aucun test dans le dépôt** : aucun runner, aucun fichier, et la CI ne fait que `format:check`, `lint`, `typecheck` et `build`.

| Besoin                                                                                  | Outil                                                |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Domaine du simulateur (fonctions pures : validation, parcours, sélection des résultats) | **Vitest** 5                                         |
| Composants (rendu, clavier, ARIA)                                                       | **Vitest** + **@testing-library/react** 16 + jsdom   |
| Parcours complet dans un navigateur                                                     | **Playwright** 1.63, sur quelques parcours seulement |

**Par où commencer** : le domaine du simulateur. Ce sont des fonctions pures, déjà isolées de React, qui portent les règles métier écrites avec la PO — le meilleur rapport valeur/effort. Les composants ensuite, en priorité ceux dont l'accessibilité est un engagement (champs, bouton de téléchargement).

**Condition pour que ça tienne** : ajouter `npm run test` à la CI dans la même PR que les premiers tests, sinon ils pourrissent sans que personne ne le voie.

## Décision 9 — Langue de l'interface : français uniquement

Aucune bibliothèque d'internationalisation. Les textes sont écrits en français dans les composants et les données de contenu ; les accents et apostrophes vivent dans les libellés, jamais dans les identifiants ([`nommage.md`](./nommage.md)).

**Ce que ça engage** : le jour où une autre langue est demandée, c'est une PR dédiée qui extrait les textes. Poser une bibliothèque d'i18n « au cas où » coûterait aujourd'hui une indirection sur chaque libellé, sans bénéfice.

## Questions à trancher

1. Option B pour les formulaires, avec le critère écrit ci-dessus ?
2. Le simulateur reste-t-il sur son moteur déclaratif ? Cela fige deux approches dans le dépôt, assumées.
3. zod partout, ou mesure préalable du bundle avant de fixer zod plutôt que valibot ?
4. TanStack Query est acté : qui l'installe, et sur quelle première PR ?
5. Client d'API : couche `fetch` + zod maintenant, génération depuis l'OpenAPI plus tard — ou génération d'emblée ?
6. Preset `jsx-a11y` complet : on encaisse les écarts constatés dans la même PR ?
7. Vitest + Testing Library + Playwright : qui écrit les premiers tests, et sur quel périmètre ?
8. Français uniquement, sans bibliothèque d'i18n : validé ?
9. Si l'option A est retenue en décision 1, il faut retirer `react-hook-form`, `@hookform/resolvers`, `zod` et `form.tsx` de `packages/ui` dans la foulée, pour ne pas laisser un choix fantôme dans le dépôt.
