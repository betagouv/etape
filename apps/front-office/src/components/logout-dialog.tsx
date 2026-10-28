import { buildLogoutUrl } from "@etape/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@etape/ui/components/alert-dialog";
import { Button } from "@etape/ui/components/button";
import { LogOutIcon } from "lucide-react";

import { API_BASE_URL } from "@/lib/clients";

export function LogoutDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost-primary"
          size="icon-sm-wide"
          aria-label="Se déconnecter"
        >
          <LogOutIcon aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Se déconnecter&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            La session actuelle sera fermée. Une nouvelle connexion sera nécessaire.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction asChild>
            <a href={buildLogoutUrl(API_BASE_URL)}>Se déconnecter</a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
