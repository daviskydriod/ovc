-- OVC Website: MySQL 8+ / compatible MariaDB single-import schema.
-- Select the existing OVC database in cPanel/phpMyAdmin, back it up, then import this file once.
-- This creates the complete current schema and conditionally upgrades the previous OVC schema.
-- No application `users` table is created or required. Administrator credentials stay in private PHP configuration.
-- This file never creates or selects a database, and is safe to import again.

-- Flexible page copy managed from the admin dashboard; consume values as plain text.
CREATE TABLE IF NOT EXISTS site_sections (
  section_key VARCHAR(80) NOT NULL,
  content_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (section_key),
  KEY idx_site_sections_updated (updated_at)
) ENGINE=InnoDB;

-- Binary assets are stored outside the public web root; this table stores metadata only.
CREATE TABLE IF NOT EXISTS media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename VARCHAR(100) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  media_type ENUM('image', 'video') NOT NULL,
  title VARCHAR(180) NOT NULL DEFAULT '',
  alt_text VARCHAR(300) NOT NULL DEFAULT '',
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_filename (filename),
  KEY idx_media_public_order (is_published, sort_order, created_at),
  KEY idx_media_type_created (media_type, created_at)
) ENGINE=InnoDB;

-- Project records can use a legacy media item or a direct approved GitHub image URL as cover.
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT '',
  cover_media_id BIGINT UNSIGNED NULL,
  cover_url VARCHAR(2048) NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_slug (slug),
  KEY idx_projects_public_order (status, sort_order, created_at),
  CONSTRAINT fk_projects_cover_media FOREIGN KEY (cover_media_id) REFERENCES media (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Contact submissions contain personal data. Apply a retention/deletion policy.
-- IP addresses are not stored directly; ip_hash uses RATE_LIMIT_HMAC_KEY for abuse limits.
CREATE TABLE IF NOT EXISTS contact_enquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(254) NOT NULL,
  service VARCHAR(120) NOT NULL,
  location VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  status ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
  internal_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_enquiries_status_created (status, created_at),
  KEY idx_enquiries_ip_created (ip_hash, created_at)
) ENGINE=InnoDB;

-- Migration tracking; the completed database layout is version 3.
CREATE TABLE IF NOT EXISTS schema_version (
  version INT UNSIGNED NOT NULL PRIMARY KEY,
  description VARCHAR(180) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Compatibility upgrades for installations made from the original OVC schema.
-- Each ALTER is guarded by INFORMATION_SCHEMA so the same file works for both fresh
-- databases and older OVC databases, and can be safely imported again.

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_sections' AND COLUMN_NAME = 'created_at') = 0,
  'ALTER TABLE site_sections ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP FIRST',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_sections' AND INDEX_NAME = 'idx_site_sections_updated') = 0,
  'ALTER TABLE site_sections ADD KEY idx_site_sections_updated (updated_at)',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media' AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE media ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media' AND INDEX_NAME = 'idx_media_type_created') = 0,
  'ALTER TABLE media ADD KEY idx_media_type_created (media_type, created_at)',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_enquiries' AND COLUMN_NAME = 'internal_note') = 0,
  'ALTER TABLE contact_enquiries ADD COLUMN internal_note TEXT NULL AFTER status',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_enquiries' AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE contact_enquiries ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_enquiries' AND INDEX_NAME = 'idx_enquiries_created') > 0,
  'ALTER TABLE contact_enquiries DROP INDEX idx_enquiries_created',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_enquiries' AND INDEX_NAME = 'idx_enquiries_status_created') = 0,
  'ALTER TABLE contact_enquiries ADD KEY idx_enquiries_status_created (status, created_at)',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

SET @ovc_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'cover_url') = 0,
  'ALTER TABLE projects ADD COLUMN cover_url VARCHAR(2048) NULL AFTER cover_media_id',
  'SELECT 1'
);
PREPARE ovc_stmt FROM @ovc_ddl; EXECUTE ovc_stmt; DEALLOCATE PREPARE ovc_stmt;

INSERT IGNORE INTO schema_version (version, description)
VALUES (3, 'Complete OVC content, media, projects and enquiries schema; single-import installer');
INSERT IGNORE INTO schema_version (version, description)
VALUES (4, 'Projects support direct GitHub-hosted image URLs');
