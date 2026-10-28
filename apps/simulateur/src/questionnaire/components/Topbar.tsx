import Link from "next/link";
import { LogOutIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@etape/ui/components/alert-dialog";
import { BrandMark } from "@etape/ui/components/brand-mark";
import { Button } from "@etape/ui/components/button";
import { Container } from "@etape/ui/components/container";

/**
 * Quitter ramène à l'accueil du simulateur. Les réponses restent dans le
 * `sessionStorage` : l'accueil propose alors de reprendre la simulation.
 */
const EXIT_HREF = "/";

/** Barre commune aux écrans du simulateur. */
export function Topbar() {
  return (
    <header className="border-divider bg-background shrink-0 border-b">
      <Container size="md" className="flex items-center justify-between gap-4 py-4">
        <BrandMark product="Simulateur d’éligibilité" className="min-w-0" />
        <ExitDialog />
      </Container>
    </header>
  );
}

function ExitDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          Quitter
        </Button>
      </AlertDialogTrigger>
      {/* Dès `sm`, sous « Quitter » : hauteur de la barre + 8 px, gouttière de `Container size="md"`. */}
      <AlertDialogContent
        placement="top-end"
        className="sm:top-[calc(4rem+1px+0.5rem)] sm:right-[max(1.5rem,calc((100vw-62rem)/2+2rem))]"
      >
        <AlertDialogHeader>
          <AlertDialogMedia variant="destructive">
            <LogOutIcon aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Voulez-vous vraiment quitter le simulateur&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            Les données saisies dans le simulateur seront conservées jusqu’à la fermeture de
            l’onglet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="sm">Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive-subdued" size="sm" asChild>
            <Link href={EXIT_HREF}>Quitter</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
