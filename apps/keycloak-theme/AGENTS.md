# apps/keycloak-theme — consignes pour les agents

Vue d'ensemble du dépôt : [`docs/cartographie.md`](../../docs/cartographie.md). **Le [`README.md`](./README.md) de ce dossier fait foi** pour les écrans, leurs choix et leurs limites : le lire avant de modifier un écran.

## Rôle

Thème Keycloak d'ETAPE, écrit en React avec Keycloakify : écrans de connexion, d'inscription, de mot de passe, et gabarits d'e-mail. **Ce n'est pas un serveur** : le build produit un JAR que le Keycloak lancé par Docker charge.

## Ici / ailleurs

- Ici : l'apparence et les textes des écrans Keycloak et des e-mails.
- Ailleurs : le parcours de connexion, la session, le compte → `apps/api/src/auth/` ; un client OIDC, une URI de redirection, FranceConnect, le choix du thème → `keycloak/realms/etape-realm.json` ; une couleur ou un token → `packages/ui/src/styles/globals.css`.

## Lancer et vérifier

Keycloakify 11 sur Vite 8, React 19, Tailwind 4. Le JAR demande **Maven** ; la CI ne lance que `build:bundle` (sans JAR).

```bash
npm run build -- --filter=@etape/keycloak-theme   # JAR dans dist_keycloak/
docker compose up -d keycloak-providers && docker compose restart keycloak
npm run test --workspace=@etape/keycloak-theme    # Vitest
npm run storybook --workspace=@etape/keycloak-theme  # Keycloak jetable avec le realm du dépôt
```

C'est `keycloak-providers` qui recopie le JAR dans le volume d'extensions : un simple redémarrage de Keycloak servirait l'ancien.

## Où vivent les choses

- `src/login/pages/` — un fichier par écran ; `src/login/KcPage.tsx` aiguille selon l'écran demandé ; `Template.tsx`, `i18n.ts`.
- `src/login/components/` — formulaire, alerte, bouton FranceConnect, règles de mot de passe.
- `src/email/` — gabarits FreeMarker (`html/`, `text/`) et `messages/`.
- `src/styles/theme.css` — reprend les variables de `packages/ui`.

## Conventions

- Hors du périmètre de `docs/conventions/react.md` : les contraintes viennent de Keycloakify (voir le README).
- Le bouton FranceConnect suit son propre kit graphique, Marianne comprise : c'est une exigence de FranceConnect, vérifiée à l'homologation. Cela n'en fait pas un service de l'État : pas de DSFR pour le reste des écrans.
- ESLint `@etape/eslint-config/react-internal` : les règles `jsx-a11y` ne s'appliquent pas ici.

## État et pièges

- Pas de script `typecheck` : `tsc` ne tourne que dans `build:bundle`.
- Pas de port fixé : `npm run dev` prend 5173, comme `apps/front-office`.
