import { Outlet } from "@tanstack/react-router";

import { Topbar } from "./topbar";

/** Mise en page commune aux écrans de l'espace bénéficiaire. */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
