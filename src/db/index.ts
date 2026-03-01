import { PrismaClient } from "./generated/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
    url: import.meta.env.DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const db = new PrismaClient({ adapter });