import Image from "next/image";

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
    label: "Tous profils",
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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white font-sans text-zinc-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-16 text-center">
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
          Un projet de reconversion ?
          <br />
          Trouvez par où commencer.
        </h1>

        {/* Description */}
        <p className="mt-10 max-w-2xl text-lg leading-8 text-zinc-600">
          Le simulateur recense l&apos;ensemble des dispositifs français de reconversion et
          d&apos;évolution professionnelle, et vous indique en quelques minutes ceux auxquels vous
          êtes éligible, puis vous oriente vers le bon organisme.
        </p>

        {/* CTA */}
        <a
          href="#"
          className="mt-12 inline-flex h-14 items-center justify-center rounded-lg bg-[#1b7a5e] px-8 text-lg font-medium text-white transition-colors hover:bg-[#155f49]"
        >
          Commencer
        </a>

        {/* Points clés */}
        <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-zinc-700">
          {benefits.map((benefit) => (
            <li key={benefit.label} className="flex items-center gap-2">
              <span className="text-[#1b7a5e]">{benefit.icon}</span>
              <span className="text-lg">{benefit.label}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
