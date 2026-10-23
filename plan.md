# OVC Website — Current Implementation

## Public site

- Next.js App Router, TypeScript, React and Tailwind CSS with responsive Home, About, Services, Projects and Contact pages.
- Production canonical origin is `https://ovcconstructions.com`; route metadata, sitemap, Open Graph/Twitter tags and structured-data origin use that host.
- The original OVC master logo at `public/brand/ovc-master-logo.png` is preserved unchanged.
- The client supplied a 24-image archive. Twenty-three non-portrait assets are organized and converted to WebP under `public/projects/`; the unlabeled portrait is not published. The gallery identifies photos, renderings and drawings separately, uses no stock/generated images, and makes no unsupported project-completion claims.
- Public page copy and portfolio image selection read PHP API section content when `NEXT_PUBLIC_CMS_API_URL` is configured, falling back to approved defaults otherwise.
- The quote form is still preview-only and does not send or save personal details.

## Admin and backend

- `/admin` is a private, no-index route with responsive horizontal tabs for Home, About, Services, Projects & Images, Contact and Uploads.
- Custom labeled text fields save to MySQL-backed JSON content sections; the project tab selects which supplied WebP images appear in the public gallery.
- Image/video upload and deletion routes use the PHP 8.1+ backend, PDO/MySQL, admin sessions, CSRF tokens, MIME checks and upload limits.
- Backend setup and deployment are documented in `backend/README.md`; the API must be hosted separately and configured in Vercel before admin edits can persist or display.

## Verification

Run `npm ci`, `npm run typecheck`, and `npm run build` for the Next.js application. PHP source can be checked using `php -l` when PHP CLI is installed. No DNS or Vercel deployment is performed by this repository workflow.
