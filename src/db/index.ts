import { PrismaClient } from "./generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: import.meta.env.DATABASE_URL! });
export const db = new PrismaClient({ adapter });