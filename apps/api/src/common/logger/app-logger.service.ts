import { Injectable, type LoggerService } from '@nestjs/common';

type LogLevel = 'debug' | 'error' | 'info' | 'verbose' | 'warn';

const SENSITIVE_KEY_PATTERNS = new Set([
  'password',
  'passwordhash',
  'token',
  'secret',
  'sessionsecret',
  'sessionversion',
  'authorization',
  'cookie',
  'set-cookie',
  'nik',
  'identitynumber',
  'medicaldata',
  'medicalhistory',
  'healthnote',
]);

export function redactSensitiveData(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(
        /postgresql:\/\/[^:]+:[^@]+@/g,
        'postgresql://[REDACTED]:[REDACTED]@',
      )
      .replace(
        /postgres:\/\/[^:]+:[^@]+@/g,
        'postgres://[REDACTED]:[REDACTED]@',
      )
      .replace(/(Bearer\s+)[A-Za-z0-9-_.]+/gi, '$1[REDACTED]')
      .replace(/([?&](?:token|password|secret)=)[^&]+/gi, '$1[REDACTED]');
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactSensitiveData(v));
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
      if (SENSITIVE_KEY_PATTERNS.has(normalizedKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = redactSensitiveData(val);
      }
    }
    return sanitized;
  }
  return value;
}

@Injectable()
export class AppLogger implements LoggerService {
  log(message: unknown, context?: string) {
    this.write('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context, trace ? { trace } : undefined);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }

  request(fields: Record<string, unknown>) {
    this.write('info', 'request_completed', 'HTTP', fields);
  }

  exception(fields: Record<string, unknown>, trace?: string) {
    this.write('error', 'request_failed', 'HTTP', {
      ...fields,
      ...(trace ? { trace: redactSensitiveData(trace) } : {}),
    });
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    fields?: Record<string, unknown>,
  ) {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message:
        typeof message === 'string'
          ? redactSensitiveData(message)
          : String(message),
      ...(context ? { context } : {}),
      ...(fields
        ? (redactSensitiveData(fields) as Record<string, unknown>)
        : {}),
    });
    const stream = level === 'error' ? process.stderr : process.stdout;
    stream.write(`${entry}\n`);
  }
}
