// components/chat/SendIcon.tsx
// Ícono de enviar: flecha hacia arriba cuya punta es el techo del logo.
// Usa currentColor: el color lo define el botón (ver la guía, sección de estados).
// Tamaño dentro del botón: 20 a 22 px.

export default function SendIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinejoin="miter"
      strokeMiterlimit="10"
      aria-hidden="true"
      className={className}
    >
      <path d="M5.5 11.5L12 5.5L18.5 11.5" />
      <path d="M12 5.5V19" />
    </svg>
  );
}
