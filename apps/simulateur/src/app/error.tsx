"use client";

import Link from "next/link";

import { Button } from "@etape/ui/components/button";
import { Container } from "@etape/ui/components/container";

export default function Error({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <Container size="md" className="flex flex-1 flex-col items-center justify-center py-16">
      <div className="flex max-w-[600px] flex-col items-center gap-6 text-center">
        <h1 className="text-foreground text-2xl leading-8 font-bold md:text-[28px] md:leading-9">
          Une erreur est survenue
        </h1>
        <p className="text-content-secondary text-base leading-6">
          Le simulateur n’a pas pu afficher cette étape. Réessayer relance l’affichage sans perdre
          les réponses déjà saisies.
        </p>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Button type="button" onClick={unstable_retry} className="min-h-11 rounded-lg px-6">
            Réessayer
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground min-h-11 rounded-lg px-6"
          >
            <Link href="/">Retour à l’accueil</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
