type Level = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function emit(level: Level, message: string, fields?: LogFields) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  };
  // In production, pipe this to a log drain (Vercel Log Drains, Axiom, etc.)
  // Structured JSON output keeps it queryable either way.
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
