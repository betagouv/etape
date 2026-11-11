/** `groupChars("50393256800010", [3, 3, 3, 5])` → `503 932 568 00010` ; un groupe incomplet reste tel quel. */
export function groupChars(chars: string, sizes: readonly number[]): string {
  let result = "";
  let pos = 0;
  for (const size of sizes) {
    if (pos >= chars.length) break;
    if (result) result += " ";
    result += chars.slice(pos, pos + size);
    pos += size;
  }
  return result;
}
