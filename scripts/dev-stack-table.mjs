/**
 * Tableau des services affiché par `pnpm run dev:stack` et `pnpm run dev:tunnel`
 * une fois la pile prête, puis à chaque appui sur Entrée.
 *
 * Bordures seulement si le tableau tient dans la largeur du terminal : une ligne
 * repliée casse un cadre bien plus qu'une liste. Sinon, la même chose sans cadre.
 */

/** Ce que la colonne d'état affiche : un service sondé répond ou non, une ligne d'information n'a pas d'état. */
export const ROW_STATE = {
  UP: "up",
  DOWN: "down",
  INFO: "info",
};

/** @type {Record<string, string>} */
const STATE_SYMBOL = {
  [ROW_STATE.UP]: "✓",
  [ROW_STATE.DOWN]: "✗",
  [ROW_STATE.INFO]: " ",
};

const INDENT = "  ";

/**
 * @typedef {{ state: string, label: string, value: string }} TableRow
 * @typedef {{ title: string, rows: TableRow[] }} TableSection
 */

/**
 * @param {TableSection[]} sections
 * @param {number | undefined} maxWidth Largeur du terminal ; `undefined` hors terminal.
 * @returns {string}
 */
export function renderTable(sections, maxWidth) {
  const rows = sections.flatMap((section) => section.rows);
  const labelWidth = Math.max(...rows.map((row) => row.label.length));
  const valueWidth = Math.max(
    ...rows.map((row) => row.value.length),
    ...sections.map((section) => section.title.length),
  );
  // « │ ✓  libellé  valeur │ »
  const innerWidth = labelWidth + valueWidth + 7;
  const tableWidth = INDENT.length + innerWidth + 2;

  if (maxWidth !== undefined && tableWidth > maxWidth) {
    return renderPlain(sections, labelWidth);
  }

  const formatRow = (row) =>
    `${INDENT}│ ${STATE_SYMBOL[row.state]}  ${row.label.padEnd(labelWidth)}  ${row.value.padEnd(valueWidth)} │`;
  const formatRule = (left, title, right) =>
    `${INDENT}${left}─ ${title} ${"─".repeat(innerWidth - title.length - 3)}${right}`;

  return [
    ...sections.flatMap((section, index) => [
      index === 0 ? formatRule("┌", section.title, "┐") : formatRule("├", section.title, "┤"),
      ...section.rows.map(formatRow),
    ]),
    `${INDENT}└${"─".repeat(innerWidth)}┘`,
  ].join("\n");
}

/** @param {TableSection[]} sections @param {number} labelWidth */
function renderPlain(sections, labelWidth) {
  return sections
    .map((section) =>
      [
        `${INDENT}${section.title}`,
        ...section.rows.map(
          (row) =>
            `${INDENT}  ${STATE_SYMBOL[row.state]}  ${row.label.padEnd(labelWidth)}  ${row.value}`,
        ),
      ].join("\n"),
    )
    .join("\n\n");
}
