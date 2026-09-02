import "server-only";

export function createEntityId(prefix: "cli" | "ord" | "wri") {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${suffix}`;
}
