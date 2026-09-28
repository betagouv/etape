-- Rôles PostgreSQL de la base ETAPE. À exécuter UNE fois, par un compte
-- disposant de CREATEROLE (DBA ou Cegedim), avant la première migration.
-- Les mots de passe sont injectés hors dépôt (psql -v).
--
--   psql -v owner_pwd=… -v app_pwd=… -v maintenance_pwd=… -f roles.sql
--
-- etape_owner       possède les tables, exécute les migrations (DATABASE_MIGRATION_URL)
-- etape_app         runtime de l'API : NOBYPASSRLS, non propriétaire, pas de DELETE
-- etape_maintenance purges RGPD et reprises : BYPASSRLS, jamais utilisé par l'API

CREATE ROLE etape_owner LOGIN PASSWORD :'owner_pwd';
CREATE ROLE etape_app LOGIN NOBYPASSRLS PASSWORD :'app_pwd';
CREATE ROLE etape_maintenance LOGIN BYPASSRLS PASSWORD :'maintenance_pwd';

GRANT USAGE ON SCHEMA public TO etape_app, etape_maintenance;
GRANT CREATE ON SCHEMA public TO etape_owner;

-- Tout ce que etape_owner créera (tables, séquences, fonctions).
ALTER DEFAULT PRIVILEGES FOR ROLE etape_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO etape_app;
ALTER DEFAULT PRIVILEGES FOR ROLE etape_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO etape_app;
ALTER DEFAULT PRIVILEGES FOR ROLE etape_owner IN SCHEMA public
  GRANT SELECT, DELETE ON TABLES TO etape_maintenance;
