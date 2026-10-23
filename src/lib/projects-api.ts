export type PublicProject = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  cover_url: string | null;
  cover_alt_text?: string | null;
  created_at: string;
  updated_at: string;
};

const API = (process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API_URL || "").replace(/\/$/, "");

/** Fetch published project records with ISR so the portfolio can be pre-rendered for search crawlers. */
export async function getPublishedProjects(): Promise<PublicProject[]> {
  if (!API) return [];
  try {
    const response = await fetch(`${API}/projects?limit=100&offset=0`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = await response.json() as { projects?: unknown };
    if (!Array.isArray(payload.projects)) return [];
    return payload.projects.filter((project): project is PublicProject =>
      Boolean(project && typeof project === "object" &&
        typeof (project as PublicProject).slug === "string" &&
        typeof (project as PublicProject).title === "string" &&
        typeof (project as PublicProject).description === "string"),
    );
  } catch {
    return [];
  }
}

/** Fetch one published project; cached for five minutes for ISR and metadata generation. */
export async function getPublishedProject(slug: string): Promise<PublicProject | null> {
  if (!API || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    const response = await fetch(`${API}/projects/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const payload = await response.json() as { project?: PublicProject };
    return payload.project && typeof payload.project.title === "string" ? payload.project : null;
  } catch {
    return null;
  }
}
