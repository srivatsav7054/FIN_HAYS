type RuntimeErrorContext = Record<string, unknown>;

export function reportRuntimeError(error: unknown, context: RuntimeErrorContext = {}) {
  console.error("Sahaara runtime error", { error, ...context });
}