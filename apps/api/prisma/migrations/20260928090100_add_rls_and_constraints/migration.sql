-- Ce que schema.prisma ne sait pas exprimer : contexte de requête, RLS,
-- contraintes CHECK, index partiels, verrou après signature, droits du rôle
-- applicatif. Écrit à la main (`prisma migrate dev --create-only`), relu comme
-- du SQL ordinaire. Prisma ne voit ni les CHECK ni les policies : il ne les
-- supprimera pas.
--
-- Rappels :
-- - un superutilisateur ignore toujours la RLS, même FORCE : l'API doit se
--   connecter avec `etape_app` (NOBYPASSRLS, non propriétaire), CI comprise ;
-- - le contexte est posé par transaction (`set_config(..., true)`), jamais
--   par session : le pool de connexions le ferait fuiter d'une requête à l'autre.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Contexte de la requête
-- ═════════════════════════════════════════════════════════════════════════════

-- Compte connecté (bénéficiaire ou agent).
CREATE FUNCTION app_account_id() RETURNS uuid
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT nullif(current_setting('app.account_id', true), '')::uuid $$;

-- Régions des habilitations actives du compte (codes INSEE), format tableau : '{93,75}'.
CREATE FUNCTION app_region_ids() RETURNS text[]
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT coalesce(nullif(current_setting('app.region_ids', true), '')::text[], '{}'::text[]) $$;

-- Dossier ouvert par un lien CEP valide (conseiller sans compte).
CREATE FUNCTION app_cep_dossier_id() RETURNS uuid
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT nullif(current_setting('app.cep_dossier_id', true), '')::uuid $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Row-Level Security
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Sans RLS, volontairement :
-- - account, session, habilitation, invitation, lien_cep : lues pour
--   ÉTABLIR le contexte (qui est connecté, quels rôles, quel lien) ; protégées
--   par l'API et les droits du rôle ;
-- - region, operateur_cep, type_piece : référentiels publics.
--
-- Trois niveaux de visibilité pour les tables rattachées à un dossier :
-- - « dossier »    : ce que la RLS de `dossier` laisse voir (propriétaire,
--                    agents de la région, conseiller CEP du lien) ;
-- - « hors CEP »   : idem, sauf l'accès par lien CEP (minimisation du Viewer) ;
-- - « agents »     : agents de la région seulement (jamais le bénéficiaire).

-- ── dossier ──────────────────────────────────────────────────────────────────
ALTER TABLE dossier ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier FORCE ROW LEVEL SECURITY;
CREATE POLICY dossier_acces ON dossier
  USING (
    region_id = ANY (app_region_ids())
    OR beneficiaire_id = app_account_id()
    OR id = app_cep_dossier_id()
  );
-- WITH CHECK implicite = USING : un bénéficiaire ne crée un dossier que pour
-- lui, un agent ne déplace pas un dossier hors de ses régions.

-- ── beneficiaire (profil) : son seul propriétaire ────────────────────────────
ALTER TABLE beneficiaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaire FORCE ROW LEVEL SECURITY;
CREATE POLICY beneficiaire_proprietaire ON beneficiaire
  USING (account_id = app_account_id());

-- ── Niveau « dossier » : ce que le Viewer CEP peut atteindre ─────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['volet_cep', 'identite_beneficiaire', 'projet_entreprise',
                           'piece_justificative', 'signature']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (EXISTS (SELECT 1 FROM dossier d WHERE d.id = dossier_id))',
      t || '_acces', t);
  END LOOP;
END $$;

-- ── Niveau « hors CEP » : bénéficiaire et agents ─────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['situation_professionnelle', 'historique_statut', 'message', 'decision']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (EXISTS (SELECT 1 FROM dossier d WHERE d.id = dossier_id '
      'AND d.id IS DISTINCT FROM app_cep_dossier_id()))',
      t || '_acces', t);
  END LOOP;
END $$;

-- ── Niveau « agents » : jamais visible du bénéficiaire ───────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['note_interne', 'commission_dossier']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (EXISTS (SELECT 1 FROM dossier d WHERE d.id = dossier_id '
      'AND d.region_id = ANY (app_region_ids())))',
      t || '_acces', t);
  END LOOP;
END $$;

-- ── Commission : agents et membres de la région ──────────────────────────────
ALTER TABLE commission ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission FORCE ROW LEVEL SECURITY;
CREATE POLICY commission_acces ON commission
  USING (region_id = ANY (app_region_ids()));

ALTER TABLE commission_membre ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_membre FORCE ROW LEVEL SECURITY;
CREATE POLICY commission_membre_acces ON commission_membre
  USING (EXISTS (SELECT 1 FROM commission c WHERE c.id = commission_id));

-- ── Journal : tout le monde écrit, on relit sa région ou ses propres lignes ──
-- Écrire avec createMany / INSERT sans RETURNING : un INSERT … RETURNING
-- exige que la ligne soit aussi lisible.
ALTER TABLE journal_securite ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_securite FORCE ROW LEVEL SECURITY;
CREATE POLICY journal_securite_insert ON journal_securite
  FOR INSERT WITH CHECK (true);
CREATE POLICY journal_securite_select ON journal_securite
  FOR SELECT USING (region_id = ANY (app_region_ids()) OR account_id = app_account_id());

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Contraintes CHECK (formats, cohérence des champs conditionnels)
-- ═════════════════════════════════════════════════════════════════════════════
-- Un format invalide n'est jamais enregistré : la sauvegarde automatique
-- n'envoie que les champs valides (le front garde la saisie en cours).

ALTER TABLE habilitation
  ADD CONSTRAINT habilitation_region_check
    CHECK ((role = 'SUPER_ADMIN') = (region_id IS NULL)),
  ADD CONSTRAINT habilitation_auto_attribution_check
    CHECK (auteur_attribution_id IS DISTINCT FROM account_id),
  ADD CONSTRAINT habilitation_revocation_check
    CHECK (date_revocation IS NOT NULL OR (auteur_revocation_id IS NULL AND motif_revocation IS NULL));

ALTER TABLE invitation
  ADD CONSTRAINT invitation_email_check CHECK (email = lower(email)),
  ADD CONSTRAINT invitation_region_check
    CHECK ((role = 'SUPER_ADMIN') = (region_id IS NULL));

ALTER TABLE operateur_cep
  ADD CONSTRAINT operateur_cep_siret_check CHECK (siret ~ '^[0-9]{14}$');

ALTER TABLE beneficiaire
  ADD CONSTRAINT beneficiaire_code_postal_check CHECK (code_postal ~ '^[0-9]{5}$');

ALTER TABLE volet_cep
  ADD CONSTRAINT volet_cep_code_postal_check CHECK (operateur_code_postal ~ '^[0-9]{5}$'),
  ADD CONSTRAINT volet_cep_conseiller_email_check CHECK (conseiller_email = lower(conseiller_email));

ALTER TABLE lien_cep
  ADD CONSTRAINT lien_cep_email_check CHECK (email = lower(email));

-- NIR : sexe (1), année (2), mois (2), département (2, dont 2A / 2B), commune (3), ordre (3).
ALTER TABLE identite_beneficiaire
  ADD CONSTRAINT identite_beneficiaire_nir_check
    CHECK (nir ~ '^[1-8][0-9]{4}(2[AB]|[0-9]{2})[0-9]{6}$'),
  ADD CONSTRAINT identite_beneficiaire_cle_nir_check CHECK (cle_nir ~ '^[0-9]{2}$'),
  ADD CONSTRAINT identite_beneficiaire_code_postal_check CHECK (code_postal ~ '^[0-9]{5}$');

ALTER TABLE situation_professionnelle
  ADD CONSTRAINT situation_professionnelle_siret_check CHECK (employeur_siret ~ '^[0-9]{14}$'),
  -- « Date de démission » n'existe que si la réponse est « Oui ».
  ADD CONSTRAINT situation_professionnelle_date_demission_check
    CHECK (is_demission_envisagee IS TRUE OR date_demission IS NULL);

ALTER TABLE projet_entreprise
  -- « Intitulé de la formation » n'existe que si la réponse est « Oui ».
  ADD CONSTRAINT projet_entreprise_intitule_formation_check
    CHECK (has_formation_prealable IS TRUE OR intitule_formation IS NULL);

ALTER TABLE piece_justificative
  ADD CONSTRAINT piece_justificative_sha256_check CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT piece_justificative_size_check CHECK (size > 0),
  ADD CONSTRAINT piece_justificative_motif_refus_check
    CHECK (statut = 'REFUSEE' OR motif_refus IS NULL);

ALTER TABLE signature
  ADD CONSTRAINT signature_sha256_check CHECK (document_sha256 ~ '^[0-9a-f]{64}$'),
  -- Le conseiller CEP signe par email, tous les autres avec leur compte.
  ADD CONSTRAINT signature_signataire_check
    CHECK ((signataire = 'CONSEILLER_CEP') = (account_id IS NULL AND email IS NOT NULL)),
  ADD CONSTRAINT signature_decision_check
    CHECK ((signataire IN ('PRESIDENT', 'VICE_PRESIDENT')) = (decision_id IS NOT NULL));

ALTER TABLE decision
  ADD CONSTRAINT decision_sha256_check CHECK (document_sha256 ~ '^[0-9a-f]{64}$');

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. Index partiels (unicités métier et contrôles d'accès)
-- ═════════════════════════════════════════════════════════════════════════════

-- Habilitations actives : lues à chaque requête pour construire l'acteur.
-- NULLS NOT DISTINCT : un seul SUPER_ADMIN actif par compte malgré region_id null.
CREATE UNIQUE INDEX habilitation_active_key
  ON habilitation (account_id, role, region_id) NULLS NOT DISTINCT
  WHERE date_revocation IS NULL;

-- Une invitation en attente par email, rôle et région (réinviter = révoquer l'ancienne).
CREATE UNIQUE INDEX invitation_en_attente_key
  ON invitation (email, role, region_id) NULLS NOT DISTINCT
  WHERE used_at IS NULL AND revoked_at IS NULL;

-- Un seul dossier en cours par bénéficiaire et dispositif (hypothèse H5).
CREATE UNIQUE INDEX dossier_en_cours_key
  ON dossier (beneficiaire_id, dispositif)
  WHERE statut NOT IN ('CLOTURE', 'IRRECEVABLE', 'DESISTE');

-- Un dossier n'est inscrit qu'à une commission à la fois (report = date_retrait).
CREATE UNIQUE INDEX commission_dossier_actif_key
  ON commission_dossier (dossier_id)
  WHERE date_retrait IS NULL;

-- Un seul président en exercice par commission.
CREATE UNIQUE INDEX commission_membre_president_key
  ON commission_membre (commission_id)
  WHERE fonction = 'PRESIDENT' AND date_retrait IS NULL;

-- Sessions à purger / retrouver par sub au backchannel logout : index déjà posés par Prisma.

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. Verrou après signature
-- ═════════════════════════════════════════════════════════════════════════════
-- Les informations déclarées ne changent plus une fois le dossier signé :
-- toute correction passe par une demande de complément. L'API le vérifie ;
-- la base le garantit.

CREATE FUNCTION is_dossier_modifiable(p_dossier_id uuid) RETURNS boolean
  LANGUAGE sql STABLE
  AS $$ SELECT statut IN ('BROUILLON', 'EN_ATTENTE_CEP') FROM dossier WHERE id = p_dossier_id $$;

-- Sections entièrement déclaratives.
CREATE FUNCTION check_section_modifiable() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF NOT coalesce(is_dossier_modifiable(coalesce(NEW.dossier_id, OLD.dossier_id)), false) THEN
    RAISE EXCEPTION 'dossier % verrouillé : % non modifiable après signature',
      coalesce(NEW.dossier_id, OLD.dossier_id), TG_TABLE_NAME
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN coalesce(NEW, OLD);
END $$;

CREATE TRIGGER identite_beneficiaire_verrou BEFORE INSERT OR UPDATE OR DELETE ON identite_beneficiaire
  FOR EACH ROW EXECUTE FUNCTION check_section_modifiable();
CREATE TRIGGER situation_professionnelle_verrou BEFORE INSERT OR UPDATE OR DELETE ON situation_professionnelle
  FOR EACH ROW EXECUTE FUNCTION check_section_modifiable();
CREATE TRIGGER projet_entreprise_verrou BEFORE INSERT OR UPDATE OR DELETE ON projet_entreprise
  FOR EACH ROW EXECUTE FUNCTION check_section_modifiable();

-- Volet CEP : la partie déclarée est verrouillée, pas la confirmation
-- (le conseiller confirme, l'instructeur peut lever le blocage après dépôt).
CREATE FUNCTION check_volet_cep_modifiable() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF (NEW.operateur_cep_id, NEW.operateur_nom, NEW.operateur_code_postal, NEW.operateur_commune,
      NEW.conseiller_nom, NEW.conseiller_prenom, NEW.conseiller_telephone, NEW.conseiller_email,
      NEW.date_saisine)
     IS DISTINCT FROM
     (OLD.operateur_cep_id, OLD.operateur_nom, OLD.operateur_code_postal, OLD.operateur_commune,
      OLD.conseiller_nom, OLD.conseiller_prenom, OLD.conseiller_telephone, OLD.conseiller_email,
      OLD.date_saisine)
     AND NOT coalesce(is_dossier_modifiable(NEW.dossier_id), false) THEN
    RAISE EXCEPTION 'dossier % verrouillé : volet CEP déclaré non modifiable après signature', NEW.dossier_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER volet_cep_verrou BEFORE UPDATE ON volet_cep
  FOR EACH ROW EXECUTE FUNCTION check_volet_cep_modifiable();

-- Dossier : propriétaire jamais modifiable ; région et nature du projet figées à la signature.
CREATE FUNCTION check_dossier_modifiable() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF NEW.beneficiaire_id IS DISTINCT FROM OLD.beneficiaire_id THEN
    RAISE EXCEPTION 'dossier % : le bénéficiaire ne change jamais', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  IF (NEW.region_id, NEW.type_projet, NEW.dispositif) IS DISTINCT FROM (OLD.region_id, OLD.type_projet, OLD.dispositif)
     AND OLD.statut NOT IN ('BROUILLON', 'EN_ATTENTE_CEP') THEN
    RAISE EXCEPTION 'dossier % verrouillé : région, dispositif et nature du projet figés après signature', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER dossier_verrou BEFORE UPDATE ON dossier
  FOR EACH ROW EXECUTE FUNCTION check_dossier_modifiable();

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. Droits du rôle applicatif
-- ═════════════════════════════════════════════════════════════════════════════
-- Les rôles sont créés hors migration (deploy/postgres/roles.sql), avec des
-- privilèges par défaut SELECT, INSERT, UPDATE : l'application ne supprime
-- rien, sauf des sessions. Les purges RGPD passent par `etape_maintenance`.
-- Si le rôle n'existe pas (poste de dev en superutilisateur), on passe.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'etape_app') THEN
    GRANT DELETE ON session TO etape_app;
    -- Tables de preuve : ajout seulement.
    REVOKE UPDATE ON journal_securite, historique_statut, signature FROM etape_app;
    REVOKE ALL ON _prisma_migrations FROM etape_app;
  END IF;
END $$;
