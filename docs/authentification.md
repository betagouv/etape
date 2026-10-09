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
front-office (son origine)            back-office (son origine)
   │  /api/auth/login?idp=franceconnect   │  /api/auth/login
   │  /api/auth/login                     │
   ▼  relayé par nginx ou Vite            ▼  relayé par nginx ou Vite
apps/api (NestJS) ── front reconnu à l'en-tête Host · client OIDC confidentiel
   │                                       · session en cookie httpOnly
   ▼                                      ▼
Keycloak, realm etape ─┬→ FranceConnect   Keycloak, realm etape-back-office
                       └→ comptes locaux     └→ comptes locaux (sans inscription)
```

Deux choix structurants :

**L'API est le client OIDC, pas le navigateur.** Aucun jeton n'atteint le front.
Il reçoit un cookie `httpOnly` contenant un identifiant de session opaque ; tout
le reste vit côté serveur. Chaque front relaie `/api` sur sa propre origine —
nginx en production, le proxy de Vite en local — donc ni CORS ni
`SameSite=None` : l'API n'active pas le CORS du tout.

**L'API ne parle qu'à Keycloak.** FranceConnect n'apparaît nulle part dans le
code : Keycloak le broker. Le choix du fournisseur se réduit au paramètre
`kc_idp_hint`. Ajouter ProConnect pour des conseillers plus tard ne demandera
aucune modification de `apps/api`.

### Le module

Tout tient dans `apps/api/src/auth/`, et le reste de l'application ne dépend que
de `SessionService` et `SessionGuard` — jamais de Keycloak ni d'`openid-client`.
Changer d'IAM revient à réécrire `OidcService` seul.

Les sessions sont gardées en PostgreSQL : elles survivent au redéploiement, et
deux instances de l'API voient les mêmes. La transaction de connexion (`state`,
`nonce`, `code_verifier`, `returnTo`) voyage au contraire dans un cookie chiffré
en AES-256-GCM (`COOKIE_ENCRYPTION_KEY`) : `/api/auth/login` est anonyme, et
n'écrit donc rien en base. Les routes du parcours sont limitées à 30 appels par
minute et par IP, les autres à 300 (`@nestjs/throttler`). Le détail du schéma
est dans [donnees.md](donnees.md).

| Route                    | Rôle                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| `GET /api/auth/login`    | Démarre le parcours, redirige vers Keycloak                          |
| `GET /api/auth/callback` | Échange le code, crée le compte, ouvre la session                    |
| `GET /api/auth/logout`   | Ferme la session et propage la déconnexion                           |
| `GET /api/auth/session`  | État de connexion : `{ session }`, `null` si personne n'est connecté |

Une navigation vers `login`, `callback` ou `logout` ne reçoit jamais d'erreur
brute : l'échec renvoie au front avec son motif, `?login=<motif>` ou
`?logout=<motif>` (`expired`, `failed`, `unavailable`, `too-many-requests`), que
front-office et back-office affichent sans rediriger : c'est la personne qui
relance le parcours, sinon une panne de Keycloak ferait boucler. Le détail reste
dans les journaux de l'API.

`/api/auth/session` répond toujours 200 : `{ session: null }` n'est pas une
erreur, c'est « personne n'est connecté ». Un 401 ne veut donc dire, partout
dans l'API, qu'une chose : la session a expiré (`SessionGuard`). Le schéma de la
réponse est la première route de `packages/api-contract` (`getSession`).

**Une garde CSRF protège les requêtes qui modifient des données** (`POST`,
`PUT`, `PATCH`, `DELETE` ; `CsrfGuard`, globale). Elle exige deux choses, et
répond 403 sinon :

- l'en-tête `x-etape-csrf: 1`, que `createHttpClient` (`packages/api-client`)
  envoie sur toutes les requêtes. Une page d'un autre site ne peut pas l'ajouter
  sans la permission du serveur, et l'API ne la donne jamais : elle n'active pas
  le CORS ;
- un en-tête `Origin` égal à l'origine du front reconnu par `Host`. Les
  navigateurs l'envoient sur toute requête qui n'est ni GET ni HEAD ; il tient
  encore si le CORS était un jour ouvert par erreur.

Le cookie de session reste en `SameSite=Lax` : le retour de Keycloak sur
`/auth/callback` est une navigation venue d'un autre site, que `Strict`
priverait de son cookie.

**Les cookies** (`etape-front-office.sid`, `etape-back-office.sid`, et leur
transaction de connexion en `.txn`) sont `HttpOnly`, sans `Domain`, donc liés à
l'hôte de leur front. En production, ils portent le préfixe `__Host-Http-` : le
navigateur ne les accepte alors que `Secure`, sur `Path=/`, sans `Domain` et
posés par le serveur — aucun script, aucun sous-domaine ne peut les créer ni les
écraser. Un tel cookie ne s'efface qu'avec les mêmes attributs, `Secure`
compris : `SessionService` pose et efface avec une seule définition.

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

Un realm par front, versionnés dans `keycloak/realms/` (`etape-realm.json` pour
le front-office, `etape-back-office-realm.json` pour le back-office), importés
au démarrage. Deux realms et non deux clients : la session de Keycloak est
commune à tout un realm, et un compte du front-office se retrouverait connecté
au back-office sans rien saisir. Ces fichiers décrivent **l'environnement de
développement uniquement** :
l'import de realm ne substitue aucune variable, ni d'environnement ni de propriété
système, si bien que tout ce qui varie d'un environnement à l'autre doit être
appliqué après coup par `kcadm`. Le détail et les pièges associés sont dans
[keycloak/realms/README.md](../keycloak/realms/README.md).

### Client `etape-api`

- Type **confidentiel** ; `Direct access grants` désactivé — le mot de passe ne
  doit jamais transiter par l'API.
- Un client par realm, donc un par front : `etape` pour le front-office,
  `etape-back-office` pour le back-office.
- `Valid redirect URIs` : `<url du front>/api/auth/callback`, au caractère près.
  Le retour doit se faire sur l'hôte où la connexion a commencé, sans quoi le
  cookie de connexion en attente n'est pas retrouvé.
- PKCE `S256` **exigé** côté client, en plus d'être envoyé par l'API.
- `post.logout.redirect.uris` doit couvrir l'URL du front. Elle n'est pas déduite
  des `redirectUris` : oubliée, la déconnexion échoue alors même que la connexion
  fonctionne.
- `baseUrl` est la destination des liens « retour » que Keycloak pose sur ses
  pages d'information et d'erreur. Sans elle, la page qui clôt une
  réinitialisation de mot de passe n'affiche **aucun bouton**.
- Un **mapper** expose `identity_provider` dans l'`id_token`, ce qui permet à
  l'API de distinguer une identité FranceConnect d'un compte local. Sans lui,
  `isFranceConnectSession` reste toujours `false`, et tous les comptes sont enregistrés
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
`FRANCECONNECT_ENVIRONMENT` permet d'en changer sans toucher au code.

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

| Lien ouvert…                           | Ce que voit la personne                                            |
| -------------------------------------- | ------------------------------------------------------------------ |
| dans le navigateur de la demande       | connectée directement, elle arrive sur son front (voir ci-dessous) |
| ailleurs (téléphone, autre navigateur) | « Compte mis à jour », puis un bouton                              |

Le second cas est le plus courant — on demande depuis un ordinateur et on lit
ses emails sur un téléphone — et c'est celui qui n'avait pas d'issue : la page de
confirmation ne propose de lien que si le client Keycloak porte une `baseUrl`, et
`etape-api` n'en avait pas. Elle vise l'entrée de connexion de l'API plutôt que
la racine du front, `/api/auth/login?returnTo=/` : qui arrive là n'est pas
connecté, et la marche suivante est toujours la même.

Chaque realm renvoie vers son front : le front-office pour `etape`, le
back-office pour `etape-back-office`.

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

## La session dans front-office et back-office

Les deux apps sont entièrement derrière la connexion. La logique partagée vit
dans `@etape/api-client` (clients HTTP et de cache, garde de démarrage
`checkStartupAccess` et son compteur, textes, `useSessionExpired`) et les vues dans
`@etape/ui` (écrans d'attente et d'avis, dialogue). Le branchement, qui les
relie au routeur, vit dans `@etape/session` : la route racine qui porte la garde
(`sessionRootRoute`), l'aiguillage `SessionLayout` et les écrans d'erreur. Un
mécanisme de sécurité n'existe ainsi qu'en un exemplaire, et un correctif ne
peut pas n'atteindre qu'une app. Chaque app n'y ajoute que ses routes, son
routeur — qui reçoit `apiBaseUrl`, lue dans son `.env` — et l'amorçage.

- **Au démarrage**, une garde `beforeLoad` sur la route racine lit
  `/api/auth/session`. Personne n'est connecté : navigation pleine page vers
  `/api/auth/login?returnTo=<page demandée>`, donc vers le formulaire servi par
  Keycloak. L'URL porte un échec du parcours : l'avis s'affiche (`NoticeScreen`),
  sans redirection — sauf un ancien échec de connexion quand la session est
  valide (favori, bouton Précédent) ; l'échec d'une déconnexion s'affiche
  toujours, la limite de débit pouvant l'avoir refusée. L'API ne répond pas
  (délai de 4 s par lecture, deux relances, soit 15 s au plus, même si la
  connexion tombe pendant la vérification) : un écran « service indisponible »,
  relancé par un clic. Ce délai ne vaut que pour les appels de session : un
  délai commun couperait l'envoi d'une pièce justificative sur une connexion
  lente. Une autre erreur, comme une réponse hors contrat, affiche « Une erreur
  inattendue est survenue ».
- **Si le cookie de session n'est pas conservé** (cookies bloqués, cookie
  `Secure` servi en `http`), on reviendrait de la connexion sans session, que
  Keycloak rouvrirait en silence : une boucle, jusqu'à la limite de débit. La
  garde compte donc ses départs vers la connexion en `sessionStorage`
  (`login-attempts.ts`) : au-delà de deux en une minute, elle affiche « Connexion
  impossible », et c'est la personne qui relance. Lire, effacer et incrémenter
  le compteur se fait dans `checkStartupAccess`, testé d'un bloc : l'app n'a
  plus qu'à rediriger.
  Deux et non un : revenir du formulaire par le bouton Précédent ressemble, vu
  du front, à un retour sans session. Un stockage inaccessible — le cas des
  cookies bloqués — affiche l'avis d'emblée. Le compteur s'efface à la
  connexion réussie.
- **En cours d'utilisation**, un 401 efface du cache de TanStack Query tout ce
  qui a été chargé pendant la session et retire l'écran affiché — sur un poste
  partagé, rien ne doit rester lisible derrière le dialogue, et un écran monté
  garde ses données même cache vidé —, vide la session et ouvre le dialogue
  « Session expirée » (`SessionExpiredDialog`). Rien ne le ferme, ni Échap ni un
  clic dehors ; « Se reconnecter » mène au formulaire et ramène sur la page en
  cours, ancre comprise. Si la personne quitte la page, par le bouton Précédent
  par exemple, la garde ne trouve plus de session et la redirige vers le
  formulaire. Plusieurs 401 simultanés n'ouvrent qu'un dialogue. « Se
  reconnecter » est un lien : il quitte l'app.
- **La session prend fin** après une période sans activité ou à sa durée
  maximale, comptée depuis la connexion et que l'activité ne repousse jamais.
  Les deux délais dépendent du front (`SESSION_POLICY_BY_FRONT`, côté API) :
  30 minutes et 10 heures pour le front-office ; 1 heure et 12 heures,
  provisoires, pour le back-office, dont les délais ne sont pas encore
  arbitrés. Aucune app ne les écrit en dur : `GET /api/auth/session` renvoie la
  règle et le temps restant avant chaque fin (`expiry`), en durées plutôt
  qu'en dates, pour ne pas dépendre de l'horloge du poste.
  - **Est une activité** : toute requête authentifiée (`SessionGuard`), et,
    côté front, un mouvement du pointeur, une touche, un défilement, un retour
    en arrière ou l'affichage d'une page, signalés par
    `POST /api/auth/session/refresh` au plus une fois par minute — l'API
    n'écrit pas plus souvent. La lecture de session n'en est pas une : le front
    relit l'échéance sans la repousser.
  - **Deux minutes avant la fin**, le front relit l'échéance — un autre onglet a
    pu la prolonger —, puis avertit. Avant la fin d'inactivité : « Êtes-vous
    toujours là ? » et un seul bouton, « Oui », qui prolonge ; pendant ce
    dialogue, bouger la souris ne compte pas, seul « Oui » prolonge (WCAG
    2.2.1). Avant la durée maximale, que rien ne repousse : « Votre session se
    termine bientôt » et « Se reconnecter », qui ouvre une session neuve.
  - **Sans réponse**, le front relit encore l'échéance et, la session finie,
    l'expire comme sur un 401 : dialogue « Session expirée », avec la cause
    quand elle est connue (« Votre session a expiré après 30 minutes
    d'inactivité », « … a atteint sa durée maximale de 10 heures »). Une fin
    sans cause plausible — déconnexion dans un autre onglet — garde le message
    générique.
  - Le minuteur est relu au retour sur l'onglet : le navigateur le ralentit en
    arrière-plan et le suspend en veille. Dans tous les cas, c'est l'API qui
    refuse une session finie.
  - Le realm de chaque front reprend les mêmes délais (`ssoSessionIdleTimeout`,
    `ssoSessionMaxLifespan`, réappliqués par `deploy/keycloak-init.sh`) :
    Keycloak ne voit pas l'activité dans l'app, et sa propre session finit
    souvent avant celle de l'app. Se reconnecter redemande alors le mot de
    passe, ce que veut la durée maximale.
- **Une région `role="status"`**, montée une fois au-dessus du routeur
  (`SessionApp`), annonce l'attente au démarrage, les avis et la prolongation
  par « Oui ». Les dialogues n'y passent pas : le focus déplacé dans
  l'`alertdialog` les annonce déjà.
- **Une erreur dans un écran** affiche « Une erreur inattendue est survenue » à
  sa place, sous `SessionLayout` : le dialogue « Session expirée » reste
  disponible. Une adresse inconnue affiche « Page introuvable ».

`PublicSession` porte un `claims` non typé, et `identity-claims.ts` en retire la
plomberie du protocole — `iss`, `aud`, `at_hash` et consorts — en liste noire
plutôt qu'en liste blanche : les champs que renvoie FranceConnect varient selon
le fournisseur d'identité choisi, et c'est leur nom technique qui sert à
discuter avec le portail partenaires quand l'un d'eux manque.

**L'API reconnaît le front à l'en-tête `Host`**, comparé à la liste fermée des
fronts configurés (`auth/front.ts`) ; un hôte inconnu reçoit 421, sans
redirection. C'est de là qu'elle tire le realm, la `redirect_uri` et l'adresse
de retour après connexion, déconnexion ou échec — jamais de l'en-tête lui-même.
`X-Forwarded-Host` n'est pas lu : `req.host` le préférerait dès que
`trust proxy` est actif, en gardant la valeur la plus à gauche, celle du client.
En local, le proxy de Vite doit donc garder `Host` intact (forme objet, sans
`changeOrigin`).

## Développement local

```bash
# Le thème d'abord : `keycloak-providers` recopie le JAR qu'il produit. Sans
# lui Keycloak démarre quand même, mais avec ses écrans par défaut.
npm run build -- --filter=@etape/keycloak-theme

# Les `.env` — à la racine, et dans apps/api, apps/front-office et
# apps/back-office — se récupèrent dans le coffre-fort de l'équipe. Les
# `.env.example` versionnés n'en donnent que la liste des variables, sans valeur.

# La base applicative, Keycloak et la sienne, configurés depuis le `.env` à la
# racine. Identifiants FranceConnect et clé SMTP sont facultatifs : sans eux tout
# fonctionne, seuls le parcours FranceConnect et les emails (inscription,
# « mot de passe oublié ») restent indisponibles.
docker compose up -d

# Crée les tables de la base applicative. À rejouer après chaque migration.
npm run db:migrate --workspace=@etape/api

npm run dev            # site, simulateur, front-office, back-office et API
npm run test           # tests de l'API, du thème, d'ui et d'api-client (Vitest)
```

Après modification du thème, `npm run build -- --filter=@etape/keycloak-theme`
puis `docker compose up -d keycloak-providers && docker compose restart keycloak` :
c'est `keycloak-providers` qui recopie le JAR dans le volume d'extensions, un
simple redémarrage de Keycloak servirait l'ancien.

| Service           | Adresse               | Accès                                              |
| ----------------- | --------------------- | -------------------------------------------------- |
| Front-office      | http://localhost:5173 | la connexion est demandée à l'ouverture            |
| Back-office       | http://localhost:5174 | idem, realm `etape-back-office`                    |
| Console Keycloak  | http://localhost:8080 | `admin` / `admin`                                  |
| Compte applicatif | —                     | `test@etape.local` / `KEYCLOAK_TEST_USER_PASSWORD` |
| Base applicative  | localhost:5432        | `etape` / `etape`, base `etape`                    |

L'API écoute sur `localhost:3002`, mais n'y répond qu'aux noms d'hôte des
fronts : ouverte directement, elle renvoie 421. Pour l'appeler à la main, passer
par un front (`http://localhost:5173/api/…`) ou envoyer son en-tête :
`curl -H 'Host: localhost:5173' http://localhost:3002/api/auth/session`.

Aucun mot de passe n'est versionné : le compte applicatif n'est créé que si
`KEYCLOAK_TEST_USER_PASSWORD` est renseigné, dans le `.env` à la racine ou dans
le shell, avant `docker compose up`.

Aucun secret de client n'est versionné non plus : le fichier de realm n'en porte
pas, et Keycloak en tire un au sort à l'import. `keycloak-init` le remplace
ensuite par celui du `.env` à la racine (`FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET`,
`BACK_OFFICE_KEYCLOAK_CLIENT_SECRET`), qui doit être le même que dans
`apps/api/.env`. Les autres environnements reçoivent le leur par `kcadm`.

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
- [ ] Page de connexion du front-office : le bouton FranceConnect, conforme au
      kit, vers `/api/auth/login?idp=franceconnect`, et « Se connecter » vers
      `/api/auth/login`. Le back-office n'utilise pas FranceConnect
- [x] Une origine par front : chaque front relaie `/api` sur son sous-domaine,
      l'API le reconnaît à l'en-tête `Host` (421 sinon) ; un realm Keycloak par
      front, le back-office sans FranceConnect ni inscription ; sessions et
      comptes rattachés à leur front et à leur realm ; garde CSRF (en-tête
      `x-etape-csrf` et `Origin`) ; cookies `__Host-Http-` en production ;
      `frame-ancestors 'none'` ; garde contre les boucles de redirection
- [ ] Déclarer chez l'hébergeur les domaines du front-office et du
      back-office, sur le service `web` (voir [deploiement.md](deploiement.md)),
      et jouer la connexion de bout en bout en recette
- [ ] Comptes du back-office : décrire leur création par un administrateur
      (`kcadm` dans le realm `etape-back-office`, l'inscription y étant fermée),
      puis rattacher chaque compte à son rôle métier (instructeur, conseiller)
      avant le premier écran du back-office qui affiche des données. Le realm
      séparé ferme la porte aux bénéficiaires ; les rôles régleront les droits
      au sein du back-office
- [x] Session inactive : fin après une période sans activité et à une durée
      maximale, par front ; avertissement deux minutes avant (« Oui » ou « Se
      reconnecter ») ; cause de la fin dans le dialogue ; délai réservé aux
      appels de session et attente au démarrage ramenée à 15 s ; région
      `role="status"` commune ; « Se reconnecter » en lien
- [ ] Arbitrer les délais de session du back-office (1 h d'inactivité et 12 h
      au plus, provisoires) : `SESSION_POLICY_BY_FRONT` dans l'API et
      `deploy/keycloak-init.sh` pour le realm
- [ ] Écrans d'avis : un titre d'onglet qui suit l'avis (RGAA 8.6), et
      « Réessayer » ou « Se connecter » en liens plutôt qu'en boutons. Avec le
      bouton de déconnexion : après une déconnexion refusée par la limite de
      débit, proposer de la relancer plutôt que « Se connecter »
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
