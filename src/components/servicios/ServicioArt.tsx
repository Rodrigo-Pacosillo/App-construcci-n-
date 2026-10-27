// Uso: <ServicioArt slug={servicio.slug} />
// Componente de servidor: solo el dibujo del slug pedido viaja al navegador.
// Si el slug no tiene dibujo (por ejemplo un servicio nuevo desde el admin), no renderiza nada.
import ArtPlayer from "./ArtPlayer";
import { ARTS } from "./arts";

export default function ServicioArt({ slug }: { slug: string }) {
  const Art = ARTS[slug];
  if (!Art) return null;
  return (
    <ArtPlayer>
      <Art />
    </ArtPlayer>
  );
}
