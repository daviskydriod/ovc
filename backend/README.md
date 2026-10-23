# OVC PHP + MySQL Content API

This is a separate PHP 8.1+ backend for administering site section content and uploading project images/videos. The Next.js public pages read editable copy and the selected client-supplied project image list from `GET /content` when `NEXT_PUBLIC_CMS_API_URL` is configured. The API and database must be hosted separately from the Vercel front end.

## Requirements and setup

- PHP 8.1+ with `pdo_mysql`, `fileinfo`, `mbstring`, and sessions enabled.
- MySQL 8+ (or a compatible MariaDB release).
- HTTPS for production.
- Point the PHP web root to `backend/public/`. Apache deployments can use the included `.htaccess`; configure the equivalent rewrite rule on Nginx.
- Import `backend/database/schema.sql` using a MySQL account with permission to create/use the database and tables.
- Set the environment variables below in your hosting control panel or process manager. Do not commit real credentials.

| Variable | Required | Description |
|---|---:|---|
| `DB_HOST` | Yes | MySQL hostname, e.g. `127.0.0.1` |
| `DB_NAME` | Yes | Database name (schema defaults to `ovc_site`) |
| `DB_USER` | Yes | Least-privilege MySQL user |
| `DB_PASSWORD` | Yes | MySQL password |
| `ADMIN_USERNAME` | Yes | Single admin account username |
| `ADMIN_PASSWORD_HASH` | Yes | Hash generated with `php -r 'echo password_hash("use-a-long-unique-password", PASSWORD_DEFAULT), PHP_EOL;'` |
| `CORS_ALLOWED_ORIGINS` | For cross-origin | Comma-separated exact origins, e.g. `https://example.com`; do not use `*` with cookie auth |
| `SESSION_COOKIE_SECURE` | Production | Set `true` when served over HTTPS |
| `SESSION_SAMESITE` | For cross-site | `Strict` by default; use `None` only for cross-site hosting, with HTTPS and secure cookies |
| `PUBLIC_API_URL` | For public media URLs | Absolute API origin/base URL, e.g. `https://api.example.com/api` |
| `MEDIA_STORAGE_PATH` | No | Private writable directory; defaults to `backend/storage/media` |
| `MAX_UPLOAD_BYTES` | No | Upload cap in bytes; defaults to 104857600 (100 MiB) |
| `API_BASE_PATH` | No | API prefix; defaults to `/api` |

Set PHP's `upload_max_filesize` and `post_max_size` to accommodate the configured cap. Ensure media storage is writable by PHP and not web-accessible directly. Back up both MySQL and the storage directory.

## Endpoints

- `GET /api/health` — liveness check.
- `GET /api/content` — all published/editable content sections as `{ "sections": { "home": {}, ... } }`.
- `GET /api/media` — published media metadata; each item includes a media URL.
- `GET /api/media/{id}` — streams a published image/video.
- `POST /api/admin/login` — JSON `{ "username": "...", "password": "..." }`; starts a secure HttpOnly session and returns a CSRF token.
- `GET /api/admin/csrf` — returns a CSRF token for an authenticated session.
- `PUT /api/admin/content` — JSON `{ "key": "home", "content": { ... } }`; requires admin session and `X-CSRF-Token` header.
- `GET /api/admin/media` — authenticated complete media inventory.
- `POST /api/admin/media` — multipart form field `file`, optional `title` and `alt_text`; requires session and CSRF header. Accepts JPEG, PNG, WebP, GIF, MP4, WebM and MOV.
- `DELETE /api/admin/media/{id}` — deletes record and stored file; requires session and CSRF header.
- `POST /api/admin/logout` — destroys the admin session; requires CSRF header.

For browser calls across origins, use `credentials: "include"` and set the exact front-end origin in `CORS_ALLOWED_ORIGINS`. Keep the API and front end on HTTPS. If the front end and API are on different sites, set `SESSION_SAMESITE=None` and `SESSION_COOKIE_SECURE=true`; browser third-party-cookie policies may still block cross-site sessions, so same-site hosting is recommended. Admin login has a small response delay but should additionally be protected by host-level rate limiting/WAF in production. Back up uploads before deleting content. Use strong unique admin credentials and rotate them through hosting configuration.

## Content payload example

```json
{
  "key": "home",
  "content": {
    "headline": "BUILDING QUALITY. FINISHING WITH EXCELLENCE.",
    "intro": "Approved copy for the home page"
  }
}
```

The API deliberately stores flexible section JSON without inventing company details. Validate and sanitize any rich text in the consuming website; treat content fields as plain text unless a reviewed HTML-sanitization layer is added. The custom Next.js admin dashboard at `/admin` saves page copy to `home`, `about`, `services`, `projects` and `contact` sections. Its Projects & Images tab controls the static client image paths shown on the portfolio; newly uploaded API files remain in the upload library until selected through a future media-to-gallery integration. Existing WebP assets are version-controlled in `public/projects/`.
