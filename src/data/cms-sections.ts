import { defaultProjectImagePaths } from "@/data/project-images";

export type CmsField = { key: string; label: string; help: string; multiline?: boolean };
export type CmsSection = { label: string; eyebrow: string; fields: CmsField[]; defaults: Record<string, string | string[]> };

export const cmsSections = {
  home: {
    label: "Home page", eyebrow: "Homepage", fields: [
      { key: "heroEyebrow", label: "Hero eyebrow", help: "Short line above the main headline." },
      { key: "heroTitle", label: "Headline — first line", help: "Keep this concise for mobile." },
      { key: "heroHighlight", label: "Headline — highlighted line", help: "The second line uses the brand accent color." },
      { key: "heroDescription", label: "Hero introduction", help: "One short paragraph describing the company." , multiline: true },
      { key: "aboutHeading", label: "About section heading", help: "Homepage company introduction heading." },
      { key: "aboutIntro", label: "About introduction", help: "Company description; avoid unverified claims.", multiline: true },
      { key: "aboutDetails", label: "About supporting text", help: "Additional short supporting paragraph.", multiline: true },
      { key: "projectsHeading", label: "Portfolio heading", help: "Heading above the selected images." },
      { key: "projectsDescription", label: "Portfolio introduction", help: "Use neutral wording unless project details are verified.", multiline: true },
      { key: "ctaHeading", label: "Final call-to-action heading", help: "Closing contact section heading." },
      { key: "ctaDescription", label: "Final call-to-action text", help: "One short invitation to contact OVC.", multiline: true },
    ], defaults: {
      heroEyebrow: "Construction · Architectural finishing · Maintenance", heroTitle: "BUILDING QUALITY.", heroHighlight: "FINISHING WITH EXCELLENCE.",
      heroDescription: "Professional construction, architectural finishing and building maintenance services focused on quality workmanship and customer satisfaction.",
      aboutHeading: "Built on quality and commitment", aboutIntro: "Okechukwu Venatius Chibuike Ltd. provides construction, architectural finishing and building maintenance services with a focus on quality workmanship and customer satisfaction.",
      aboutDetails: "Explore the services or contact the team to discuss your project requirements and next steps.", projectsHeading: "Our projects",
      projectsDescription: "Explore photographs, renderings and drawings from OVC's construction and finishing work.", ctaHeading: "Have a project in mind?", ctaDescription: "Let's discuss your construction, painting or finishing requirements.",
    },
  },
  about: {
    label: "About page", eyebrow: "Company profile", fields: [
      { key: "heroTitle", label: "Page heading", help: "Main About page title." },
      { key: "heroDescription", label: "Page introduction", help: "Short factual summary.", multiline: true },
      { key: "storyHeading", label: "Company section heading", help: "Heading above company description." },
      { key: "storyBody", label: "Company description", help: "Describe only confirmed services and focus.", multiline: true },
      { key: "commitment", label: "Quality and customer focus", help: "Approved statement about company priorities.", multiline: true },
      { key: "approachHeading", label: "Approach section heading", help: "Heading for the process/approach section." },
      { key: "approachDescription", label: "Approach section text", help: "Explain the enquiry process.", multiline: true },
    ], defaults: {
      heroTitle: "Built on quality and commitment", heroDescription: "Learn about Okechukwu Venatius Chibuike Ltd. and its construction, finishing and maintenance services.",
      storyHeading: "Construction and finishing with a focus on workmanship", storyBody: "Okechukwu Venatius Chibuike Ltd. is a construction and architectural finishing company. Services include construction, painting and design, wall screeding, wallpaper installation, stucco finishing, maintenance, project coordination and related work.",
      commitment: "The company focuses on quality workmanship and customer satisfaction. Discuss your project requirements with the team to agree the right scope and next steps.",
      approachHeading: "Clear scope. Careful execution.", approachDescription: "Project details, site conditions and the requested service are discussed before the scope and next steps are agreed.",
    },
  },
  services: {
    label: "Services page", eyebrow: "Services", fields: [
      { key: "heroTitle", label: "Page heading", help: "Main Services page title." },
      { key: "heroDescription", label: "Page introduction", help: "Short summary above the service list.", multiline: true },
      { key: "sidebar", label: "Side note", help: "Supporting note beside the heading.", multiline: true },
      { key: "ctaHeading", label: "Enquiry call-to-action", help: "Closing section heading." },
      { key: "ctaDescription", label: "Enquiry text", help: "Short invitation to discuss service scope.", multiline: true },
    ], defaults: {
      heroTitle: "Our construction & finishing services", heroDescription: "A clear overview of the service areas listed by Okechukwu Venatius Chibuike Ltd. Enquire to discuss the exact scope and project requirements.",
      sidebar: "Every project has its own requirements. Share the details so the appropriate service scope can be discussed.", ctaHeading: "Need a service not listed here?", ctaDescription: "Describe your requirements and the company can discuss whether they fit the available service scope.",
    },
  },
  projects: {
    label: "Projects & images", eyebrow: "Portfolio", fields: [
      { key: "heroTitle", label: "Page heading", help: "Main portfolio heading." },
      { key: "heroDescription", label: "Page introduction", help: "Mention the included photo/render/drawing types.", multiline: true },
      { key: "sidebar", label: "Portfolio note", help: "Clarify that images alone do not verify project completion.", multiline: true },
      { key: "galleryNote", label: "Gallery disclosure", help: "A brief factual note beneath the gallery.", multiline: true },
    ], defaults: {
      heroTitle: "Our projects", heroDescription: "Browse construction photographs, architectural renderings, detail images and drawings from OVC.",
      sidebar: "Explore the images, then contact OVC to discuss a project with similar requirements.",
      galleryNote: "Explore the gallery for inspiration and contact OVC to discuss your own construction or finishing project.", images: defaultProjectImagePaths,
    },
  },
  contact: {
    label: "Contact page", eyebrow: "Contact", fields: [
      { key: "heroTitle", label: "Page heading", help: "Main Contact page title." },
      { key: "heroDescription", label: "Page introduction", help: "Help visitors understand how to contact OVC.", multiline: true },
      { key: "sidebar", label: "Side note", help: "Instructions beside the heading.", multiline: true },
      { key: "quoteTitle", label: "Quote form heading", help: "Title above the enquiry form." },
      { key: "quoteDescription", label: "Quote form instructions", help: "Short prompt above the form fields.", multiline: true },
    ], defaults: {
      heroTitle: "Let's discuss your project.", heroDescription: "Share your construction, painting or finishing requirements, or call one of the supplied contact numbers.",
      sidebar: "Use the project enquiry form to provide your service, location and a short description of the work you have in mind.",
      quoteTitle: "Request a quote", quoteDescription: "Provide a few details about the work you have in mind. Required fields are marked with an asterisk.",
    },
  },
} satisfies Record<string, CmsSection>;
