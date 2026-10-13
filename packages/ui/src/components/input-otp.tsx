"use client";

import * as React from "react";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";

import { cn } from "@etape/ui/lib/utils";

/*
 * Saisie découpée en cases, un caractère par case : un code, une année, un
 * mois. Source shadcn `input-otp`, sur la bibliothèque du même nom.
 *
 * Un SEUL `<input>`, transparent et posé sur les cases, porte la saisie : le
 * champ a un nom accessible, se colle d'un coup (« 1990 ») et s'efface au
 * retour arrière comme n'importe quel champ. Les cases n'en sont que l'image —
 * `InputOTPGroup` les masque aux technologies d'assistance, qui liraient sinon
 * chaque chiffre une seconde fois.
 *
 * Écart au kit shadcn : des cases de 48 px séparées, aux angles arrondis, comme
 * la maquette SIMULATEUR-v3, plutôt qu'une barre soudée de 36 px. L'erreur se
 * lit sur l'`<input>` (`aria-invalid`), pas sur des cases qui n'en ont pas le
 * rôle.
 */

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "group/input-otp flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      aria-hidden="true"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, placeholderChar, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "border-input bg-background text-foreground dark:bg-input/30 relative flex size-12 items-center justify-center rounded-lg border text-sm transition-[color,box-shadow] outline-none",
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        "group-has-[input[aria-invalid=true]]/input-otp:border-destructive group-has-[input[aria-invalid=true]]/input-otp:ring-destructive/20 dark:group-has-[input[aria-invalid=true]]/input-otp:ring-destructive/40 group-has-[input[aria-invalid=true]]/input-otp:ring-[3px]",
        className,
      )}
      {...props}
    >
      {char ?? <span className="text-muted-foreground">{placeholderChar}</span>}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="bg-foreground motion-safe:animate-caret-blink h-4 w-px" />
        </div>
      )}
    </div>
  );
}

/** Motif de saisie : des chiffres seulement (filtre la frappe et le collage). */
export { REGEXP_ONLY_DIGITS };

export { InputOTP, InputOTPGroup, InputOTPSlot };
