# Stack front — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/site`, `apps/simulateur`, `packages/ui`

Ce document valide les outils du front : ce qui est en place et n'est pas rediscuté, ce qui reste à trancher, et selon quels critères. Le nommage relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md), l'accessibilité de [`accessibilite.md`](./accessibilite.md).

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

**À la charge du développeur, quoi qu'il arrive** : react-hook-form ne fournit ni style ni ARIA. Le composant `form.tsx` relie libellé, message d'erreur et champ ; il ne gère pas le déplacement du focus vers le premier champ en erreur, qui reste à écrire (voir [`accessibilite.md`](./accessibilite.md)).

## Décision 2 — Validation de schéma : zod

**zod v4**, déjà présent côté `packages/ui` (^4.5) et côté API (^4.1, pour valider l'environnement). Une seule bibliothèque de schémas des deux côtés, donc un seul vocabulaire et, le jour où un schéma décrit un échange, une seule source.

**Alternative écartée pour l'instant** : valibot (1.5.0) est plus léger (de l'ordre du kilo-octet une fois compressé, contre plusieurs pour zod). À reconsidérer seulement si une mesure du bundle du simulateur — qui est pensé comme un widget embarquable — montre que zod y pèse. Le simulateur n'embarque aujourd'hui aucune des deux.

**Porte de sortie** : zod, valibot et arktype implémentent [Standard Schema](https://standardschema.dev/). `@hookform/resolvers` 5.x et NestJS acceptent cette interface. Changer de bibliothèque de schémas plus tard ne rejouerait donc pas le câblage.

## Décision 3 — État client : rien de plus pour l'instant

Le store maison du simulateur (module singleton lu par `useSyncExternalStore`, persisté en `sessionStorage`) est conservé. Ni Redux, ni Zustand, ni Jotai : l'état tient en un reducer et une clé de stockage.

**À réévaluer** quand les écrans authentifiés appelleront l'API : la question deviendra celle du cache des données serveur (TanStack Query ou équivalent), qui est un autre sujet que l'état local.

## Décision 4 — Tests : à installer

**Il n'existe aujourd'hui aucun test dans le dépôt** — aucun runner, aucun fichier, et la CI ne fait que `format:check`, `lint`, `typecheck` et `build`.

Proposition :

| Besoin                                                                                  | Outil                                                |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Domaine du simulateur (fonctions pures : validation, parcours, sélection des résultats) | **Vitest** 5                                         |
| Composants (rendu, clavier, ARIA)                                                       | **Vitest** + **@testing-library/react** 16 + jsdom   |
| Parcours complet dans un navigateur                                                     | **Playwright** 1.63, sur quelques parcours seulement |

**Par où commencer** : le domaine du simulateur. Ce sont des fonctions pures, déjà isolées de React, qui portent les règles métier écrites avec la PO — le meilleur rapport valeur/effort. Les composants ensuite, en priorité ceux dont l'accessibilité est un engagement (champs, bouton de téléchargement).

**Condition pour que ça tienne** : ajouter `npm run test` à la CI dans la même PR que les premiers tests, sinon ils pourrissent sans que personne ne le voie.

## Questions à trancher

1. Option B validée pour les formulaires, avec le critère écrit ci-dessus ?
2. Le simulateur reste-t-il sur son moteur déclaratif ? (cela fige deux approches dans le dépôt, assumées)
3. zod partout, ou mesure préalable du bundle avant de fixer zod plutôt que valibot ?
4. Vitest + Testing Library + Playwright : qui écrit les premiers tests, et sur quel périmètre ?
5. Si l'option A est retenue, il faut retirer `react-hook-form`, `@hookform/resolvers`, `zod` et `form.tsx` de `packages/ui` — à faire dans la foulée, pour ne pas laisser un choix fantôme dans le dépôt.
