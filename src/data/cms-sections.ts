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
      aboutHeading: "Built on quality and commitment", aboutIntro: "Okechukwu Venatius Chibuike Ltd. provides construction, architectural finishing and building maintenance services. The company’s stated focus is quality workmanship and customer satisfaction.",
      aboutDetails: "Explore the services or contact the team to discuss the scope and requirements of a project.", projectsHeading: "Our projects",
      projectsDescription: "Client-supplied photographs, renderings and drawings. Captions and project claims are not assumed.", ctaHeading: "Have a project in mind?", ctaDescription: "Let's discuss your construction, painting or finishing requirements.",
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
      heroTitle: "Built on quality and commitment", heroDescription: "An introduction to Okechukwu Venatius Chibuike Ltd. and the construction and finishing services in its supplied brief.",
      storyHeading: "Construction and finishing with a focus on workmanship", storyBody: "Okechukwu Venatius Chibuike Ltd. is a construction and architectural finishing company. Its supplied service scope includes construction, painting and design, wall screeding, wallpaper installation, stucco finishing, maintenance, project coordination and related work.",
      commitment: "The company describes its focus as quality workmanship and customer satisfaction. This website keeps the introduction concise until approved company history, mission, vision, leadership details or professional credentials are provided.",
      approachHeading: "Clear scope. Careful execution.", approachDescription: "Project details, site conditions and the requested service are discussed before a scope is agreed. No project history, completion statistics or qualifications are assumed on this page.",
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
      heroTitle: "Our projects", heroDescription: "Browse client-supplied construction photographs, architectural renderings, detail images and drawings.",
      sidebar: "Images are shown as provided. No project names, locations, dates, completion claims or budgets have been assumed.",
      galleryNote: "These images were supplied for OVC's website. Renderings and drawings are presented as design visuals, not as confirmation of completed work.", images: defaultProjectImagePaths,
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
