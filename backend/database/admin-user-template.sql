-- Run this only AFTER database/schema.sql has created the users table.
-- Replace the username/display name as desired. Replace the hash placeholder with a PHP password_hash() value.
-- If your old private backend/.env contains ADMIN_PASSWORD_HASH, you may copy that hash here.
-- Otherwise generate locally on a machine with PHP: php -r 'echo password_hash("YOUR_NEW_PASSWORD", PASSWORD_DEFAULT), PHP_EOL;'
-- Never put the plaintext password in this file, Git, or chat. Do not import until the hash placeholder is replaced.
-- INSERT IGNORE prevents a repeated import from overwriting an existing user's password.

INSERT IGNORE INTO users (username, display_name, password_hash, role, is_active)
VALUES ('ovc-admin', 'OVC Administrator', 'REPLACE_WITH_PASSWORD_HASH', 'admin', 1);
