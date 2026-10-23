# OVC API — cPanel deployment checklist

This guide accompanies `ovc-cpanel-api.zip`. It assumes an existing Next.js frontend and keeps PHP source, SQL files, secrets and media outside the API public web root.

## Before upload

1. In cPanel → **MySQL Databases**, use your existing database—do not create a second one just for this setup. Use its exact prefixed database name. Ensure the PHP app has a separate database user with access to it (`SELECT`, `INSERT`, `UPDATE`, `DELETE`; schema setup/migrations additionally require DDL permissions during import). If the existing account lacks an application user, create only that user and grant access to the existing database.
2. In cPanel → **Domains/Subdomains**, create an API hostname such as `api.ovcconstructions.com`. Set its document root to the extracted archive's `public/` directory, for example `/home/ACCOUNT/ovc-api/public`. Do not point it to the `ovc-api/` parent. Issue/enable TLS before using admin login.
3. Confirm the hosting account supports PHP 8.1+, PDO MySQL (`pdo_mysql`), fileinfo, PHP sessions, Apache rewrite (`mod_rewrite`) and writable private storage.

## Upload and extract

1. Download `ovc-cpanel-api.zip` to your computer.
2. In cPanel File Manager, create `/home/ACCOUNT/ovc-api/` outside `public_html`.
3. Upload and extract the ZIP there. It creates an `ovc-api/` folder containing `public/`, `src/`, `config/`, `database/`, `storage/`, `README.md`, `.env.example` and `openapi.yaml`. Move that folder's *contents* to `/home/ACCOUNT/ovc-api/` if the archive added a nested directory, so the final layout is:

```text
/home/ACCOUNT/ovc-api/
├── config/local.php.example
├── database/schema.sql
├── public/index.php       ← API subdomain document root
├── public/.htaccess
├── src/bootstrap.php
└── storage/media/.htaccess
```

4. If the PHP host lets you create environment variables, use the variable names in `.env.example`. Otherwise, copy `config/local.php.example` to `config/local.php` **outside the web root**, edit the placeholders, and save it with restrictive permissions (for example `0600` where cPanel allows). Never upload real credentials into `public/` or commit them to Git.
5. Generate unique strong values for `DB_PASSWORD`, `ADMIN_USERNAME`, the admin password (store only its `password_hash` output), and `RATE_LIMIT_HMAC_KEY` (at least 32 random bytes). Set `CORS_ALLOWED_ORIGINS` to exact origins, e.g. `https://ovcconstructions.com,https://www.ovcconstructions.com`; set `SESSION_COOKIE_SECURE=true`; use `SESSION_SAMESITE=Lax` for same-site subdomains. Set `PUBLIC_API_URL=https://api.ovcconstructions.com/api` and the cPanel-prefixed `DB_NAME` and `DB_USER`.
6. Set `MEDIA_STORAGE_PATH` to a writable private absolute path outside the document root, e.g. `/home/ACCOUNT/private/ovc-media`. Create the directory and grant the PHP account write access. Keep the default upload cap and set PHP `upload_max_filesize`/`post_max_size` to at least that value.

## Import the database

In cPanel → **phpMyAdmin**, click your existing database, then choose **Import**. If it is empty and has no OVC tables, import `database/schema.sql`. If it already contains the earlier OVC schema, back it up and import `database/migrations/002_production_ready_api.sql` followed by `database/migrations/003_projects.sql`. The SQL files deliberately do not create or select a hard-coded database, so they work with your existing cPanel-prefixed database. Do not import both the fresh schema and migration series into the same database. If your database already has a custom schema, do not run either blindly—compare its tables/columns first and adapt the migration safely.

## Configure the frontend

Set this build/runtime variable on the Next.js host (Vercel or the deployment provider):

```text
NEXT_PUBLIC_CMS_API_URL=https://api.ovcconstructions.com/api
NEXT_PUBLIC_SITE_URL=https://ovcconstructions.com
```

Redeploy the frontend after setting variables. The PHP API allows public GET routes without admin credentials. Admin browser requests use the session cookie with credentials and a CSRF header; the exact frontend origins must be allowed by the API's CORS list. With same-site subdomains, SameSite=Lax is normally appropriate; browser cookie rules and hosting proxy behavior still need testing.

## Verify staging before launch

1. Open `https://api.ovcconstructions.com/api/health`. Expect HTTP 200 with `checks.php`, `checks.database`, `checks.schema` and `checks.ready` all true. A 503 means check PHP error logs, DB credentials and schema/migration state.
2. Open `/admin`, sign in with the configured account, and confirm page content, project records, uploads and enquiries load.
3. Create a project as a draft; verify it is not public. Publish it; verify it appears at `/projects`, its `/projects/{slug}` detail page renders, and its URL appears in `/sitemap.xml` after the five-minute revalidation window.
4. Submit a real test enquiry in staging and verify it appears in the admin inbox. Then remove the test record and ensure test personal data is not retained.
5. Upload a small approved image, attach it as a project cover, publish the media and project, verify the public cover stream, then unpublish or delete the test media.
6. Remove test accounts and data as appropriate, review PHP logs, and configure database/media backups and an enquiry-retention policy.

The API does not send email notifications for enquiries. Staff use the protected `/admin` inbox. Keep `config/local.php`, database backups and uploaded media private.
