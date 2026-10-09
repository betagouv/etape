import { StatusRegion } from "@etape/ui/components/status-region";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { RouterProvider, type AnyRouter } from "@tanstack/react-router";

import { useAnnouncement } from "./announcer";

export interface SessionAppProps {
  router: AnyRouter;
  queryClient: QueryClient;
}

/**
 * La racine de chaque app. La région `role="status"` est hors du routeur : elle
 * reste montée quand l'attente au démarrage cède la place à l'app ou à un avis.
 */
export function SessionApp({ router, queryClient }: SessionAppProps) {
  const announcement = useAnnouncement();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <StatusRegion message={announcement} />
    </QueryClientProvider>
  );
}
