# Conventions d'accessibilité — ETAPE

**Statut** : Proposé · **Date** : 2026-09-15 · **Origine** : revue de la PR #49 (bouton de téléchargement du PDF)
**Portée** : composants React de `apps/site`, `apps/simulateur` et `packages/ui`

Ces règles précisent la case « Accessibilité (navigation clavier, focus visible) » du modèle de PR. Aucune n'est vérifiable par un outil : elles sont appliquées à l'écriture et contrôlées en revue.

## 1. Un bouton d'action asynchrone n'est jamais `disabled` pendant l'action

Un bouton qui a le focus et passe `disabled` perd le focus (`document.activeElement` devient `body`) et ne le retrouve pas à la fin de l'action : la personne au clavier ou au lecteur d'écran perd sa position dans la page.

On expose l'état par `aria-disabled` et `aria-busy`, et on bloque la double activation dans le handler.

```tsx
async function handleDownload() {
  if (isGenerating) return;
  setStatus(PDF_STATUS.GENERATING);
  // …
}

<Button
  type="button"
  onClick={handleDownload}
  aria-disabled={isGenerating}
  aria-busy={isGenerating}
  className="aria-busy:cursor-progress"
>
  {isGenerating && <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />}
  {BUTTON_LABELS[status]}
</Button>;
```

**Vérifier** : activer le bouton au clavier, puis contrôler que `document.activeElement` reste le bouton pendant et après l'action.

## 2. Un changement d'état s'annonce dans une région `role="status"` toujours montée

Le changement de libellé d'un bouton n'est pas annoncé de façon fiable par les lecteurs d'écran. On annonce le début et la fin de l'action dans une région `role="status"` (équivalent `aria-live="polite"`) :

- **toujours présente dans le DOM**, vide au repos : une région insérée en même temps que son texte n'est pas annoncée de façon fiable ;
- **sans doublon** : quand un toast signale l'erreur, il porte sa propre région live, la région de statut se vide.

```tsx
<p role="status" className="sr-only">
  {ANNOUNCEMENTS[status]}
</p>
```

## 3. Le libellé visible et le message annoncé sont deux textes distincts

Le libellé du bouton (`BUTTON_LABELS`) et le message de la région de statut (`ANNOUNCEMENTS`) sont deux correspondances séparées, toutes deux indexées par l'état (voir [`typescript.md`](./typescript.md), règle 4) :

- le bouton ne perd jamais son nom accessible (l'annonce au repos est vide, pas le libellé) ;
- un même texte n'est pas lu deux fois (nom du bouton, puis région de statut) ;
- un message ponctuel (« Le PDF est prêt ») ne reste pas affiché sur le bouton.

## 4. Les icônes décoratives sont masquées

Une icône qui double un texte (spinner, pictogramme de bouton) porte `aria-hidden="true"`.

## 5. Un document généré n'est pas la version accessible

`@react-pdf/renderer` ne produit pas de PDF balisé (PDF/UA). La page HTML reste la version accessible ; le document généré en est une copie imprimable, qui ne contient aucune information absente de la page. On y déclare au minimum :

- la langue (`<Document language="fr">`) ;
- des liens cliquables (`Link` plutôt que `Text` pour une URL).
