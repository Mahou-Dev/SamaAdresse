export type ClassValue = string | number | boolean | null | undefined | ClassValue[];

/**
 * Assemble des classes CSS conditionnelles de manière légère sans dépendance externe.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string' || typeof input === 'number') {
      const trimmed = String(input).trim();
      if (trimmed) classes.push(trimmed);
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    }
  }

  return classes.join(' ');
}
