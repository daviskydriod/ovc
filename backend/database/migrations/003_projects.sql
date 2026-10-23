-- OVC API migration 003 — apply once after migration 002 to an existing installation.
-- Back up first. Requires media table (migration 002 installation lineage).
-- Select the existing OVC database in phpMyAdmin before importing this migration.

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

INSERT INTO schema_version (version, description)
VALUES (3, 'Admin-managed project CRUD and cover image references');
