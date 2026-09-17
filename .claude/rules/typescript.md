---
paths:
  - "**/*.{ts,tsx}"
---

# Typage — règles par défaut

Référence complète : `docs/conventions/typescript.md`. La lire avant de créer un type d'état, un hook ou un module de domaine.

1. **Type de retour explicite** sur toute fonction exportée d'un `.ts` ; un hook qui renvoie un objet déclare son interface `<Hook>Result`. Composants `.tsx` : type inféré. (ESLint, bloquant.)
2. **Valeurs finies** : objet `as const` + type dérivé (`PDF_STATUS` / `PdfStatus`, `FLAGS` / `Flag`). Jamais d'`enum`. (Compilateur et ESLint, bloquant.)
3. **Jamais de littéral en dur** dans une condition ou un appel : `status === PDF_STATUS.GENERATING`, pas `status === "generating"`. Exception : discriminant d'union (`{ type: "RESET" }`).
4. **Correspondance valeur → libellé** : `Record<Type, …>` (`BUTTON_LABELS[status]`), pas de ternaire ni de `switch`.
5. **État React typé par l'union** : `useState<PdfStatus>(PDF_STATUS.IDLE)`.

Les règles 3 à 5 ne sont vérifiées par aucun outil : les appliquer à l'écriture, les signaler en revue.
