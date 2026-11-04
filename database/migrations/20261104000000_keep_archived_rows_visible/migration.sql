-- "Arsipkan" used to set deleted_at, which hid archived mountains, routes and
-- trips from the admin with no way back. Archiving now only sets status to
-- ARCHIVED, so bring back the rows that were archived that way.
UPDATE "mountains" SET "deleted_at" = NULL WHERE "status" = 'ARCHIVED' AND "deleted_at" IS NOT NULL;
UPDATE "routes" SET "deleted_at" = NULL WHERE "status" = 'ARCHIVED' AND "deleted_at" IS NOT NULL;
UPDATE "trips" SET "deleted_at" = NULL WHERE "status" = 'ARCHIVED' AND "deleted_at" IS NOT NULL;
