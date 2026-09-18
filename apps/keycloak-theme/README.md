# @etape/keycloak-theme

Thème Keycloak d'ETAPE — écrans de connexion et gabarits d'email, écrits en
React avec [Keycloakify](https://keycloakify.dev).

Les écrans suivent les maquettes `login-proposition-2` du Figma _Dépôt de
dossier_. Ils réutilisent les variables de `@etape/ui` — couleurs, rayons,
échelle typographique — plutôt que de les recopier : ce qui bouge dans le design
system se propage ici au prochain build.

## Installer et lancer

```bash
# Construit le bundle puis le JAR (dist_keycloak/etape-keycloak-theme.jar)
npm run build

# Voir le résultat dans le Keycloak du dépôt
docker compose restart keycloak   # depuis la racine

# Linter
npm run lint
```

Le `docker-compose.yml` de la racine monte le JAR dans `/opt/keycloak/providers`.
Après un build, un `docker compose restart keycloak` suffit — inutile de
recréer le conteneur.

`npm run storybook` (`keycloakify start-keycloak`) démarre un Keycloak jetable
préchargé avec le realm du dépôt, pratique pour parcourir les écrans que le
parcours normal atteint rarement.

## Ce que contient le thème

| Écran                                                | Fichier                                   |
| ---------------------------------------------------- | ----------------------------------------- |
| Connexion                                            | `src/login/pages/Login.tsx`               |
| Inscription                                          | `src/login/pages/Register.tsx`            |
| Mot de passe oublié                                  | `src/login/pages/LoginResetPassword.tsx`  |
| Nouveau mot de passe                                 | `src/login/pages/LoginUpdatePassword.tsx` |
| Vérification d'adresse                               | `src/login/pages/LoginVerifyEmail.tsx`    |
| Liaison de comptes (2 écrans)                        | `src/login/pages/LoginIdpLink*.tsx`       |
| Session expirée · erreur · information · déconnexion | `src/login/pages/`                        |

Les écrans non listés — double authentification, WebAuthn, consentement —
tombent sur `DefaultPage` de Keycloakify. Ils héritent du gabarit d'ETAPE, mais
le balisage de leur formulaire reste celui de Keycloakify : les règles
`.kc-fallback` de `src/styles/theme.css` leur donnent une apparence correcte
sans les avoir dessinés un à un.

Les emails sont dans `src/email/`. `theme.properties` hérite de `base`, donc
seuls les gabarits redéfinis (vérification d'adresse, réinitialisation) sont à
nous ; tous les autres emails de Keycloak prennent malgré tout l'habillage
d'ETAPE, porté par `html/template.ftl`.

## Connexion et inscription sont deux pages, et c'est imposé

Le pied de formulaire porte un lien — « Pas encore de compte ? Créer un compte
usager » — et non un onglet. Ce n'est pas un choix esthétique.

Keycloak ne suit qu'une étape courante par session d'authentification et
régénère son `session_code` à chaque changement. Échanger les formulaires côté
client invaliderait celui qui est déjà affiché : mesuré, il suffit d'aller
chercher la page d'inscription en arrière-plan pour que la soumission suivante du
formulaire de connexion tombe sur « La page a expiré ». Une barre d'onglets
promettrait donc un basculement instantané qu'elle ne peut pas tenir — la
maquette en proposait une, elle a été écartée pour cette raison.

**Corollaire : ne jamais précharger ces pages** (`<link rel="prefetch">`, service
worker, prefetch au survol). Cela casserait la connexion de façon intermittente,
et le symptôme ne pointerait pas vers sa cause.

Ce qui a été supprimé, en revanche, c'est le vide entre les deux écrans. Le
document restait blanc ~350 ms le temps que le bundle démarre, et c'est ce vide
qui se lit comme un rechargement. `index.html` porte désormais l'ossature de
l'écran — illustration et panneau — peinte dès la feuille de style analysée, avec
les mêmes classes que le gabarit React (`.kc-split`, `.kc-illustration`,
`.kc-panel`) pour que rien ne bouge quand React prend le relais.

Une transition de vue entre documents a été tentée pour aller plus loin ; elle ne
démarre pas de façon fiable dans ce contexte et a été retirée plutôt que laissée
à moitié fonctionnelle.

## Polices

Open Sans vient de `@fontsource` et Marianne est versionnée dans
`src/assets/fonts`, extraite de la distribution du DSFR — le paquet
`@gouvfr/dsfr` refuse de s'installer hors d'un projet initialisé par son propre
CLI. Marianne ne sert qu'au bouton FranceConnect, dont le kit d'implémentation
l'impose. Aucune police n'est chargée depuis un CDN : une page de connexion ne
doit pas dépendre d'un tiers.

## Limites connues

- **`passwordRequired` n'est pas transmis par Keycloakify 11.15** — le gabarit
  généré ne recopie pas cette variable, pourtant fournie par Keycloak. Sans
  elle, `useUserProfileForm` n'ajoute pas les champs de mot de passe et
  l'inscription crée un compte sans moyen de connexion. `Register.tsx` la déduit
  du contexte ; à retirer si une version ultérieure corrige le tir.
- **Attributs multivalués non gérés** dans `UserProfileFields` — le profil du
  realm n'en contient aucun. En ajouter un demanderait d'étendre le composant.
