import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/db/schema/schema.ts",   // правильный путь
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DB_URL ?? process.env.DATABASE_URL!,
  },
} satisfies Config;
