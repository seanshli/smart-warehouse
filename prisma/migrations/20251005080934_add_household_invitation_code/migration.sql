-- Add invitationCode column as nullable first
ALTER TABLE "households" ADD COLUMN "invitationCode" TEXT;

-- Generate unique invitation codes for existing households
UPDATE "households" SET "invitationCode" = 'INV-' || substr(hex(randomblob(4)), 1, 8) WHERE "invitationCode" IS NULL;

-- Make invitationCode NOT NULL and create unique index
CREATE UNIQUE INDEX "households_invitationCode_key" ON "households"("invitationCode");
