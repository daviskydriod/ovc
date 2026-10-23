export type PageContent = Record<string, string | string[] | number[]>;

const apiBase = (process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API_URL || "https://ovcconstructions.com/api").replace(/\/$/, "");

export async function getPageContent<T extends PageContent>(key: string, fallback: T): Promise<T> {
  if (!apiBase) return fallback;
  try {
    const response = await fetch(`${apiBase}/content`, { next: { revalidate: 300 } });
    if (!response.ok) return fallback;
    const payload = await response.json() as { sections?: Record<string, unknown> };
    const incoming = payload.sections?.[key];
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return fallback;
    const merged = { ...fallback } as T;
    for (const [field, value] of Object.entries(incoming)) {
      if (typeof value === "string" && value.length <= 6000) (merged as PageContent)[field] = value;
      else if (Array.isArray(value) && value.length <= 60 && value.every((item) => typeof item === "string" || typeof item === "number")) (merged as PageContent)[field] = value as string[] | number[];
    }
    return merged;
  } catch {
    return fallback;
  }
}
