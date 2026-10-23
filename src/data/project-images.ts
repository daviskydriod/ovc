export type ProjectImage = {
  src: string;
  alt: string;
  category: "Construction photo" | "Architectural rendering" | "Window detail" | "Drawing";
  title: string;
};

export const projectImages: ProjectImage[] = [
  { src: "/projects/client-exterior-photo-01.webp", alt: "Client-supplied photograph of a residential building exterior.", category: "Construction photo", title: "Exterior building photograph" },
  { src: "/projects/client-floor-plan-01.webp", alt: "Client-supplied architectural floor plan drawing.", category: "Drawing", title: "Architectural floor plan 01" },
  { src: "/projects/client-floor-plan-02.webp", alt: "Client-supplied architectural floor plan drawing.", category: "Drawing", title: "Architectural floor plan 02" },
  { src: "/projects/client-window-detail-photo.webp", alt: "Client-supplied photograph showing a window detail.", category: "Window detail", title: "Window detail photograph" },
  { src: "/projects/client-exterior-render-01.webp", alt: "Client-supplied exterior architectural rendering of a residence.", category: "Architectural rendering", title: "Residential exterior rendering 01" },
  { src: "/projects/client-exterior-render-02.webp", alt: "Client-supplied exterior architectural rendering of a residence.", category: "Architectural rendering", title: "Residential exterior rendering 02" },
  { src: "/projects/client-window-render-01.webp", alt: "Client-supplied rendering of a window and wall detail.", category: "Window detail", title: "Window detail rendering 01" },
  { src: "/projects/client-window-render-02.webp", alt: "Client-supplied rendering of paired windows.", category: "Window detail", title: "Window detail rendering 02" },
  { src: "/projects/client-window-render-03.webp", alt: "Client-supplied rendering of a window and facade detail.", category: "Window detail", title: "Window detail rendering 03" },
  { src: "/projects/client-window-render-04.webp", alt: "Client-supplied architectural window design image.", category: "Window detail", title: "Window detail rendering 04" },
  { src: "/projects/client-facade-detail-render.webp", alt: "Client-supplied rendering showing a vertical facade detail.", category: "Architectural rendering", title: "Facade detail rendering" },
  { src: "/projects/client-exterior-render-03.webp", alt: "Client-supplied exterior architectural rendering of a residence.", category: "Architectural rendering", title: "Residential exterior rendering 03" },
  { src: "/projects/client-railing-detail-photo.webp", alt: "Client-supplied photograph showing an architectural railing detail.", category: "Construction photo", title: "Railing detail photograph" },
  { src: "/projects/client-masonry-construction-photo.webp", alt: "Client-supplied photograph of masonry work in progress.", category: "Construction photo", title: "Masonry work photograph" },
  { src: "/projects/client-tower-exterior-render.webp", alt: "Client-supplied architectural rendering showing a tall facade detail.", category: "Architectural rendering", title: "Facade rendering" },
  { src: "/projects/client-exterior-render-04.webp", alt: "Client-supplied exterior architectural rendering of a residence.", category: "Architectural rendering", title: "Residential exterior rendering 04" },
  { src: "/projects/client-building-construction-photo.webp", alt: "Client-supplied photograph of a building under construction.", category: "Construction photo", title: "Building construction photograph" },
  { src: "/projects/client-exterior-render-05.webp", alt: "Client-supplied exterior architectural rendering of a residence.", category: "Architectural rendering", title: "Residential exterior rendering 05" },
  { src: "/projects/client-front-elevation.webp", alt: "Client-supplied front elevation drawing of a building.", category: "Drawing", title: "Front elevation drawing" },
  { src: "/projects/client-ground-floor-plan.webp", alt: "Client-supplied ground-floor plan drawing.", category: "Drawing", title: "Ground-floor plan drawing" },
  { src: "/projects/client-left-elevation.webp", alt: "Client-supplied left elevation drawing of a building.", category: "Drawing", title: "Left elevation drawing" },
  { src: "/projects/client-right-elevation.webp", alt: "Client-supplied right elevation drawing of a building.", category: "Drawing", title: "Right elevation drawing" },
  { src: "/projects/client-rear-elevation.webp", alt: "Client-supplied rear elevation drawing of a building.", category: "Drawing", title: "Rear elevation drawing" },
];

export const defaultProjectImagePaths = projectImages.map((image) => image.src);
export const featuredProjectImage = projectImages[0];
