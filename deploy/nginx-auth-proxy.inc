# Directives de transmission vers Keycloak, communes à chaque emplacement
# autorisé de `nginx-auth.conf`.
#
# Dans un fichier à part parce qu'elles sont répétées : dupliquées à la main,
# elles finiraient par diverger, et une divergence ici se lit mal — un en-tête
# `X-Forwarded-*` oublié sur un seul emplacement suffit à faire émettre à
# Keycloak des URL en clair sur ce chemin-là seulement.

set $etape_keycloak http://keycloak:8080;
proxy_pass $etape_keycloak$request_uri;

proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $etape_schema_auth;
proxy_set_header X-Forwarded-Host  $host;

# Keycloak émet des cookies de session volumineux, et l'en-tête d'une réponse de
# fin de parcours en porte plusieurs. Aux tailles par défaut, nginx répond 502
# avec « upstream sent too big header » — une panne qui n'apparaît qu'une fois le
# parcours réellement joué.
proxy_buffer_size 16k;
proxy_buffers 8 16k;
proxy_busy_buffers_size 32k;
