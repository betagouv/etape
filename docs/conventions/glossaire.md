# Glossaire métier — ETAPE

Référentiel des noms métier du projet. Règles d'usage : `docs/conventions/nommage.md`.

- Tout nom métier employé dans un identifiant doit figurer ici. Un terme absent déclenche un ajout ou un renommage — jamais un nouveau synonyme.
- La colonne **Identifiant** donne la forme snake_case de référence ; la casse s'adapte au contexte (`VoletCep`, `voletCep`, `VOLET_CEP`).
- Aucune définition n'est devinée : `à compléter` signifie qu'elle n'a pas pu être sourcée. La colonne **Source** cite un texte, un document officiel ou le fichier du code où la définition figure.
- Les synonymes encore présents dans le code sont listés dans `docs/conventions/audit-nommage.md` : ils ne sont pas des alternatives admises.

## Domaine ETAPE (demande d'attestation)

| Terme métier           | Identifiant           | Définition                                                                               | Source                                                                                               |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Dossier                | `dossier`             | Demande déposée par un bénéficiaire auprès d'une Transitions Pro                         | —                                                                                                    |
| Bénéficiaire           | `beneficiaire`        | Salarié déposant une demande, identifié via FranceConnect                                | —                                                                                                    |
| Volet CEP              | `volet_cep`           | Partie du formulaire officiel cosignée par le conseiller en évolution professionnelle    | formulaire officiel                                                                                  |
| Opérateur CEP          | `operateur_cep`       | Structure délivrant le CEP (Avenir Actifs, APEC, Cap emploi)                             | France compétences                                                                                   |
| Conseiller             | `conseiller`          | Personne physique du CEP ayant accompagné et cosigné                                     | —                                                                                                    |
| Instructeur            | `instructeur`         | Agent Transitions Pro traitant le dossier                                                | —                                                                                                    |
| Commission             | `commission`          | Instance CPIR examinant le caractère réel et sérieux                                     | art. R5422-2-1                                                                                       |
| Dispositif             | `dispositif`          | Dispositif de transition (DD, PTP, …)                                                    | —                                                                                                    |
| Démission-reconversion | `dd`                  | Dispositif objet du MVP. Condition relevée dans le simulateur : 5 ans d'activité, en CDI | `apps/simulateur/src/resultats/domain/catalogue.ts` (id actuel `demission-reconversion`, voir audit) |
| Pièce justificative    | `piece_justificative` | Document déposé à l'appui du dossier                                                     | —                                                                                                    |
| Simulateur             | `simulateur`          | Parcours public d'orientation, sans compte                                               | —                                                                                                    |

## Territoire et interlocuteurs

| Terme métier         | Identifiant        | Définition                                                                                                                                                                               | Source                                                                                          |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Région               | `region`           | Région administrative identifiée par son code INSEE ; 18 valeurs (13 en métropole, 5 en outre-mer). Pour les liens, le simulateur retient la région de travail, sinon celle de résidence | `apps/simulateur/src/questionnaire/domain/regions.ts`                                           |
| Transitions Pro      | `transitions_pro`  | Association régionale (une par région, 18 au total) qui instruit et finance les projets de transition professionnelle du territoire                                                      | `apps/simulateur/src/resultats/domain/transitions-pro.ts`, transitionspro.fr/contacts-en-region |
| Conseil régional     | `conseil_regional` | Collectivité régionale qui finance une offre de formation (programme régional de formation)                                                                                              | `apps/simulateur/src/resultats/domain/conseil-regional.ts`                                      |
| Outre-mer            | `outre_mer`        | Régions d'outre-mer groupées à part dans la liste ; les collectivités d'outre-mer sont exclues sur décision produit                                                                      | `apps/simulateur/src/questionnaire/domain/regions.ts`                                           |
| Métropole            | `metropole`        | à compléter                                                                                                                                                                              | —                                                                                               |
| Employeur            | `employeur`        | Employeur de la personne ; concerne les situations salarié et agent public                                                                                                               | `apps/simulateur/src/questionnaire/domain/questions.ts`                                         |
| CPIR                 | `cpir`             | à compléter (développement du sigle non sourcé dans le dépôt)                                                                                                                            | —                                                                                               |
| Commission paritaire | à compléter        | à compléter (terme présent seulement dans un libellé du site)                                                                                                                            | `apps/site/src/lib/footer.ts`                                                                   |

## Situation de la personne (simulateur)

| Terme métier                    | Identifiant        | Définition                                                                                                                    | Source                                                  |
| ------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Situation professionnelle       | `situation`        | Situation actuelle déclarée à la question 3 ; 5 valeurs : salarié, demandeur d'emploi, agent public, indépendant, sans emploi | `apps/simulateur/src/questionnaire/domain/questions.ts` |
| Salarié                         | `salarie`          | Salarié·e du secteur privé                                                                                                    | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Demandeur d'emploi              | `demandeur_emploi` | Demandeur·euse d'emploi inscrit·e à France Travail                                                                            | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Agent public                    | `agent_public`     | Agent·e de la fonction publique                                                                                               | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Indépendant                     | `independant`      | Auto-entrepreneur·euse ou chef·fe d'entreprise                                                                                | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Sans emploi                     | `sans_emploi`      | Sans emploi, non inscrit·e à France Travail                                                                                   | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| En activité                     | `en_activite`      | Salarié·e, agent·e ou indépendant·e                                                                                           | `apps/simulateur/src/questionnaire/domain/questions.ts` |
| Type de contrat                 | `contrat`          | Contrat du salarié : CDI, CDD, intérim, intermittent du spectacle                                                             | `apps/simulateur/src/questionnaire/domain/questions.ts` |
| CDI                             | `cdi`              | à compléter (sigle non développé dans le dépôt)                                                                               | —                                                       |
| CDD                             | `cdd`              | à compléter (sigle non développé dans le dépôt)                                                                               | —                                                       |
| Intérim                         | `interim`          | Salarié·e en intérim                                                                                                          | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Intermittent du spectacle       | `intermittent`     | à compléter                                                                                                                   | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Cadre                           | `cadre`            | Statut cadre, posé aux seuls CDI et CDD ; sans effet sur les résultats                                                        | `flags.ts`, `catalogue.ts` (simulateur)                 |
| Versant de la fonction publique | `versant`          | État, territoriale ou hospitalière ; définition du terme à compléter                                                          | `apps/simulateur/src/questionnaire/domain/questions.ts` |
| Arrêt de travail                | `arret_travail`    | En arrêt de travail (maladie, accident du travail ou invalidité)                                                              | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| RQTH                            | `rqth`             | Reconnaissance de travailleur handicapé ; « refus » (choix de ne pas répondre) est distinct de « non »                        | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Obligation d'emploi             | à compléter        | à compléter (seulement citée en commentaire)                                                                                  | `apps/simulateur/src/questionnaire/domain/flags.ts`     |
| Poste menacé                    | `poste_menace`     | Motif « mon poste est menacé ou mon entreprise est en difficulté »                                                            | `apps/simulateur/src/resultats/domain/catalogue.ts`     |

## Parcours du simulateur

| Terme métier                   | Identifiant             | Définition                                                                                                                       | Source                                              |
| ------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Questionnaire                  | `questionnaire`         | Suite de questions conditionnelles du simulateur                                                                                 | `apps/simulateur/src/questionnaire/domain/flow.ts`  |
| Origine de la demande          | `origine`               | Motif déclaré en question 1 : envie d'un nouveau départ, santé, poste menacé, ne trouve pas d'emploi, autre origine              | `apps/simulateur/src/questionnaire/domain/flags.ts` |
| Métier (projet)                | `metier`                | Projet de métier déclaré en question 2 : métier cible précis, besoin d'orientation, ou garder son métier mais l'exercer ailleurs | `apps/simulateur/src/questionnaire/domain/flags.ts` |
| Orientation                    | `orientation`           | Projet non arrêté (piste incertaine ou aucune idée) : besoin d'orientation                                                       | `apps/simulateur/src/questionnaire/domain/flags.ts` |
| Ancienneté                     | `anciennete`            | Ancienneté chez l'employeur actuel, en mois révolus                                                                              | `apps/simulateur/src/resultats/domain/profil.ts`    |
| Date d'entrée chez l'employeur | `date_entree_employeur` | Mois et année d'entrée chez l'employeur actuel                                                                                   | `apps/simulateur/src/questionnaire/domain/types.ts` |
| Durée d'activité               | `duree_activite`        | Toutes les périodes d'activité professionnelle cumulées, en années                                                               | `questions.ts`, `profil.ts` (simulateur)            |
| Résidence                      | `residence`             | Lieu de résidence (en France ou hors de France) et région de résidence                                                           | `apps/simulateur/src/questionnaire/domain/flags.ts` |
| Profil                         | `profil`                | Tout ce que le catalogue a besoin de savoir d'un parcours                                                                        | `apps/simulateur/src/resultats/domain/profil.ts`    |
| Résultat                       | `resultat`              | Carte proposée à l'issue du questionnaire : un interlocuteur, un outil ou un dispositif que les réponses rendent pertinent       | `apps/simulateur/src/resultats/domain/types.ts`     |
| Catégorie de résultat          | `categorie`             | Interlocuteur, outil ou dispositif ; l'ordre est l'ordre d'affichage                                                             | `apps/simulateur/src/resultats/domain/types.ts`     |
| Catalogue                      | `catalogue`             | Ensemble des résultats possibles, une entrée par carte                                                                           | `apps/simulateur/src/resultats/domain/catalogue.ts` |
| Barème                         | `bareme`                | à compléter (terme présent seulement dans un libellé du site)                                                                    | `apps/site/src/lib/footer.ts`                       |

## Dispositifs, outils et interlocuteurs du catalogue

Définitions reprises des descriptions de `apps/simulateur/src/resultats/domain/catalogue.ts`.

| Terme métier                    | Identifiant                    | Définition                                                                                                                                                                           | Source         |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| CEP                             | `cep`                          | Conseil en évolution professionnelle : un conseiller accompagne gratuitement la personne ; portail national mon-cep.org ; France Travail est l'opérateur CEP des demandeurs d'emploi | `catalogue.ts` |
| PTP                             | `ptp`                          | Projet de transition professionnelle. Condition : 12 mois chez l'employeur actuel et 24 mois d'activité au total ; sans condition en intérim et intermittence                        | `catalogue.ts` |
| OPCO                            | `opco`                         | Opérateur de compétences                                                                                                                                                             | `catalogue.ts` |
| France Travail                  | `france_travail`               | à compléter                                                                                                                                                                          | `catalogue.ts` |
| CPAM                            | `cpam`                         | à compléter                                                                                                                                                                          | `catalogue.ts` |
| AGEFIPH                         | `agefiph`                      | à compléter                                                                                                                                                                          | `catalogue.ts` |
| CPF                             | `cpf`                          | Compte personnel de formation                                                                                                                                                        | `catalogue.ts` |
| VAE                             | `vae`                          | Validation des acquis de l'expérience                                                                                                                                                | `catalogue.ts` |
| Bilan de compétences            | `bilan_competences`            | à compléter                                                                                                                                                                          | `catalogue.ts` |
| PMSMP                           | `pmsmp`                        | Période de mise en situation en milieu professionnel                                                                                                                                 | `catalogue.ts` |
| C2P                             | `c2p`                          | Compte professionnel de prévention (compte pénibilité)                                                                                                                               | `catalogue.ts` |
| Période de reconversion         | `periode_reconversion`         | Dispositif ex-Pro-A ; définition à compléter                                                                                                                                         | `catalogue.ts` |
| PUR                             | `pur`                          | Prévention Usure Reconversion                                                                                                                                                        | `catalogue.ts` |
| CSP                             | `csp`                          | Contrat de sécurisation professionnelle                                                                                                                                              | `catalogue.ts` |
| AREF                            | `aref`                         | Allocation d'aide au retour à l'emploi formation                                                                                                                                     | `catalogue.ts` |
| POEC                            | `poec`                         | Préparation opérationnelle à l'emploi collective                                                                                                                                     | `catalogue.ts` |
| Contrat de professionnalisation | `contrat_professionnalisation` | à compléter                                                                                                                                                                          | `catalogue.ts` |
| CFP                             | `cfp`                          | Congé de formation professionnelle                                                                                                                                                   | `catalogue.ts` |

## Termes en attente de classement

Leur nature (métier ou technique) n'est pas tranchée ; ils ne doivent pas servir de modèle tant que la question reste ouverte (voir `audit-nommage.md`, questions ouvertes).

| Terme                | Identifiants actuels                   | Question                                                                   |
| -------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Réponse              | `answers`, `Answers`, `setAnswer` (EN) | Terme métier (`reponse`) ou donnée technique de formulaire ?               |
| Issue du parcours    | `Outcome`, `findOutcome` (EN)          | Écran terminal (technique) ou sortie d'inéligibilité (métier) ?            |
| Utilisateur / compte | `Utilisateur`, `/compte/` (PR #16)     | Compte technique (`user`, `account`) ou personne métier (`beneficiaire`) ? |
