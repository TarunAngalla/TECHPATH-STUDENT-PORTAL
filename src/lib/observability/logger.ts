type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const SENSITIVE_KEY = /(authorization|cookie|password|secret|token|session|api[-_]?key|signeddocument|pdf|content)/i;
const MAX_STRING_LENGTH = 1500;

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  }
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message.slice(0, MAX_STRING_LENGTH),
      stack: process.env.NODE_ENV === "production" ? undefined : value.stack,
    };
  }
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, seen));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitize(item, seen),
    ]),
  );
}

function write(level: LogLevel, event: string, context: LogContext = {}) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: "techpath-portal",
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
    ...(sanitize(context) as LogContext),
  };
  const output = JSON.stringify(record);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else if (level === "info") console.info(output);
  else console.debug(output);
}

export const logger = {
  debug(event: string, context?: LogContext) { write("debug", event, context); },
  info(event: string, context?: LogContext) { write("info", event, context); },
  warn(event: string, context?: LogContext) { write("warn", event, context); },
  error(event: string, error?: unknown, context?: LogContext) {
    write("error", event, { ...context, error });
  },
};

export function sanitizeLogContext(context: LogContext) {
  return sanitize(context) as LogContext;
}
