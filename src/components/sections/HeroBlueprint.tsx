"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function HeroBlueprint() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

    // Rieles (horizontales)
    const rails = svg.querySelectorAll(".rail");
    tl.fromTo(rails, { strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: 0.8, stagger: 0.1 });

    // Parantes (verticales)
    const studs = svg.querySelectorAll(".stud");
    tl.fromTo(studs, { strokeDashoffset: 200 }, { strokeDashoffset: 0, duration: 0.3, stagger: 0.08 }, "-=0.3");

    // Dinteles
    const headers = svg.querySelectorAll(".header");
    tl.fromTo(headers, { strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.1 }, "-=0.2");

    // Paños (aislación)
    const panels = svg.querySelectorAll(".panel");
    tl.fromTo(panels, { opacity: 0 }, { opacity: 0.15, duration: 0.4, stagger: 0.1 }, "-=0.2");

    // Placas
    const plates = svg.querySelectorAll(".plate");
    tl.fromTo(plates, { opacity: 0 }, { opacity: 0.3, duration: 0.5, stagger: 0.15 }, "-=0.3");

    // Ventana se enciende
    const windowGlow = svg.querySelector(".window-glow");
    if (windowGlow) {
      tl.to(windowGlow, { opacity: 1, duration: 0.3 }, "-=0.2");
      tl.to(windowGlow, { opacity: 0, duration: 0.5, delay: 1.5 });
    }

    // Fade out todo
    tl.to(svg, { opacity: 0.3, duration: 0.8, delay: 0.5 });
    tl.set(svg, { opacity: 1 });
    tl.set(rails, { strokeDashoffset: 400 });
    tl.set(studs, { strokeDashoffset: 200 });
    tl.set(headers, { strokeDashoffset: 300 });
    tl.set(panels, { opacity: 0 });
    tl.set(plates, { opacity: 0 });
    if (windowGlow) tl.set(windowGlow, { opacity: 0 });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-40 lg:opacity-60">
      <svg
        ref={svgRef}
        viewBox="0 0 400 300"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        {/* Rieles */}
        <line className="rail" x1="20" y1="280" x2="380" y2="280" strokeDasharray="400" strokeDashoffset="400" stroke="var(--bp-accent)" />
        <line className="rail" x1="20" y1="20" x2="380" y2="20" strokeDasharray="400" strokeDashoffset="400" stroke="var(--bp-accent)" />

        {/* Parantes */}
        <line className="stud" x1="20" y1="20" x2="20" y2="280" strokeDasharray="200" strokeDashoffset="200" stroke="var(--bp-stud)" />
        <line className="stud" x1="100" y1="20" x2="100" y2="280" strokeDasharray="200" strokeDashoffset="200" stroke="var(--bp-stud)" />
        <line className="stud" x1="180" y1="20" x2="180" y2="280" strokeDasharray="200" strokeDashoffset="200" stroke="var(--bp-stud)" />
        <line className="stud" x1="260" y1="20" x2="260" y2="280" strokeDasharray="200" strokeDashoffset="200" stroke="var(--bp-stud)" />
        <line className="stud" x1="340" y1="20" x2="340" y2="280" strokeDasharray="200" strokeDashoffset="200" stroke="var(--bp-stud)" />
        <line className="stud" x1="380" y1="20" x2="380" y2="280" strokeDasharray="200" strokeDashoffset="200" stroke="var(--bp-stud)" />

        {/* Dinteles */}
        <line className="header" x1="180" y1="80" x2="260" y2="80" strokeDasharray="300" strokeDashoffset="300" stroke="var(--bp-accent)" />
        <line className="header" x1="180" y1="200" x2="260" y2="200" strokeDasharray="300" strokeDashoffset="300" stroke="var(--bp-accent)" />

         {/* Paños (aislación) */}
        <rect className="panel" x="25" y="25" width="70" height="250" fill="var(--bp-panel)" opacity="0" />
        <rect className="panel" x="105" y="25" width="70" height="250" fill="var(--bp-panel)" opacity="0" />
        <rect className="panel" x="265" y="25" width="70" height="250" fill="var(--bp-panel)" opacity="0" />
        <rect className="panel" x="345" y="25" width="30" height="250" fill="var(--bp-panel)" opacity="0" />

        {/* Placas */}
        <rect className="plate" x="25" y="25" width="70" height="250" fill="var(--bp-plate)" opacity="0" />
        <rect className="plate" x="105" y="25" width="70" height="250" fill="var(--bp-plate)" opacity="0" />
        <rect className="plate" x="265" y="25" width="70" height="250" fill="var(--bp-plate)" opacity="0" />
        <rect className="plate" x="345" y="25" width="30" height="250" fill="var(--bp-plate)" opacity="0" />

        {/* Ventana */}
        <rect className="window-glow" x="185" y="85" width="70" height="110" fill="var(--bp-glow)" opacity="0" rx="2" />
      </svg>
    </div>
  );
}
