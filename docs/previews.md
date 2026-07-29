# Les previews

Une « preview » est une version du produit déposée sur une adresse web temporaire,
pour la faire relire et tester avant qu'elle n'existe pour de vrai.

**Ce dispositif est temporaire**, le temps que l'environnement Cegedim soit disponible.
Il sera remplacé à ce moment-là.

---

## Pour l'équipe produit

### Où trouver le lien

Le lien est déposé sur le ticket Notion correspondant, par le dev qui a réalisé le travail.

Chaque preview a **sa propre adresse**, de la forme
`https://etape-preview-xxxxx-uppertech-projects.vercel.app`. Elle est figée : elle montrera
toujours l'état déposé ce jour-là, même si le travail continue ensuite. Plusieurs previews
peuvent donc coexister, une par ticket — il faut prendre le lien du ticket qu'on relit, et non
un lien retrouvé ailleurs.

### Ce qu'il faut savoir avant de tester

- **Rien n'est conservé.** Les réponses saisies dans le simulateur ne sont enregistrées nulle
  part et disparaissent à la fermeture de l'onglet.
- **Les résultats ne sont pas fiables.** Le produit est en cours de construction : un résultat
  d'éligibilité affiché sur une preview n'a aucune valeur et ne doit jamais être communiqué à
  une personne réelle.
- **Ne pas diffuser les liens hors de l'équipe.** Les adresses sont publiques : n'importe qui
  disposant du lien peut y accéder. Rien dans l'interface n'indique qu'il s'agit d'une version
  de test, donc un visiteur de passage pourrait prendre ce qu'il lit pour argent comptant. Les
  moteurs de recherche sont bloqués, mais cela ne protège pas d'un lien transmis à la main.

### Ce qu'on peut y tester

Le site et le simulateur, aux mêmes adresses qu'en production : la page d'accueil sur `/`,
le simulateur sur `/simulateur/`. Le bouton « C'est parti ! » de l'accueil mène au simulateur.

---

## Pour l'équipe technique

### Lancer une preview

```bash
npm run preview
```

La commande construit les deux apps, assemble leurs exports, puis déploie. L'URL affichée en
fin d'exécution est celle à coller sur le ticket Notion :

```
Preview   https://etape-preview-xxxxx-uppertech-projects.vercel.app
```

Le déploiement se fait en `--target=preview` : chaque exécution produit une URL **distincte et
figée**, sans écraser les previews des autres. Plusieurs relectures peuvent donc être en cours
en parallèle, une par ticket.

### ⚠️ Prérequis : Deployment Protection doit être désactivée

Par défaut, Vercel protège toutes les URL générées par **Vercel Authentication** : une requête
anonyme est redirigée vers un écran de connexion Vercel.

**Le piège :** un dev qui teste son propre lien le verra fonctionner, parce que son navigateur
porte le cookie Vercel. Le lien collé sur Notion sera pourtant inutilisable pour toute personne
n'appartenant pas au scope Vercel — la PO en particulier.

Le réglage se trouve dans Project Settings → Deployment Protection → Vercel Authentication.
Pour vérifier depuis n'importe quelle machine, sans cookie :

```bash
curl -sI <url-de-la-preview>/ | head -1
# 200 → accessible ; 302 vers vercel.com/sso-api → protection encore active
```

### Lier son clone

Le projet `etape-preview` vit actuellement dans le scope Vercel `uppertech-projects`.

```bash
vercel login
vercel link
```

Un dev qui a accès à ce scope lie son clone au projet existant : les previews de toute l'équipe
s'y accumulent, chacune avec son URL. Sinon, `vercel link` permet de créer son **propre** projet,
qu'il faudra alors configurer de la même façon (Deployment Protection désactivée).

`vercel link` crée un dossier `.vercel/` à la racine. Il est ignoré par git — ne jamais le
committer : `project.json` contient l'`orgId` et le `projectId`.

Le CLI est déclaré en `devDependencies` : un `npm install` suffit, pas d'installation globale
nécessaire.

### Comment ça marche

Le déploiement est en **mode `--prebuilt`** : Vercel ne voit ni le repo ni le code. Il reçoit
uniquement le contenu de `.vercel/output/`, construit en local. Trois conséquences :

1. **Aucun `vercel.json` n'est lu.** Les règles de routage sont écrites dans
   `.vercel/output/config.json`, généré par `scripts/vercel-out.mjs`. Ne pas créer de
   `vercel.json` : il serait ignoré, et donc trompeur.
2. **Les réglages de build du dashboard Vercel** (build command, output directory) ne sont
   jamais exécutés.
3. **Les variables d'environnement du dashboard ne s'appliquent pas.** Tout ce dont le front a
   besoin doit être présent au moment du build local.

> ⚠️ **Ne jamais lancer `vercel deploy` sans `--prebuilt`.** Vercel tenterait un build à la
> racine du monorepo avec ses réglages par défaut (`Output Directory: public`) et produirait un
> résultat faux — sans nécessairement échouer, ce qui est le pire des cas.

### La chaîne de build

Les deux apps sont déployées **ensemble, sur une seule origine**, avec le découpage de chemins
de la production. C'est volontaire : cela valide dès maintenant le contrat de préfixe qui devra
fonctionner derrière le reverse proxy nginx.

| Étape                                                     | Effet                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| `turbo run build`                                         | `apps/site/out/` et `apps/simulateur/out/` (exports statiques Next)        |
| `node scripts/vercel-out.mjs`                             | assemble les deux dans `.vercel/output/static/`, écrit `config.json`       |
| `vercel deploy --prebuilt --archive=tgz --target=preview` | envoie `.vercel/output/` (`--archive` évite un upload fichier par fichier) |

Le simulateur est construit avec `basePath: "/simulateur"` (`apps/simulateur/next.config.ts`),
ce qui préfixe ses routes et ses assets. Son export reste écrit à plat dans `out/` : c'est le
script d'assemblage qui le place sous `static/simulateur/`.

`basePath` ne s'applique pas au `src` de `next/image` : les fichiers de `apps/simulateur/public/`
doivent être préfixés à la main, via `process.env.NEXT_PUBLIC_BASE_PATH`. **Une image cassée sur
la preview est presque toujours ce préfixe oublié.**

Les deux apps ont `trailingSlash: true` et doivent le garder alignées : la résolution des URL
diffèrerait sinon de part et d'autre de `/simulateur/`.

### Vérifier une preview

À lancer sur l'URL affichée par `npm run preview`, **avant** de la coller sur le ticket. Un `302`
sur la première ligne signale que Deployment Protection est encore active et que la PO ne pourra
pas ouvrir le lien.

```bash
U=<url-de-la-preview>
curl -sI $U/                                   # 200 + x-robots-tag: noindex, nofollow
curl -sI $U/simulateur                         # 308 vers /simulateur/
curl -s  $U/robots.txt                         # Disallow: /
curl -so /dev/null -w '%{http_code}\n' $U/simulateur/nimporte-quoi   # 404
```

Puis, dans le navigateur : `/` affiche le site, son CTA mène au simulateur, `/simulateur/`
affiche les deux logos, un F5 ne casse pas, et la console ne montre aucune 404 (une 404 sur
`/_next/...` signe un `basePath` mal réglé).

Pour tester l'assemblage sans déployer :

```bash
npx turbo run build && node scripts/vercel-out.mjs
npx serve .vercel/output/static
```

### Pas de CI

Le déploiement est déclenché à la main, il n'y a rien dans `.github/workflows/`. C'est un choix
assumé : la chaîne de build ci-dessus sera identique le jour où elle sera déplacée dans GitHub
Actions.

### TODO au passage en production

- [ ] Supprimer `apps/site/public/robots.txt` (il bloque toute indexation).
- [ ] Retirer le script `preview` et `scripts/vercel-out.mjs` une fois l'environnement Cegedim
      en place.
