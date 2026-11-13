# Configuration des VM par Ansible

Les playbooks de ce dossier décrivent le **socle** de chaque VM Cegedim, en dev (DEBFCO\*) et
en Recette (REBFCO\*, livrée le 16/10) : paquets, comptes, clés, nginx (et la basic auth des
previews en dev), Docker et le registre. Ils remplacent les installations à la main : une
machine se configure en un clic, à l'identique, autant de fois que nécessaire (les tâches
décrivent un état voulu et se rejouent sans risque, y compris sur une machine déjà configurée
à la main).

Le déploiement des applications, lui, reste le rôle des workflows de CI (`preview.yml`,
`deploy-dev.yml`, et le déploiement de la Recette) : Ansible prépare la machine, la CI y livre
les versions.

| Fichier                  | Rôle                                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inventaire.ini`         | La liste des machines, par groupe (`front`, `back` en dev ; `front_recette`, `back_recette` en Recette)                                                                                              |
| `group_vars/all.yml`     | Variables communes : la clé du runner, lue sur la machine opérationnelle                                                                                                                             |
| `taches/cle-runner.yml`  | Gestes communs : autoriser la clé du runner pour `deploy`                                                                                                                                            |
| `front.yml`              | Socle de DEBFCOETAPFRT01 : nginx + previews de PR + environnement dev + basic auth (miroir de `docs/infra/installation-previews.md`)                                                                 |
| `front-recette.yml`      | Socle de REBFCOETAPFRT01 : nginx servant la Recette depuis `/srv/etape-recette` (ni previews ni basic auth)                                                                                          |
| `back.yml`               | Socle des VM back, dans les deux environnements : Docker + Compose + login Harbor (préparatoire, back NestJS à venir). Vise DEBFCOETAPAPP01 par défaut, REBFCOETAPAPP01 avec `-e cible=back_recette` |
| `../nginx/previews.conf` | La configuration nginx déployée par `front.yml` (une seule source)                                                                                                                                   |
| `../nginx/recette.conf`  | La configuration nginx déployée par `front-recette.yml` (une seule source)                                                                                                                           |

**REBFCOETAPKC01 (Keycloak de Recette) n'a pas de playbook, et n'est pas inventoriée** : son
socle (installation, mises à jour) est exploité par Cegedim. Notre périmètre se limite aux
realms, configurés via la console d'administration ; plus tard, un export de realm versionné
dans le dépôt.

## Comment lancer

**Voie normale : le workflow « Setup VM »** (`.github/workflows/setup-vm.yml`), onglet
Actions → Setup VM → « Run workflow » → choisir la machine (`front`, `back`, `front-recette`,
`back-recette`), saisir le mot de passe d'exécution. Le job tourne sur le runner d'OPS01, qui
a l'accès SSH aux machines. Le bouton n'apparaît que lorsque le workflow existe sur la branche
principale.

**Voie manuelle (dépannage)** : depuis OPS01, sous le compte `github-runner`, avec le dépôt
cloné :

```bash
export PREVIEW_BASIC_AUTH_PASSWORD='le mot de passe partagé'   # front, premier passage
ansible-playbook -i infra/ansible/inventaire.ini infra/ansible/front.yml
```

Pour la Recette (aucun mot de passe de basic auth : le site est interne) :

```bash
ansible-playbook -i infra/ansible/inventaire.ini infra/ansible/front-recette.yml
ansible-playbook -i infra/ansible/inventaire.ini infra/ansible/back.yml -e cible=back_recette
```

Le compte `github-runner` importe : c'est lui qui détient la paire de clés SSH du runner, et
`group_vars/all.yml` lit la clé publique dans son `$HOME/.ssh/id_ed25519.pub`. Depuis un autre
compte, passer la clé explicitement : `-e "cle_runner='ssh-ed25519 AAAA… github-runner@…'"`.

## Prérequis (une fois par machine cible)

Les playbooks se connectent avec le compte de service **`deploy`**, créé par Cegedim avec
sudo et la clé du runner (point du 2/09). À vérifier sur chaque cible avant le premier
lancement, depuis OPS01 sous le compte `github-runner` :

```bash
ssh deploy@debfcoetapfrt01.fco.cegedim.cloud 'sudo -n true && echo "sudo OK sans mot de passe"'
```

Même test pour la Recette, sur `deploy@rebfcoetapfrt01.fco.cegedim.cloud` et
`deploy@rebfcoetapapp01.fco.cegedim.cloud` (vérifié depuis OPS01 à la livraison : sudo sans
mot de passe sur les deux machines).

Si la commande demande un mot de passe, faire passer le sudo de `deploy` en `NOPASSWD`
(fichier sous `/etc/sudoers.d/`), sinon l'automatisation ne peut pas fonctionner.

C'est la « convention de livraison » à acter avec Cegedim : toute nouvelle VM ETAPE arrive
avec ce compte en place (clé du runner + sudo NOPASSWD), et sa configuration devient un clic.

Note de durcissement pour plus tard : `deploy` cumule aujourd'hui le dépôt des previews (CI)
et l'administration (Ansible, sudo). Quand le montage sera stabilisé, on pourra séparer les
deux rôles ou restreindre le sudo à ce que les playbooks utilisent.

## Ce que garantit un rejeu

- **La clé du runner n'est jamais écrite en dur** : elle est lue sur OPS01 à l'exécution et
  _ajoutée_ à l'`authorized_keys` de `deploy` si elle manque, sans toucher aux autres lignes.
  Une clé régénérée (`docs/infra/reprise-cle-runner.md`) est prise en compte au rejeu suivant ;
  un rejeu ne peut pas verrouiller un accès existant.
- **La basic auth des previews survit au rejeu** : le htpasswd est écrit depuis le secret, hors
  git, et n'est réécrit que si le mot de passe a changé. Sans secret et sans htpasswd déjà en
  place, le playbook s'arrête avant de toucher nginx (jamais de preview sans mot de passe : le
  443 public est ouvert).
- **Une conf nginx cassée arrête le playbook** (`nginx -t` avant le reload) au lieu de laisser
  l'ancienne conf en service avec un run vert.

## Secrets et sécurité

- `PREVIEW_BASIC_AUTH_PASSWORD` (Settings → Secrets and variables → Actions) : mot de passe
  partagé des previews (utilisateur `etape`). Utilisé par `front.yml` pour écrire
  `/etc/nginx/previews.htpasswd` (bcrypt), tâche masquée (`no_log`). Obligatoire au premier
  passage ; au rejeu, un secret vide laisse le htpasswd existant tel quel.
- `HARBOR_ROBOT_LOGIN` (onglet **Variables**, pas Secrets : la valeur n'est pas secrète) : nom
  du compte robot Harbor, `robot$betagouvetape` (registre `fco.repo.cegedim.cloud/etape/`,
  coordonnées confirmées par Cegedim le 7/09). Le login contient un `$` : il passe par une
  variable d'environnement, jamais interpolé dans une ligne de commande bash.
- `HARBOR_ROBOT_PASSWORD` (onglet Secrets) : mot de passe de ce compte. Utilisé par `back.yml`
  pour authentifier APP01 au registre ; jamais écrit dans les playbooks, transmis à l'exécution
  par le workflow, tâche masquée (`no_log`). Secret absent = la tâche est sautée ; secret
  présent sans la variable de login = arrêt explicite.
- `SETUP_VM_PASSWORD` (idem) : mot de passe demandé par le formulaire du workflow. **Limite à
  connaître** : la valeur saisie au déclenchement est visible dans les métadonnées du run
  (dépôt public) ; ce mot de passe est donc un garde-fou contre les lancements accidentels,
  pas un secret fort. Ne le réutiliser nulle part, le changer de temps en temps. Pour un
  contrôle fort (prod), préférer un environnement GitHub avec approbation obligatoire
  (Settings → Environments → Required reviewers).
- Seules les personnes ayant l'accès en écriture au dépôt voient le bouton « Run workflow ».

## Ce qui reste à la main après `front.yml` et `front-recette.yml`

Rien côté VM. Deux réglages des confs nginx (`../nginx/previews.conf` et
`../nginx/recette.conf`) attendent une information de Cegedim et se font par commit puis
rejeu :

1. `set_real_ip_from` : l'IP du BigIP, pour avoir l'IP réelle des visiteurs dans les logs.
2. La redirection vers HTTPS des accès en clair qui ne viennent pas du proxy : décommenter
   `"" 1;` dans le `map` une fois confirmé que le BigIP pose `X-Forwarded-Proto`.
