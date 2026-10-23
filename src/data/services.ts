export type Service = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  icon: "paint" | "wall" | "product" | "paper" | "maintenance" | "sales" | "stucco" | "build" | "site" | "contract" | "manage" | "architecture" | "structure";
};

export const services: Service[] = [
  { id: "painting-design", title: "Interior & Exterior Painting and Design", summary: "Painting and design services for interior and exterior spaces.", detail: "Discuss the surfaces, finish preferences and project scope for interior or exterior painting and design.", icon: "paint" },
  { id: "wall-screeding", title: "Wall Screeding", summary: "Wall preparation and screeding as part of a finishing scope.", detail: "Wall screeding can be discussed as a preparation and finishing service for your project.", icon: "wall" },
  { id: "paint-production", title: "Paint Production", summary: "Paint production services for construction and finishing needs.", detail: "Contact the company to discuss paint production requirements and availability for your project.", icon: "product" },
  { id: "wallpaper", title: "Wallpaper Installation", summary: "Wallpaper installation for interior finishing projects.", detail: "Share your space, preferred material and project timeline to discuss wallpaper installation.", icon: "paper" },
  { id: "maintenance", title: "Maintenance", summary: "Building maintenance services for property upkeep.", detail: "Describe the building and maintenance needs so the project scope can be discussed.", icon: "maintenance" },
  { id: "paint-sales", title: "Sales of Paint", summary: "Sales of paint for construction and finishing projects.", detail: "Enquire about paint requirements and product availability for your project.", icon: "sales" },
  { id: "stucco", title: "Stucco Finishing", summary: "Stucco finishing as part of architectural surface treatment.", detail: "Discuss the intended surfaces, finish and scope before work is agreed.", icon: "stucco" },
  { id: "general-construction", title: "General Construction", summary: "General construction services for project requirements.", detail: "Share your project brief and site details to discuss general construction needs.", icon: "build" },
  { id: "site-supervision", title: "Site Supervision", summary: "Site supervision for construction project activities.", detail: "Contact the company to discuss the project scope and supervision requirements.", icon: "site" },
  { id: "contracting", title: "Contracting", summary: "Contracting services for agreed construction work scopes.", detail: "Project requirements and the proposed contract scope should be reviewed before appointment.", icon: "contract" },
  { id: "project-management", title: "Project Management", summary: "Project coordination and management for construction work.", detail: "Discuss project objectives, scope and coordination requirements with the company.", icon: "manage" },
  { id: "civil-architectural-design", title: "Civil & Architectural Design", summary: "Enquire about civil and architectural design services.", detail: "Contact the company to confirm the exact design scope and applicable professional qualifications before appointing regulated design work.", icon: "architecture" },
  { id: "structural-design", title: "Structural Design", summary: "Enquire about structural design requirements.", detail: "Contact the company to confirm the exact scope and applicable professional qualifications before appointing regulated structural design work.", icon: "structure" },
];
