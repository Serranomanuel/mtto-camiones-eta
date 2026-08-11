export function withGeneratedId(record: Record<string, unknown>): Record<string, unknown> {
  return { id: crypto.randomUUID(), ...record };
}
