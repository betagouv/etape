---
paths:
  - "**/*.tsx"
---

# React — règles par défaut

Référence complète : `docs/conventions/react.md`. La lire avant de créer un écran, un hook ou de découper un composant.

1. **Le métier reste hors des composants** : règles pures dans `domain/`, appelées par le composant.
2. **La logique d'écran va dans un hook** `use<Écran>`. Un composant qui appelle plus d'un hook d'état **et** manipule le DOM **et** aiguille le rendu doit être découpé — l'enveloppe appelle le hook, la vue affiche.
3. **Une vue est pure** : props → JSX. Ni store, ni effet, ni `fetch` caché derrière une apparence de vue.
4. **`useEffect` sert à parler à l'extérieur** (focus, URL, abonnement). Jamais pour dériver un état, jamais pour charger des données d'API.
5. **Six props maximum** ; au-delà, regrouper ou composer avec `children`. Le forage s'arrête à deux niveaux — ensuite, hook ou contexte, et le contexte porte un commentaire qui le justifie.
6. **`"use client"` le plus bas possible** : pages et layouts restent des composants serveur.
7. **Écriture** : `export function`, `interface <Nom>Props`, commentaires qui disent _pourquoi_, JSDoc sur les exports.

Le lint impose déjà les règles React Compiler (`purity`, `set-state-in-effect`, `set-state-in-render`, `static-components`, `use-memo`) : ne pas contourner un avertissement, corriger la cause.
