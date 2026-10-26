import { HOME_PATH } from "@etape/session";
import { Button } from "@etape/ui/components/button";
import { Container } from "@etape/ui/components/container";
import { focusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { CircleUserRoundIcon } from "lucide-react";

import { LogoutDialog } from "./logout-dialog";

/** Barre commune aux écrans de l'espace bénéficiaire. */
export function Topbar() {
  return (
    <header className="border-divider bg-background border-b">
      <Container size="app" className="flex items-center justify-between gap-4 py-4">
        <Link to={HOME_PATH} className={cn("flex items-baseline gap-2 rounded-sm", focusRing)}>
          <span className="font-heading text-heading-sm text-primary">etape.</span>
          <span className="text-body text-foreground font-semibold">Espace bénéficiaire</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {/* Sans action tant que la page « Mon compte » n'existe pas. */}
            <Button type="button" variant="ghost-primary" size="compact">
              <CircleUserRoundIcon aria-hidden="true" />
              Mon compte
            </Button>
            <LogoutDialog />
          </div>
        </div>
      </Container>
    </header>
  );
}
