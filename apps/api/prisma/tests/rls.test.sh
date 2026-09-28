#!/usr/bin/env bash
# Tests de la RLS et des contraintes, joués avec le rôle applicatif etape_app.
# Usage : APP_URL=postgresql://etape_app:…@host:port/base ./rls.test.sh
set -u
A_ALICE=00000000-0000-0000-0000-00000000b0a1
A_BRUNO=00000000-0000-0000-0000-00000000b0b1
A_AGENT_PACA=00000000-0000-0000-0000-00000000a9e1
A_AGENT_NA=00000000-0000-0000-0000-00000000a9e2
A_SUPER=00000000-0000-0000-0000-00000000ad01
R_PACA=00000000-0000-0000-0000-0000000000a1
R_NA=00000000-0000-0000-0000-0000000000a2
D_A=00000000-0000-0000-0000-0000000d0a01
D_B=00000000-0000-0000-0000-0000000d0b01
pass=0; fail=0

# check <libellé> <attendu> <account_id> <region_ids> <cep_dossier_id> <sql>
# attendu = valeur exacte renvoyée, ou ERR:<motif> pour une erreur attendue.
check() {
  local label=$1 expected=$2 acc=$3 regions=$4 cep=$5 sql=$6
  local out
  out=$(psql "$APP_URL" -tA -v ON_ERROR_STOP=1 2>&1 <<SQL | grep -Ev '^(BEGIN|SET|ROLLBACK)$'
BEGIN;
SET LOCAL app.account_id = '$acc';
SET LOCAL app.region_ids = '$regions';
SET LOCAL app.cep_dossier_id = '$cep';
$sql;
ROLLBACK;
SQL
)
  # Une erreur : on garde la ligne ERROR ; sinon la dernière ligne (valeur ou étiquette de commande).
  if grep -q '^ERROR' <<<"$out"; then out=$(grep -m1 '^ERROR' <<<"$out"); else out=$(tail -n 1 <<<"$out"); fi
  if [[ $expected == ERR:* ]]; then
    if [[ $out == *"${expected#ERR:}"* ]]; then ok=1; else ok=0; fi
  else
    [[ $out == "$expected" ]] && ok=1 || ok=0
  fi
  if ((ok)); then pass=$((pass+1)); echo "  ok   $label";
  else fail=$((fail+1)); echo "  FAIL $label"; echo "       attendu : $expected"; echo "       obtenu  : $out"; fi
}

echo "Visibilité des dossiers"
check "sans contexte : aucun dossier"             0 "" "" "" "SELECT count(*) FROM dossier"
check "Alice voit son seul dossier"               "$D_A" $A_ALICE "" "" "SELECT string_agg(id::text, ',') FROM dossier"
check "Alice ne voit pas le profil de Bruno"      0 $A_ALICE "" "" "SELECT count(*) FROM beneficiaire WHERE account_id = '$A_BRUNO'"
check "agent PACA : dossiers PACA seulement"      "$D_A" $A_AGENT_PACA "{$R_PACA}" "" "SELECT string_agg(id::text, ',') FROM dossier"
check "agent multi-régions : les deux"            2 $A_AGENT_PACA "{$R_PACA,$R_NA}" "" "SELECT count(*) FROM dossier"
check "agent : pas de lecture des profils"        0 $A_AGENT_PACA "{$R_PACA}" "" "SELECT count(*) FROM beneficiaire"
check "super admin sans région : aucun dossier"   0 $A_SUPER "" "" "SELECT count(*) FROM dossier"
check "super admin : lit les attributions (pas de RLS)" 3 $A_SUPER "" "" "SELECT count(*) FROM role_attribution"

echo "Sections et niveaux de visibilité"
check "Alice lit sa situation professionnelle"    1 $A_ALICE "" "" "SELECT count(*) FROM situation_professionnelle"
check "Alice lit les messages de son dossier"     1 $A_ALICE "" "" "SELECT count(*) FROM message"
check "Alice ne voit pas les notes internes"      0 $A_ALICE "" "" "SELECT count(*) FROM note_interne"
check "agent PACA voit la note interne"           1 $A_AGENT_PACA "{$R_PACA}" "" "SELECT count(*) FROM note_interne"
check "agent NA ne voit rien du dossier A"        0 $A_AGENT_NA "{$R_NA}" "" "SELECT count(*) FROM volet_cep WHERE dossier_id = '$D_A'"

echo "Lien CEP (dossier A)"
check "CEP : voit le dossier A seul"              1 "" "" $D_A "SELECT count(*) FROM dossier"
check "CEP : volet, identité, projet"             "1|1|1" "" "" $D_A "SELECT (SELECT count(*) FROM volet_cep), (SELECT count(*) FROM identite_beneficiaire), (SELECT count(*) FROM projet_entreprise)"
check "CEP : pas la situation professionnelle"    0 "" "" $D_A "SELECT count(*) FROM situation_professionnelle"
check "CEP : pas les messages"                    0 "" "" $D_A "SELECT count(*) FROM message"
check "CEP : pas les notes internes"              0 "" "" $D_A "SELECT count(*) FROM note_interne"
check "CEP : confirme son volet"                  "UPDATE 1" "" "" $D_A "UPDATE volet_cep SET statut = 'CONFIRME', date_confirmation = now()"

echo "Écritures refusées par la RLS"
check "Alice ne crée pas de dossier pour Bruno"   "ERR:row-level security" $A_ALICE "" "" "INSERT INTO dossier (beneficiaire_id, region_id, updated_at) VALUES ('$A_BRUNO', '$R_NA', now())"
check "Alice ne modifie pas le dossier de Bruno"  "UPDATE 0" $A_ALICE "" "" "UPDATE projet_entreprise SET motivations = 'x' WHERE dossier_id = '$D_B'"
check "agent PACA ne déplace pas un dossier en NA" "ERR:row-level security" $A_AGENT_PACA "{$R_PACA}" "" "UPDATE dossier SET region_id = '$R_NA' WHERE id = '$D_A'"
check "Alice n'écrit pas de note interne"         "ERR:row-level security" $A_ALICE "" "" "INSERT INTO note_interne (dossier_id, account_id, contenu, updated_at) VALUES ('$D_A', '$A_ALICE', 'x', now())"

echo "Droits du rôle applicatif"
check "pas de DELETE sur dossier"                 "ERR:permission denied" $A_ALICE "" "" "DELETE FROM dossier WHERE id = '$D_A'"
check "journal : écriture sans RETURNING"         "INSERT 0 1" "" "" "" "INSERT INTO journal_securite (evenement, dossier_id) VALUES ('dossier.consultation', '$D_A')"
check "journal : pas d'UPDATE"                    "ERR:permission denied" $A_SUPER "" "" "UPDATE journal_securite SET evenement = 'x'"
check "journal : pas de DELETE"                   "ERR:permission denied" $A_SUPER "" "" "DELETE FROM journal_securite"
check "session : DELETE autorisé"                 "DELETE 0" "" "" "" "DELETE FROM session WHERE expires_at < now()"

echo "Contraintes"
check "SIRET invalide refusé"                     "ERR:situation_professionnelle_siret_check" $A_ALICE "" "" "UPDATE situation_professionnelle SET employeur_siret = '1234567890123X' WHERE dossier_id = '$D_A'"
check "date de démission sans « Oui » refusée"    "ERR:date_demission_check" $A_ALICE "" "" "UPDATE situation_professionnelle SET date_demission = '2026-08-01' WHERE dossier_id = '$D_A'"
check "date de démission avec « Oui » acceptée"   "UPDATE 1" $A_ALICE "" "" "UPDATE situation_professionnelle SET is_demission_envisagee = true, date_demission = '2026-08-01' WHERE dossier_id = '$D_A'"
check "intitulé de formation sans « Oui » refusé" "ERR:intitule_formation_check" $A_ALICE "" "" "UPDATE projet_entreprise SET intitule_formation = 'CAP' WHERE dossier_id = '$D_A'"
check "NIR Corse (2A) accepté"                    "UPDATE 1" $A_ALICE "" "" "UPDATE identite_beneficiaire SET nir = '185072A012345' WHERE dossier_id = '$D_A'"
check "NIR invalide refusé"                       "ERR:nir_check" $A_ALICE "" "" "UPDATE identite_beneficiaire SET nir = '9850713012345' WHERE dossier_id = '$D_A'"
check "second dossier DD en cours refusé"         "ERR:dossier_en_cours_key" $A_ALICE "" "" "INSERT INTO dossier (beneficiaire_id, region_id, updated_at) VALUES ('$A_ALICE', '$R_PACA', now())"
check "auto-attribution d'un rôle refusée"        "ERR:auto_attribution_check" $A_SUPER "" "" "INSERT INTO role_attribution (account_id, role, region_id, auteur_attribution_id) VALUES ('$A_AGENT_PACA', 'ADMIN_TP', '$R_PACA', '$A_AGENT_PACA')"
check "SUPER_ADMIN avec région refusé"            "ERR:role_attribution_region_check" $A_SUPER "" "" "INSERT INTO role_attribution (account_id, role, region_id, auteur_attribution_id) VALUES ('$A_AGENT_NA', 'SUPER_ADMIN', '$R_NA', '$A_SUPER')"
check "rôle déjà actif refusé"                    "ERR:role_attribution_active_key" $A_SUPER "" "" "INSERT INTO role_attribution (account_id, role, region_id, auteur_attribution_id) VALUES ('$A_AGENT_PACA', 'SALARIE_TP', '$R_PACA', '$A_SUPER')"

echo "Verrou après signature"
LOCK="UPDATE dossier SET statut = 'SIGNE', date_signature = now() WHERE id = '$D_A'"
check "identité modifiable en brouillon"          "UPDATE 1" $A_ALICE "" "" "UPDATE identite_beneficiaire SET prenom = 'Alicia' WHERE dossier_id = '$D_A'"
check "identité verrouillée après signature"      "ERR:verrouillé" $A_ALICE "" "" "$LOCK; UPDATE identite_beneficiaire SET prenom = 'Alicia' WHERE dossier_id = '$D_A'"
check "projet verrouillé après signature"         "ERR:verrouillé" $A_ALICE "" "" "$LOCK; UPDATE projet_entreprise SET motivations = 'x' WHERE dossier_id = '$D_A'"
check "volet CEP déclaré verrouillé"              "ERR:verrouillé" $A_ALICE "" "" "$LOCK; UPDATE volet_cep SET conseiller_nom = 'Autre' WHERE dossier_id = '$D_A'"
check "levée du blocage CEP possible"             "UPDATE 1" $A_AGENT_PACA "{$R_PACA}" "" "UPDATE dossier SET statut = 'SOUMIS' WHERE id = '$D_A'; UPDATE volet_cep SET statut = 'LEVE_PAR_INSTRUCTEUR' WHERE dossier_id = '$D_A'"
check "nature du projet figée après signature"    "ERR:verrouillé" $A_ALICE "" "" "$LOCK; UPDATE dossier SET type_projet = 'REPRISE_ENTREPRISE' WHERE id = '$D_A'"

echo
echo "$pass réussis, $fail échoués"
exit $((fail > 0))
