type LogLevel = "info" | "warn" | "error";
type LogValue = string | number | boolean | null | undefined;
type LogFields = Record<string, LogValue>;

const levels: Record<LogLevel, number> = { info: 20, warn: 30, error: 40 };

function configuredLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.toLowerCase();
  return value === "warn" || value === "error" ? value : "info";
}

function formatValue(value: LogValue): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 160)
    .replace(/["']/g, "");
}

function write(level: LogLevel, scope: string, message: string, fields: LogFields = {}) {
  if (levels[level] < levels[configuredLevel()]) return;
  const metadata = Object.entries(fields)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(" ");
  const line = `${new Date().toISOString()} ${level.toUpperCase()} [${scope}] ${message}${metadata ? ` ${metadata}` : ""}`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

function errorKind(error: unknown): string {
  if (error && typeof error === "object" && "name" in error && typeof error.name === "string") {
    return error.name.slice(0, 80);
  }
  return "UnknownError";
}

export const logger = {
  info: (scope: string, message: string, fields?: LogFields) => write("info", scope, message, fields),
  warn: (scope: string, message: string, fields?: LogFields) => write("warn", scope, message, fields),
  error: (scope: string, message: string, fields?: LogFields) => write("error", scope, message, fields),
  errorKind,
};
