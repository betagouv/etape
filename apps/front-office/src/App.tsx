import { Button } from "@etape/ui/components/button";

import { Topbar } from "./components/topbar";

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <h1 className="text-foreground text-xl font-semibold">ETAPE — front office</h1>
        <Button>Bouton de démonstration</Button>
      </main>
    </div>
  );
}
