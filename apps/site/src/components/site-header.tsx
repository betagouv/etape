import Image from "next/image";
import Link from "next/link";

import { cn } from "@etape/ui/lib/utils";

import { Container } from "@/components/container";
import { MainNav } from "@/components/main-nav";
import { FOCUS_RING } from "@/lib/styles";

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
      <Container className="flex items-center gap-4 py-4">
        <Link href="/" className={cn("shrink-0 rounded-sm", FOCUS_RING)}>
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
