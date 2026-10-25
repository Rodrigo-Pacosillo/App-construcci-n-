// lib/intro-gate.ts
// Script que se inyecta en <head>. Se ejecuta ANTES del primer pintado.
// Si la sesión ya vio la intro, o la primera página no es "/", o hay reduced-motion,
// o falla sessionStorage: marca la sesión y oculta la intro con data-intro="done".
export const introGateScript = `(function(){var d=document.documentElement,k='constrart-intro';try{if(sessionStorage.getItem(k)||location.pathname!=='/'||matchMedia('(prefers-reduced-motion: reduce)').matches){sessionStorage.setItem(k,'1');d.setAttribute('data-intro','done')}}catch(e){d.setAttribute('data-intro','done')}})()`;
