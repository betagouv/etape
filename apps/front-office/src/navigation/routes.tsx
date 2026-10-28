import { HOME_PATH, sessionRootRoute } from "@etape/session";
import { createRoute, notFound, redirect } from "@tanstack/react-router";

import { AppLayout } from "@/components/app-layout";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { DossierScreen } from "@/dossier/components/dossier-screen";
import { VoletScreen } from "@/dossier/components/volet-screen";
import { isVoletId } from "@/dossier/domain/volets";
import { VOLETS_DOSSIER } from "@/dossier/domain/volets-dossier";
import { VOLET_PATH } from "./paths";

// Garde de démarrage, avis et dialogue d'expiration : communs aux deux fronts,
// dans `@etape/session`.
const appLayoutRoute = createRoute({
  getParentRoute: () => sessionRootRoute,
  id: "app",
  component: AppLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: HOME_PATH,
  component: () => <PlaceholderScreen title="Mes dossiers" />,
});

const profilRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "profil",
  component: () => <PlaceholderScreen title="Mon profil" />,
});

const nouveauDossierRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "nouveau-dossier",
  component: () => <PlaceholderScreen title="Sélectionnez votre dispositif" />,
});

const typeProjetRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "nouveau-dossier/$dispositif",
  component: () => <PlaceholderScreen title="Type de projet" />,
});

const dossierRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "dossiers/$dossierId",
  component: DossierScreen,
});

const dossierIndexRoute = createRoute({
  getParentRoute: () => dossierRoute,
  path: "/",
  beforeLoad: ({ params }) => {
    throw redirect({ to: VOLET_PATH, params: { ...params, voletId: VOLETS_DOSSIER[0].id } });
  },
});

// Une seule route : la mise en page, et le focus avec, restent en place d'un volet à l'autre.
const voletRoute = createRoute({
  getParentRoute: () => dossierRoute,
  path: "$voletId",
  params: {
    parse: ({ voletId }) => {
      if (!isVoletId(voletId)) throw notFound();
      return { voletId };
    },
    stringify: ({ voletId }) => ({ voletId }),
  },
  component: VoletScreen,
});

export const routeTree = sessionRootRoute.addChildren([
  appLayoutRoute.addChildren([
    homeRoute,
    profilRoute,
    nouveauDossierRoute,
    typeProjetRoute,
    dossierRoute.addChildren([dossierIndexRoute, voletRoute]),
  ]),
]);
