// components/intro/HomeIntro.tsx
// Server Component. Solo marcado: la animación es CSS (ver intro.css).
import IntroLogo from './IntroLogo';
import IntroController from './IntroController';

export default function HomeIntro() {
  return (
    <div className="intro" aria-hidden="true">
      <IntroLogo />
      <IntroController />
    </div>
  );
}
