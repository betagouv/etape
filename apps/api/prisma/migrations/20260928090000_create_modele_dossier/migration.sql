-- CreateEnum
CREATE TYPE "realm" AS ENUM ('etape', 'etape-pro');

-- CreateEnum
CREATE TYPE "role" AS ENUM ('SALARIE_TP', 'ADMIN_TP', 'SUPER_ADMIN', 'MEMBRE_COMMISSION');

-- CreateEnum
CREATE TYPE "dispositif" AS ENUM ('DD');

-- CreateEnum
CREATE TYPE "type_operateur_cep" AS ENUM ('AVENIR_ACTIFS', 'APEC', 'CAP_EMPLOI');

-- CreateEnum
CREATE TYPE "civilite" AS ENUM ('MADAME', 'MONSIEUR');

-- CreateEnum
CREATE TYPE "statut_dossier" AS ENUM ('BROUILLON', 'EN_ATTENTE_CEP', 'SIGNE', 'SOUMIS', 'EN_CONTROLE', 'EN_ATTENTE_COMPLEMENT', 'CONTROLE', 'ATTRIBUE_COMMISSION', 'DECIDE', 'CLOTURE', 'IRRECEVABLE', 'DESISTE');

-- CreateEnum
CREATE TYPE "type_projet" AS ENUM ('FORMATION', 'CREATION_ENTREPRISE', 'REPRISE_ENTREPRISE');

-- CreateEnum
CREATE TYPE "statut_volet_cep" AS ENUM ('DECLARE', 'EN_ATTENTE_CONFIRMATION', 'CONFIRME', 'INFIRME', 'LEVE_PAR_INSTRUCTEUR');

-- CreateEnum
CREATE TYPE "statut_piece" AS ENUM ('DEPOSEE', 'VALIDEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "signataire" AS ENUM ('BENEFICIAIRE', 'CONSEILLER_CEP', 'PRESIDENT', 'VICE_PRESIDENT');

-- CreateEnum
CREATE TYPE "statut_commission" AS ENUM ('OUVERTE', 'EN_SEANCE', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "fonction_commission" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'COMMISSAIRE', 'ANIMATEUR', 'VICE_ANIMATEUR', 'MEMBRE');

-- CreateEnum
CREATE TYPE "sens_decision" AS ENUM ('ACCORD', 'REFUS');

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "disabled_at" TIMESTAMPTZ(3),
ADD COLUMN     "realm" "realm" NOT NULL DEFAULT 'etape';

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "keycloak_sid" TEXT,
ADD COLUMN     "last_activity_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "realm" "realm" NOT NULL DEFAULT 'etape';

-- CreateTable
CREATE TABLE "role_attribution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "role" "role" NOT NULL,
    "region_id" UUID,
    "auteur_attribution_id" UUID,
    "date_attribution" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteur_retrait_id" UUID,
    "date_retrait" TIMESTAMPTZ(3),
    "motif_retrait" TEXT,

    CONSTRAINT "role_attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "region_id" UUID,
    "auteur_id" UUID NOT NULL,
    "account_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_securite" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evenement" TEXT NOT NULL,
    "account_id" UUID,
    "acteur_email" TEXT,
    "region_id" UUID,
    "dossier_id" UUID,
    "cible_type" TEXT,
    "cible_id" UUID,
    "details" JSONB,
    "ip" INET,
    "user_agent" TEXT,
    "correlation_id" TEXT,

    CONSTRAINT "journal_securite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url_atnet" TEXT,
    "departements" TEXT[],
    "date_ouverture" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operateur_cep" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "type" "type_operateur_cep" NOT NULL,
    "region_id" UUID,
    "domaines_email" TEXT[],
    "siret" CHAR(14),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "operateur_cep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_piece" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "libelle" TEXT NOT NULL,
    "dispositif" "dispositif" NOT NULL,
    "type_projet" "type_projet",
    "is_obligatoire" BOOLEAN NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "date_fin_validite" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "type_piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaire" (
    "account_id" UUID NOT NULL,
    "civilite" "civilite",
    "nom" TEXT,
    "prenom" TEXT,
    "date_naissance" DATE,
    "nationalite" TEXT,
    "numero_voie" TEXT,
    "nom_voie" TEXT,
    "complement_adresse" TEXT,
    "code_postal" TEXT,
    "commune" TEXT,
    "code_commune" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "beneficiaire_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "dossier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" TEXT,
    "beneficiaire_id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "dispositif" "dispositif" NOT NULL DEFAULT 'DD',
    "type_projet" "type_projet",
    "statut" "statut_dossier" NOT NULL DEFAULT 'BROUILLON',
    "date_signature" TIMESTAMPTZ(3),
    "date_depot" TIMESTAMPTZ(3),
    "date_cloture" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_statut" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "previous_statut" "statut_dossier",
    "statut" "statut_dossier" NOT NULL,
    "account_id" UUID,
    "motif" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_statut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volet_cep" (
    "dossier_id" UUID NOT NULL,
    "operateur_cep_id" UUID,
    "operateur_nom" TEXT,
    "operateur_code_postal" TEXT,
    "operateur_commune" TEXT,
    "conseiller_nom" TEXT,
    "conseiller_prenom" TEXT,
    "conseiller_telephone" TEXT,
    "conseiller_email" TEXT,
    "date_saisine" DATE,
    "statut" "statut_volet_cep" NOT NULL DEFAULT 'DECLARE',
    "date_confirmation" TIMESTAMPTZ(3),
    "commentaire_cep" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "volet_cep_pkey" PRIMARY KEY ("dossier_id")
);

-- CreateTable
CREATE TABLE "lien_cep" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "last_opened_at" TIMESTAMPTZ(3),
    "ouverture_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lien_cep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identite_beneficiaire" (
    "dossier_id" UUID NOT NULL,
    "civilite" "civilite",
    "nom" TEXT,
    "prenom" TEXT,
    "date_naissance" DATE,
    "nationalite" TEXT,
    "nir" CHAR(13),
    "cle_nir" CHAR(2),
    "numero_voie" TEXT,
    "nom_voie" TEXT,
    "complement_adresse" TEXT,
    "code_postal" TEXT,
    "commune" TEXT,
    "code_commune" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "identite_beneficiaire_pkey" PRIMARY KEY ("dossier_id")
);

-- CreateTable
CREATE TABLE "situation_professionnelle" (
    "dossier_id" UUID NOT NULL,
    "fonction" TEXT,
    "secteur_activite" TEXT,
    "employeur_denomination" TEXT,
    "employeur_siret" CHAR(14),
    "is_demission_envisagee" BOOLEAN,
    "date_demission" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "situation_professionnelle_pkey" PRIMARY KEY ("dossier_id")
);

-- CreateTable
CREATE TABLE "projet_entreprise" (
    "dossier_id" UUID NOT NULL,
    "demarches_projet" TEXT,
    "motivations" TEXT,
    "demarches_experts" TEXT,
    "description_activite" TEXT,
    "offre_services" TEXT,
    "type_activite" TEXT,
    "forme_juridique" TEXT,
    "competences" TEXT,
    "has_formation_prealable" BOOLEAN,
    "intitule_formation" TEXT,
    "analyse_marche" TEXT,
    "analyse_clientele" TEXT,
    "analyse_concurrence" TEXT,
    "besoins_financement" TEXT,
    "aides_financieres" TEXT,
    "moyens_techniques" TEXT,
    "moyens_humains" TEXT,
    "recrutement" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "projet_entreprise_pkey" PRIMARY KEY ("dossier_id")
);

-- CreateTable
CREATE TABLE "piece_justificative" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "type_piece_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "account_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "statut" "statut_piece" NOT NULL DEFAULT 'DEPOSEE',
    "motif_refus" TEXT,
    "instructeur_id" UUID,
    "date_controle" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "piece_justificative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "signataire" "signataire" NOT NULL,
    "account_id" UUID,
    "email" TEXT,
    "decision_id" UUID,
    "document_sha256" CHAR(64) NOT NULL,
    "date_signature" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" INET,
    "user_agent" TEXT,

    CONSTRAINT "signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "contenu" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_interne" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "contenu" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "note_interne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "region_id" UUID NOT NULL,
    "libelle" TEXT,
    "date_commission" TIMESTAMPTZ(3) NOT NULL,
    "statut" "statut_commission" NOT NULL DEFAULT 'OUVERTE',
    "date_cloture" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_membre" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commission_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "fonction" "fonction_commission" NOT NULL,
    "auteur_designation_id" UUID NOT NULL,
    "date_designation" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_retrait" TIMESTAMPTZ(3),

    CONSTRAINT "commission_membre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_dossier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commission_id" UUID NOT NULL,
    "dossier_id" UUID NOT NULL,
    "ordre_passage" INTEGER,
    "fiche_synthese" TEXT,
    "auteur_attribution_id" UUID NOT NULL,
    "date_attribution" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_retrait" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commission_dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "commission_id" UUID NOT NULL,
    "sens" "sens_decision" NOT NULL,
    "motif" TEXT,
    "auteur_id" UUID NOT NULL,
    "date_decision" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_notification" TIMESTAMPTZ(3),
    "document_storage_key" TEXT,
    "document_sha256" CHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_attribution_region_id_role_idx" ON "role_attribution"("region_id", "role");

-- CreateIndex
CREATE INDEX "journal_securite_dossier_id_created_at_idx" ON "journal_securite"("dossier_id", "created_at");

-- CreateIndex
CREATE INDEX "journal_securite_account_id_created_at_idx" ON "journal_securite"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "journal_securite_region_id_created_at_idx" ON "journal_securite"("region_id", "created_at");

-- CreateIndex
CREATE INDEX "journal_securite_created_at_idx" ON "journal_securite"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "region_code_key" ON "region"("code");

-- CreateIndex
CREATE INDEX "operateur_cep_region_id_idx" ON "operateur_cep"("region_id");

-- CreateIndex
CREATE UNIQUE INDEX "type_piece_code_version_key" ON "type_piece"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_numero_key" ON "dossier"("numero");

-- CreateIndex
CREATE INDEX "dossier_region_id_statut_idx" ON "dossier"("region_id", "statut");

-- CreateIndex
CREATE INDEX "dossier_beneficiaire_id_idx" ON "dossier"("beneficiaire_id");

-- CreateIndex
CREATE INDEX "historique_statut_dossier_id_created_at_idx" ON "historique_statut"("dossier_id", "created_at");

-- CreateIndex
CREATE INDEX "volet_cep_operateur_cep_id_idx" ON "volet_cep"("operateur_cep_id");

-- CreateIndex
CREATE UNIQUE INDEX "lien_cep_token_hash_key" ON "lien_cep"("token_hash");

-- CreateIndex
CREATE INDEX "lien_cep_dossier_id_idx" ON "lien_cep"("dossier_id");

-- CreateIndex
CREATE UNIQUE INDEX "piece_justificative_dossier_id_type_piece_id_version_key" ON "piece_justificative"("dossier_id", "type_piece_id", "version");

-- CreateIndex
CREATE INDEX "signature_dossier_id_idx" ON "signature"("dossier_id");

-- CreateIndex
CREATE INDEX "message_dossier_id_created_at_idx" ON "message"("dossier_id", "created_at");

-- CreateIndex
CREATE INDEX "note_interne_dossier_id_created_at_idx" ON "note_interne"("dossier_id", "created_at");

-- CreateIndex
CREATE INDEX "commission_region_id_date_commission_idx" ON "commission"("region_id", "date_commission");

-- CreateIndex
CREATE INDEX "commission_membre_account_id_idx" ON "commission_membre"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_membre_commission_id_account_id_key" ON "commission_membre"("commission_id", "account_id");

-- CreateIndex
CREATE INDEX "commission_dossier_commission_id_idx" ON "commission_dossier"("commission_id");

-- CreateIndex
CREATE INDEX "commission_dossier_dossier_id_idx" ON "commission_dossier"("dossier_id");

-- CreateIndex
CREATE UNIQUE INDEX "decision_dossier_id_key" ON "decision"("dossier_id");

-- CreateIndex
CREATE INDEX "decision_commission_id_idx" ON "decision"("commission_id");

-- CreateIndex
CREATE INDEX "session_keycloak_sid_idx" ON "session"("keycloak_sid");

-- AddForeignKey
ALTER TABLE "role_attribution" ADD CONSTRAINT "role_attribution_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_attribution" ADD CONSTRAINT "role_attribution_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_attribution" ADD CONSTRAINT "role_attribution_auteur_attribution_id_fkey" FOREIGN KEY ("auteur_attribution_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_attribution" ADD CONSTRAINT "role_attribution_auteur_retrait_id_fkey" FOREIGN KEY ("auteur_retrait_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operateur_cep" ADD CONSTRAINT "operateur_cep_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaire" ADD CONSTRAINT "beneficiaire_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier" ADD CONSTRAINT "dossier_beneficiaire_id_fkey" FOREIGN KEY ("beneficiaire_id") REFERENCES "beneficiaire"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier" ADD CONSTRAINT "dossier_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statut" ADD CONSTRAINT "historique_statut_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_statut" ADD CONSTRAINT "historique_statut_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volet_cep" ADD CONSTRAINT "volet_cep_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volet_cep" ADD CONSTRAINT "volet_cep_operateur_cep_id_fkey" FOREIGN KEY ("operateur_cep_id") REFERENCES "operateur_cep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lien_cep" ADD CONSTRAINT "lien_cep_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identite_beneficiaire" ADD CONSTRAINT "identite_beneficiaire_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situation_professionnelle" ADD CONSTRAINT "situation_professionnelle_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projet_entreprise" ADD CONSTRAINT "projet_entreprise_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_justificative" ADD CONSTRAINT "piece_justificative_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_justificative" ADD CONSTRAINT "piece_justificative_type_piece_id_fkey" FOREIGN KEY ("type_piece_id") REFERENCES "type_piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_justificative" ADD CONSTRAINT "piece_justificative_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_justificative" ADD CONSTRAINT "piece_justificative_instructeur_id_fkey" FOREIGN KEY ("instructeur_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature" ADD CONSTRAINT "signature_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature" ADD CONSTRAINT "signature_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature" ADD CONSTRAINT "signature_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_interne" ADD CONSTRAINT "note_interne_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_interne" ADD CONSTRAINT "note_interne_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission" ADD CONSTRAINT "commission_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_membre" ADD CONSTRAINT "commission_membre_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_membre" ADD CONSTRAINT "commission_membre_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_membre" ADD CONSTRAINT "commission_membre_auteur_designation_id_fkey" FOREIGN KEY ("auteur_designation_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_dossier" ADD CONSTRAINT "commission_dossier_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_dossier" ADD CONSTRAINT "commission_dossier_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_dossier" ADD CONSTRAINT "commission_dossier_auteur_attribution_id_fkey" FOREIGN KEY ("auteur_attribution_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

