CREATE DATABASE IF NOT EXISTS ovc_site CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ovc_site;

CREATE TABLE IF NOT EXISTS site_sections (
  section_key VARCHAR(80) NOT NULL PRIMARY KEY,
  content_json JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(100) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  media_type ENUM('image', 'video') NOT NULL,
  title VARCHAR(180) NOT NULL DEFAULT '',
  alt_text VARCHAR(300) NOT NULL DEFAULT '',
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_media_public_order (is_published, sort_order, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(254) NOT NULL,
  service VARCHAR(120) NOT NULL,
  location VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  status ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_enquiries_created (created_at),
  KEY idx_enquiries_ip_created (ip_hash, created_at)
) ENGINE=InnoDB;
