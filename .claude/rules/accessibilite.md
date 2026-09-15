---
paths:
  - "**/*.tsx"
---

# Accessibilité — règles par défaut

Référence complète : `docs/conventions/accessibilite.md`. Aucune de ces règles n'est vérifiée par un outil.

1. **Action asynchrone** : jamais `disabled` sur le bouton pendant l'action (perte du focus). `aria-disabled` + `aria-busy` + garde `if (isX) return;` en tête du handler.
2. **Changement d'état annoncé** dans une région `role="status"` toujours montée, vide au repos. Pas de doublon avec un toast.
3. **Libellé visible ≠ message annoncé** : deux `Record` indexés par l'état (`BUTTON_LABELS`, `ANNOUNCEMENTS`). Le bouton garde toujours un nom accessible.
4. **Icônes décoratives** : `aria-hidden="true"`.
5. **Document généré (PDF)** : pas la version accessible ; `language="fr"`, URL en `Link`, aucune information absente de la page.

Pour affirmer qu'un comportement clavier ou lecteur d'écran fonctionne, le vérifier dans le navigateur (`document.activeElement`, contenu de la région) — sinon dire qu'il n'a pas été testé.
