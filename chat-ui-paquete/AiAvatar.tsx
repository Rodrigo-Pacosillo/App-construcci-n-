// components/chat/AiAvatar.tsx
// Avatar del asistente: la casita del logo de CONSTR-ART (techo, chevrón ámbar, ventana y tres barras),
// reducida dentro de un círculo. Los trazados salen del logo; NO modificarlos.
// Los colores salen de variables CSS (ver chat-ui.css), así cambia solo entre tema claro y oscuro.
// Tamaño recomendado: 40 a 44 px en el encabezado. Mínimo: 32 px (por debajo se pierde el detalle).

type Props = { size?: number; className?: string; title?: string };

export default function AiAvatar({ size = 40, className = '', title = 'Asistente CONSTR-ART' }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={`shrink-0 ${className}`}
    >
      <circle cx="32" cy="32" r="30" fill="var(--ai-badge-bg)" stroke="var(--ai-badge-ring)" strokeWidth="2" />
      <g transform="translate(-3.79 18.41) scale(0.12723)">
    <path d="M402,167.8L304.2,89.2L264.2,58L248,46.2L157.2,110.8L85.5,159L84.8,160L84.8,178.5L85.2,179L93,178.5L179,120.5L247.5,73L248.5,73L304.2,116L369,168.5L402,168.5Z" fill="var(--ai-fg)"/>
    <path d="M346.2,38.5L346,115.5L384.8,146.8L387.8,148.5L387.8,66.2L349.8,40.2Z" fill="var(--ai-fg)"/>
    <rect x="221" y="123" width="21" height="20.5" fill="var(--ai-fg)"/>
    <rect x="251" y="123" width="21" height="20.5" fill="var(--ai-fg)"/>
    <rect x="221" y="152" width="21" height="20.5" fill="var(--ai-fg)"/>
    <rect x="251" y="152" width="21" height="20.5" fill="var(--ai-fg)"/>
    <path d="M335,9.8L321,17.8L288.8,38.2L288.2,41L288.5,69.8L289.8,71.2L331.5,104L336,106.5L336.8,102.8L336.8,12.2L336.2,10Z" fill="var(--ai-amber)"/>
    <path d="M396.2,78.2L436.8,106L436.8,168L396,155.2Z" fill="var(--ai-amber)"/>
    <polyline points="113,176 248,96 358,176" fill="none" stroke="var(--ai-amber)" strokeWidth="13" strokeLinejoin="miter" strokeMiterlimit="10"/>
    <rect x="352" y="171" width="126" height="11" fill="var(--ai-amber)"/>
  </g>
    </svg>
  );
}
