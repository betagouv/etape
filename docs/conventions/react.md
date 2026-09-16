# Pratiques React — ETAPE

**Statut** : Proposé · **Date** : 2026-09-16 · **À arbitrer avec l'équipe**
**Portée** : `apps/site`, `apps/simulateur`, `packages/ui`

Ce document dit **comment écrire le code**, là où [`stack-front.md`](./stack-front.md) dit **quels outils on utilise**. Le nommage relève de [`nommage.md`](./nommage.md), le typage de [`typescript.md`](./typescript.md), l'accessibilité de [`accessibilite.md`](./accessibilite.md).

**Comment le lire** : chaque pratique porte son statut — **déjà tenu** (on l'acte pour ne pas la perdre) ou **écart** (du code existant ne la respecte pas) — et ce qui la vérifie : le lint, la revue, ou rien. Les exemples sont dans des blocs dépliables, et viennent du code réel du dépôt sauf mention contraire.

## 1. Où vit la logique

### 1.1 Le métier vit hors des composants — _déjà tenu_

Les règles métier sont des fonctions pures dans `domain/`, sans React. Un composant les appelle, ne les réécrit pas.

C'est déjà le cas, et massivement : `questionnaire/domain/questions.ts` fait 441 lignes quand le plus gros composant du dépôt en fait 175.

<details><summary><strong>Exemple — une règle métier se lit comme le ticket</strong></summary>

`resultats/domain/catalogue.ts` : chaque carte porte sa condition d'affichage, écrite avec le vocabulaire de la PO.

```ts
{
  id: "cep",
  categorie: "interlocuteur",
  nom: "CEP régional",
  // Absent du parcours demandeur d'emploi (S7) : France Travail y est
  // l'opérateur CEP, la carte ferait doublon et enverrait au mauvais guichet.
  quand: (p) => salarie(p) || agentPublic(p) || sansEmploi(p) || independant(p),
}
```

Aucun composant ne sait pourquoi le CEP n'apparaît pas à un demandeur d'emploi : il affiche ce que `selectResultats` lui donne. C'est ce qui rend la règle testable sans monter de rendu.

</details>

### 1.2 La logique d'écran vit dans un hook — _écart_

Un composant qui réunit ces trois traits doit être découpé : il appelle **plus d'un hook d'état**, il **manipule le DOM** (focus, mesure, écoute), et il **aiguille** le rendu entre plusieurs écrans.

<details><summary><strong>Exemple — <code>FlowShell</code>, le cas à découper</strong></summary>

Ce que le composant fait aujourd'hui, en 107 lignes (`questionnaire/components/FlowShell.tsx`) :

```tsx
export function FlowShell() {
  const { state, hydrated, dispatch } = useFlow(); // 1er hook d'état
  const nav = useFlowNavigation(); // 2e hook d'état
  const [attempt, setAttempt] = useState(0); // compteur de tentatives
  const [visitedQuestionId, setVisitedQuestionId] = useState(nav.question?.id);
  const headingRef = useRef<HTMLHeadingElement>(null);

  if (nav.question?.id !== visitedQuestionId) {
    /* dérivation pendant le rendu */
  }

  useEffect(() => {
    headingRef.current?.focus();
  }, [nav.question?.id]); // manipulation du DOM

  if (nav.isResults) return <ResultsScreen … />; // aiguillage
  if (nav.outcome) return <OutcomeScreen … />;
  return <QuestionScreen … />;
}
```

La cible : un `useFlowShell()` qui renvoie `{ ecran, question, attempt, headingRef, … }`, et un composant qui ne fait plus qu'afficher. Le hook devient testable sans rendu ; le composant devient lisible d'un coup d'œil.

</details>

### 1.3 Une vue est pure par défaut — _déjà tenu_

Une vue reçoit des props et rend du JSX. Pas de store, pas d'effet, pas de `fetch`. Les bons exemples existent déjà : `OptionRow`, `FieldHeader`, `CategorieTag`, `ResultCard`, `EmptyResults`, `OutcomeScreen`.

<details><summary><strong>Contre-exemple — une vue qui cache un abonnement</strong></summary>

`resultats/components/ScrollToTopButton.tsx` ressemble à un bouton ; il abonne en réalité un écouteur de défilement via `useSyncExternalStore`, et tient un état de focus.

**Pourquoi c'est un problème, alors que le composant fonctionne** :

- **Il ne s'affiche pas hors de son contexte** : impossible de le rendre dans un test ou une galerie sans simuler le défilement de la fenêtre.
- **Il ne se réutilise pas** : le prendre ailleurs, c'est embarquer son écouteur, même sur un écran qui n'en a pas besoin.
- **Il cache son coût** : rien dans son nom ni dans ses props ne dit qu'il s'abonne à un événement global. Le lecteur suivant le duplique en croyant copier un bouton.

La sortie est la même qu'en 1.2 : un `useBackToTop()` d'un côté, un bouton bête de l'autre — ou, mieux, réutiliser `BackToTop` de `packages/ui`, qui répond déjà au besoin (voir 4.4).

</details>

### 1.4 L'enveloppe appelle le hook, la vue affiche — _à généraliser_

<details><summary><strong>Exemple — le motif, appliqué à l'écran de résultats</strong> (proposition)</summary>

```tsx
// L'enveloppe : elle sait d'où viennent les données.
export function ResultsScreen(props: ResultsScreenProps) {
  const { resultats, recapEntries } = useResultats(props.answers);
  return <ResultsView resultats={resultats} recapEntries={recapEntries} {...props} />;
}

// La vue : elle ne sait rien, donc elle se rend n'importe où.
export function ResultsView({ resultats, recapEntries, onEdit, onRestart }: ResultsViewProps) {
  return <main>…</main>;
}
```

**Ce que le découpage achète, concrètement :**

- **La vue se rend partout.** `ResultsView` s'affiche dans un test avec trois résultats fabriqués, sans store, sans URL, sans `sessionStorage` — et demain dans une galerie de composants, ou dans une capture pour la PO.
- **Le hook se teste sans rendu.** Les règles « quels résultats, dans quel ordre » se vérifient en appelant une fonction, pas en montant un arbre React.
- **Les deux changent séparément.** Une refonte visuelle ne touche pas le hook ; un changement de règle métier ne touche pas la vue. C'est la même idée que les trois couches de l'API : une modification, un seul fichier concerné.

**Ce que ça n'est pas** : une couche à poser partout. Un écran sans logique n'a pas besoin d'enveloppe — `OutcomeScreen` est très bien tel quel. Le motif se déclenche sur le seuil de 1.2, pas par principe.

</details>

## 2. État et effets

### 2.1 Rien qui soit dérivable ne devient un état — _déjà tenu, vérifié par le lint_

Ce qui se calcule à partir des props ou d'un autre état se calcule pendant le rendu.

**Exception documentée** : la dérivation par comparaison pendant le rendu, utilisée deux fois dans le dépôt (`FlowShell` pour `visitedQuestionId`, `MonthYearField` pour `previousValue`). C'est un motif React légitime, qui évite un rendu supplémentaire, mais il surprend à la lecture : **il doit porter le commentaire qui l'explique**.

### 2.2 `useEffect` sert à parler au monde extérieur — _déjà tenu_

<details><summary><strong>Exemple — les cinq effets du dépôt, et ce qu'ils font</strong></summary>

| Fichier                | Ce que fait l'effet                                        | Légitime ?                               |
| ---------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `FlowShell.tsx`        | Déplace le focus sur le titre au changement d'étape        | Oui : DOM                                |
| `QuestionScreen.tsx`   | Déplace le focus sur le premier champ fautif               | Oui : DOM                                |
| `main-nav.tsx`         | Écoute un `pointerdown` global pour fermer le menu         | Oui : abonnement                         |
| `useFlowNavigation.ts` | Réécrit l'URL quand l'étape demandée n'est pas atteignable | Oui : URL                                |
| `HomeCta.tsx`          | Réinitialise le store quand on revient sur un cul-de-sac   | Oui : synchronisation d'un store externe |

Aucun n'est là pour dériver un état ou charger des données. C'est la référence.

</details>

Ce qui n'est **jamais** un effet : dériver un état, charger des données de l'API ([`stack-front.md`](./stack-front.md), décisions 3 et 5), réagir à un clic — ça, c'est le gestionnaire d'événement.

### 2.3 Pas de mémoïsation manuelle sans raison — _vérifié par le lint_

`useMemo` et `useCallback` se justifient par un calcul coûteux ou une identité de référence nécessaire. Le lint tranche déjà : `react-hooks/use-memo` et `preserve-manual-memoization` sont en erreur.

## 3. Props et composition

### 3.1 Six props, au-delà on compose — _écart_

Trois composants sont à sept props : `FieldRenderer`, `QuestionFields`, `RadioField`. Le signal n'est pas le nombre en soi : il révèle deux responsabilités mélangées, ou une prop de mise en page qui traverse un composant que ça ne regarde pas.

Deux sorties : regrouper les props liées en un objet nommé, ou composer avec `children` plutôt que passer un `render*`.

### 3.2 Le forage s'arrête à deux niveaux — _écart_

`answers` et `setAnswer` traversent `FlowShell` → `QuestionScreen` → `QuestionFields` → `FieldRenderer` avant d'atteindre un champ.

<details><summary><strong>Exemple — le seul contexte du dépôt, et le problème qu'il résout</strong></summary>

**La situation** : le questionnaire a deux mises en page d'erreur, selon la question affichée.

- Une question à **plusieurs champs** (« mois » et « année », une liste de cases à cocher) : chaque message s'affiche **sous son champ**, sinon on ne sait pas lequel corriger.
- Une question à **champ unique** : le message s'affiche **une seule fois en bas de l'écran**, et c'est cette ligne-là que l'`aria-describedby` du champ désigne. Le répéter sous le champ le ferait annoncer deux fois.

**Le trajet que la décision devrait faire sans contexte.** C'est `QuestionFields` qui sait combien de champs porte la question ; c'est `FieldError`, quatre niveaux plus bas, qui affiche ou non le message :

```
QuestionFields  →  FieldRenderer  →  RadioField / MonthYearField / …  →  FieldError
    (sait)          (s'en fiche)              (s'en fiche)                (a besoin)
```

Une prop `inlineErrors` aurait donc traversé `FieldRenderer` et chacun des six composants de champ — qui n'ont rien à voir avec une décision de mise en page, et qui auraient tous eu une prop de plus à déclarer, à documenter et à relayer sans jamais l'utiliser.

**Ce que le dépôt fait à la place** (`QuestionFields.tsx:112`) :

```tsx
<InlineFieldErrorProvider value={inlineErrors}>
  <div className="flex w-full flex-col gap-6 md:gap-8">{mainFields.map(renderField)}</div>
</InlineFieldErrorProvider>
```

et, tout en bas, `FieldError` lit la valeur au lieu de la recevoir :

```tsx
const inline = useContext(InlineFieldError);
if (!message || !inline) return null;
```

**Le niveau d'exigence attendu**, et c'est le vrai sujet de cet exemple : la déclaration du contexte porte la raison de son existence, en toutes lettres.

```ts
/**
 * Un contexte plutôt qu'une propriété : les composants traversés
 * (`FieldRenderer`, `RadioField`, `MonthYearField`…) n'ont rien à voir avec
 * cette décision de mise en page, et ne devraient pas avoir à la relayer.
 */
const InlineFieldError = createContext(true);
```

Sans ce paragraphe, personne ne saura plus tard si on peut le retirer — et le prochain contexte s'ajoutera « parce qu'il y en a déjà un », ce qui est exactement ce qu'on veut éviter.

</details>

## 4. Design system

### 4.1 Aucune couleur hors des tokens — _déjà tenu, et c'est rare_

Aucune valeur hexadécimale, `rgb()` ou `hsl()` n'existe hors de `packages/ui/src/styles/globals.css` dans tout le dépôt.

<details><summary><strong>Exemple — un token dit d'où il vient</strong></summary>

```css
--primary: #00796b; /* Action/Primary/Default (Teal-700) */
--secondary: #e0f2f1; /* Surface/Base/Secondary (Teal-50) */
--content-secondary: #434343; /* Content/Base/Secondary (Neutral-700) */
```

Le commentaire porte le nom Figma : c'est ce qui permet, devant une maquette, de retrouver le token sans deviner. Écrire `#00796b` dans un composant fait perdre ce lien, et le thème sombre avec.

**Seule exception** : le PDF (`resultats/pdf/pdf-styles.ts`), car `@react-pdf/renderer` a son propre moteur de styles et ne lit pas le CSS. Elle est commentée sur place.

</details>

### 4.2 On étend par variante, on ne modifie pas par `className` — _écart_

Un besoin d'apparence non couvert s'ajoute **dans le composant**, comme variante `cva`, puis s'utilise partout.

<details><summary><strong>Écart n° 1 — <code>CategorieTag</code> : une couleur injectée depuis l'app</strong></summary>

Aujourd'hui, l'app décide de la couleur d'un composant du design system :

```tsx
const TAG_UI: Record<Categorie, { Icon: LucideIcon; className: string }> = {
  interlocuteur: { Icon: UsersRoundIcon, className: "bg-secondary text-secondary-foreground" },
  outil: { Icon: WrenchIcon, className: "bg-info-muted text-info-text" },
  dispositif: { Icon: FileTextIcon, className: "bg-success-muted text-success-text" },
};

<Badge variant="secondary" className={`gap-1.5 px-2.5 py-1 text-xs ${className}`}>
```

Deux ennuis : `variant="secondary"` est contredit par le `className` qui suit, et la prochaine catégorie se coloriera ailleurs, autrement.

La cible — les couleurs rejoignent `badgeVariants`, l'app ne décide plus que du contenu :

```tsx
// packages/ui/src/components/badge.tsx
variant: {
  // …
  info: "bg-info-muted text-info-text",
  success: "bg-success-muted text-success-text",
}

// CategorieTag.tsx
<Badge variant={TAG_UI[categorie].variant}>
```

</details>

<details><summary><strong>Écart n° 2 — <code>OutcomeScreen</code> : un bouton entièrement reconstruit</strong></summary>

```tsx
const secondaryClassName =
  "border-primary text-primary hover:bg-secondary hover:text-secondary-foreground h-auto min-h-11 w-full rounded-lg px-6 py-4 text-sm font-semibold md:text-base";
```

Cette chaîne redéfinit la bordure, la couleur, le survol, la hauteur, le rayon, la graisse et la taille de texte — c'est-à-dire tout ce que `buttonVariants` sait déjà faire. La variante `outline-primary` existe, la taille `xl` fait déjà 44 px de haut.

La cible : `<Button variant="outline-primary" size="xl" className="w-full">`. Le `w-full` reste dans l'app : c'est de la mise en page, pas de l'apparence (4.3).

</details>

### 4.3 Le `className` d'une app ne fait que de la mise en page — _règle qui découle de 4.2_

Autorisé : largeur, marge, `gap`, `flex`. Interdit : couleur, fond, bordure, rayon, hauteur — ils appartiennent au composant.

### 4.4 On utilise les primitives avant d'en écrire une — _écart_

<details><summary><strong>Exemple — quatre réécritures de ce qui existe déjà</strong></summary>

| Où                      | Ce qui est écrit                                                                           | Ce qui existe                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `ResultsScreen.tsx:24`  | `const CONTAINER = "mx-auto w-full max-w-[1184px] px-4 md:px-10"`                          | `Container size="lg"` — avec, en prime, des paliers de gouttière cohérents avec le reste du site |
| `ResultsScreen.tsx:45`  | `text-[28px] leading-9 md:text-[32px] md:leading-10`                                       | Le token `text-h1`, qui vaut **exactement** ces valeurs, en mobile comme en desktop              |
| `ResultCard.tsx:15`     | `<article className="border-border bg-card flex h-full flex-col … rounded-sm border p-6">` | `Card` / `CardContent`                                                                           |
| `ScrollToTopButton.tsx` | Un bouton de remontée écrit à la main, avec son écouteur de défilement                     | `BackToTop` de `packages/ui`, déjà utilisé par `apps/site`                                       |

Le cas `text-[28px]` est le plus révélateur : la valeur est juste, mais elle ne suivra pas le jour où l'échelle typographique changera. Un token n'est pas une commodité d'écriture, c'est le point de synchronisation avec la maquette.

</details>

### 4.5 Un composant partagé vit dans `packages/ui` — _déjà tenu_

Avec ce que font déjà tous les autres : un attribut `data-slot`, un `className` fusionné par `cn()`, ses variantes en `cva`, et `focusRing` pour tout élément focusable qui n'est ni `Button` ni `Badge`.

La source officielle d'un composant shadcn se récupère par le **serveur MCP `shadcn`** — voir le skill `composant-ui` et [`outillage-agent.md`](./outillage-agent.md).

## 5. Frontière client / serveur

### 5.1 `"use client"` le plus bas possible — _déjà tenu_

19 fichiers sur 72 le portent. Les pages et les mises en page restent des composants serveur ; la directive descend au composant qui a vraiment besoin d'un état ou d'un événement.

<details><summary><strong>Exemple — une page qui ne fait qu'envelopper</strong></summary>

`app/questionnaire/page.tsx` reste serveur ; tout l'état vit sous elle :

```tsx
export default function QuestionnairePage() {
  // `Suspense` requis par `useSearchParams`, qui lit l'étape dans l'URL.
  return (
    <Suspense>
      <FlowShell />
    </Suspense>
  );
}
```

Rappel : les deux apps sont exportées statiquement, donc un composant serveur est rendu **au build**. Il n'y a pas de rendu serveur à l'exécution.

</details>

### 5.2 Aucune donnée d'API dans un `useEffect` — _à venir_

Les données viendront de TanStack Query au-dessus du contrat de route partagé ([`stack-front.md`](./stack-front.md), décisions 3 et 5).

## 6. Écriture

Ces conventions sont déjà uniformes dans le dépôt ; elles sont écrites ici pour le rester.

- `export function Composant()` — jamais une constante fléchée pour un composant.
- `interface <Nom>Props` nommée ; `type` réservé aux unions et alias de domaine.
- Ordre dans un fichier : directive, imports (externes, `@etape/ui`, internes), constantes, types, interface de props, JSDoc, composant.
- Les commentaires disent **pourquoi**, jamais **quoi**, et en français.
- JSDoc sur tout ce qui est exporté.

<details><summary><strong>Exemple — ce qu'est un bon commentaire ici</strong></summary>

`fields/aria.ts` : le commentaire explique une décision que le code ne peut pas dire.

```ts
/**
 * Marque l'élément à viser quand un champ est en erreur : c'est LUI qui reçoit
 * le focus, donc lui qui est annoncé, avec son libellé et son message.
 *
 * Un attribut à nous plutôt que `aria-invalid` : celui-ci n'est pas valide sur
 * un `role="group"` (l'ARIA le réserve aux widgets), or c'est justement la
 * forme d'un groupe de cases à cocher ou d'un couple mois/année.
 */
export const FIELD_ERROR_ATTRIBUTE = "data-field-error";
```

Un commentaire qui aurait dit « attribut pour marquer les champs en erreur » n'aurait rien appris à personne.

</details>

## Récapitulatif

| Pratique                         | Statut                                               | Vérification                                        |
| -------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| 1.1 Métier hors des composants   | Déjà tenu                                            | Revue                                               |
| 1.2 Logique d'écran dans un hook | Écart (`FlowShell`)                                  | Revue                                               |
| 1.3 Vue pure par défaut          | Écart (`ScrollToTopButton`)                          | Revue                                               |
| 2.1 Pas d'état dérivable         | Déjà tenu                                            | Lint (`set-state-in-render`, `set-state-in-effect`) |
| 2.2 Effet réservé à l'extérieur  | Déjà tenu                                            | Revue                                               |
| 2.3 Pas de mémoïsation gratuite  | Déjà tenu                                            | Lint (`use-memo`, `preserve-manual-memoization`)    |
| 3.1 Six props                    | Écart (3 composants)                                 | Revue                                               |
| 3.2 Forage ≤ 2 niveaux           | Écart (`answers`)                                    | Revue                                               |
| 4.1 Aucune couleur hors tokens   | Déjà tenu                                            | Revue                                               |
| 4.2 Étendre par variante         | Écart (`CategorieTag`, `OutcomeScreen`, `error.tsx`) | Revue                                               |
| 4.4 Primitives avant réécriture  | Écart (4 endroits)                                   | Revue                                               |
| 5.1 `"use client"` au plus bas   | Déjà tenu                                            | Revue                                               |
| 6 Écriture                       | Déjà tenu                                            | Prettier, ESLint, revue                             |

## Questions à trancher

1. Le seuil de découpage de 1.2 (deux hooks d'état **et** DOM **et** aiguillage) est-il le bon, ou trop permissif ?
2. Six props maximum : seuil, ou simple signal d'alerte en revue ?
3. Les écarts cités sont-ils repris dans une PR dédiée, au fil de l'eau, ou laissés tels quels tant qu'on n'y touche pas ?
4. Les variantes manquantes (`info` et `success` sur `Badge`, usage de `xl` dans `OutcomeScreen`) : on les ajoute maintenant ?
5. `ScrollToTopButton` est-il remplacé par `BackToTop`, ou les deux besoins diffèrent-ils vraiment ?
