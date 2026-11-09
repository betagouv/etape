const NIR_MAX_CHARS = 13;
const NIR_GROUPS: readonly number[] = [1, 2, 2, 2, 3, 3];

export function formatNir(value: string): string {
  const chars = value.replace(/[^0-9AaBb]/g, "").slice(0, NIR_MAX_CHARS);
  let result = "";
  let pos = 0;
  for (const size of NIR_GROUPS) {
    if (pos >= chars.length) break;
    if (result) result += " ";
    result += chars.slice(pos, pos + size);
    pos += size;
  }
  return result;
}
