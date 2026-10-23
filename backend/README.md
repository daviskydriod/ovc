# OVC PHP + MySQL API

The backend is a separately hosted PHP 8.1+ JSON API for the OVC Next.js site. It provides public content, portfolio project and media reads, quote-enquiry submission, and authenticated administration for page content, uploaded media, project records and enquiries. MySQL stores structured metadata and content; image/video binaries are stored outside the public web root.

For machine-readable endpoint documentation see [`openapi.yaml`](openapi.yaml). The implementation is in `public/index.php`, shared helpers and security configuration are in `src/bootstrap.php`, and the single database import is `database/schema.sql`.

For a panel-oriented walkthrough, use [`CPANEL-DEPLOYMENT.md`](CPANEL-DEPLOYMENT.md).

## 1. Requirements and deployment layout

- PHP 8.1 or later with `pdo_mysql`, `fileinfo` and PHP sessions. `mbstring` is recommended but the API includes UTF-8 helper fallbacks.
- MySQL 8+ or a compatible MariaDB version with InnoDB and JSON support.
- HTTPS for the public website and API.
- Configure `https://api.ovcconstructions.com` to serve the PHP `public/` directory; the API base is `https://api.ovcconstructions.com/api`. Keep `src`, database scripts, `.env` files and media storage outside the web document root. The backend-root `.htaccess` denies requests for `.env*` files as defense in depth.
- Apache can use the included `public/.htaccess`. For Nginx, route missing paths to `index.php` and preserve the query string.
- Set PHP `upload_max_filesize` and `post_max_size` to values at least as large as `MAX_UPLOAD_BYTES`; use host/WAF request limits too.

### Single-file database import

Use your existing MySQL database and its existing connection credentials; do not create a second database. Back up the database first. In phpMyAdmin, select the existing OVC database and import `database/schema.sql`. This idempotent file creates the complete current schema, adds missing columns such as `projects.cover_url`, and creates the `users` table without inserting an administrator account. Re-import it after updating the API. Then replace the hash placeholder and import `database/admin-user-template.sql` to create the first administrator. It does not create or select a database. To add all client images as unpublished project drafts, import `database/projects-seed-drafts.sql`; `database/project-import-template.sql` remains available for individual approved project rows.

For command-line import, replace the placeholders with the exact cPanel-prefixed database and the MySQL account you already use for this application:

```sh
mysql -u YOUR_DB_USER -p --database=YOUR_EXISTING_DB < backend/database/schema.sql
```

`DB_USER` and `DB_PASSWORD` are the MySQL connection account PHP uses to access the existing database; that connection account is separate from administrator rows in the application's `users` table. If the current database account lacks the `CREATE`/`ALTER` permissions needed for import, use the account provided for database imports. The running API needs only the table privileges listed by your host.

### cPanel file upload

Download the `ovc-cpanel-api.zip` artifact supplied with this change. In cPanel File Manager, upload and extract it into a private directory such as `/home/ACCOUNT/ovc-api/`, not directly into `public_html`. Set the `api.ovcconstructions.com` document root to `/home/ACCOUNT/ovc-api/public`; keep `src`, `database`, configuration and storage outside the web root. Copy `.env.example` to `.env` in `/home/ACCOUNT/ovc-api/` and edit the private file; the PHP bootstrap reads it automatically. Alternatively copy `config/local.php.example` to `config/local.php`. Back up the existing database, then import `database/schema.sql`; optionally import `database/projects-seed-drafts.sql` to add 23 unpublished image-backed draft records. Ensure private media storage is writable by the PHP account. Finally test `https://api.ovcconstructions.com/api/health` and sign in to the admin dashboard from the deployed site.

### Environment configuration

The shared-hosting loader reads `backend/.env`, located beside `public/` and outside the API document root. Copy `backend/.env.example` to `backend/.env` and edit the copy; the real `.env` is ignored by Git, and the included backend-root `.htaccess` denies web requests for `.env*`. The application also supports process variables and `config/local.php`. Precedence is process environment, then `config/local.php`, then `.env`. The simple parser accepts `KEY=value`, optional `export ` prefixes, comments, and single- or double-quoted values; it does not expand variables. Never commit real credentials.

Administrator authentication uses active rows in MySQL's `users` table with `role='admin'`. Passwords are stored only as PHP `password_hash()` output and checked with `password_verify()`; plaintext passwords are never stored or returned. The API does not expose a user-management screen or user CRUD endpoint: provision or disable administrator rows through phpMyAdmin. Protected requests re-check that the session's account still exists and is active. `DB_USER` is the separate MySQL connection account, not an administrator login.

| Variable | Required | Purpose |
|---|---|---|
| `DB_HOST` | Yes | MySQL host or socket host; default `127.0.0.1`. |
| `DB_NAME` | Yes | Exact database name created/selected in cPanel or MySQL, including any hosting-account prefix. |
| `DB_USER` | Yes | MySQL connection account PHP uses to access the existing database; distinct from application administrator accounts. |
| `DB_PASSWORD` | Yes | Password for that MySQL connection account. |
| `RATE_LIMIT_HMAC_KEY` | Yes | At least 32 random bytes used to hash IP addresses for abuse throttling. Generate with `php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'`. |
| `CORS_ALLOWED_ORIGINS` | For cross-origin use | Exact comma-separated origins, e.g. `https://ovc-lime.vercel.app,https://ovcconstructions.com,https://www.ovcconstructions.com`; never use `*` with credentials. |
| `SESSION_COOKIE_SECURE` | Production | Set to `true` for HTTPS. |
| `SESSION_SAMESITE` | Usually | `Strict` by default. Cross-site deployments may require `None` plus `SESSION_COOKIE_SECURE=true`; browser third-party-cookie policies can still block the cookie. Prefer same-site deployment. |
| `API_BASE_PATH` | Optional | URL prefix stripped by the router; default `/api`. Set `/` only when the API is mounted at the origin root. |
| `PUBLIC_API_URL` | For media links | Public API base URL ending in the configured API prefix; for OVC use `https://api.ovcconstructions.com/api`. |
| `MEDIA_STORAGE_PATH` | Optional | Absolute writable private directory; default `backend/storage/media`. Keep it outside the document root and back it up. |
| `MAX_UPLOAD_BYTES` | Optional | Per-file byte limit; default `104857600` (100 MiB). |

In the Next.js host configure `NEXT_PUBLIC_CMS_API_URL=https://api.ovcconstructions.com/api`. Allow the exact frontend origin in `CORS_ALLOWED_ORIGINS`. For cross-origin admin fetches the browser must use `credentials: "include"`; the site already does this. After changing secrets, restart PHP workers and verify `GET https://api.ovcconstructions.com/api/health`.

## 2. Endpoint conventions

All JSON request/response bodies use UTF-8. JSON errors have the form `{ "error": "Human-readable explanation" }`; field validation may also include `{ "fields": { "fieldName": "Correction" } }`. Pagination is zero-based (`limit`, `offset`) and capped at 100 rows per request. Unknown routes return 404. JSON body limits are enforced per route. Database timestamp fields use MySQL's `YYYY-MM-DD HH:MM:SS` format; configure the MySQL/PHP server time zone to UTC for consistent handling. The health endpoint's `time` field is ISO 8601 UTC.

The `/admin/*` routes require the HttpOnly `ovc_admin` session cookie. State-changing admin requests also require `X-CSRF-Token`, obtained from login, `GET /admin/session` or `GET /admin/csrf`. Keep the token in memory, send requests with credentials, and do not place it in URLs or local storage. Public endpoints do not require the admin session.

## 3. Detailed endpoint reference

### Health and readiness

#### `GET /api/health`

Checks that PHP runs, MySQL can be reached, all required `site_sections`, `media`, `projects`, `contact_enquiries` and `users` tables exist, and required columns (including `projects.cover_url` and administrator-account fields) are present. No credentials are returned. A healthy response is `200`; a dependency or incomplete-schema failure returns `503`.

```json
{
  "ok": true,
  "service": "ovc-content-api",
  "checks": { "php": true, "database": true, "schema": true, "ready": true },
  "time": "2026-10-23T12:00:00+00:00"
}
```

Use this as an operational readiness check, not as a detailed diagnostic endpoint. The exact database error is only written to the PHP server log; an incomplete schema can be fixed by importing the current `database/schema.sql` into the same database selected by `DB_NAME`.

### Public content

#### `GET /api/content`

Returns saved CMS sections keyed by section name. Sections not yet saved are omitted; the Next.js site supplies approved defaults. Response: `{ "sections": { "home": {}, "about": {} }, "updatedAt": { "home": "..." } }`.

#### `GET /api/content/{sectionKey}`

Returns a single saved section as `{ "key": "home", "content": { ... }, "updatedAt": "..." }`. A section key consists of 1–80 lowercase letters, digits, `_` or `-`. Returns 404 when the key does not exist and 400 when malformed.

### Projects and portfolio records

The public Projects page is API/database driven and does not include the former static image gallery. Public endpoints expose only published database records. A project can use a securely uploaded media-library image or `cover_url` for a direct HTTPS image from GitHub's raw image hosts; the SQL template supports GitHub links. The dashboard supports image upload and cover selection, while the SQL template remains an alternative for adding project rows and GitHub URLs. The Next.js portfolio is pre-rendered and revalidates every five minutes; new slugs are generated on the first request after publication and included in the sitemap on its next revalidation.

#### `GET /api/projects?limit=25&offset=0`

Lists published records with `id`, `slug`, `title`, `summary`, `description`, `category`, optional GitHub `cover_url`, optional `cover_alt_text`, and timestamps. Returns `{ "projects": [...], "pagination": { "limit": 25, "offset": 0, "total": 2, "hasMore": false } }`.

#### `GET /api/projects/{slug}`

Returns one published record as `{ "project": { ... } }`. Draft and unknown slugs both return 404, so draft titles and content are not disclosed.

#### `GET /api/admin/projects?limit=25&offset=0&status=draft`

Requires an admin session. Lists draft and published records, optionally filtered by `status=draft|published`. Includes management fields `cover_media_id`, `status` and `sort_order`.

#### `GET /api/admin/projects/{id}`

Requires an admin session. Reads one record by numeric id, including drafts. Returns `{ "project": { ... } }`; 404 when absent.

#### `POST /api/admin/projects`

Requires an admin session and CSRF header. JSON requires `slug`, `title` and `description`; optional fields are `summary`, `category`, `cover_url`, legacy `cover_media_id`, `status` and `sort_order`. `cover_url`, when provided through the API, must be HTTPS and hosted at `raw.githubusercontent.com`, `user-images.githubusercontent.com` or `gist.githubusercontent.com`. The database template uses direct raw GitHub links. New projects default to `draft`, order `0`, and no cover. Response 201 contains `{ "ok": true, "id": 42, "slug": "sample-project" }`. Duplicate slugs return 409; invalid data returns 422.

```json
{
  "slug": "sample-project",
  "title": "Sample project title",
  "summary": "A short approved project summary.",
  "description": "Approved project description and scope details.",
  "category": "Construction",
  "cover_url": "https://raw.githubusercontent.com/daviskydriod/ovc/main/public/projects/client-building-construction-photo.webp",
  "status": "draft",
  "sort_order": 0
}
```

#### `PATCH /api/admin/projects/{id}`

Requires an admin session and CSRF header. Send one or more of the `POST` fields to update only those properties. A duplicate slug returns 409, invalid fields 422 and absent id 404. To remove a cover URL, set `cover_url` to `null`.

#### `DELETE /api/admin/projects/{id}`

Requires an admin session and CSRF header. Permanently deletes the project record. If its uploaded cover image is not referenced by another project, the media row and stored file are also removed. Shared uploaded covers are kept; GitHub-hosted source files are never deleted from GitHub by this API. Returns `{ "ok": true, "id": 42, "removed_cover_media": true|false }` or 404 if absent.

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

The schema separates five functional domains:

| Table | Purpose | Important design |
|---|---|---|
| `site_sections` | Flexible CMS page sections | Primary key is a slug; JSON payload; created/updated timestamps. |
| `media` | File metadata and publication state | Files are stored outside web root; unique random filename; MIME, type, alt text and sort order indexed for public reads. |
| `projects` | API-managed project portfolio records | Unique slug, draft/published status, sort order, optional uploaded-media FK or direct GitHub `cover_url`. |
| `contact_enquiries` | Public project requests | Personal contact details, status and private staff note; raw IP is not stored; status/time and HMAC hash/time indexes support inbox and rate limiting. |
| `users` | Administrator accounts | Unique usernames; password hashes only; active flag, admin role and last-login timestamp. No initial account is inserted by the schema. |
| `schema_version` | Applied database version | Version 5 records MySQL-backed administrator authentication. |

All tables use InnoDB and `utf8mb4`. Prepared statements are used for data values. The app account should have only SELECT/INSERT/UPDATE/DELETE access to the selected database (no schema administration at runtime). Enquiry contact details are personal data: limit access, define a retention period, delete records when no longer required, and restrict database backups. `internal_note` is admin-only.

## 5. Security and operations checklist

- Serve the API over HTTPS; set secure cookies and exact CORS origin allowlists. Do not use wildcard origins with credentials.
- Keep database connection credentials private and use a strong unique administrator password; the database stores only its password hash. Rotate credentials if exposed.
- Set media storage outside the document root with restrictive directory permissions. Maintain backups and test restores.
- Configure host/WAF rate limiting for login and public contact routes; the API's own throttles are additional controls, not a substitute.
- Monitor PHP error logs. API responses intentionally avoid returning SQL details.
- Set PHP upload limits consistently with `MAX_UPLOAD_BYTES` and any reverse proxy limits.
- Maintain a data-retention schedule for contact enquiries. Export only when authorized and store exports securely.
- Test health check, admin login/session/CSRF, a valid enquiry, invalid form responses, media upload/publish/stream, and retention deletion in staging before launch.

## 6. Compatibility and limitations

Administrator accounts are stored in the MySQL `users` table; this dashboard does not include a user-management screen, so add or disable admins through phpMyAdmin. The public Projects pages use published API/database records only. Project covers can be uploaded to private media storage and selected in the dashboard, or linked from GitHub through SQL/API. Deleting a project removes its unique uploaded cover file when no other project uses it; GitHub files are not deleted by the cPanel API. The public enquiry endpoint stores messages in MySQL but does not send email; the protected admin inbox is the delivery mechanism. Hosting, DNS, database credentials and deployment are configured by the site owner and are not included in source control.
