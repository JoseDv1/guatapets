-- CreateTable
CREATE TABLE "posts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT NOT NULL,
    "breed" TEXT,
    "color" TEXT,
    "gender" TEXT DEFAULT 'unknown',
    "image_url" TEXT,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "contact_email" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
