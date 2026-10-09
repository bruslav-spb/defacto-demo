// Плавная прокрутка всей страницы (правка 27, 08.10.2026): Lenis 1.3.26 (MIT, js/vendor/lenis.min.js).
// Связка с ScrollTrigger — по README Lenis, раздел «GSAP ScrollTrigger».
// При prefers-reduced-motion Lenis сам отключает сглаживание (README, раздел о reduced motion).
const SMOOTH_LERP = 0.08; // сглаживание: меньше — мягче и дольше докатывается

document.addEventListener('DOMContentLoaded', () => {
  const { Lenis, gsap, ScrollTrigger } = window;
  if (!Lenis || !gsap || !ScrollTrigger) return;
  const lenis = new Lenis({ lerp: SMOOTH_LERP, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
});
