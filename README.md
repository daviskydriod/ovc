# Okechukwu Venatius Chibuike Ltd. — Website

A responsive, search-optimized OVC site built with Next.js App Router, React and TypeScript. It includes a PHP/MySQL API, an admin content studio, project-record CRUD, media management and a real project enquiry workflow.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Quality checks: `npm run typecheck` and `npm run build`.

## Public pages

- `/` — Home page with seven content sections.
- `/about` — Company information, service focus and process sections.
- `/services` — Service directory, scope guidance and enquiry sections.
- `/projects` — Client-supplied gallery plus published CMS project records.
- `/projects/[slug]` — Project detail pages generated at build time for published records; additional slugs render on demand.
- `/contact` — Direct phone/WhatsApp contact options for every supplied number, project enquiry form and practical contact guidance.
- `/admin` — Protected content studio for page copy, client image selection, project CRUD, uploads and enquiries.
- `/sitemap.xml` and `/robots.txt` — SEO metadata routes. Published project slugs are added to the sitemap.

Each public marketing page contains at least seven distinct content sections. Canonical URLs, page metadata, sitemap, Open Graph information and semantic headings are provided. Public pages use Next.js pre-rendering and incremental revalidation at five-minute intervals when the PHP API is configured; newly published project routes are statically generated where available and rendered on-demand otherwise.

The route declaration is in [`public/manus-routes.json`](public/manus-routes.json).

## Contact enquiries

The contact form validates submissions in the browser and again in the PHP API, then stores accepted requests in MySQL. Authenticated staff review and update requests in the `/admin` Enquiries tab. Visitors can call or open WhatsApp for each supplied phone number; WhatsApp chats depend on the corresponding number having an active WhatsApp account. The frontend reads `NEXT_PUBLIC_CMS_API_URL` for admin, contact, page content and project requests; the root `.env.example` uses `https://api.ovcconstructions.com/api`. Configure the same value in the frontend host's build settings. Follow [`backend/README.md`](backend/README.md) before launch.

## Images and company claims

The original master logo remains unchanged in `public/brand/ovc-master-logo.png`. The newly supplied brand pack is used for the transparent primary logo in the header, reverse white logo in the dark footer, and official illustrations on the service cards. Client-provided project images are organized and converted to WebP under `public/projects/`; no stock or generated project imagery is used. Renderings and drawings are labelled as such, not as confirmed completed work. Site copy avoids unverified history, credentials, project names, locations, warranties and performance claims.

## PHP/MySQL backend and admin dashboard

The full endpoint guide is [`backend/README.md`](backend/README.md); machine-readable OpenAPI 3.1 is [`backend/openapi.yaml`](backend/openapi.yaml). Import `backend/database/schema.sql` once into the existing OVC database: it contains the full current schema and safely applies the supported earlier OVC column/index updates. The API uses one privately configured administrator and does not create or require a website `users` table. The cPanel archive includes the PHP API source, single SQL import, configuration examples and deployment guide.

The `/admin` dashboard provides Home, About, Services, Projects & Images, Project Records, Contact, Enquiries and Uploads tabs. Project Records supports create, read, update and delete, draft/published status, ordering and a selected uploaded cover image. Published projects appear in the public portfolio and project detail routes. New backend images can be managed and marked public/private.

For cPanel, configure the API subdomain document root to `backend/public/`, keep `src/`, `database/` and media storage outside that public root, back up the existing database and import `backend/database/schema.sql` once. Copy `backend/.env.example` to `backend/.env` beside `public/` and enter the private MySQL credentials and single admin username/password hash there; the PHP bootstrap loads it automatically, and the backend-root `.htaccess` denies web requests for `.env*`. Set `NEXT_PUBLIC_CMS_API_URL=https://<your-api-host>/api` in the Next.js host's build settings and allow the exact frontend origin in `CORS_ALLOWED_ORIGINS`. Never commit real passwords or `.env` files.

## Production domain and hosting

Canonical URLs, sitemap and social metadata use `https://ovcconstructions.com` by default. Set `NEXT_PUBLIC_SITE_URL=https://ovcconstructions.com` in the Next.js hosting environment. Repository changes and pull-request merges do not configure DNS, cPanel or Vercel hosting, and do not trigger a deployment by themselves.
