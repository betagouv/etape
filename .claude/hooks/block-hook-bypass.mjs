/**
 * Refuse à l'agent les commandes qui contournent les hooks git (`--no-verify`,
 * `HUSKY=0`, `SKIP_AI_REVIEW`…) : il ne saute pas ce qu'on impose aux humains.
 *
 * Branché sur PreToolUse (Bash) dans .claude/settings.json. Reçoit sur son
 * entrée standard la charge JSON du hook, dont `tool_input.command`. Sort en 2
 * pour refuser (Claude Code ne bloque que sur ce code), avec la raison sur
 * stderr ; en 0 sinon, y compris sur une charge illisible.
 *
 * En Node plutôt qu'en shell : la commande contient des guillemets échappés
 * qu'un `grep` sur le JSON brut lirait mal. La logique est dans
 * `scripts/hook-bypass.mjs`, testée par `pnpm run test:scripts`.
 */
import { readFileSync } from "node:fs";

import { findHookBypass } from "../../scripts/hook-bypass.mjs";

let command = "";
try {
  command = JSON.parse(readFileSync(0, "utf8")).tool_input?.command ?? "";
} catch {
  process.exit(0);
}

const reason = findHookBypass(command);
if (reason) {
  console.error(
    `Refusé : ${reason}. Les hooks du dépôt (lint-staged, typecheck, review IA) s'appliquent aussi à l'agent. Corrige ce qu'ils signalent, ou demande à l'utilisateur de pousser lui-même.`,
  );
  process.exit(2);
}
