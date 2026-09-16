# Pratiques React — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/site`, `apps/simulateur`, `packages/ui`

Ce document dit **comment écrire le code**, là où [`stack-front.md`](./stack-front.md) dit **quels outils on utilise**. Le nommage relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md), l'accessibilité de [`accessibilite.md`](./accessibilite.md).

**Comment le lire** : chaque pratique porte son statut dans le dépôt — **déjà tenu** (on l'acte pour ne pas la perdre) ou **écart** (du code existant ne la respecte pas) — et ce qui la vérifie : le lint, la revue, ou rien.

## 1. Où vit la logique

### 1.1 Le métier vit hors des composants — _déjà tenu_

Les règles métier sont des fonctions pures dans `domain/`, sans React : `selection.ts`, `validation.ts`, `flow.ts`, `catalogue.ts`. Un composant les appelle, ne les réécrit pas.

C'est déjà le cas, et massivement : `questionnaire/domain/questions.ts` fait 441 lignes quand le plus gros composant du dépôt en fait 175. C'est ce qui rendra les tests possibles sans monter de rendu (voir `stack-front.md`, décision 8).

### 1.2 La logique d'écran vit dans un hook — _écart_

Un composant qui réunit ces trois traits doit être découpé : il appelle **plus d'un hook d'état**, il **manipule le DOM** (focus, mesure, écoute), et il **aiguille** le rendu entre plusieurs écrans.

L'exemple à ne pas suivre est `questionnaire/components/FlowShell.tsx` : il combine `useFlow` et `useFlowNavigation`, gère le focus du titre dans un effet, tient un compteur de tentatives échouées, et choisit entre trois écrans. La logique irait dans un `useFlowShell()` qui renvoie ce que la vue affiche ; le composant deviendrait une vue.

### 1.3 Une vue est pure par défaut — _déjà tenu_

Une vue reçoit des props et rend du JSX. Pas de store, pas d'effet, pas de `fetch`. Les bons exemples existent déjà : `OptionRow`, `FieldHeader`, `CategorieTag`, `ResultCard`, `EmptyResults`, `OutcomeScreen`.

Le contre-exemple est `resultats/components/ScrollToTopButton.tsx` : il a l'apparence d'une vue mais abonne un écouteur de défilement. Une vue qui cache un abonnement ne se teste pas et ne se réutilise pas.

### 1.4 L'enveloppe appelle le hook, la vue affiche — _à généraliser_

Le motif à appliquer quand 1.2 se déclenche :

```tsx
// resultats/components/ResultsScreen.tsx — l'enveloppe
export function ResultsScreen(props: ResultsScreenProps) {
  const { resultats, recapEntries } = useResultats(props.answers);
  return <ResultsView resultats={resultats} recapEntries={recapEntries} {...props} />;
}
```

La vue est exportée à part : elle se rend dans un test avec des données fabriquées, sans store ni URL.

**Ce que ça n'est pas** : une couche à poser partout. Un écran sans logique n'a pas besoin d'enveloppe — `OutcomeScreen` est très bien tel quel.

## 2. État et effets

### 2.1 Rien qui soit dérivable ne devient un état — _déjà tenu_

Ce qui se calcule à partir des props ou d'un autre état se calcule pendant le rendu. `ResultsScreen` le fait bien : `buildProfil` puis `selectResultats`, mémoïsés, jamais stockés.

**Exception documentée** : le dépôt utilise deux fois la dérivation par comparaison pendant le rendu (`FlowShell` pour `visitedQuestionId`, `MonthYearField` pour `previousValue`). C'est un motif React légitime, qui évite un rendu supplémentaire, mais il surprend à la lecture : il doit porter le commentaire qui l'explique.

### 2.2 `useEffect` sert à parler au monde extérieur — _déjà tenu_

Focus, `window.history`, abonnement, minuteur. Les cinq effets du dépôt sont dans ce cas : trois déplacent le focus, un écrit l'URL, un écoute un `pointerdown`.

Ce qui n'est **jamais** un effet : dériver un état, charger des données de l'API (`stack-front.md`, décisions 3 et 5), réagir à un clic — ça, c'est le gestionnaire d'événement.

### 2.3 Pas de mémoïsation manuelle sans raison — _vérifié par le lint_

`useMemo` et `useCallback` se justifient par un calcul coûteux ou une identité de référence nécessaire. Le lint tranche déjà : `react-hooks/use-memo` et `preserve-manual-memoization` sont en erreur.

## 3. Props et composition

### 3.1 Six props, au-delà on compose — _écart_

Trois composants sont à sept props : `FieldRenderer`, `QuestionFields`, `RadioField`. Le signal n'est pas le nombre en soi, c'est qu'il révèle deux responsabilités mélangées, ou une prop de mise en page qui traverse un composant que ça ne regarde pas.

Deux sorties : regrouper les props liées en un objet nommé, ou composer avec `children` plutôt que passer un `render*`.

### 3.2 Le forage s'arrête à deux niveaux — _écart_

`answers` et `setAnswer` traversent `FlowShell` → `QuestionScreen` → `QuestionFields` → `FieldRenderer` avant d'atteindre un champ. Au-delà de deux niveaux, deux options : remonter la lecture dans un hook appelé là où la donnée sert, ou passer par un contexte.

**Un contexte se justifie par écrit.** Le seul du dépôt, `fields/FieldError.tsx`, porte le commentaire qui dit pourquoi il existe : éviter que cinq composants relaient une prop de mise en page qui ne les concerne pas. C'est le niveau d'exigence attendu.

## 4. Design system

### 4.1 Aucune couleur hors des tokens — _déjà tenu, et c'est rare_

Aucune valeur hexadécimale, `rgb()` ou `hsl()` n'existe hors de `packages/ui/src/styles/globals.css` dans tout le dépôt. Les couleurs passent par les tokens (`bg-primary`, `text-info-text`), qui portent leur équivalent Figma en commentaire.

La seule exception est le PDF (`resultats/pdf/pdf-styles.ts`) : `@react-pdf/renderer` a son propre moteur de styles et ne lit pas le CSS. Elle est commentée sur place.

### 4.2 On étend par variante, on ne modifie pas par `className` — _écart_

Un besoin d'apparence non couvert s'ajoute **dans le composant**, comme variante `cva`, puis s'utilise partout. Le dépôt sait déjà le faire : `button.tsx` porte deux variantes maison, `inverse` et `outline-primary`, signalées comme telles en commentaire.

Les écarts à reprendre :

| Où                                                 | Ce qui est fait                                                                                   | Ce qu'il faudrait                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `questionnaire/components/OutcomeScreen.tsx:19-63` | Une chaîne de classes recrée l'apparence complète d'un bouton et court-circuite les tailles `cva` | Une taille existante, ou une variante ajoutée à `button.tsx` |
| `resultats/components/CategorieTag.tsx:14-31`      | Les couleurs par catégorie sont injectées en `className` sur `Badge`                              | Une variante de `badgeVariants` par catégorie                |
| `app/error.tsx:20`                                 | `min-h-11 rounded-lg px-6` change hauteur et rayon                                                | La taille `xl`, qui fait déjà 44 px                          |

### 4.3 Le `className` d'une app ne fait que de la mise en page — _règle qui découle de 4.2_

Autorisé : largeur, marge, `gap`, `flex`. Interdit : couleur, fond, bordure, rayon, hauteur — ces quatre-là appartiennent au composant.

### 4.4 On utilise les primitives avant d'en écrire une — _écart_

| Où                                           | Ce qui est fait                                      | Ce qui existe déjà                         |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `resultats/components/ResultsScreen.tsx:24`  | `max-w-[1184px] px-4 md:px-10` recopié à la main     | `Container size="lg"`                      |
| `resultats/components/ResultsScreen.tsx:45`  | `text-[28px] leading-9 md:text-[32px] md:leading-10` | Le token `text-h1`, qui vaut exactement ça |
| `resultats/components/ResultCard.tsx:15`     | Une carte refaite en `<article>` stylé               | `Card` / `CardContent`                     |
| `resultats/components/ScrollToTopButton.tsx` | Un second bouton de remontée en page                 | `BackToTop` de `packages/ui`               |

Avant d'écrire un composant ou une classe de mise en forme : chercher dans `packages/ui/src/components/`, puis dans les tokens de `globals.css`.

### 4.5 Un composant partagé vit dans `packages/ui` — _déjà tenu_

Utilisé par plus d'une app, il va dans `packages/ui`, avec ce que font déjà tous les autres : un attribut `data-slot`, un `className` fusionné par `cn()`, ses variantes en `cva`, et `focusRing` pour tout élément focusable qui n'est ni `Button` ni `Badge`.

La source officielle d'un composant shadcn se récupère par le **serveur MCP `shadcn`** déclaré dans `.mcp.json` — voir [`outillage-agent.md`](./outillage-agent.md).

## 5. Frontière client / serveur

### 5.1 `"use client"` le plus bas possible — _déjà tenu_

19 fichiers sur 72 le portent. Les pages et les mises en page restent des composants serveur ; la directive descend au composant qui a vraiment besoin d'un état ou d'un événement. `app/questionnaire/page.tsx` en est l'exemple : elle ne fait qu'envelopper `FlowShell` dans un `Suspense`.

Rappel : les deux apps sont exportées statiquement, donc un composant serveur est rendu au build. Il n'y a pas de rendu serveur à l'exécution.

### 5.2 Aucune donnée d'API dans un `useEffect` — _à venir_

Quand les écrans authentifiés arriveront, les données viendront de TanStack Query au-dessus du contrat de route partagé (`stack-front.md`, décisions 3 et 5). Aucun `fetch` dans un effet.

## 6. Écriture

Ces conventions sont déjà uniformes dans le dépôt ; elles sont écrites ici pour le rester.

- `export function Composant()` — jamais une constante fléchée pour un composant.
- `interface <Nom>Props` nommée ; `type` réservé aux unions et alias de domaine.
- Ordre dans un fichier : directive, imports (externes, `@etape/ui`, internes), constantes, types, interface de props, JSDoc, composant.
- Les commentaires disent **pourquoi**, jamais **quoi**, et en français. Une décision produit, d'accessibilité ou de contournement se commente sur place.
- JSDoc sur tout ce qui est exporté.

## Récapitulatif

| Pratique                         | Statut               | Vérification                                        |
| -------------------------------- | -------------------- | --------------------------------------------------- |
| 1.1 Métier hors des composants   | Déjà tenu            | Revue                                               |
| 1.2 Logique d'écran dans un hook | Écart (`FlowShell`)  | Revue                                               |
| 1.3 Vue pure par défaut          | Déjà tenu            | Revue                                               |
| 2.1 Pas d'état dérivable         | Déjà tenu            | Lint (`set-state-in-render`, `set-state-in-effect`) |
| 2.2 Effet réservé à l'extérieur  | Déjà tenu            | Lint partiel                                        |
| 2.3 Pas de mémoïsation gratuite  | Déjà tenu            | Lint (`use-memo`, `preserve-manual-memoization`)    |
| 3.1 Six props                    | Écart (3 composants) | Revue                                               |
| 3.2 Forage ≤ 2 niveaux           | Écart (`answers`)    | Revue                                               |
| 4.1 Aucune couleur hors tokens   | Déjà tenu            | Revue (recherche de valeurs hexadécimales)          |
| 4.2 Étendre par variante         | Écart (3 endroits)   | Revue                                               |
| 4.4 Primitives avant réécriture  | Écart (4 endroits)   | Revue                                               |
| 5.1 `"use client"` au plus bas   | Déjà tenu            | Revue                                               |
| 6 Écriture                       | Déjà tenu            | Prettier, ESLint, revue                             |

## Questions à trancher

1. Le seuil de découpage de 1.2 (deux hooks d'état **et** DOM **et** aiguillage) est-il le bon, ou trop permissif ?
2. Six props maximum : seuil accepté, ou simple signal d'alerte en revue ?
3. Les écarts cités (`FlowShell`, `MonthYearField`, `OutcomeScreen`, `CategorieTag`, `ResultsScreen`, `ResultCard`, `ScrollToTopButton`) sont-ils repris dans une PR dédiée, au fil de l'eau, ou laissés tels quels tant qu'on n'y touche pas ?
4. Les variantes manquantes (couleurs de `Badge` par catégorie, taille de bouton d'`OutcomeScreen`) : on les ajoute au design system maintenant ?
