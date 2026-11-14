const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function createReference(taken: ReadonlySet<string>): string {
  let reference: string;
  do {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
    }
    reference = `JTK-${code}`;
  } while (taken.has(reference));
  return reference;
}
