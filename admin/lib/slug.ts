// Ids in the catalog are lower-case words joined by hyphens, like the seeded ones
// ('jollof-grilled-tilapia'). A taken id gets a number on the end.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function uniqueSlug(text: string, taken: string[]): string {
  const base = slugify(text) || 'item';
  let candidate = base;
  for (let n = 2; taken.includes(candidate); n += 1) candidate = `${base}-${n}`;
  return candidate;
}
