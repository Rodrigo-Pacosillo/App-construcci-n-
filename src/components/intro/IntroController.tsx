// components/intro/IntroController.tsx
'use client';

import { useEffect } from 'react';

const KEY = 'constrart-intro';

export default function IntroController() {
  useEffect(() => {
    const root = document.documentElement;
    const intro = document.querySelector<HTMLElement>('.intro');
    if (!intro) return;

    const finish = () => root.setAttribute('data-intro', 'done');

    // React Strict Mode re-runs this effect on the same DOM node in development.
    // Detect that re-run so the intro is not cancelled before it can play.
    if (intro.dataset.started !== '1') {
      // Client-side navigation back to "/" in the same session: already seen.
      try {
        if (sessionStorage.getItem(KEY) === '1') {
          finish();
          return;
        }
        sessionStorage.setItem(KEY, '1');
      } catch {
        finish();
        return;
      }
      intro.dataset.started = '1';
    }

    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === 'intro-up') finish();
    };

    intro.addEventListener('animationend', onEnd);
    window.addEventListener('pointerdown', finish, { once: true });
    window.addEventListener('keydown', finish, { once: true });

    return () => {
      intro.removeEventListener('animationend', onEnd);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
      // No finish() here: the session key is already stored, and any real
      // navigation away fires pointerdown/keydown, which hides the curtain.
    };
  }, []);

  return null;
}
