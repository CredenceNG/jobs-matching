type LogLevel = "debug" | "info" | "warn" | "error";

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: LogData
  ): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data && Object.keys(data).length > 0) {
      return `${baseMessage} ${JSON.stringify(
        data,
        null,
        this.isDevelopment ? 2 : 0
      )}`;
    }

    return baseMessage;
  }

  debug(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: LogData): void {
    console.info(this.formatMessage("info", message, data));
  }

  warn(message: string, data?: LogData): void {
    console.warn(this.formatMessage("warn", message, data));
  }

  error(message: string, data?: LogData): void {
    console.error(this.formatMessage("error", message, data));
  }

  // Performance timing helper
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();
