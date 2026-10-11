-- Jeu de données minimal pour les tests RLS (exécuté en superutilisateur).
INSERT INTO region (id, nom, departements, is_pilote, updated_at) VALUES
  ('93', 'Provence-Alpes-Côte d''Azur', '{04,05,06,13,83,84}', true, now()),
  ('75', 'Nouvelle-Aquitaine', '{16,17,19,23,24,33,40,47,64,79,86,87}', false, now());

INSERT INTO account (id, realm, keycloak_sub, first_login_identity_provider, last_login_identity_provider) VALUES
  ('00000000-0000-0000-0000-00000000b0a1', 'etape',     'sub-benef-a', 'franceconnect', 'franceconnect'),
  ('00000000-0000-0000-0000-00000000b0b1', 'etape',     'sub-benef-b', 'franceconnect', 'franceconnect'),
  ('00000000-0000-0000-0000-00000000a9e1', 'etape-pro', 'sub-agent-paca', 'local', 'local'),
  ('00000000-0000-0000-0000-00000000a9e2', 'etape-pro', 'sub-agent-na', 'local', 'local'),
  ('00000000-0000-0000-0000-00000000ad01', 'etape-pro', 'sub-super-admin', 'local', 'local');

INSERT INTO habilitation (account_id, role, region_id, auteur_attribution_id) VALUES
  ('00000000-0000-0000-0000-00000000ad01', 'SUPER_ADMIN', NULL, NULL),
  ('00000000-0000-0000-0000-00000000a9e1', 'INSTRUCTEUR', '93', '00000000-0000-0000-0000-00000000ad01'),
  ('00000000-0000-0000-0000-00000000a9e2', 'INSTRUCTEUR', '75', '00000000-0000-0000-0000-00000000ad01');

INSERT INTO beneficiaire (account_id, nom, prenom, updated_at) VALUES
  ('00000000-0000-0000-0000-00000000b0a1', 'Martin', 'Alice', now()),
  ('00000000-0000-0000-0000-00000000b0b1', 'Durand', 'Bruno', now());

-- Dossier A (PACA, Alice), dossier B (Nouvelle-Aquitaine, Bruno).
INSERT INTO dossier (id, beneficiaire_id, region_id, type_projet, updated_at) VALUES
  ('00000000-0000-0000-0000-0000000d0a01', '00000000-0000-0000-0000-00000000b0a1', '93', 'CREATION_ENTREPRISE', now()),
  ('00000000-0000-0000-0000-0000000d0b01', '00000000-0000-0000-0000-00000000b0b1', '75', 'REPRISE_ENTREPRISE', now());

INSERT INTO volet_cep (dossier_id, conseiller_nom, conseiller_email, date_saisine, updated_at) VALUES
  ('00000000-0000-0000-0000-0000000d0a01', 'Leroy', 'c.leroy@avenir-actifs.fr', '2026-09-01', now()),
  ('00000000-0000-0000-0000-0000000d0b01', 'Petit', 'p.petit@apec.fr', '2026-09-02', now());
INSERT INTO identite_beneficiaire (dossier_id, nom, prenom, nir, cle_nir, updated_at) VALUES
  ('00000000-0000-0000-0000-0000000d0a01', 'Martin', 'Alice', '2870413055123', '45', now()),
  ('00000000-0000-0000-0000-0000000d0b01', 'Durand', 'Bruno', '1850733063456', '12', now());
INSERT INTO situation_professionnelle (dossier_id, fonction, employeur_siret, is_demission_envisagee, updated_at) VALUES
  ('00000000-0000-0000-0000-0000000d0a01', 'Comptable', '35600000000048', false, now()),
  ('00000000-0000-0000-0000-0000000d0b01', 'Soudeur', '35600000000048', true, now());
INSERT INTO projet_entreprise (dossier_id, description_activite, updated_at) VALUES
  ('00000000-0000-0000-0000-0000000d0a01', 'Cabinet de conseil', now()),
  ('00000000-0000-0000-0000-0000000d0b01', 'Reprise d''un atelier', now());
INSERT INTO message (dossier_id, account_id, contenu) VALUES
  ('00000000-0000-0000-0000-0000000d0a01', '00000000-0000-0000-0000-00000000a9e1', 'Merci de compléter le volet CEP');
INSERT INTO note_interne (dossier_id, account_id, contenu, updated_at) VALUES
  ('00000000-0000-0000-0000-0000000d0a01', '00000000-0000-0000-0000-00000000a9e1', 'Vérifier le SIRET', now());
