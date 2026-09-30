// apps/backend/src/db/config.ts
import dotenv from 'dotenv';
dotenv.config();

/** Утилиты для чтения ENV */
type EnvType = 'string' | 'number' | 'boolean' | 'array';

const string = (key: string) => ({ key, type: 'string' as const });
const integer = (key: string) => ({ key, type: 'number' as const });
const boolean = (key: string) => ({ key, type: 'boolean' as const });
// const array   = (key: string) => ({ key, type: 'array'   as const });

const parseEnvValue = <T extends EnvType>(
  rawValue: string | undefined,
  key: string,
  type: T,
):
  | (T extends 'string'
      ? string
      : T extends 'number'
        ? number
        : T extends 'boolean'
          ? boolean
          : T extends 'array'
            ? string[]
            : never)
  | undefined => {
  if (rawValue === undefined) return undefined;

  try {
    switch (type) {
      case 'string':
        return rawValue as any;
      case 'number': {
        const num = Number(rawValue);
        return Number.isFinite(num) ? (num as any) : undefined;
      }
      case 'boolean': {
        const lower = rawValue.toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(lower)) return true as any;
        if (['false', '0', 'no', 'n'].includes(lower)) return false as any;
        console.warn(`[config] ENV ${key} has invalid boolean "${rawValue}" → using undefined`);
        return undefined;
      }
      case 'array':
        return rawValue
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean) as any;
      default:
        return undefined;
    }
  } catch (err) {
    console.error(`[config] parse error for ${key}:`, err);
    return undefined;
  }
};

interface EnvTypeInfo<T extends EnvType> {
  key: string;
  type: T;
}

function getEnv<T extends EnvType>(typeInfo: EnvTypeInfo<T>) {
  const { key, type } = typeInfo;
  const raw = process.env[key];

  return {
    default: <
      V extends T extends 'string'
        ? string
        : T extends 'number'
          ? number
          : T extends 'boolean'
            ? boolean
            : T extends 'array'
              ? string[]
              : never
    >(def: V) => (parseEnvValue(raw, key, type) ?? def) as V,

    required: <
      V extends T extends 'string'
        ? string
        : T extends 'number'
          ? number
          : T extends 'boolean'
            ? boolean
            : T extends 'array'
              ? string[]
              : never
    >(msg?: string) => {
      const parsed = parseEnvValue(raw, key, type);
      if (parsed === undefined) {
        throw new Error(msg ?? `[config] Missing required ENV ${key}`);
      }
      return parsed as V;
    },
  };
}

/** Явные типы конфига — чтобы TS «видел» все поля (в т.ч. jwtExpiresIn) */
type AppConfig = {
  apiUrl: string;
  frontendBaseUrl: string;
  port: number;
  env: string;
  debug: boolean;
};

type CorsConfig = { origin: string };

type PostgresConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  databaseUrl: string;
  migrationsFolder: string;
};

type AuthConfig = {
  jwtSecret: string;
  expiresIn: string;          // == access
  tokenTtl: string;           // alias для обратной совместимости
  jwtExpiresIn: string;       // alias для обратной совместимости
  refreshSecret: string;      // NEW: секрет для refresh-токена
  refreshExpiresIn: string;   // NEW: TTL для refresh-токена
};

export type Config = {
  app: AppConfig;
  cors: CorsConfig;
  postgres: PostgresConfig;
  auth: AuthConfig;
};

/** Конфиг приложения */
export const config: Config = {
  app: {
    // фронт по умолчанию на 3000
    apiUrl: getEnv(string('API_URL')).default('http://localhost:3000') as string,
    frontendBaseUrl: getEnv(string('FRONTEND_BASE_URL')).default('http://localhost:3000') as string,
    // бэкенд (Hono) по умолчанию поднимаем на 8080
    port: getEnv(integer('PORT')).default(8080) as number,
    env: getEnv(string('NODE_ENV')).default('development') as string,
    debug: getEnv(boolean('DEBUG')).default(true) as boolean,
  },

  cors: {
    origin: getEnv(string('CORS_ORIGIN')).default('http://localhost:3000') as string,
  },

  postgres: {
    // эти поля вторичны, основное — databaseUrl
    host: getEnv(string('POSTGRES_HOST')).default('localhost') as string,
    port: getEnv(integer('POSTGRES_PORT')).default(5432) as number,
    user: getEnv(string('POSTGRES_USER')).default('postgres') as string,
    password: getEnv(string('POSTGRES_PASSWORD')).default('postgres') as string,
    database: getEnv(string('POSTGRES_DB')).default('logistic_pro') as string,

    // строка подключения — обязательно одна из переменных
    databaseUrl:
      getEnv(string('DATABASE_URL')).default(
        getEnv(string('DB_URL')).required('Missing DB_URL or DATABASE_URL'),
      ) as string,

    // путь к миграциям Drizzle
    migrationsFolder: getEnv(string('MIGRATIONS_FOLDER')).default('./drizzle') as string,
  },

  // JWT-конфиг
  auth: {
    // access-token
    jwtSecret: getEnv(string('JWT_SECRET')).required('Missing JWT_SECRET') as string,
    // совместимо с jsonwebtoken: "7d", "12h", "3600s" и т.п.
    expiresIn: getEnv(string('JWT_EXPIRES_IN')).default('7d') as string,

    // алиасы для совместимости (старый код мог читать другие ключи)
    tokenTtl: getEnv(string('JWT_EXPIRES_IN')).default('7d') as string,
    jwtExpiresIn: getEnv(string('JWT_EXPIRES_IN')).default('7d') as string,

    // refresh-token
    refreshSecret: getEnv(string('JWT_REFRESH_SECRET')).default(
      getEnv(string('JWT_SECRET')).required('Missing JWT_SECRET'),
    ) as string,
    refreshExpiresIn: getEnv(string('JWT_REFRESH_EXPIRES_IN')).default('7d') as string,
  },
};

export default config;
