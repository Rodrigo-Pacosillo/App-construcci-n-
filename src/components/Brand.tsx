import Image from "next/image";
import Link from "next/link";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CONSTR-ART, ir al inicio"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <Image
        src="/logotipo/logo-icon-light.png"
        alt=""
        width={87}
        height={40}
        loading="eager"
        quality={90}
        className="h-9 w-auto lg:h-10 dark:hidden"
      />
      <Image
        src="/logotipo/logo-icon-dark.png"
        alt=""
        width={87}
        height={40}
        loading="eager"
        quality={90}
        className="hidden h-9 w-auto lg:h-10 dark:block"
      />
      <span className="font-heading text-lg font-bold tracking-tight">
        CONSTR-<span className="text-accent">ART</span>
      </span>
    </Link>
  );
}
