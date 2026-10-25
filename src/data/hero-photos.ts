import blurData from "./hero-blur.json";

export type HeroPhoto = {
  id: string;
  src: string;
  alt: string;
  label: string;
  blurDataURL: string;
  objectPosition?: string;
};

export const heroPhotos: HeroPhoto[] = [
  {
    id: "estructura",
    src: "/img/hero/estructura.webp",
    alt: "Vista aérea de estructura de steel frame con perfiles galvanizados y cerchas en obra",
    label: "ESTRUCTURA",
    blurDataURL: (blurData as Record<string, string>).estructura,
    objectPosition: "center",
  },
  {
    id: "cerramiento",
    src: "/img/hero/cerramiento.webp",
    alt: "Edificación en steel frame con placas de OSB y Glass Rey en proceso de cerramiento",
    label: "CERRAMIENTO",
    blurDataURL: (blurData as Record<string, string>).cerramiento,
    objectPosition: "center",
  },
  {
    id: "fachada",
    src: "/img/hero/fachada.webp",
    alt: "Fachada azul de construcción en seco casi terminada con ventanas y alero",
    label: "FACHADA",
    blurDataURL: (blurData as Record<string, string>).fachada,
    objectPosition: "center",
  },
  {
    id: "acabados",
    src: "/img/hero/acabados.webp",
    alt: "Operario instalando peldaños de una escalera interior en obra con fachada de vidrio",
    label: "ACABADOS",
    blurDataURL: (blurData as Record<string, string>).acabados,
    objectPosition: "center",
  },
];
