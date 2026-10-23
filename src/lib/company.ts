export const COMPANY = {
  name: "Okechukwu Venatius Chibuike Ltd.",
  shortName: "OVC",
  motto: "YOUR SATISFACTION IS OUR UTMOST PRIORITY.",
  phones: [
    { display: "0814 2695 560", href: "tel:+2348142695560", country: "Nigeria" },
    { display: "0916 9117 749", href: "tel:+2349169117749", country: "Nigeria" },
    { display: "+233 25 669 6916", href: "tel:+233256696916", country: "Ghana" },
  ],
} as const;

export function getVerifiedPublicOrigin(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ovcconstructions.com";
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export function publicUrl(path: string): string | undefined {
  const origin = getVerifiedPublicOrigin();
  return origin ? new URL(path, origin).toString() : undefined;
}
