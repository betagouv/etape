"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { focusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";

import { isCurrentPage } from "@/lib/navigation";
import type { FooterLink } from "@/lib/footer";

const linkClassName = cn(
  "text-content-secondary hover:text-content-accent rounded-sm text-sm hover:underline hover:underline-offset-4",
  focusRing,
);

export function FooterAnchor({ link }: { link: FooterLink }) {
  const pathname = usePathname();
  const isInternalRoute =
    !link.isExternal && link.href.startsWith("/") && !link.href.startsWith("//");

  if (isInternalRoute) {
    const isCurrent = isCurrentPage(link.href, pathname);

    return (
      <Link
        href={link.href}
        aria-current={isCurrent ? "page" : undefined}
        className={cn(linkClassName, isCurrent && "text-content-accent font-semibold")}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      {...(link.isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
      className={linkClassName}
    >
      {link.label}
      {link.isExternal ? <span className="sr-only"> (nouvelle fenêtre)</span> : null}
    </a>
  );
}
