ALTER TABLE "Minuts" ADD COLUMN "meetingType" TEXT;
ALTER TABLE "Minuts" ADD COLUMN "meetingTypeSource" TEXT NOT NULL DEFAULT 'auto';
