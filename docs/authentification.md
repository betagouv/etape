# Authentification

Deux façons de se connecter à ETAPE : **FranceConnect**, et un **compte local**
email / mot de passe. Ce document décrit comment les deux cohabitent et ce qu'il
reste à faire.

## Pourquoi une API est apparue

Le site et le simulateur sont des exports statiques (`output: "export"`) : aucun
serveur, aucun secret possible. Or FranceConnect impose un **client
confidentiel** — l'échange du code d'autorisation contre les jetons se fait avec
un `client_secret`, et il n'existe pas de mode public comme chez d'autres
fournisseurs. Un secret placé dans un bundle JavaScript est lisible par tout le
monde, et rédhibitoire à l'homologation.

D'où `apps/api` : le seul composant autorisé à détenir des secrets. Les deux
apps Next restent strictement statiques, et l'invariant du dépôt — `basePath`,
assemblage par `scripts/vercel-out.mjs` — n'est pas touché.

## Architecture

```
front statique (Next SSG)
   │  bouton FranceConnect → /api/auth/login?idp=franceconnect
   │  bouton email/mdp     → /api/auth/login
   ▼
apps/api (NestJS)  ── client OIDC confidentiel · session en cookie httpOnly
   ▼
Keycloak (realm etape) ─┬→ FranceConnect  (identity provider brokerisé)
                        └→ utilisateurs locaux (email / mot de passe)
```

Deux choix structurants :

**L'API est le client OIDC, pas le navigateur.** Aucun jeton n'atteint le front.
Il reçoit un cookie `httpOnly` contenant un identifiant de session opaque ; tout
le reste vit côté serveur. Front et API partagent l'origine derrière nginx, donc
pas de CORS ni de `SameSite=None` en production.

**L'API ne parle qu'à Keycloak.** FranceConnect n'apparaît nulle part dans le
code : Keycloak le broker. Le choix du fournisseur se réduit au paramètre
`kc_idp_hint`. Ajouter ProConnect pour des conseillers plus tard ne demandera
aucune modification de `apps/api`.

### Le module

Tout tient dans `apps/api/src/auth/`, et le reste de l'application ne dépend que
de `SessionService` et `SessionGuard` — jamais de Keycloak ni d'`openid-client`.
Changer d'IAM revient à réécrire `OidcService` seul.

Sessions et transactions de connexion sont gardées en PostgreSQL : elles
survivent au redéploiement, et deux instances de l'API voient les mêmes. Le
détail du schéma est dans [donnees.md](donnees.md).

| Route                    | Rôle                                              |
| ------------------------ | ------------------------------------------------- |
| `GET /api/auth/login`    | Démarre le parcours, redirige vers Keycloak       |
| `GET /api/auth/callback` | Échange le code, crée le compte, ouvre la session |
| `GET /api/auth/logout`   | Ferme la session et propage la déconnexion        |
| `GET /api/auth/session`  | État de connexion pour le front (401 si absent)   |

## Le bouton FranceConnect reste dans le front

Dans un flux brokerisé standard, c'est Keycloak qui affiche l'écran de connexion,
et FranceConnect y apparaît comme un bouton. La seule chose qui **doit** être
conforme au pixel — le bouton FranceConnect et son lien « Qu'est-ce que
FranceConnect ? » — serait donc rendue par le composant sur lequel on a le moins
la main.

`kc_idp_hint` évite ça : le front affiche lui-même les deux entrées, et celle de
FranceConnect part vers `/api/auth/login?idp=franceconnect`. Keycloak n'affiche
aucune page et redirige directement vers FranceConnect. Son écran ne sert plus
que pour le chemin email / mot de passe.

## Configuration du realm

Elle est versionnée dans `keycloak/realms/etape-realm.json`, importée au
démarrage. Ce fichier décrit **l'environnement de développement uniquement** :
l'import de realm ne substitue aucune variable, ni d'environnement ni de propriété
système, si bien que tout ce qui varie d'un environnement à l'autre doit être
appliqué après coup par `kcadm`. Le détail et les pièges associés sont dans
[keycloak/realms/README.md](../keycloak/realms/README.md).

### Client `etape-api`

- Type **confidentiel** ; `Direct access grants` désactivé — le mot de passe ne
  doit jamais transiter par l'API.
- `Valid redirect URIs` : `${API_BASE_URL}/auth/callback`, au caractère près.
- PKCE `S256` **exigé** côté client, en plus d'être envoyé par l'API.
- `post.logout.redirect.uris` doit couvrir l'URL du front. Elle n'est pas déduite
  des `redirectUris` : oubliée, la déconnexion échoue alors même que la connexion
  fonctionne.
- `baseUrl` est la destination des liens « retour » que Keycloak pose sur ses
  pages d'information et d'erreur. Sans elle, la page qui clôt une
  réinitialisation de mot de passe n'affiche **aucun bouton**.
- Un **mapper** expose `identity_provider` dans l'`id_token`, ce qui permet à
  l'API de distinguer une identité FranceConnect d'un compte local. Sans lui,
  `viaFranceConnect` reste toujours `false`, et tous les comptes sont enregistrés
  comme locaux (`docs/donnees.md`).

### Identity provider FranceConnect

Le broker OIDC générique de Keycloak **ne suffit pas**, et l'apprendre coûte une
matinée : FranceConnect rejette toutes ses requêtes d'autorisation avec l'erreur
`Y030007`, qui signifie « un paramètre de l'appel à `/authorize` ne respecte pas
le format attendu » — sans dire lequel.

Le paramètre en cause est le **`nonce`**. FranceConnect v2 exige `state` et
`nonce` d'au moins 32 caractères ; le broker générique émet un `nonce` de 22.
Aucun réglage ne permet de le changer, c'est du code.

L'identity provider est donc celui de l'**extension Keycloak-FranceConnect de
l'INSEE**, ajoutée à l'image dans le `Dockerfile` et installée en local par le
service `keycloak-providers`. Elle s'enregistre comme _social identity provider_
sous l'identifiant `franceconnect-particulier` — détail qui a son importance, car
elle n'apparaît pas dans la liste des identity providers de `serverinfo`, ce qui
donne à croire qu'elle n'est pas chargée.

Elle n'est pas facultative, même sans identifiants FranceConnect : le fichier de
realm déclare son fournisseur sous cet identifiant, et Keycloak **refuse de
démarrer** s'il ne le connaît pas — « Invalid identity provider id ». Une pile
locale sans l'extension ne perd pas le seul parcours FranceConnect, elle ne
démarre pas du tout.

Trois choses qu'elle règle, et qui étaient autant de questions ouvertes :

- **le format des paramètres** (`nonce` de 64 caractères alphanumériques) ;
- **le niveau de garantie eIDAS**, émis nativement. Le montage précédent —
  `acr_values` ajouté par l'API et relayé par `forwardParameters` — a donc été
  retiré de `OidcService` ;
- **le `/userinfo` renvoyé en JWT signé** et la **propagation de la
  déconnexion**, que le broker générique ne savait pas traiter.

Sa configuration tient en deux clés :

| Clé              | Valeur                    | Effet                           |
| ---------------- | ------------------------- | ------------------------------- |
| `fc_environment` | `INTEGRATION_STANDARD_V2` | toutes les URL de FranceConnect |
| `eidas_values`   | `EIDAS1`                  | niveau de garantie demandé      |

Plus aucune URL en dur : l'extension les dérive de l'environnement. La
correspondance, lue dans son fichier de propriétés :

| Environnement                    | Hôte                                   |
| -------------------------------- | -------------------------------------- |
| `INTEGRATION_STANDARD_LEGACY_V2` | `fcp-low.integ01.dev-franceconnect.fr` |
| `INTEGRATION_STANDARD_V2`        | `fcp-low.sbx.dev-franceconnect.fr`     |
| `PRODUCTION_STANDARD_V2`         | `oidc.franceconnect.gouv.fr`           |

Les identifiants ne valent que pour l'environnement où ils ont été délivrés :
s'y tromper produit un « client_id inconnu » (`Y04EA6EF`). La variable
`FRANCECONNECT_ENVIRONNEMENT` permet d'en changer sans toucher au code.

Pour savoir quel environnement connaît un `client_id` sans rien déployer, il
suffit d'appeler son `/authorize` : `Y04EA6EF` signifie qu'il l'ignore,
`Y04C013C` qu'il le connaît mais que la `redirect_uri` n'y est pas déclarée.
Le second code est donc une bonne nouvelle — il désigne le bon environnement.

L'alias reste `franceconnect`, et non celui que l'extension propose par défaut :
c'est lui qui figure dans la `redirect_uri` déclarée chez FranceConnect, pénible
à faire changer, et dans `kc_idp_hint`.

### Liaison des comptes

Le point à ne pas rater. Une personne crée un compte avec `jean@exemple.fr`, puis
se connecte plus tard via FranceConnect, qui renvoie un `sub` différent.

**Ne jamais lier automatiquement sur le seul email.** Ce serait une prise de
contrôle de compte : je crée un compte avec l'email de quelqu'un sans le vérifier,
la personne se connecte en FranceConnect, les comptes fusionnent, je récupère son
dossier.

Le flux _First Broker Login_ doit donc imposer une **vérification par email avant
fusion**. La clé réellement fiable côté FranceConnect est l'identité pivot (nom,
prénom, date **et** lieu de naissance) plutôt que l'email — mais Keycloak lie sur
l'email nativement, et faire autrement demande un authenticator maison. Partir sur
l'email avec vérification obligatoire, et stocker le pivot en attributs
utilisateur pour garder l'option ouverte.

Le flux `first broker login` par défaut de Keycloak convient : il enchaîne
`idp-confirm-link` puis `idp-email-verification`, ce qui prouve la maîtrise de la
boîte mail avant fusion. **Ne pas le remplacer par la liaison automatique**, et
laisser `trustEmail: false` sur l'identity provider — activer cette option ferait
sauter l'étape de vérification.

### Sécurité du realm

- **Brute force detection** : désactivée par défaut de Keycloak, activée dans le
  fichier de realm.
- **Politique de mot de passe** : `length(12)`, une majuscule, une minuscule, un
  chiffre, un caractère spécial, refus du mot de passe identique à l'identifiant,
  historique de 3.

  Les règles de composition sont une **demande produit**, et non ce que nous
  recommanderions : l'ANSSI comme le NIST tiennent la longueur pour plus efficace
  que la complexité, qui pousse surtout à des substitutions prévisibles
  (`Password1!`) et à la réutilisation. Les douze caractères exigés restent le
  garde-fou principal.

  Elles sont écrites à deux endroits qui doivent rester d'accord : `passwordPolicy`
  dans le realm, qui fait autorité, et `PasswordRules` dans le thème, qui les
  affiche pendant la saisie. Modifier l'un sans l'autre annonce une règle que le
  serveur n'applique pas, ou fait échouer un formulaire qui paraît complet.

## Thème

Les écrans de connexion ne sont pas soumis au DSFR, mais le thème Keycloak par
défaut jure avec l'identité d'ETAPE. Ils sont donc écrits en React avec
**Keycloakify**, dans [`apps/keycloak-theme`](../apps/keycloak-theme/README.md),
d'après les maquettes `login-proposition-2` du Figma _Dépôt de dossier_.

Sont couverts : `login`, `register`, `login-reset-password`,
`login-update-password`, `login-verify-email`, `login-idp-link-confirm`,
`login-idp-link-email`, `login-page-expired`, `logout-confirm`, `info`, `error`,
ainsi que **les gabarits d'email** — distincts du thème de connexion, et
régulièrement oubliés jusqu'à ce qu'un utilisateur reçoive un message brut
estampillé Keycloak.

Le thème réutilise les variables de `@etape/ui` plutôt que de recopier les
valeurs : la palette et l'échelle typographique restent celles du reste du
produit. Deux points méritent d'être connus :

- **le bouton FranceConnect apparaît aussi sur l'écran de Keycloak.** C'est ce
  que prévoient les maquettes, et il y est rendu conformément au kit — Marianne
  comprise. Cela ne change rien au choix décrit plus haut : en parcours normal,
  `kc_idp_hint` évite cet écran, et c'est le bouton du front qui sert ;
- **l'écran d'inscription ne reçoit pas `passwordRequired`** de Keycloakify
  11.15, alors que Keycloak le fournit. Sans correctif, l'inscription crée un
  compte sans mot de passe. `Register.tsx` le déduit du contexte ; le détail est
  dans le README du thème.

## Mot de passe oublié

Le parcours est celui de Keycloak — `reset-credentials` — habillé par le thème.
Rien n'est réimplémenté : le lien reçu par email porte un jeton d'action signé,
que Keycloak vérifie et consomme.

Ce qu'il a fallu régler pour qu'il tienne debout :

**Le lien vit 15 minutes**, et non les 5 par défaut
(`actionTokenGeneratedByUserLifespan`). Cinq minutes ne laissent pas le temps
d'ouvrir sa boîte mail sur un autre appareil ; la première chose que fait la
personne est alors d'en redemander un. L'email annonce la durée, quelle qu'elle
soit — `linkExpirationFormatter` la met en toutes lettres.

**Le parcours se termine de deux façons**, selon l'endroit où le lien est ouvert :

| Lien ouvert…                           | Ce que voit la personne                        |
| -------------------------------------- | ---------------------------------------------- |
| dans le navigateur de la demande       | connectée directement, elle arrive sur le site |
| ailleurs (téléphone, autre navigateur) | « Compte mis à jour », puis un bouton          |

Le second cas est le plus courant — on demande depuis un ordinateur et on lit
ses emails sur un téléphone — et c'est celui qui n'avait pas d'issue : la page de
confirmation ne propose de lien que si le client Keycloak porte une `baseUrl`, et
`etape-api` n'en avait pas. Elle vise l'entrée de connexion de l'API plutôt que
la racine du site, `/api/auth/login?returnTo=/compte/` : qui arrive là n'est pas
connecté, et la marche suivante est toujours la même.

**Un lien périmé mène à `error.ftl`**, qui n'a pas non plus de retour naturel vers
le formulaire de demande. `Error.tsx` reconnaît ce cas et propose « Demander un
nouveau lien ». Il le reconnaît en comparant le texte du message — Keycloak ne
transmet pas la clé — ce qui ne tient que parce que les deux chaînes sortent de
la même source : Keycloakify recopie les traductions du thème dans le paquet de
messages dont le serveur se sert. C'est aussi pourquoi ces deux libellés-là sont
écrits sans apostrophe, `MessageFormat` la doublant d'un côté et pas de l'autre.

**L'existence d'un compte n'est pas divulguée.** Keycloak affiche le même message
que l'adresse soit connue ou non, et n'envoie rien dans le second cas ; le
libellé repris dans le thème dit « si un compte existe pour cette adresse » et se
garde d'en dire plus.

## La page `/compte/`

Le site expose une page qui rend compte de la session en cours : l'identité
reçue, champ par champ, et un bouton de déconnexion.

Elle affiche les claims **tels qu'ils arrivent**, sous leur libellé français et
leur nom technique. C'est délibéré : les champs que renvoie FranceConnect
varient selon le fournisseur d'identité choisi, et c'est le nom technique qui
sert à discuter avec le portail partenaires quand l'un d'eux manque. Un champ
inconnu de la table des libellés est affiché quand même, jamais écarté.

Deux conséquences côté API : `PublicSession` porte un `claims` non typé, et
`identity-claims.ts` en retire la plomberie du protocole — `iss`, `aud`,
`at_hash` et consorts — en liste noire plutôt qu'en liste blanche, pour la même
raison.

L'entrée de l'en-tête suit l'état de session : « Se connecter » avant, « Mon
compte » après. Le lien de connexion porte `returnTo=/compte/`, sans quoi
quelqu'un déjà connecté à Keycloak repasse tout le parcours pour revenir d'où il
vient — et croit que le bouton n'a rien fait.

L'en-tête n'interroge la session qu'au chargement complet d'une page : il vit
dans le layout, que les navigations côté client ne remontent pas. Se déconnecter
depuis `/compte/` provoque une vraie navigation, donc l'en-tête se remet à jour.

## Développement local

```bash
# Le thème d'abord : `keycloak-providers` recopie le JAR qu'il produit. Sans
# lui Keycloak démarre quand même, mais avec ses écrans par défaut.
npm run build -- --filter=@etape/keycloak-theme

# La base applicative, Keycloak et la sienne. Identifiants FranceConnect et clé
# SMTP sont facultatifs : sans eux tout fonctionne, seuls le parcours
# FranceConnect et les emails (inscription, « mot de passe oublié ») restent
# indisponibles.
FRANCECONNECT_CLIENT_ID=… FRANCECONNECT_CLIENT_SECRET=… docker compose up -d

cp apps/api/.env.example apps/api/.env

# Crée les tables de la base applicative. À rejouer après chaque migration.
npm run db:migrate --workspace=@etape/api

npm run dev            # site, simulateur et API
```

Après modification du thème, `npm run build -- --filter=@etape/keycloak-theme`
puis `docker compose up -d keycloak-providers && docker compose restart keycloak` :
c'est `keycloak-providers` qui recopie le JAR dans le volume d'extensions, un
simple redémarrage de Keycloak servirait l'ancien.

| Service           | Adresse               | Accès                                      |
| ----------------- | --------------------- | ------------------------------------------ |
| Site vitrine      | http://localhost:3000 | bouton « Se connecter » dans l'en-tête     |
| Console Keycloak  | http://localhost:8080 | `admin` / `admin`                          |
| Compte applicatif | —                     | `test@etape.local` / `MotDePasseTest2026!` |
| Base applicative  | localhost:5432        | `etape` / `etape`, base `etape`            |

Le secret du client est figé dans le fichier de realm et recopié tel quel dans
`.env.example` : sans cela, Keycloak en régénère un à chaque import et il
faudrait rouvrir la console après chaque `docker compose down -v`. Il ne protège
qu'un Keycloak local ; les autres environnements reçoivent le leur par `kcadm`.

### Les emails, en local aussi

L'envoi passe par **Brevo**, dans tous les environnements. En local, il faut donc
une clé SMTP de développement :

```bash
SMTP_HOST=smtp-relay.brevo.com \
SMTP_USER=<le login affiché dans « SMTP & API → SMTP »> \
SMTP_PASSWORD=… \
SMTP_FROM=no-reply@etape.beta.gouv.fr \
  docker compose up -d
```

Ces variables ne peuvent pas figurer dans le fichier de realm : il est versionné
et public, et **l'import ne substitue aucune variable**. C'est donc le service
`keycloak-init` qui les applique après coup, comme pour les secrets
FranceConnect. Sans elles, `verifyEmail` reste désactivé et le parcours « mot de
passe oublié » est fermé — les deux s'arrêteraient sur un email qui n'arriverait
jamais.

Deux choses à savoir avant de chercher longtemps :

- il n'y a qu'un seul secret, la clé SMTP, dans `SMTP_PASSWORD` — et c'est bien
  une **clé SMTP**, pas une clé API v3 (`xkeysib-…`) : cette dernière ne sert
  qu'à l'API HTTP de Brevo, que Keycloak ne sait pas appeler. `SMTP_USER` n'est
  pas un secret mais reste obligatoire, l'authentification SMTP étant un couple
  identifiant / mot de passe ; c'est le login affiché dans « SMTP & API → SMTP »,
  qui selon l'ancienneté du compte est l'email du compte ou un identifiant en
  `@smtp-brevo.com`. Le détail est dans [`deploy/.env.example`](../deploy/.env.example) ;
- pour vérifier qu'un envoi est bien configuré, lire le realm **sans filtre**.
  `kcadm get realms/etape --fields smtpServer` affiche `{}` pour toute map
  imbriquée, quel que soit le contenu réel — de quoi croire une configuration
  perdue alors qu'elle est en place.

Les gabarits vivent dans `apps/keycloak-theme/src/email`, distincts du thème de
connexion. Ils sont écrits en tables et en styles en ligne, sans police distante :
c'est ce que comprennent les clients de messagerie.

## Ce qui reste à faire

- [ ] Fournir de vrais identifiants FranceConnect et jouer le parcours de bout en
      bout — c'est ce qui validera les deux inconnues restantes (`/userinfo` en
      JWT, propagation de la déconnexion)
- [x] Remplacer `InMemorySessionStore` par une implémentation persistante —
      c'est fait, en PostgreSQL, en même temps que la base applicative
      (`docs/donnees.md`)
- [x] Thème Keycloakify — écrans et emails, cf. `apps/keycloak-theme`
- [x] « Mot de passe oublié » de bout en bout, envoi par Brevo
- [ ] Valider l'expéditeur `SMTP_FROM` chez Brevo (SPF, DKIM) : sans domaine
      authentifié, le relais accepte les messages et la remise échoue ensuite,
      sans que Keycloak en sache rien
- [ ] Bouton FranceConnect dans le front. Le bouton « Se connecter » de
      l'en-tête du site part bien vers `/api/auth/login` ; celui de
      FranceConnect, conforme au kit, reste à poser sur l'écran qui
      l'accueillera : `FRANCE_CONNECT_LOGIN_URL` (`apps/site/src/lib/auth.ts`)
      pointe déjà où il faut
- [ ] Décider de l'hébergement de Keycloak et de sa base, et scripter la
      configuration des environnements non locaux via `kcadm`

## Deux points à anticiper

**Les previews ne verront pas FranceConnect.** Les `redirect_uri` sont déclarées
en liste blanche chez FranceConnect, et les previews Vercel ont des URL
mouvantes (`etape-preview-xxxxx-…`). Avec Keycloak, FranceConnect ne voit plus
qu'une seule `redirect_uri` — celle du broker, fixe par environnement — et les
URL de preview ne concernent plus que la liste blanche de Keycloak, que nous
administrons. Le parcours redevient donc testable, à condition d'un realm de
développement pointant vers l'environnement d'intégration de FranceConnect.

**L'homologation.** Le passage en production de FranceConnect suppose une
validation par leurs équipes : conformité du bouton, déconnexion fonctionnelle,
mentions obligatoires. À déclencher tôt, le délai n'est pas maîtrisé.
