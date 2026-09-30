/** Names are stored as "Gunung Semeru"; avoid rendering "Gunung Gunung Semeru". */
export function mountainTitle(name: string) {
  return /^gunung\b/i.test(name.trim()) ? name.trim() : `Gunung ${name.trim()}`;
}
