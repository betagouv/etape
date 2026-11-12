---
paths:
  - "**/*.{ts,tsx}"
---

# Typage — règles par défaut

Référence complète : `docs/conventions/typescript.md`. La lire avant de créer un type d'état, un hook ou un module de domaine.

1. **Type de retour explicite** sur toute fonction exportée d'un `.ts` ; un hook qui renvoie un objet déclare son interface `<Hook>Result`. Composants `.tsx` : type inféré. (ESLint, bloquant.)
2. **Valeurs finies** : objet `as const` + type dérivé (`PDF_STATUS` / `PdfStatus`, `FLAGS` / `Flag`). Jamais d'`enum`. (Compilateur et ESLint, bloquant.)
3. **Jamais de littéral en dur** dans une condition ou un appel : `status === PDF_STATUS.GENERATING`, pas `status === "generating"` ; `changeField(MANUAL_FIELD.NOM_VOIE, …)`, pas `changeField("nomVoie", …)`. Exceptions : discriminant d'union (`{ type: "RESET" }`), noms de champ de `messagesPerField` dans le thème Keycloak. (ESLint `etape/no-hardcoded-literal`, bloquant, sauf dans le JSX.)
4. **Correspondance valeur → libellé** : `Record<Type, …>` (`BUTTON_LABELS[status]`), pas de ternaire ni de `switch`.
5. **État React typé par l'union** : `useState<PdfStatus>(PDF_STATUS.IDLE)`.

La règle 3 est vérifiée par ESLint hors JSX ; les règles 4 et 5 par aucun outil : les appliquer à l'écriture, les signaler en revue. Quand une valeur finie n'a pas encore sa constante, la créer (`as const` + type dérivé) plutôt que d'écrire la chaîne.
