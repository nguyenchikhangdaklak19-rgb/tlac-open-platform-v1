// Prisma CLI config (schema/migrate/generate/seed). Required by Prisma 7 —
// `datasource.url` and `migrations.seed` are no longer read from
// schema.prisma / package.json's "prisma" field.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
