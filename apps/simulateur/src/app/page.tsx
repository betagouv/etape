import Image from "next/image";
import { Button } from "@etape/ui/components/button";
import { Container } from "@etape/ui/components/container";

const benefits = [
  {
    label: "Gratuit",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.5 4A5.5 5.5 0 0 0 9 9.5v5A5.5 5.5 0 0 0 14.5 20" />
        <path d="M5 10h6" />
        <path d="M5 14h6" />
      </svg>
    ),
  },
  {
    label: "Anonyme",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    ),
  },
  {
    label: "Sans dossier",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m9 10 6 4" />
        <path d="m15 10-6 4" />
      </svg>
    ),
  },
  {
    label: "Environ 5 min",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="10" y1="2" x2="14" y2="2" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <circle cx="12" cy="14" r="8" />
      </svg>
    ),
  },
  {
    label: "Sans engagement",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="bg-background text-foreground flex flex-1 flex-col items-center justify-center">
      <Container
        asChild
        size="md"
        className="flex flex-col items-center py-16 text-center focus-visible:outline-none"
      >
        <main id="contenu" tabIndex={-1}>
          {/* Logos partenaires */}
          <div className="flex items-center justify-center gap-8">
            <Image
              src="/transitions-pro-logo.svg"
              alt="Transitions Pro"
              width={150}
              height={74}
              priority
            />
            <Image
              src="/ministere-travail-logo.svg"
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

          {/* CTA — inerte : ne lance pas le questionnaire (cf. ticket) */}
          <Button size="lg" className="mt-12 h-14 px-8 text-lg">
            C&apos;est parti !
          </Button>

          {/* Points clés */}
          <ul className="text-foreground mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {benefits.map((benefit) => (
              <li key={benefit.label} className="flex items-center gap-2">
                <span className="text-primary">{benefit.icon}</span>
                <span className="text-lg">{benefit.label}</span>
              </li>
            ))}
          </ul>

          {/* Mention bas de page */}
          <p className="text-muted-foreground mt-12 text-sm">
            Une erreur ou un oubli ?{" "}
            <a
              href="#"
              className="text-primary font-medium underline underline-offset-4 hover:no-underline"
            >
              Aidez-nous à l&apos;améliorer
            </a>
            .
          </p>
        </main>
      </Container>
    </div>
  );
}
