# OVC PHP + MySQL API

The backend is a separately hosted PHP 8.1+ JSON API for the OVC Next.js site. It provides public content, portfolio project and media reads, quote-enquiry submission, and authenticated administration for page content, uploaded media, project records and enquiries. MySQL stores structured metadata and content; image/video binaries are stored outside the public web root.

For machine-readable contracts see [`openapi.yaml`](openapi.yaml). The implementation is in `public/index.php`, shared helpers and security configuration are in `src/bootstrap.php`, the fresh-install schema is `database/schema.sql`, and the one-time upgrade for the earlier schema is `database/migrations/002_production_ready_api.sql`.

For a panel-oriented walkthrough, use [`CPANEL-DEPLOYMENT.md`](CPANEL-DEPLOYMENT.md).

## 1. Requirements and deployment layout

- PHP 8.1 or later with `pdo_mysql`, `fileinfo` and PHP sessions. `mbstring` is recommended but the API includes UTF-8 helper fallbacks.
- MySQL 8+ or a compatible MariaDB version with InnoDB and JSON support.
- HTTPS for the public website and API.
- Configure the PHP document root to `backend/public/`; never expose `backend/src`, database scripts, `.env` files or media storage as static web content.
- Apache can use the included `public/.htaccess`. For Nginx, route missing paths to `index.php` and preserve the query string.
- Set PHP `upload_max_filesize` and `post_max_size` to values at least as large as `MAX_UPLOAD_BYTES`; use host/WAF request limits too.

### Fresh database installation

Use the existing database if you already have one—do not create another unnecessarily. Create a dedicated least-privilege MySQL user only if needed, grant the app user access to the selected database, then select that database before importing the schema. In a command-line install where the database is literally named `ovc_site`:

```sh
mysql -u root -p --database=ovc_site < backend/database/schema.sql
mysql -u root -p -e "CREATE USER 'ovc_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_LONG_RANDOM_PASSWORD';"
mysql -u root -p -e "GRANT SELECT, INSERT, UPDATE, DELETE ON ovc_site.* TO 'ovc_app'@'localhost'; FLUSH PRIVILEGES;"
```

Use the exact database name displayed by cPanel (often prefixed, for example `account_ovc_site`) in `DB_NAME`. When using phpMyAdmin, first click the target database and then import `database/schema.sql`; it intentionally does not issue `CREATE DATABASE` or `USE` so it works with cPanel prefixes. Do not use the database administrator account in the application.

### Existing installation upgrade

Back up the database first. Select the existing OVC database in phpMyAdmin (or pass its name to the MySQL command) and apply `backend/database/migrations/002_production_ready_api.sql` **once** to databases created by the original OVC schema. Then apply `backend/database/migrations/003_projects.sql` **once** to add project records. Do not run these migrations on a fresh database already created from the current `schema.sql`; that schema already includes every table and records version 3.

### cPanel file upload

Download the `ovc-cpanel-api.zip` artifact supplied with this change. In cPanel File Manager, upload and extract it into a private directory such as `/home/ACCOUNT/ovc-api/`, not directly into `public_html`. Configure an API subdomain (recommended: `api.ovcconstructions.com`) with document root `/home/ACCOUNT/ovc-api/public`; the `src`, `database` and storage folders are siblings outside the public document root. If the hosting plan cannot set that document root, ask the host to map the subdomain to the `public` directory—do not make `src` or `database` publicly accessible. Import `database/schema.sql` for a fresh database, or back up and apply the numbered migrations in order for an existing installation. Set environment variables in cPanel's PHP application/environment settings, or copy `config/local.php.example` to `config/local.php` and edit that file outside the public root if cPanel does not expose environment settings. Ensure private media storage is writable by the PHP account. Finally test `https://api.example.com/api/health` and sign in to the admin dashboard from the deployed site.

### Environment configuration

Set these values in the PHP host's secret/environment manager, not in a committed file. `backend/.env.example` is a variable reference only; the PHP application reads process variables or a private `config/local.php` array (copied from the example), not a `.env` file. Never commit `config/local.php`.

| Variable | Required | Purpose |
|---|---|---|
| `DB_HOST` | Yes | MySQL host or socket host; default `127.0.0.1`. |
| `DB_NAME` | Yes | Exact database name created/selected in cPanel or MySQL, including any hosting-account prefix. |
| `DB_USER` | Yes | Least-privilege app account. |
| `DB_PASSWORD` | Yes | Password for the app account. |
| `ADMIN_USERNAME` | Yes | Single administrator username. |
| `ADMIN_PASSWORD_HASH` | Yes | Password hash generated with `php -r 'echo password_hash("a-long-unique-password", PASSWORD_DEFAULT), PHP_EOL;'`. Never store the plaintext password here. |
| `RATE_LIMIT_HMAC_KEY` | Yes | At least 32 random bytes used to hash IP addresses for abuse throttling. Generate with `php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'`. |
| `CORS_ALLOWED_ORIGINS` | For cross-origin use | Exact comma-separated origins, e.g. `https://ovcconstructions.com,https://www.ovcconstructions.com`; never use `*` with credentials. |
| `SESSION_COOKIE_SECURE` | Production | Set to `true` for HTTPS. |
| `SESSION_SAMESITE` | Usually | `Strict` by default. Cross-site deployments may require `None` plus `SESSION_COOKIE_SECURE=true`; browser third-party-cookie policies can still block the cookie. Prefer same-site deployment. |
| `API_BASE_PATH` | Optional | URL prefix stripped by the router; default `/api`. Set `/` only when the API is mounted at the origin root. |
| `PUBLIC_API_URL` | For media links | Public API base URL ending in the configured API prefix, e.g. `https://api.example.com/api`. |
| `MEDIA_STORAGE_PATH` | Optional | Absolute writable private directory; default `backend/storage/media`. Keep it outside the document root and back it up. |
| `MAX_UPLOAD_BYTES` | Optional | Per-file byte limit; default `104857600` (100 MiB). |

In Vercel configure `NEXT_PUBLIC_CMS_API_URL` as the API base URL including `/api`. Allow that exact frontend origin in `CORS_ALLOWED_ORIGINS`. For cross-origin admin fetches the browser must use `credentials: "include"`; the site already does this. After changing secrets, restart PHP workers and verify `GET /api/health`.

## 2. Endpoint conventions

All JSON request/response bodies use UTF-8. JSON errors have the form `{ "error": "Human-readable explanation" }`; field validation may also include `{ "fields": { "fieldName": "Correction" } }`. Pagination is zero-based (`limit`, `offset`) and capped at 100 rows per request. Unknown routes return 404. JSON body limits are enforced per route. Database timestamp fields use MySQL's `YYYY-MM-DD HH:MM:SS` format; configure the MySQL/PHP server time zone to UTC for consistent handling. The health endpoint's `time` field is ISO 8601 UTC.

The `/admin/*` routes require the HttpOnly `ovc_admin` session cookie. State-changing admin requests also require `X-CSRF-Token`, obtained from login, `GET /admin/session` or `GET /admin/csrf`. Keep the token in memory, send requests with credentials, and do not place it in URLs or local storage. Public endpoints do not require the admin session.

## 3. Detailed endpoint reference

### Health and readiness

#### `GET /api/health`

Checks that PHP runs, MySQL can be reached, and all required `site_sections`, `media`, `projects` and `contact_enquiries` tables exist. No credentials are returned. A healthy response is `200`; a dependency/configuration failure returns `503`.

```json
{
  "ok": true,
  "service": "ovc-content-api",
  "checks": { "php": true, "database": true, "schema": true, "ready": true },
  "time": "2026-10-23T12:00:00+00:00"
}
```

Use this as an operational readiness check, not as a detailed diagnostic endpoint. The exact database error is only written to the PHP server log.

### Public content

#### `GET /api/content`

Returns saved CMS sections keyed by section name. Sections not yet saved are omitted; the Next.js site supplies approved defaults. Response: `{ "sections": { "home": {}, "about": {} }, "updatedAt": { "home": "..." } }`.

#### `GET /api/content/{sectionKey}`

Returns a single saved section as `{ "key": "home", "content": { ... }, "updatedAt": "..." }`. A section key consists of 1–80 lowercase letters, digits, `_` or `-`. Returns 404 when the key does not exist and 400 when malformed.

### Projects and portfolio records

Projects are separate database records, not just captions attached to the static client gallery. Administrators can create drafts or published entries and optionally attach a cover image already uploaded to the media library. Public endpoints expose only published projects. The Next.js portfolio is pre-rendered and revalidates every five minutes; new slugs are generated on the first request after publication and included in the sitemap on its next revalidation.

#### `GET /api/projects?limit=25&offset=0`

Lists published records with `id`, `slug`, `title`, `summary`, `description`, `category`, optional `cover_url`, optional `cover_alt_text`, and timestamps. Returns `{ "projects": [...], "pagination": { "limit": 25, "offset": 0, "total": 2, "hasMore": false } }`.

#### `GET /api/projects/{slug}`

Returns one published record as `{ "project": { ... } }`. Draft and unknown slugs both return 404, so draft titles and content are not disclosed.

#### `GET /api/admin/projects?limit=25&offset=0&status=draft`

Requires an admin session. Lists draft and published records, optionally filtered by `status=draft|published`. Includes management fields `cover_media_id`, `status` and `sort_order`.

#### `GET /api/admin/projects/{id}`

Requires an admin session. Reads one record by numeric id, including drafts. Returns `{ "project": { ... } }`; 404 when absent.

#### `POST /api/admin/projects`

Requires an admin session and CSRF header. JSON requires `slug`, `title` and `description`; optional fields are `summary`, `category`, `cover_media_id`, `status` and `sort_order`. Slugs are lowercase URL-safe strings with hyphens; title is limited to 180 characters, summary 500, description 12,000 and category 120. A cover id must point to an image media record. New projects default to `draft`, order `0`, and no cover. Response 201 contains `{ "ok": true, "id": 42, "slug": "sample-project" }`. Duplicate slugs return 409; invalid data returns 422.

```json
{
  "slug": "sample-project",
  "title": "Sample project title",
  "summary": "A short approved project summary.",
  "description": "Approved project description and scope details.",
  "category": "Construction",
  "cover_media_id": 17,
  "status": "draft",
  "sort_order": 0
}
```

#### `PATCH /api/admin/projects/{id}`

Requires an admin session and CSRF header. Send one or more of the `POST` fields to update only those properties. A duplicate slug returns 409, invalid fields 422 and absent id 404. To remove a cover image, set `cover_media_id` to `null`.

#### `DELETE /api/admin/projects/{id}`

Requires an admin session and CSRF header. Permanently deletes the project record; the referenced media item is retained. Returns `{ "ok": true, "id": 42 }` or 404 if absent.

### Public media

#### `GET /api/media?limit=25&offset=0&type=image`

Returns only published media. `limit` is 1–100 (default 25); `offset` is a non-negative integer (default 0); optional `type` is `image` or `video`. Response includes `media` records and a `pagination` object with `total` and `hasMore`. Each record contains its id, original name, detected MIME type, type, title, alt text, publication state and API URL.

#### `GET /api/media/{id}`

Streams a published binary with its detected `Content-Type`, `X-Content-Type-Options: nosniff` and a one-day immutable cache header. Unpublished, unknown or missing files return 404. Media is not served directly from the public filesystem.

### Public contact enquiries

#### `POST /api/contact`

Accepts `application/json`, up to 8 KiB. A request must include all fields below. The optional hidden `website` honeypot must be empty. The API validates field types and lengths, email syntax, and that `service` matches the supplied service catalogue. On success it stores a row in `contact_enquiries` and returns 201. The API HMAC-hashes the source IP for a limit of five submissions per 15 minutes; it does not store the raw IP. A populated honeypot receives a generic 202 response and is not saved.

```json
{
  "fullName": "Example Person",
  "phone": "+2348000000000",
  "email": "person@example.com",
  "service": "General Construction",
  "location": "Lagos",
  "description": "Please contact me to discuss the construction scope.",
  "website": ""
}
```

Success response: `{ "ok": true, "id": 123, "message": "Enquiry received." }`. Validation failure is 422 and may contain field errors. Rate limit is 429; missing rate-limit configuration is 503; a database failure is 500. The frontend must only display a success confirmation after a 201 response. The form does not send an email notification; staff review enquiries in the protected admin inbox.

### Administrator authentication

#### `POST /api/admin/login`

Accepts `application/json`: `{ "username": "...", "password": "..." }`. On success rotates the session id, sets an HttpOnly session cookie and returns `{ "ok": true, "username": "...", "csrfToken": "...", "expires": "browser-session" }`. Invalid credentials return 401; repeated failed attempts in the session are throttled (429 after eight attempts within the window). Also apply host-level rate limiting/WAF because session throttling alone is not sufficient.

#### `GET /api/admin/session`

Requires a valid session; returns the current authenticated state and CSRF token. Returns 401 when logged out. Use it after a page reload to restore admin UI state.

#### `GET /api/admin/csrf`

Requires a valid admin session. Returns `{ "csrfToken": "..." }`, creating a token if the session does not yet have one.

#### `POST /api/admin/logout`

Requires an admin session and CSRF header. Invalidates the session and cookie. Response: `{ "ok": true }`.

### Admin content editing

#### `PUT /api/admin/content`

Requires admin session and CSRF header. Max JSON request is 220 KiB; the stored content JSON is limited to 200 KiB. Valid section key is 1–80 lowercase letters, digits, `_` or `-`.

```json
{ "key": "home", "content": { "heroTitle": "Approved heading", "heroDescription": "Approved copy" } }
```

Upserts the whole JSON object for that section. Response: `{ "ok": true, "key": "home", "updatedAt": "..." }`. Content is treated as plain text by the website; do not store untrusted HTML.

### Admin media management

#### `GET /api/admin/media?limit=25&offset=0&type=video`

Requires admin session. Lists published and unpublished inventory. Filters and pagination match the public endpoint. The response includes the full metadata fields and media URLs.

#### `POST /api/admin/media`

Requires admin session and CSRF header. Use `multipart/form-data`; required part `file`, optional text fields `title` (180 chars) and `alt_text` (300 chars). Supported MIME types are JPEG, PNG, WebP, GIF, MP4, WebM and QuickTime MOV. MIME is detected from file content; client filenames are never used as storage paths. Images must decode as images. Response is 201 with the stored id, generated filename, type and URL. Errors include 413 for size limits, 415 for unsupported/corrupt types, 422 for missing/invalid upload, and 500 for storage/database failures.

#### `PATCH /api/admin/media/{id}`

Requires admin session and CSRF header. JSON may include any subset of `title`, `alt_text`, `is_published` and `sort_order`. At least one property is required. Title and alt text are truncated to their database limits; `is_published` is boolean; `sort_order` is an integer within ±1,000,000. Response `{ "ok": true, "id": 12 }`. Returns 404 if missing and 422 for invalid fields.

#### `DELETE /api/admin/media/{id}`

Requires admin session and CSRF header. Permanently deletes the media database row and attempts to remove the corresponding binary from private storage. This operation cannot be undone; back up media before use. Response `{ "ok": true, "id": 12 }`; 404 if the id does not exist.

### Admin enquiry inbox

#### `GET /api/admin/enquiries?limit=25&offset=0&status=new`

Requires admin session. Optional status filter is `new`, `contacted` or `closed`; pagination matches media endpoints. Returns the submitted name, contact details, service, location, description, status, internal note and timestamps. Personal information is returned only to the authenticated admin. Response has `enquiries` plus `pagination` fields.

#### `PATCH /api/admin/enquiries/{id}`

Requires admin session and CSRF header. JSON may set `status` (`new`, `contacted` or `closed`), `internal_note` (up to 2,000 characters), or both. Notes are private internal text and never appear on public endpoints. Response `{ "ok": true, "id": 123 }`.

#### `DELETE /api/admin/enquiries/{id}`

Requires admin session and CSRF header. Permanently removes a submission and its personal information. Use this to fulfil an approved deletion/retention request. Response `{ "ok": true, "id": 123 }`; 404 if missing.

## 4. Database organization and data handling

The schema separates four functional domains:

| Table | Purpose | Important design |
|---|---|---|
| `site_sections` | Flexible CMS page sections | Primary key is a slug; JSON payload; created/updated timestamps. |
| `media` | File metadata and publication state | Files are stored outside web root; unique random filename; MIME, type, alt text and sort order indexed for public reads. |
| `projects` | Admin-managed project portfolio records | Unique slug, draft/published status, sort order and optional FK to cover media; deleting a media item clears only the reference. |
| `contact_enquiries` | Public project requests | Personal contact details, status and private staff note; raw IP is not stored; status/time and HMAC hash/time indexes support inbox and rate limiting. |
| `schema_version` | Applied database version | Version 2 records the organized schema release. |

All tables use InnoDB and `utf8mb4`. Prepared statements are used for data values. The app account should have only SELECT/INSERT/UPDATE/DELETE access to the selected database (no schema administration at runtime). Enquiry contact details are personal data: limit access, define a retention period, delete records when no longer required, and restrict database backups. `internal_note` is admin-only.

## 5. Security and operations checklist

- Serve the API over HTTPS; set secure cookies and exact CORS origin allowlists. Do not use wildcard origins with credentials.
- Keep database and admin credentials in the host secret manager; use unique strong values. Rotate them if exposed.
- Set media storage outside the document root with restrictive directory permissions. Maintain backups and test restores.
- Configure host/WAF rate limiting for login and public contact routes; the API's own throttles are additional controls, not a substitute.
- Monitor PHP error logs. API responses intentionally avoid returning SQL details.
- Set PHP upload limits consistently with `MAX_UPLOAD_BYTES` and any reverse proxy limits.
- Maintain a data-retention schedule for contact enquiries. Export only when authorized and store exports securely.
- Test health check, admin login/session/CSRF, a valid enquiry, invalid form responses, media upload/publish/stream, and retention deletion in staging before launch.

## 6. Compatibility and limitations

The single administrator account is configured with environment variables; there is no multi-user roles interface. The portfolio supports both the original version-controlled client WebP gallery and new CMS-managed project records. Project covers are selected from uploaded image media. The public enquiry endpoint stores messages in MySQL but does not send email; the protected admin inbox is the delivery mechanism. Hosting, DNS, database credentials and deployment are configured by the site owner and are not included in source control.
