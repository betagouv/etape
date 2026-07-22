import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-zinc-900">
      {/* En-tête : logo seul, sans menu */}
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center px-6">
          <Image
            src="/transitions-pro-logo.svg"
            alt="Transitions Pro"
            width={150}
            height={74}
            priority
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6">
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          {/* Placeholder image */}
          <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-zinc-100 text-zinc-400">
            <div className="flex flex-col items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span className="text-sm font-medium">Image</span>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex flex-col gap-8">
            <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Un projet de reconversion ?
              <br />
              Trouvez par où commencer.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600">
              Le simulateur recense l&apos;ensemble des dispositifs français de reconversion et
              d&apos;évolution professionnelle, et vous indique en quelques minutes ceux auxquels
              vous êtes éligible, puis vous oriente vers le bon organisme.
            </p>
            <div>
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1b7a5e] px-6 text-base font-medium text-white transition-colors hover:bg-[#155f49]"
              >
                C&apos;est parti !
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
