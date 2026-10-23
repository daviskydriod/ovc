-- OVC API migration 002 — apply exactly once to a database created by the previous schema.sql.
-- Back up the database first. Run using a DB account allowed to ALTER the OVC tables.
-- Select the existing OVC database in phpMyAdmin before importing this migration.

ALTER TABLE site_sections
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP FIRST,
  ADD KEY idx_site_sections_updated (updated_at);

ALTER TABLE media
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD KEY idx_media_type_created (media_type, created_at);

ALTER TABLE contact_enquiries
  ADD COLUMN internal_note TEXT NULL AFTER status,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  DROP INDEX idx_enquiries_created,
  ADD KEY idx_enquiries_status_created (status, created_at);

CREATE TABLE IF NOT EXISTS schema_version (
  version INT UNSIGNED NOT NULL PRIMARY KEY,
  description VARCHAR(180) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT INTO schema_version (version, description)
VALUES (2, 'Organized media and enquiry metadata, timestamps, status and indexes');
