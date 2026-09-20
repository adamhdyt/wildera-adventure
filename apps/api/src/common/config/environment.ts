export type RuntimeEnvironment =
  'development' | 'staging' | 'production' | 'test';

export interface Environment {
  DATABASE_URL: string;
  HOST: string;
  NODE_ENV: RuntimeEnvironment;
  PORT: number;
  SESSION_SECRET: string;
}

const runtimeEnvironments = new Set<RuntimeEnvironment>([
  'development',
  'staging',
  'production',
  'test',
]);

export function validateEnvironment(
  input: Record<string, unknown>,
): Environment {
  const databaseUrl = String(input.DATABASE_URL ?? '').trim();
  if (!databaseUrl) throw new Error('DATABASE_URL wajib diisi.');
  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL harus berupa URL PostgreSQL yang valid.');
  }
  if (!['postgresql:', 'postgres:'].includes(parsedDatabaseUrl.protocol)) {
    throw new Error('DATABASE_URL harus menggunakan PostgreSQL.');
  }

  const port = Number(input.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT harus berupa integer antara 1 dan 65535.');
  }

  const nodeEnvironment = String(
    input.NODE_ENV ?? 'development',
  ) as RuntimeEnvironment;
  if (!runtimeEnvironments.has(nodeEnvironment)) {
    throw new Error(
      'NODE_ENV harus development, staging, production, atau test.',
    );
  }

  const host = String(input.HOST ?? '127.0.0.1').trim();
  if (!host) throw new Error('HOST tidak boleh kosong.');

  const sessionSecret = String(input.SESSION_SECRET ?? '');
  if (sessionSecret.length < 32 || sessionSecret.startsWith('replace_')) {
    throw new Error('SESSION_SECRET wajib berisi minimal 32 karakter.');
  }

  return {
    DATABASE_URL: databaseUrl,
    HOST: host,
    NODE_ENV: nodeEnvironment,
    PORT: port,
    SESSION_SECRET: sessionSecret,
  };
}
