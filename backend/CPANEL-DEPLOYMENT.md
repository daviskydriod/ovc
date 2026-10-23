# OVC API — cPanel deployment checklist

This guide accompanies `ovc-cpanel-api.zip`. It assumes an existing Next.js frontend and keeps PHP source, SQL files, secrets and media outside the API public web root.

## Before upload

1. In cPanel → **MySQL Databases**, use your existing database—do not create a second one just for this setup. Use its exact prefixed database name and the MySQL connection account you already use for the application. The PHP API has no application `users` table; `DB_USER` is only the MySQL connection login. The account doing the import needs `CREATE`/`ALTER` permissions.
2. Create `api.ovcconstructions.com` and set its document root to the extracted archive's `public/` directory (for example `/home/ACCOUNT/ovc-api/public`). Keep the `ovc-api/` parent private, preserve the `/api` path for the PHP router, and issue/enable TLS before using admin login.
3. Confirm the hosting account supports PHP 8.1+, PDO MySQL (`pdo_mysql`), fileinfo, PHP sessions, Apache rewrite (`mod_rewrite`) and writable private storage.

## Upload and extract

1. Download `ovc-cpanel-api.zip` to your computer.
2. In cPanel File Manager, create `/home/ACCOUNT/ovc-api/` outside `public_html`.
3. Upload and extract the ZIP there. It creates an `ovc-api/` folder containing `public/`, `src/`, `config/`, `database/`, `storage/`, `.htaccess`, `.env.example` and `openapi.yaml`. Move that folder's *contents* to `/home/ACCOUNT/ovc-api/` if the archive added a nested directory, so the final layout is:

```text
/home/ACCOUNT/ovc-api/
├── .htaccess              ← blocks web requests for .env files
├── .env.example           ← copy to .env; keep both outside public/
├── config/local.php.example
├── database/schema.sql     ← one complete database import
├── database/admin-user-template.sql ← create the first administrator from a password hash
├── database/projects-seed-drafts.sql ← optional 23 client-image drafts
├── database/project-import-template.sql ← add approved projects and GitHub image links
├── public/index.php       ← API subdomain document root
├── public/.htaccess
├── src/bootstrap.php
└── storage/media/.htaccess
```

4. In File Manager, copy `.env.example` to `.env` in `/home/ACCOUNT/ovc-api/` (the same directory as `public/`, not inside it) and edit the copy with your private values. The PHP bootstrap loads this file automatically on shared hosting. The included root `.htaccess` also denies web requests for `.env` files as defense in depth; keep the API subdomain document root pointed to `public/` while the parent remains private. As an alternative, use `config/local.php.example` copied to `config/local.php`, also outside the web root. Real `.env` and `config/local.php` files are excluded from Git; never put real credentials in `public/` or commit them.
5. Set a strong `DB_PASSWORD` and generate `RATE_LIMIT_HMAC_KEY` (at least 32 random bytes). Administrator credentials are no longer read from `.env`; they are stored in MySQL as password hashes. Set `CORS_ALLOWED_ORIGINS` to exact origins, e.g. `https://ovc-lime.vercel.app,https://ovcconstructions.com,https://www.ovcconstructions.com`; set `SESSION_COOKIE_SECURE=true`; use `SESSION_SAMESITE=Lax` for same-site requests. Set `PUBLIC_API_URL=https://api.ovcconstructions.com/api` and the cPanel-prefixed `DB_NAME` and `DB_USER`.
6. Set `MEDIA_STORAGE_PATH` to a writable private absolute path outside the document root, e.g. `/home/ACCOUNT/private/ovc-media`. Create the directory and grant the PHP account write access. Keep the default upload cap and set PHP `upload_max_filesize`/`post_max_size` to at least that value.

## Import the database

In cPanel → **phpMyAdmin**, back up your existing database, click the database named in `DB_NAME`, then choose **Import** and import `database/schema.sql`. This idempotent file creates the complete current OVC schema, creates an empty `users` table, and adds `projects.cover_url`; safely re-import it after updating the API. It does not create/select a database or any administrator account. If your database has a custom, non-OVC schema, do not import blindly—compare its tables/columns first and adapt safely. Next, replace `REPLACE_WITH_PASSWORD_HASH` in `database/admin-user-template.sql` with a PHP `password_hash()` value and import it to create the first admin. To create 23 unpublished project drafts using client-provided image URLs, import `database/projects-seed-drafts.sql`; replace the placeholder titles/descriptions and publish reviewed entries from `/admin`. Alternatively, import only approved rows from `database/project-import-template.sql`.

## Configure the frontend

Set this build/runtime variable on the Next.js host (Vercel or the deployment provider):

```text
NEXT_PUBLIC_CMS_API_URL=https://api.ovcconstructions.com/api
NEXT_PUBLIC_SITE_URL=https://ovcconstructions.com
```

Redeploy the frontend after setting variables. The PHP API allows public GET routes without admin credentials. Admin browser requests use the session cookie with credentials and a CSRF header; allow the exact frontend origin in the API's CORS list. `SameSite=Lax` is normally appropriate for this same-site subdomain setup. Verify the API subdomain serves the backend and test its health endpoint.

## Verify staging before launch

1. Open `https://api.ovcconstructions.com/api/health`. Expect HTTP 200 with `checks.php`, `checks.database`, `checks.schema` and `checks.ready` all true. The schema check includes `projects.cover_url` and the `users` table. A 503 means check PHP error logs, DB credentials and whether the schema import completed against the same database named in `DB_NAME`.
2. Open `/admin`, sign in using the username/password for the active `users` table row, and confirm project records, uploads and enquiries load.
3. Create a project as a draft; verify it is not public. Publish it; verify it appears at `/projects`, its `/projects/{slug}` detail page renders, and its URL appears in `/sitemap.xml` after the five-minute revalidation window.
4. Submit a real test enquiry in staging and verify it appears in the admin inbox. Then remove the test record and ensure test personal data is not retained.
5. Upload a small approved image, attach it as a project cover, publish the media and project, verify the public cover stream, then unpublish or delete the test media.
6. Remove test records and data as appropriate, review PHP logs, and configure database/media backups and an enquiry-retention policy.

The API does not send email notifications for enquiries. Staff use the protected `/admin` inbox. Keep `.env`, `config/local.php`, database backups and uploaded media private.
