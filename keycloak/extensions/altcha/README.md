# Extension Keycloak ALTCHA

Exige une preuve de travail [ALTCHA](https://altcha.org) à l'inscription et au
« mot de passe oublié ». Le contexte et les choix sont dans
[docs/authentification.md](../../../docs/authentification.md#protection-contre-les-robots--altcha).

## Construire et tester

```bash
mvn -f keycloak/extensions/altcha/pom.xml package
```

Compile, lance les tests JUnit et produit `target/etape-keycloak-altcha.jar`,
qui embarque la bibliothèque [`org.altcha:altcha`](https://github.com/altcha-org/altcha-lib-java)
et `org.json` (relocalisé). Java 21 et Maven sont nécessaires, comme pour le JAR
du thème. Le `Dockerfile` construit l'extension dans une étape Alpine, tests
compris.

## Ce qu'elle déclare

| Fournisseur                      | SPI             | Rôle                                                                                             |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `etape-altcha-registration`      | `form-action`   | Pose le défi sur `register.ftl`, vérifie la solution avant création du compte                    |
| `etape-altcha-reset-credentials` | `authenticator` | Remplace « Choose User » : défi sur `login-reset-password.ftl`, vérifié avant l'envoi de l'email |

Le défi arrive dans la page sous l'attribut `altchaChallenge`, ou
`altchaUnavailable` s'il n'a pas pu être créé, et la solution revient dans le
champ `altcha`. Les messages d'erreur `etapeAltchaRequired` et
`etapeAltchaFailed` sont traduits dans le thème.

Keycloak signale au démarrage que ces deux SPI sont internes
(`KC-SERVICES0047`) : l'extension est à retester à chaque montée de version.
L'étape du « mot de passe oublié » hérite en plus de
`ResetCredentialChooseUser`, une classe interne de Keycloak.

## Réglages

Sans configuration, un défi demande entre 2 000 et 4 000 essais de 2 000
itérations PBKDF2, soit 0,3 à 0,5 s sur un ordinateur récent. Pour en changer,
sans redéploiement, poser une configuration sur l'exécution concernée :

```bash
kcadm.sh create "authentication/executions/<id de l'exécution>/config" -r etape \
  -s alias=altcha-inscription \
  -s config.cost=2000 -s config.counterMin=2000 -s config.counterMax=4000
```

| Clé          | Effet                                                      |
| ------------ | ---------------------------------------------------------- |
| `cost`       | Itérations PBKDF2 par essai                                |
| `counterMin` | Nombre minimal d'essais imposé au navigateur               |
| `counterMax` | Nombre maximal ; le serveur tire une valeur entre les deux |

Le temps de résolution suit le produit `cost × compteur`. Le mesurer sur un
téléphone d'entrée de gamme avant de durcir : c'est lui qui fixe la limite, pas
l'ordinateur de développement.

Un réglage illisible (`4 000`, valeur négative, minimum au-dessus du maximum)
est ignoré : les valeurs par défaut s'appliquent, et Keycloak écrit
`Invalid ALTCHA settings` dans ses journaux. Keycloak ne propose pas de valider
la configuration d'une étape au moment où on la saisit.

## Trois points à connaître

- **Le mode est déterministe, avec signature de clé.** Le serveur connaît
  d'avance la clé que trouvera le navigateur et n'en vérifie que la signature :
  13 µs par vérification, quel que soit le réglage. C'est la clé dérivée qui
  prouve le travail, pas le compteur.
- **Les identifiants de fournisseur tiennent en 36 caractères**, taille de la
  colonne `authenticator` en base. Au-delà, la création de l'exécution échoue en
  « Database operation failed ».
- **Aucun secret à fournir.** Les secrets de signature sont dérivés par HMAC de
  la clé HS512 active du realm, dont l'identifiant voyage dans le défi : après
  une rotation, les défis en cours restent valables tant que l'ancienne clé
  n'est ni supprimée ni désactivée.
