import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderTable, ROW_STATE } from "./dev-stack-table.mjs";

const SECTIONS = [
  {
    title: "Pour les PO",
    rows: [
      { state: ROW_STATE.UP, label: "Front-office", value: "https://fo.example" },
      { state: ROW_STATE.INFO, label: "Compte de test", value: "test@etape.local" },
    ],
  },
  {
    title: "Pour toi",
    rows: [{ state: ROW_STATE.DOWN, label: "API", value: "https://fo.example/api" }],
  },
];

describe("renderTable", () => {
  it("encadre toutes les lignes à la même largeur", () => {
    const lines = renderTable(SECTIONS, 200).split("\n");
    assert.equal(new Set(lines.map((line) => line.length)).size, 1);
    assert.match(lines[0], /^ {2}┌─ Pour les PO ─+┐$/);
    assert.match(lines[3], /^ {2}├─ Pour toi ─+┤$/);
    assert.match(lines.at(-1), /^ {2}└─+┘$/);
  });

  it("marque l'état de chaque ligne", () => {
    const table = renderTable(SECTIONS, 200);
    assert.match(table, /│ ✓ {2}Front-office/);
    assert.match(table, /│ ✗ {2}API/);
    assert.match(table, /│ {4}Compte de test/);
  });

  it("renonce au cadre quand le terminal est trop étroit", () => {
    const table = renderTable(SECTIONS, 30);
    assert.doesNotMatch(table, /[┌│└]/);
    assert.match(table, /Pour toi\n {4}✗ {2}API/);
  });

  it("garde le cadre hors terminal, sans largeur connue", () => {
    assert.match(renderTable(SECTIONS, undefined), /┌/);
  });
});
