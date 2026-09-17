# Conventions TypeScript — ETAPE

**Statut** : Proposé · **Date** : 2026-09-15 · **Origine** : revue de la PR #49 (état de génération du PDF)
**Portée** : `apps/site`, `apps/simulateur`, `packages/ui`, et l'API à venir

Le nommage des identifiants (langue, casse) relève de [`nommage.md`](./nommage.md). Ce document fixe la façon de typer.

## Typage

### 1. Type de retour explicite sur les fonctions exportées

Toute fonction exportée d'un fichier `.ts` (domaine, hooks, utilitaires) déclare son type de retour. Un hook qui renvoie un objet déclare son interface, nommée `<Hook>Result`.

```ts
export function buildRecap(answers: Answers): RecapEntry[] {
  // …
}

export interface UseFlowResult {
  state: FlowState;
  hydrated: boolean;
  dispatch: (action: FlowAction) => void;
}

export function useFlow(): UseFlowResult {
  // …
}
```

Les composants React (`.tsx`) gardent leur type de retour inféré : `: JSX.Element` n'apporte rien.

**Pourquoi** : le contrat se lit sans parcourir le corps de la fonction, et un changement involontaire du type renvoyé casse à la définition plutôt que chez chaque appelant.

**Outillage** : `@typescript-eslint/explicit-module-boundary-types` sur `**/*.ts` (bloquant en CI).

### 2. Valeurs finies : objet `as const` et type dérivé, jamais d'`enum`

Un ensemble fini de valeurs (états, statuts, variantes) est un objet `as const`, dont on dérive le type. La constante est en `UPPER_SNAKE_CASE`, le type en `PascalCase` au singulier ; la langue des clés et des valeurs suit [`nommage.md`](./nommage.md) (technique en anglais, métier en français).

```ts
const PDF_STATUS = {
  IDLE: "idle",
  GENERATING: "generating",
  DONE: "done",
} as const;

type PdfStatus = (typeof PDF_STATUS)[keyof typeof PDF_STATUS];
```

Référence dans le code : `FLAGS` / `Flag` (`apps/simulateur/src/questionnaire/domain/flags.ts`).

**Pourquoi pas `enum`** : un `enum` génère du JavaScript à l'exécution, n'est pas compatible avec la suppression de types (`erasableSyntaxOnly`, exécution TypeScript native de Node) et n'est utilisé nulle part dans le dépôt.

**Prisma** : un `enum` du `schema.prisma` reste la bonne forme. Le client généré l'expose déjà comme un objet et un type du même nom (`StatutDossier.BROUILLON`), ce qui respecte cette règle. Un fichier `*.enum.ts` de l'API contient un objet `as const`.

**Outillage** : `erasableSyntaxOnly` dans les `tsconfig.json` de `apps/site`, `apps/simulateur` et `packages/ui` ; règle ESLint `no-restricted-syntax` (`TSEnumDeclaration`) dans la config `base`, qui couvre aussi l'API — ses propriétés de paramètre de constructeur (NestJS) excluent `erasableSyntaxOnly`.

### 3. Jamais de littéral en dur dans une condition ou un appel

Une valeur d'un ensemble déclaré en `as const` s'utilise par sa constante.

```ts
// Oui
const isGenerating = status === PDF_STATUS.GENERATING;
setStatus(PDF_STATUS.DONE);

// Non
const isGenerating = status === "generating";
setStatus("done");
```

**Pourquoi** : une seule source pour les valeurs. Le type accepte encore le littéral (`"done"` est un `PdfStatus` valide) : seule cette règle garantit qu'un renommage ne laisse aucune chaîne orpheline.

**Exception** : le discriminant d'une union de types (`FlowAction`, `{ type: "RESET" }`) reste un littéral ; TypeScript s'en sert pour affiner le type dans un `switch`.

**Outillage** : aucun, vérifié en revue.

### 4. Une correspondance valeur → libellé est un `Record`

Associer un libellé, une couleur ou un message à chaque valeur passe par un `Record<Type, …>`, pas par un ternaire ni un `switch`.

```tsx
const BUTTON_LABELS: Record<PdfStatus, string> = {
  [PDF_STATUS.IDLE]: "Télécharger mes résultats en PDF",
  [PDF_STATUS.GENERATING]: "Génération du PDF…",
  [PDF_STATUS.DONE]: "Télécharger mes résultats en PDF",
};

<Button>{BUTTON_LABELS[status]}</Button>;
```

Références dans le code : `CATEGORIE_LABELS`, `CATEGORIE_COLORS`.

**Pourquoi** : ajouter une valeur à l'ensemble sans compléter la correspondance ne compile plus.

**Outillage** : aucun, vérifié en revue.

### 5. L'état React est typé par son union

```ts
const [status, setStatus] = useState<PdfStatus>(PDF_STATUS.IDLE);
```

**Pourquoi** : sans le paramètre de type, `useState(PDF_STATUS.IDLE)` infère le seul type `"idle"`, et `setStatus(PDF_STATUS.GENERATING)` ne compile pas — ce qui pousse à contourner par une chaîne.

**Outillage** : aucun, vérifié en revue.

## Récapitulatif

| Règle                                     | Vérification                                            |
| ----------------------------------------- | ------------------------------------------------------- |
| 1. Type de retour des fonctions exportées | ESLint `explicit-module-boundary-types` (`**/*.ts`)     |
| 2. `as const` plutôt qu'`enum`            | `erasableSyntaxOnly` + ESLint `no-restricted-syntax`    |
| 3. Pas de littéral en dur                 | Revue (skill `review-pr`)                               |
| 4. `Record` pour les correspondances      | Revue (skill `review-pr`)                               |
| 5. `useState` typé par l'union            | Revue (skill `review-pr`) ; le compilateur aide souvent |
