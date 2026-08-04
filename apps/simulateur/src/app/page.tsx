import Image from "next/image";
import { EuroIcon, EyeOffIcon, FolderXIcon, TimerIcon, UsersIcon } from "lucide-react";

import { Container } from "@etape/ui/components/container";

import { HomeCta } from "@/questionnaire/components/HomeCta";

// `basePath` ne s'applique pas au `src` de `next/image` : les fichiers de
// `public/` doivent être préfixés à la main. Dérivé de `next.config.ts`, qui le
// tient lui-même de `paths.mjs`.
//
// Volontairement sans valeur de repli : un préfixe absent doit produire une URL
// manifestement cassée (`undefined/logo.svg`) plutôt qu'un chemin d'apparence
// valide (`/logo.svg`) qui passerait le build et ne 404 qu'une fois déployé.
const assets = process.env.NEXT_PUBLIC_BASE_PATH;

const benefits = [
  { label: "Gratuit", Icon: EuroIcon },
  { label: "Anonyme", Icon: EyeOffIcon },
  { label: "Sans dossier", Icon: FolderXIcon },
  { label: "Environ 5 min", Icon: TimerIcon },
  { label: "Tous profils", Icon: UsersIcon },
];

export default function Home() {
  return (
    <div className="bg-background text-foreground flex flex-1 flex-col items-center justify-center">
      <Container asChild size="md" className="flex flex-col items-center py-16 text-center">
        <main>
          {/* Logos partenaires */}
          <div className="flex items-center justify-center gap-8">
            <Image
              src={`${assets}/transitions-pro-logo.svg`}
              alt="Transitions Pro"
              width={150}
              height={74}
              priority
            />
            <Image
              src={`${assets}/ministere-travail-logo.svg`}
              alt="Ministère du Travail, de l'Emploi et de l'Insertion"
              width={114}
              height={90}
              priority
            />
          </div>

          {/* Titre */}
          <h1 className="mt-16 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            En pleine réflexion sur votre vie professionnelle ?
            <br />
            Trouvez par où commencer.
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mt-10 max-w-2xl text-lg leading-8">
            Le simulateur recense l&apos;ensemble des dispositifs français de reconversion et
            d&apos;évolution professionnelle, et vous indique en quelques minutes ceux auxquels vous
            êtes éligible, puis vous oriente vers le bon organisme.
          </p>

          <HomeCta />

          {/* Points clés */}
          <ul className="text-foreground mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {benefits.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon size={22} aria-hidden="true" className="text-primary" />
                <span className="text-lg">{label}</span>
              </li>
            ))}
          </ul>

        </main>
      </Container>
    </div>
  );
}
