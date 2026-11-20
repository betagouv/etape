import { Outlet } from "@tanstack/react-router";

import { Topbar } from "./topbar";

/** Mise en page commune aux écrans de l'espace bénéficiaire. */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      {/* En colonne : un écran qui a son propre fond l'étire jusqu'au bas de la fenêtre. */}
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
