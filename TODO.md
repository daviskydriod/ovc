# OVC Website — Delivery Checklist

Updated 2026-10-23 after receipt of the client image archive.

## Site and visual assets

- [x] Responsive Next.js site with Home, About, Services, Projects, Contact, shared navigation/footer, accessibility focus states and mobile breakpoints.
- [x] Production metadata uses `https://ovcconstructions.com`; sitemap, robots route, canonical URLs, Open Graph/Twitter metadata and Organization structured data are configured.
- [x] Original logo preserved unchanged. The supplied archive contained 24 images: 23 non-portrait images were renamed, converted to WebP, and added under `public/projects/`; combined optimized WebP size is about 820 KB (about 13% smaller than the corresponding original JPEGs). The unidentified portrait is not published.
- [x] Homepage and portfolio use only the supplied client assets. Photos, renderings, window details and drawings are labeled accurately; no stock/generated work imagery or unsupported project claims are included.

## CMS and admin

- [x] PHP 8.1+/MySQL content and media API, SQL schema, environment template and hosting documentation are included under `backend/`.
- [x] `/admin` is a no-index content studio with responsive, horizontally scrollable mobile tabs for Home, About, Services, Projects & Images, Contact and Uploads.
- [x] Page-specific custom fields save to MySQL and are read by the public pages when `NEXT_PUBLIC_CMS_API_URL` is configured. The Projects & Images tab selects client-provided WebP gallery items; backend uploads are managed in the media library.
- [x] Admin auth uses hashed password configuration, PHP sessions, CSRF checks, exact-origin CORS and upload MIME/size validation.

## Remaining deployment work

- [ ] Host the PHP API, import `backend/database/schema.sql`, configure secure production credentials/session/CORS settings, and set the API URL in Vercel.
- [ ] Import the GitHub repository as a Next.js project in Vercel and configure production domain/DNS as required. Metadata is configured in source; no deployment or DNS change was performed here.
- [x] `npm run typecheck` and `npm run build` passed before this latest update; rerun before delivery/push. PHP syntax check and API health endpoint were previously verified.
