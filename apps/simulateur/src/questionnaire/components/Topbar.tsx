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
import { Button } from "@etape/ui/components/button";
import { Container } from "@etape/ui/components/container";

/**
 * Quitter ramène à l'accueil du simulateur. Les réponses restent dans le
 * `sessionStorage` : l'accueil propose alors de reprendre la simulation.
 */
const EXIT_HREF = "/";

/**
 * Barre commune à tous les écrans du simulateur : marque, nom de l'outil, et
 * « Quitter », confirmé par une alerte.
 */
export function Topbar() {
  return (
    <header className="border-divider bg-background shrink-0 border-b">
      <Container size="md" className="flex items-center justify-between gap-4 py-4">
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="font-heading text-heading-sm text-primary">etape.</span>
          <span className="text-body text-foreground font-semibold">Simulateur d’éligibilité</span>
        </p>
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
      {/*
        Ancrée sous « Quitter » à partir de `sm`. `top` : hauteur de la barre
        (16 + 32 + 16, plus son filet) et 8 px d'écart. `right` : la gouttière
        de `Container size="md"` (`sm:px-6`, puis `lg:px-8` une fois la largeur
        maximale de 62rem atteinte), pour finir à l'aplomb du bouton.
      */}
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
