-- OVC Website: MySQL 8+ / MariaDB schema
-- Select/create the target database in cPanel/phpMyAdmin first, then import this file.
-- Existing installations should use the numbered migrations instead of re-importing.

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

-- Project records can reference a published image/video library item as their cover.
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT '',
  cover_media_id BIGINT UNSIGNED NULL,
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

-- Database migration tracking; version 3 includes admin-manageable project records.
CREATE TABLE IF NOT EXISTS schema_version (
  version INT UNSIGNED NOT NULL PRIMARY KEY,
  description VARCHAR(180) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT IGNORE INTO schema_version (version, description) VALUES (3, 'Organized content, media, enquiries and project CRUD schema');
