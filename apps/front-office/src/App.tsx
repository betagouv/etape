import { Topbar } from "./components/topbar";
import { DossierHeader, type DossierHeaderProps } from "./dossier/components/dossier-header";
import { formatUpdatedAt } from "./dossier/domain/progress";
import { STATUT_DOSSIER } from "./dossier/domain/statut-dossier";

const updatedAt = new Date();
updatedAt.setHours(14, 32, 0, 0);

// Données de la maquette, en attendant celles de l'API.
const DOSSIER_DEMO: DossierHeaderProps = {
  title: "Démission-reconversion",
  subtitle: "Projet de formation",
  numero: "123456",
  statut: STATUT_DOSSIER.BROUILLON,
  updatedAtLabel: formatUpdatedAt(updatedAt, new Date()),
  progress: { completed: 0, total: 5 },
};

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex-1">
        <DossierHeader {...DOSSIER_DEMO} />
      </main>
    </div>
  );
}
