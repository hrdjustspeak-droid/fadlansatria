// Motion seluruh situs (Bagian 8). Konten tetap terlihat tanpa JS: state awal hanya diset oleh GSAP.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

let ctx: gsap.Context | undefined;
let lenis: Lenis | undefined;
let tick: ((t: number) => void) | undefined;

function setup() {
  const level = document.documentElement.dataset.motion ?? 'full';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (level === 'off' || reduced) return;
  const full = level === 'full';
  const y = full ? 24 : 0;

  if (full) {
    lenis = new Lenis({ lerp: 0.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    tick = (t) => lenis!.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }

  ctx = gsap.context(() => {
    const heroLines = gsap.utils.toArray<HTMLElement>('[data-hero-line]');
    if (heroLines.length) gsap.from(heroLines, { y, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' });

    const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');
    gsap.set(reveals, { opacity: 0, y });
    ScrollTrigger.batch(reveals, {
      start: 'top 85%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' }),
    });

    gsap.utils.toArray<HTMLElement>('[data-clip]').forEach((el) => {
      gsap.fromTo(
        el,
        full ? { clipPath: 'inset(0% 0% 100% 0%)' } : { opacity: 0 },
        {
          ...(full ? { clipPath: 'inset(0% 0% 0% 0%)' } : { opacity: 1 }),
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      );
    });

    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const obj = { v: 0 };
      el.textContent = '0';
      gsap.to(obj, {
        v: end,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
      });
    });
  });
}

function teardown() {
  ctx?.revert();
  ctx = undefined;
  if (tick) gsap.ticker.remove(tick);
  tick = undefined;
  lenis?.destroy();
  lenis = undefined;
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', teardown);
