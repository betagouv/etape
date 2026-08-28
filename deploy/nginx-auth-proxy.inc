# Transmission vers Keycloak, commune à chaque emplacement autorisé de
# `nginx-auth.conf`. Dans un fichier à part parce qu'un `X-Forwarded-*` oublié
# sur un seul emplacement suffirait à faire émettre à Keycloak des URL en clair
# sur ce chemin-là seulement.

set $etape_keycloak http://keycloak:8080;
proxy_pass $etape_keycloak$request_uri;

proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $etape_schema_auth;
proxy_set_header X-Forwarded-Host  $host;

# Keycloak émet des cookies volumineux : aux tailles par défaut, nginx répond
# 502 « upstream sent too big header » une fois le parcours réellement joué.
proxy_buffer_size 16k;
proxy_buffers 8 16k;
proxy_busy_buffers_size 32k;
