import { PrismaClient } from "./generated/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

let adapter;

if (import.meta.env.TURSO_DATABASE_URL && import.meta.env.TURSO_AUTH_TOKEN) {
    const libsqlClient = createClient({
        url: import.meta.env.TURSO_DATABASE_URL,
        authToken: import.meta.env.TURSO_AUTH_TOKEN,
    });
    // @ts-ignore - PrismaLibSql internal types mismatch with isolated client export
    adapter = new PrismaLibSql(libsqlClient);
} else {
    // Fallback to local sqlite for development if Turso is not configured
    const dbUrl = import.meta.env.DATABASE_URL!.replace('file:', '');
    const sqlite = new Database(dbUrl);
    // @ts-ignore - PrismaBetterSqlite3 expects a Database instance but types are misaligned
    adapter = new PrismaBetterSqlite3(sqlite);
}

export const db = new PrismaClient({ adapter });