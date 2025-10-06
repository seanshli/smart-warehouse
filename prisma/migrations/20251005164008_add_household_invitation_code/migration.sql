/*
  Warnings:

  - Made the column `invitationCode` on table `households` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_households" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "invitationCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_households" ("createdAt", "description", "id", "invitationCode", "name", "updatedAt") SELECT "createdAt", "description", "id", "invitationCode", "name", "updatedAt" FROM "households";
DROP TABLE "households";
ALTER TABLE "new_households" RENAME TO "households";
CREATE UNIQUE INDEX "households_invitationCode_key" ON "households"("invitationCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
