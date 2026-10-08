# Commun au front-office et au back-office : chacun a son bloc `server`, son nom
# d'hôte et son `root`, et relaie lui-même `/api/` vers l'API, qui le reconnaît à
# l'en-tête `Host`. Une origine par front : les cookies de l'un ne partent
# jamais vers l'autre.

# Aucune réécriture : l'application porte elle-même le préfixe `/api`, si bien
# que la `redirect_uri` reste valable des deux côtés du proxy.
location /api/ {
    set $etape_api http://api:3002;
    proxy_pass $etape_api$request_uri;

    proxy_http_version 1.1;
    # `$host` : le nom qui a servi à choisir ce bloc `server`. L'API aiguille
    # sur lui ; `X-Forwarded-Host`, qu'elle ne lit pas, lui est égal.
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $etape_scheme;
    proxy_set_header X-Forwarded-Host  $host;

    # Le parcours porte un `state` à usage unique : une seule réponse mise en
    # cache suffirait à le faire rejouer.
    proxy_buffering off;
    add_header Cache-Control "no-store" always;
    include /etc/nginx/snippets/front-headers.inc;
}

# Assets versionnés de Vite.
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    include /etc/nginx/snippets/front-headers.inc;
    try_files $uri =404;
}

# Application monopage : toute autre adresse est une route du front, que le
# routeur résout côté navigateur.
location / {
    add_header Cache-Control "no-cache" always;
    include /etc/nginx/snippets/front-headers.inc;
    try_files $uri /index.html;
}
