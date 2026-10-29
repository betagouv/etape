# Extension Keycloak « mot de passe oublié »

Remplace l'étape native « Send Reset Email » du flow `etape-reset-credentials`
pour suivre les écrans 08 et 09 des maquettes (ticket 192). Le contexte est dans
[docs/authentification.md](../../../docs/authentification.md#mot-de-passe-oublié).

## Construire et tester

```bash
mvn -f keycloak/extensions/reset-credentials/pom.xml package
```

Compile, lance les tests JUnit et produit
`target/etape-keycloak-reset-credentials.jar`. Java 21 et Maven sont
nécessaires, comme pour l'extension ALTCHA. Le `Dockerfile` la construit dans
sa propre étape Alpine, tests compris.

## Ce qu'elle déclare

| Fournisseur                    | SPI             | Remplace                 |
| ------------------------------ | --------------- | ------------------------ |
| `etape-reset-credential-email` | `authenticator` | `reset-credential-email` |

Elle hérite de `ResetCredentialEmail`, une classe interne de Keycloak : elle est
à retester à chaque montée de version. Le retour par le lien (écran 10) et
l'option `force-login` restent ceux de Keycloak.

## Ce qui change par rapport à Keycloak

Keycloak envoie le lien, puis revient à la page de connexion avec « Si un compte
existe… » et oublie l'adresse saisie. L'extension, elle :

- **reste sur la page « e-mail envoyé »**, rendue par `login-reset-password.ftl`
  avec l'attribut `etapeResetLinkSent`. Le thème y lit aussi
  `etapeResetLinkLifespanMinutes`, `etapeResendDelaySeconds` et
  `etapeResetLinkResent` ;
- **renvoie le lien** sur le champ `resend`, deux minutes au moins après la
  demande précédente, et **révoque le lien précédent** (`revokedTokens`) ;
- **ramène à la saisie de l'adresse** sur le champ `edit-email`, adresse
  préremplie ;
- **n'envoie rien** à une adresse inconnue, à un compte désactivé ou sans
  adresse, ni à un compte FranceConnect sans mot de passe.

## Ne rien révéler de l'existence d'un compte

La page est la même pour toutes les adresses, compte à rebours compris : il
part de la demande faite dans la session, pas du dernier envoi au compte. Le
compte est détaché de la session avant l'affichage, sans quoi le contexte de la
page (`auth.showUsername`) différerait selon que l'adresse existe ou non. Le
lien l'y rattache.

Deux minutes séparent aussi deux envois à un même compte, toutes sessions
confondues (`singleUseObjects`) : ouvrir dix onglets n'envoie pas dix e-mails.
Le refus est journalisé (`slow_down`) sans rien changer à la page.
