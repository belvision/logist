import 'dotenv/config';
import { Client } from 'pg';

function buildPostgresAdminUrl(url: string): string {
  try {
    const u = new URL(url);
    // Подключаемся к системной БД postgres
    u.pathname = '/postgres';
    // Удаляем параметры специфичные для sslmode, если не нужны на админ-коннекте
    return u.toString();
  } catch {
    return url;
  }
}

async function ensureDatabaseExists() {
  const targetDbUrl = process.env.DB_URL || process.env.DATABASE_URL;
  if (!targetDbUrl) {
    console.error('DB_URL / DATABASE_URL не задан');
    process.exit(1);
  }

  const targetDbName = (() => {
    try {
      const u = new URL(targetDbUrl);
      return u.pathname.replace('/', '');
    } catch {
      return 'logistgo';
    }
  })();

  const adminUrl = buildPostgresAdminUrl(targetDbUrl);
  const client = new Client({ connectionString: adminUrl });
  try {
    await client.connect();
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
      [targetDbName],
    );
    const exists = rows[0]?.exists === true;
    if (!exists) {
      await client.query(`CREATE DATABASE ${JSON.stringify(targetDbName).replaceAll('"', '')} ENCODING 'UTF8' TEMPLATE template0`);
      console.log(`Создана БД: ${targetDbName}`);
    } else {
      console.log(`БД уже существует: ${targetDbName}`);
    }
  } finally {
    await client.end().catch(() => {});
  }

  // Ensure schema "app" exists in the TARGET database
  const targetClient = new Client({ connectionString: targetDbUrl });
  try {
    await targetClient.connect();
    await targetClient.query(`CREATE SCHEMA IF NOT EXISTS app`);
    console.log('Схема app проверена/создана.');
  } finally {
    await targetClient.end().catch(() => {});
  }
}

ensureDatabaseExists().catch((err) => {
  console.error('Ошибка при создании БД:', err);
  process.exit(1);
});




