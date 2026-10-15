# En-têtes de chaque réponse d'un front. Dans un fichier à part, inclus dans
# chaque `location` : nginx n'hérite pas des `add_header` d'un niveau supérieur
# dès qu'un `location` en déclare un, et un en-tête oublié à un seul endroit ne
# se verrait pas à la relecture.

# Aucune page d'un front ne s'affiche dans un cadre : une page tierce qui
# l'enchâsserait pourrait faire cliquer à l'insu de la personne (clickjacking).
# `X-Frame-Options` pour les navigateurs qui ignorent `frame-ancestors`.
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;

# Environnement de recette : rien de tout cela n'a vocation à être indexé.
add_header X-Robots-Tag "noindex, nofollow" always;
