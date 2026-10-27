// Los 6 dibujos animados. Son componentes de SERVIDOR (sin hooks, sin "use client"):
// no agregan JavaScript al navegador. La animación es solo CSS (servicio-art.css).
// `t` = retraso de entrada en segundos (se pasa al CSS como --d).
import type { CSSProperties, ReactElement, ReactNode, SVGProps } from "react";

const dl = (t: number, extra?: CSSProperties) => ({ "--d": t, ...extra }) as CSSProperties;

type T = { t: number };
const Part = ({ t, ...p }: T & SVGProps<SVGRectElement>) => <rect className="p" pathLength={1} style={dl(t)} {...p} />;
const PartPath = ({ t, ...p }: T & SVGProps<SVGPathElement>) => <path className="p" pathLength={1} style={dl(t)} {...p} />;
const Ln = ({ t, ...p }: T & SVGProps<SVGPathElement>) => <path className="l" pathLength={1} style={dl(t)} {...p} />;
const Am = ({ t, sw, faint, ...p }: T & { sw?: number; faint?: boolean } & SVGProps<SVGPathElement>) => (
  <path className={faint ? "a f" : "a"} pathLength={1} style={dl(t, sw ? { strokeWidth: sw } : undefined)} {...p} />
);
const Dot = ({ t, ...p }: T & SVGProps<SVGCircleElement>) => <circle className="o" style={dl(t)} {...p} />;
const Label = ({ t, y, children }: T & { y: number; children: ReactNode }) => (
  <text className="lbl am" style={dl(t)} x={160} y={y} textAnchor="middle">{children}</text>
);

function Svg({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 320 240" role="img" aria-label={title}>
      <defs>
        <pattern id={`bp-${id}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--art-grid)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height="240" fill="var(--art-paper)" />
      <rect width="320" height="240" fill={`url(#bp-${id})`} />
      {children}
    </svg>
  );
}

/* ---------- 1. Steel Frame ---------- */
export function SteelFrame() {
  return (
    <Svg id="steel" title="Estructura de acero con soleras, montantes y refuerzo diagonal, cubierta con placa de yeso">
      <Part t={0} x={24} y={36} width={272} height={10} rx={1.5} />
      <Part t={0} x={24} y={184} width={272} height={10} rx={1.5} />
      {[44, 104, 164, 224, 284].map((x, i) => (
        <Part key={x} t={0.4 + i * 0.2} x={x} y={46} width={12} height={138} />
      ))}
      <Am t={1.7} d="M50 54L290 176" />
      <Dot t={1.7} cx={50} cy={54} r={4.5} />
      <Dot t={2.5} cx={290} cy={176} r={4.5} />
      <rect className="b" style={dl(3)} x={36} y={48} width={134} height={134} rx={2} />
      <Label t={3.8} y={222}>ESTRUCTURA DE ACERO</Label>
    </Svg>
  );
}

/* ---------- 2. Tabiquería Drywall ---------- */
export function Drywall() {
  return (
    <Svg id="drywall" title="Corte de un tabique de yeso que frena las ondas de sonido">
      <Part t={0} x={140} y={28} width={10} height={180} />
      <Part t={0.2} x={170} y={28} width={10} height={180} />
      <Part t={0.6} x={153} y={52} width={14} height={14} />
      <Part t={0.8} x={153} y={112} width={14} height={14} />
      <Part t={1} x={153} y={172} width={14} height={14} />
      <Dot t={1.4} cx={44} cy={118} r={5} />
      <Am t={1.7} d="M70 98A30 30 0 0 1 70 138" />
      <Am t={2} d="M92 88A44 44 0 0 1 92 148" />
      <Am t={2.3} d="M114 78A60 60 0 0 1 114 158" />
      <Am t={2.8} faint d="M206 108A22 22 0 0 1 206 128" />
      <Label t={3.2} y={226}>EL RUIDO SE FRENA</Label>
    </Svg>
  );
}

/* ---------- 3. Cielorrasos ---------- */
export function Cielorrasos() {
  return (
    <Svg id="cielo" title="Cielorraso suspendido con luces empotradas que iluminan el ambiente">
      <Part t={0} x={24} y={28} width={272} height={8} rx={1} />
      {[60, 130, 190, 260].map((x, i) => (
        <Ln key={x} t={0.5 + i * 0.1} d={`M${x} 36V98`} />
      ))}
      <Part t={1.1} x={24} y={98} width={272} height={12} rx={1} />
      {[101, 161, 221].map((c, i) => (
        <polygon key={c} className="cone" style={dl(2.3 + i * 0.2)} points={`${c - 8},115 ${c + 8},115 ${c + 39},198 ${c - 39},198`} />
      ))}
      {[101, 161, 221].map((c, i) => (
        <rect key={c} className="o" style={dl(2 + i * 0.2)} x={c - 10} y={110} width={20} height={5} rx={1} />
      ))}
      <Ln t={3} d="M24 198H296" />
      <Label t={3.4} y={222}>CIELORRASO CON LUCES EMPOTRADAS</Label>
    </Svg>
  );
}

/* ---------- 4. Revestimientos ---------- */
export function Revestimientos() {
  const panels = [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => ({ r, c })));
  return (
    <Svg id="rev" title="Muro que se cubre con placas de revestimiento una a una">
      <Part t={0} x={40} y={28} width={240} height={172} />
      {panels.map(({ r, c }) => (
        <rect key={`${r}-${c}`} className="pn" style={dl(0.8 + (c + r) * 0.2)} x={46 + c * 58} y={35 + r * 54} width={54} height={50} rx={2} />
      ))}
      <Label t={3.2} y={222}>INTERIORES Y EXTERIORES</Label>
    </Svg>
  );
}

/* ---------- 5. Aislaciones ---------- */
const zig = (y: number) => {
  let d = `M66 ${y}`;
  let up = true;
  for (let x = 66; x < 254; x += 16) {
    d += `l16 ${up ? -12 : 12}`;
    up = !up;
  }
  return d;
};
export function Aislaciones() {
  return (
    <Svg id="ais" title="Lana aislante dentro del muro que frena el calor">
      <Part t={0} x={40} y={30} width={240} height={10} rx={1.5} />
      <Part t={0} x={40} y={190} width={240} height={10} rx={1.5} />
      <Part t={0.4} x={48} y={40} width={12} height={150} />
      <Part t={0.6} x={260} y={40} width={12} height={150} />
      {[66, 102, 138, 168].map((y, i) => (
        <Am key={y} t={1.1 + i * 0.4} sw={2} d={zig(y)} />
      ))}
      <Am t={2.9} d="M6 96H34M28 90L34 96L28 102" />
      <Am t={3.1} d="M6 140H34M28 134L34 140L28 146" />
      <Label t={3.6} y={222}>LANA DE VIDRIO O DE ROCA</Label>
    </Svg>
  );
}

/* ---------- 6. Habilitaciones de Locales ---------- */
export function Habilitaciones() {
  const stripes = [
    "30,56 54,56 52,82 24,82",
    "78,56 102,56 105,82 77,82",
    "126,56 150,56 156,82 130,82",
    "174,56 190,56 200,82 182,82",
  ];
  const reqs = [
    { y: 58, label: "PLANOS", t: 3 },
    { y: 86, label: "SEGURIDAD", t: 3.4 },
    { y: 114, label: "ELÉCTRICO", t: 3.8 },
  ];
  return (
    <Svg id="hab" title="Local comercial con toldo, lista de requisitos marcada como cumplida y sello de habilitado">
      <Part t={0} x={24} y={82} width={172} height={114} />
      <PartPath t={0.5} d="M20 82H200L190 56H30Z" />
      {stripes.map((pts, i) => (
        <polygon key={pts} className="stripe" style={dl(1.1 + i * 0.1)} points={pts} />
      ))}
      <Part t={0.9} x={38} y={100} width={82} height={58} />
      <rect className="glass" style={dl(1.5)} x={39} y={101} width={80} height={56} />
      <Ln t={1.5} d="M44 140H114" />
      <Ln t={1.6} d="M62 101V110M80 101V110M98 101V110" />
      <Dot t={1.9} cx={62} cy={114} r={3.5} />
      <Dot t={2} cx={80} cy={114} r={3.5} />
      <Dot t={2.1} cx={98} cy={114} r={3.5} />
      <Part t={1} x={134} y={116} width={46} height={80} />
      <Dot t={1.9} cx={171} cy={158} r={2.4} />

      <g className="slide" style={dl(2.3)}>
        <rect className="doc" x={204} y={22} width={96} height={152} rx={4} />
        <rect className="doc" x={236} y={16} width={32} height={12} rx={3} />
        <text className="lbl sm" x={216} y={46}>REQUISITOS</text>
        {reqs.map(({ y, label, t }) => (
          <g key={label}>
            <rect className="box" x={216} y={y} width={14} height={14} rx={2} />
            <text className="lbl sm" x={238} y={y + 11}>{label}</text>
            <Am t={t} sw={2.4} d={`M218 ${y + 7}l4 4 7-8`} />
          </g>
        ))}
      </g>

      <g transform="rotate(-10 252 154)">
        <g className="stamp" style={dl(4.4)}>
          <rect className="stampbox" x={212} y={140} width={80} height={26} rx={3} />
          <text className="stamp-t" x={252} y={157} textAnchor="middle">HABILITADO</text>
        </g>
      </g>

      <rect className="sign" style={dl(5)} x={140} y={126} width={34} height={13} rx={2} />
      <text className="sign-t" style={dl(5)} x={157} y={135.2} textAnchor="middle">ABIERTO</text>
      <Label t={5.2} y={226}>LISTO PARA ABRIR</Label>
    </Svg>
  );
}

/* slug (el mismo de la tabla `servicios`) -> dibujo */
export const ARTS: Record<string, () => ReactElement> = {
  "steel-frame": SteelFrame,
  drywall: Drywall,
  cielorrasos: Cielorrasos,
  revestimientos: Revestimientos,
  aislaciones: Aislaciones,
  habilitaciones: Habilitaciones,
};
