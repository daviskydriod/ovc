# Okechukwu Venatius Chibuike Ltd. — Website

A responsive site for OVC’s construction and architectural-finishing services, built with Next.js App Router, React, TypeScript, Tailwind CSS and Lucide icons. The repository also includes a separate PHP/MySQL content API and Next.js admin dashboard.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Quality checks: `npm run typecheck` and `npm run build`.

## Pages

- `/` — Home
- `/about` — About Us
- `/services` — Services
- `/projects` — Projects / portfolio preview
- `/contact` — Contact details and preview-only enquiry form
- `/admin` — Custom responsive content studio with page tabs, gallery selection and media upload
- `/sitemap.xml` and `/robots.txt` — metadata routes

The route declaration is in [`public/manus-routes.json`](public/manus-routes.json).

## Preview-only behavior

The contact form validates its fields in the browser and then displays a preview confirmation. It does **not** send or store the enquiry. It is not connected to the content API.

The supplied master logo is stored at `public/brand/ovc-master-logo.png` and must remain unchanged. Client-provided images are organized and converted to WebP under `public/projects/`; the site uses no stock or generated project imagery. Architectural renders and drawings are labelled as such, not as confirmed completed work.

The site uses only the business name, motto, service scope and quality/customer-satisfaction emphasis supplied in the brief. No project names, locations, history, credentials, warranties or performance claims have been invented. Verify all copy, contact details and final project images with OVC before production.

## PHP/MySQL backend and admin dashboard

The PHP 8.1+ API, MySQL schema, deployment instructions and endpoint documentation are in [`backend/README.md`](backend/README.md). Import `backend/database/schema.sql`, configure the backend environment variables, and host `backend/public/` as the PHP document root. Set `NEXT_PUBLIC_CMS_API_URL` at Next.js build/runtime to the API base URL, for example `https://api.example.com/api`, and allow the exact website origin in the backend's `CORS_ALLOWED_ORIGINS` for cross-origin session requests.

The `/admin` dashboard provides mobile-friendly tabs for Home, About, Services, Projects & Images, Contact, and Uploads. It saves labelled content fields to MySQL, lets the administrator choose which supplied WebP images appear in the portfolio, and manages API uploads. Public page copy and portfolio image selection read the saved CMS content when the API is configured. `NEXT_PUBLIC_CMS_API_URL` must be set in Vercel after the PHP API is hosted; until then, the approved defaults and client image gallery are used. Never commit production credentials or real `.env` files. The production domain is configured for SEO metadata, but production hosting and DNS are not changed by this repository update.

## Production domain and Vercel

The canonical URLs, sitemap, Open Graph/Twitter metadata and structured-data origin use `https://ovcconstructions.com` by default. In Vercel, import this GitHub repository as a Next.js project, keep the repository root as the project root, and set `NEXT_PUBLIC_SITE_URL=https://ovcconstructions.com` in the project environment for Production (and Preview if desired). Add the CMS variable only after PHP hosting is ready: `NEXT_PUBLIC_CMS_API_URL=https://<your-api-host>/api`. Deployments on Vercel are not triggered from this task; pushing the repository does not change DNS or production hosting settings.
