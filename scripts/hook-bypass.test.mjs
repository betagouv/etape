import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findHookBypass } from "./hook-bypass.mjs";

describe("findHookBypass", () => {
  const refused = [
    "git push --no-verify",
    "git push origin feat/x --no-verify",
    "git commit --no-verify -m 'wip'",
    "git commit -n -m 'wip'",
    "git commit -nm 'wip'",
    "git add . && git commit -am 'wip' --no-verify",
    "HUSKY=0 git push",
    "SKIP_AI_REVIEW=1 git push",
    "env HUSKY=0 git commit -m 'x'",
    "export HUSKY=0",
    "export SKIP_AI_REVIEW=1",
    "git -c core.hooksPath=/dev/null push",
    "cd apps/api; git push --no-verify",
  ];

  const allowed = [
    "git push",
    "git push -u origin feat/review-ia-pre-push",
    "git push -n",
    "git commit -m 'Ajoute la review IA'",
    "git commit -am 'wip'",
    "git -C apps/api status",
    'grep -rn "--no-verify" docs/',
    "grep -rn SKIP_AI_REVIEW scripts/",
    "pnpm run ai-review",
    "HUSKY=1 git push",
    "",
  ];

  for (const command of refused) {
    it(`refuse ${JSON.stringify(command)}`, () => assert.ok(findHookBypass(command)));
  }

  for (const command of allowed) {
    it(`laisse passer ${JSON.stringify(command)}`, () =>
      assert.equal(findHookBypass(command), undefined));
  }
});
