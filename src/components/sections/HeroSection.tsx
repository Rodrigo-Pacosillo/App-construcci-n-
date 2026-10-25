"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroPhotos } from "@/data/hero-photos";

const ROTATION_MS = 5500;
const FADE_MS = 600;

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener?.("change", onStoreChange);
      return () => mql.removeEventListener?.("change", onStoreChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function useDocumentHidden(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    document.addEventListener("visibilitychange", onStoreChange);
    return () => document.removeEventListener("visibilitychange", onStoreChange);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => document.hidden,
    () => false,
  );
}

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [inView, setInView] = useState(true);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const documentHidden = useDocumentHidden();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const stopAutoplay = useCallback(() => {
    setHasInteracted(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    stopAutoplay();
    setActiveIndex((i) => (i + 1) % heroPhotos.length);
  }, [stopAutoplay]);

  const goPrev = useCallback(() => {
    stopAutoplay();
    setActiveIndex((i) => (i - 1 + heroPhotos.length) % heroPhotos.length);
  }, [stopAutoplay]);

  const goTo = useCallback(
    (index: number) => {
      stopAutoplay();
      setActiveIndex(index);
    },
    [stopAutoplay],
  );

  // Rotation pauses when the tab is hidden or the hero is off-screen,
  // and stops for good once the visitor takes control.
  const rotating = !reducedMotion && !hasInteracted && !documentHidden && inView;

  useEffect(() => {
    if (!rotating) return;
    const tick = () => {
      setActiveIndex((i) => (i + 1) % heroPhotos.length);
      timerRef.current = setTimeout(tick, ROTATION_MS);
    };
    timerRef.current = setTimeout(tick, ROTATION_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [rotating]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const storyState = (idx: number): "done" | "active" | "idle" => {
    if (idx < activeIndex) return "done";
    if (idx > activeIndex) return "idle";
    return rotating ? "active" : "done";
  };

  return (
    <section ref={sectionRef} tabIndex={-1} className="relative overflow-hidden py-24 lg:py-32 focus:outline-none">
      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-x-[clamp(2rem,6vw,6rem)]">
          <div className="w-full lg:max-w-3xl">
            <p className="section-label mb-4 text-accent-strong">
              Especialista en construcción en seco, STEEL FRAME
            </p>
            <h1 className="font-heading text-5xl font-bold leading-tight text-ink md:text-7xl">
              Construimos su
              <br className="hidden sm:block" />
              <span className="text-accent-strong sm:whitespace-nowrap">próximo proyecto</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-muted">
              Por la eficiencia y garantía que brindamos.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cotizacion"
                className="accent-btn inline-flex items-center justify-center rounded px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              >
                Solicite su presupuesto
              </Link>
              <Link
                href="/proyectos"
                className="inline-flex items-center justify-center rounded border border-ink/25 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/40"
              >
                Ver proyectos
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:justify-self-end">
            <div className="relative mx-auto w-full lg:mx-0 lg:w-fit">
              <button
                type="button"
                onClick={goPrev}
                className="absolute -left-12 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-surface/80 p-2 text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-ink/40 hover:text-ink lg:flex"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute -right-12 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-surface/80 p-2 text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-ink/40 hover:text-ink lg:flex"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="hero-frame relative">
                <div
                  className="hero-photo relative aspect-[3/4] w-full overflow-hidden lg:w-[min(26rem,calc((100svh-18rem)*0.75))]"
                  role="group"
                  aria-roledescription="carousel"
                  aria-label="Obras realizadas"
                  aria-live="off"
                >
                  <div
                    className="absolute inset-x-0 top-0 z-20 flex gap-1.5 px-2 pt-2 sm:hidden"
                    style={{ "--story-ms": `${ROTATION_MS}ms` } as CSSProperties}
                  >
                    {heroPhotos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => goTo(idx)}
                        className="flex h-11 flex-1 items-start"
                        aria-label={`Ver foto ${idx + 1} de ${heroPhotos.length}: ${photo.label}`}
                        aria-current={idx === activeIndex ? "true" : undefined}
                      >
                        <span className="story-bar block h-0.5 w-full overflow-hidden rounded-full bg-black/35 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                          <span className="story-fill" data-state={storyState(idx)} />
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-opacity hover:bg-black/60 sm:flex lg:hidden"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-opacity hover:bg-black/60 sm:flex lg:hidden"
                    aria-label="Foto siguiente"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {heroPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className={`absolute inset-0 transition-opacity ${idx === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                      style={{ transitionDuration: `${FADE_MS}ms` }}
                      aria-hidden={idx !== activeIndex}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 640px) 420px, 100vw"
                        quality={80}
                        priority={idx === 0}
                        loading={idx === 0 ? undefined : "lazy"}
                        placeholder="blur"
                        blurDataURL={photo.blurDataURL}
                        style={{ objectFit: "cover", objectPosition: photo.objectPosition || "center" }}
                      />
                    </div>
                  ))}
                </div>
                <span className="corner tl" aria-hidden="true" />
                <span className="corner tr" aria-hidden="true" />
                <span className="corner bl" aria-hidden="true" />
                <span className="corner br" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-frame {
          position: relative;
          width: fit-content;
          padding: 10px;
          border: 1px solid transparent;
          border-radius: 4px;
          background:
            linear-gradient(var(--surface), var(--surface)) padding-box,
            linear-gradient(160deg, var(--accent-strong), transparent 45%, var(--accent-strong)) border-box;
        }
        .hero-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          transform: translate(12px, 12px);
          border: 1px solid color-mix(in srgb, var(--accent-strong) 45%, transparent);
          z-index: -1;
        }
        .hero-frame::after {
          content: "";
          position: absolute;
          inset: -12%;
          background: radial-gradient(closest-side, color-mix(in srgb, var(--accent-strong) 14%, transparent), transparent);
          z-index: -2;
          pointer-events: none;
        }
        .hero-photo {
          position: relative;
          aspect-ratio: 3 / 4;
        }
        .story-fill {
          display: block;
          width: 0;
          height: 100%;
          border-radius: 9999px;
          background: #fff;
        }
        .story-fill[data-state="done"] {
          width: 100%;
        }
        .story-fill[data-state="active"] {
          animation-name: story-progress;
          animation-duration: var(--story-ms, 5.5s);
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes story-progress {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        .corner {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid var(--accent-strong);
        }
        .corner.tl {
          top: -1px;
          left: -1px;
          border-right: none;
          border-bottom: none;
        }
        .corner.tr {
          top: -1px;
          right: -1px;
          border-left: none;
          border-bottom: none;
        }
        .corner.bl {
          bottom: -1px;
          left: -1px;
          border-right: none;
          border-top: none;
        }
        .corner.br {
          bottom: -1px;
          right: -1px;
          border-left: none;
          border-top: none;
        }
        @media (max-width: 1023px) {
          .hero-frame {
            all: unset;
            display: block;
            width: 100%;
          }
          .hero-frame::before,
          .hero-frame::after,
          .corner {
            display: none;
          }
          /* Width yields to height so the 3:4 ratio always survives. */
          .hero-photo {
            width: min(100%, calc(62svh * 0.75));
            margin-inline: auto;
            -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent 100%);
            mask-image: linear-gradient(to bottom, #000 58%, transparent 100%);
          }
        }
        @media (max-width: 639px) {
          .hero-photo {
            width: min(100%, calc(56svh * 0.75));
          }
        }
      `}</style>
    </section>
  );
}
