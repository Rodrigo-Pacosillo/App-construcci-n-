// components/chat/BrickLoader.tsx
// Loop "se está construyendo la respuesta": un muro de ladrillos que se arma y se desarma.
// Solo CSS (ver chat-ui.css): anima únicamente opacity y transform. Sin JS por cuadro.
// Se muestra DENTRO de una burbuja con el estilo de las del asistente, mientras se espera la respuesta.

const BRICKS: Array<[number, number, 'a' | 'b']> = [
  [6, 26, 'a'],
  [30, 26, 'a'],
  [54, 26, 'a'],
  [78, 26, 'a'],
  [18, 15, 'b'],
  [42, 15, 'b'],
  [66, 15, 'b'],
  [6, 4, 'a'],
  [30, 4, 'a'],
  [54, 4, 'a'],
  [78, 4, 'a'],
];

export default function BrickLoader({ className = '' }: { className?: string }) {
  return (
    <span role="status" className={`bl ${className}`}>
      <span className="sr-only">El asistente está respondiendo…</span>
      <svg viewBox="0 0 110 36" width="110" height="36" aria-hidden="true">
        {BRICKS.map(([x, y, tone], i) => (
          <rect
            key={i}
            className={`bl-brick bl-${tone}`}
            style={{ animationDelay: `${(i * 0.1).toFixed(1)}s` }}
            x={x}
            y={y}
            width="22"
            height="8"
            rx="1"
          />
        ))}
      </svg>
    </span>
  );
}
