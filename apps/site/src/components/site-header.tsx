import Image from "next/image";
import Link from "next/link";

import { Container } from "@etape/ui/components/container";
import { focusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";

import { MainNav } from "@/components/main-nav";

/**
 * En-tête commun à toutes les pages du site : le logo Transitions Pro, qui
 * renvoie à la racine, suivi de la navigation principale.
 *
 * `relative` sert d'ancrage au panneau de navigation mobile, positionné juste
 * sous l'en-tête.
 */
export function SiteHeader() {
  return (
    <header className="border-divider bg-background relative border-b">
      <Container size="xl" className="flex items-center gap-4 py-4">
        <Link href="/" className={cn("shrink-0 rounded-sm", focusRing)}>
          {/*
            Le logo est le seul contenu du lien : son texte alternatif fait donc
            office de nom accessible pour ce lien, et doit décrire la
            destination plutôt que l'image.
            Dimensions issues du gabarit Figma (hauteur 41 px), la largeur
            découlant du ratio du SVG afin de ne pas le déformer.
          */}
          <Image
            src="/transitions-pro-logo.svg"
            alt="Transitions Pro — retour à l'accueil"
            width={83}
            height={41}
            priority
          />
        </Link>

        <MainNav />
      </Container>
    </header>
  );
}
