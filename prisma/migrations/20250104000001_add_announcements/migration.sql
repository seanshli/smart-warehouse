-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_source_source_id_idx" ON "announcements"("source", "source_id");

-- CreateIndex
CREATE INDEX "announcements_target_type_target_id_idx" ON "announcements"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "announcements_is_active_created_at_idx" ON "announcements"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "announcement_reads_user_id_household_id_idx" ON "announcement_reads"("user_id", "household_id");

-- CreateIndex
CREATE INDEX "announcement_reads_announcement_id_idx" ON "announcement_reads"("announcement_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_user_id_household_id_key" ON "announcement_reads"("announcement_id", "user_id", "household_id");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION;


