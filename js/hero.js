// Героблок: руки сходятся, камера наезжает (постановка 24, 08.10.2026; доработка 25).
// Сцена 1440 × 900 эталона-2: старт — кадр AS2K2, конец — C9pDsY.
// Без JS, на телефоне, на вертикальном планшете и при reduced motion анимации нет:
// остается начальное состояние из CSS (здесь к нему добавляется только прижим рук к краям).

// Подбирает владелец
const PIN_VH = 4;      // длина анимации, высот окна (правка 27: было 2,5)
const SCRUB = 1;       // сглаживание scrub, с
const HOLD = 0.15;     // удержание конечного кадра: доля длины анимации,
const HOLD_MIN = 250;  // но не меньше, px прокрутки
const M = 24;          // неприкосновенная зона вокруг кнопки, px
// Вход подписей после load, с (правка 29): первая — быстрее и резче, вторая — как в правке 27
const INTRO = [
  { delay: 0.3, dur: 0.7, ease: 'power2.out' }, // «Отвечаем на один вопрос…»
  { delay: 1.0, dur: 0.7, ease: 'power2.out' }, // «Только факты» (правка 30: было 2,0 / 1,6 / sine.inOut)
];

// Подписи появляются после загрузки: --l-intro 0 → 1 (CSS переводит его в filter и подъем
// на 12 px). Твин, а не CSS-переход: refresh ScrollTrigger переставляет героблок в DOM
// и обрывает переходы. Скрыты подписи только при .js и только там, где идет анимация (CSS).
window.addEventListener('load', () => {
  const notes = document.querySelectorAll('.hero__note, .hero__facts');
  if (!window.gsap) { notes.forEach((el) => el.style.setProperty('--l-intro', 1)); return; }
  notes.forEach((el, i) => gsap.fromTo(el, { '--l-intro': 0 }, {
    '--l-intro': 1, duration: INTRO[i].dur, delay: INTRO[i].delay, ease: INTRO[i].ease,
  }));
});

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  const { gsap, ScrollTrigger } = window;
  if (!hero || !gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  // 2D-трансформации: с translate3d слои растеризуются иначе, и старт отличается от CSS-версии
  gsap.config({ force3D: false });

  const stage = hero.querySelector('.hero__stage');
  const room = hero.querySelector('.hero__room');
  const roomEnd = hero.querySelector('.hero__room-end');
  const endFade = hero.querySelector('.hero__end-fade');
  const content = hero.querySelector('.hero__content');
  const title = hero.querySelector('.hero__title');
  const subtitle = hero.querySelector('.hero__subtitle');
  const cta = hero.querySelector('.hero__cta .btn');

  // Руки: прямоугольник в координатах сцены (x, y — левый верхний угол до поворота),
  // поворот от левого верхнего угла. Кромки — непрозрачные пиксели на границе картинки 1376 × 768.
  const hands = [
    {
      el: hero.querySelector('.hero__hand--seller'), w: 888, h: 405, rot: 10.172,
      start: [-274.474, 403], end: [5.526, 400], side: -1,
      cut: [[0, 69], [0, 767], [86, 767]], contour: window.HAND_CONTOUR?.seller,
    },
    {
      el: hero.querySelector('.hero__hand--buyer'), w: 1055.6, h: 589.2, rot: 4.797,
      start: [830.275, 463], end: [497.275, 471], side: 1,
      cut: [[1376, 80], [1376, 767], [1210, 767]], contour: window.HAND_CONTOUR?.buyer,
    },
  ];
  const MEET = [666, 780];          // точка рукопожатия в кадре C9pDsY
  const MEET_AT = [0.4625, 0.8667]; // ее место в героблоке, доли ширины и высоты
  const EDGE = 2;                   // запас: кромка на 2 px за краем окна (старт и конец)
  const ROOM = { x: 363, y: 167.718, w: 764, h: 405, rot: -0.279, o: 0.59, oEnd: 0.75 };

  // Героблок: ширина, высота, масштаб сцены, левый край сцены
  const box = () => {
    const W = hero.clientWidth;
    const H = hero.clientHeight;
    const off = stage.getBoundingClientRect().left - hero.getBoundingClientRect().left;
    return { W, H, k: H / 900, off };
  };

  // Экранные точки кромок руки при левом верхнем угле (L, T) и масштабе s (px на единицу сцены)
  const cutPoints = (hand, L, T, s) => {
    const a = hand.rot * Math.PI / 180;
    return hand.cut.map(([u, v]) => {
      const px = u / 1376 * hand.w * s;
      const py = v / 768 * hand.h * s;
      return [L + px * Math.cos(a) - py * Math.sin(a), T + px * Math.sin(a) + py * Math.cos(a)];
    });
  };

  // Старт: как в CSS, плюс прижим кромки за край окна
  const startRect = (hand, g) => {
    let L = g.off + g.k * hand.start[0];
    const T = g.k * hand.start[1];
    const xs = cutPoints(hand, L, T, g.k).filter(([, y]) => y < g.H).map(([x]) => x);
    if (xs.length && hand.side < 0) L -= Math.max(0, Math.max(...xs) + EDGE);
    if (xs.length && hand.side > 0) L += Math.max(0, g.W + EDGE - Math.min(...xs));
    return { L, T, s: g.k };
  };

  // Конец: точка рукопожатия на месте, масштаб S — наименьший не меньше k, при котором
  // каждая точка кромки на EDGE за боковым краем окна или ниже героблока.
  // Точка кромки: x = MEET_AT[0] · W + S · bx, y = MEET_AT[1] · H + S · by.
  // Решает продавец (0, 69): S ≥ (0,4625 · W + 2) / 666,9; при 1440 × 900 S = 1,0017 —
  // кадр C9pDsY с отклонением ~1 px (множитель 1,02 давал 1,0186 и −12 px от кадра).
  const endScale = (g) => {
    let S = g.k;
    const x0 = MEET_AT[0] * g.W;
    const y0 = MEET_AT[1] * g.H;
    hands.forEach((hand) => {
      const a = hand.rot * Math.PI / 180;
      hand.cut.forEach(([u, v]) => {
        const px = u / 1376 * hand.w;
        const py = v / 768 * hand.h;
        const bx = hand.end[0] - MEET[0] + px * Math.cos(a) - py * Math.sin(a);
        const by = hand.end[1] - MEET[1] + px * Math.sin(a) + py * Math.cos(a);
        const sx = hand.side < 0 ? (x0 + EDGE) / -bx : (g.W + EDGE - x0) / bx;
        const sy = by > 0 ? (g.H + EDGE - y0) / by : Infinity;
        S = Math.max(S, Math.min(sx, sy));
      });
    });
    return S;
  };

  const endRect = (hand, g) => {
    const S = endScale(g);
    return {
      L: MEET_AT[0] * g.W + S * (hand.end[0] - MEET[0]),
      T: MEET_AT[1] * g.H + S * (hand.end[1] - MEET[1]),
      s: S,
    };
  };

  // Прямоугольник → значения GSAP относительно положения руки в CSS (оно не анимируется)
  const toTween = (hand, rect) => {
    const g = box();
    const cs = getComputedStyle(hand.el);
    return {
      x: rect.L - (g.off + parseFloat(cs.left)),
      y: rect.T - parseFloat(cs.top),
      scale: rect.s / g.k,
    };
  };
  const handAt = (hand, which, prop) => () => {
    const rect = which === 'start' ? startRect(hand, box()) : endRect(hand, box());
    return toTween(hand, rect)[prop];
  };

  // Растушевка конца не анимируется, но зависит от окна
  const place = () => {
    const g = box();
    gsap.set(endFade, { left: -g.off, width: g.W, autoRound: false });
  };

  // Отскок: если непрозрачная часть руки входит в зону M под кнопкой, блок текста
  // поднимается так, чтобы зазор между низом кнопки и верхом руки был M.
  // Верх руки — наименьший y точек контура ниже подзаголовка в полосе
  // [лево кнопки − M, право кнопки + M]; точки переводятся той же матрицей, что и картинка.
  let shift = 0;
  let base = null; // кнопка, подзаголовок, заголовок без сдвига — от верха героблока
  const measureBase = () => {
    const top = hero.getBoundingClientRect().top - shift;
    const b = cta.getBoundingClientRect();
    base = {
      left: b.left - M, right: b.right + M, bottom: b.bottom - top,
      sub: subtitle.getBoundingClientRect().bottom - top,
      title: title.getBoundingClientRect().top - top,
    };
  };
  const bounce = () => {
    if (!base) return;
    const top = hero.getBoundingClientRect().top;
    const s = stage.getBoundingClientRect();
    let handTop = Infinity;
    hands.forEach((hand) => {
      if (!hand.contour) return;
      const cs = getComputedStyle(hand.el);
      const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform);
      const L = s.left + parseFloat(cs.left);
      const T = s.top - top + parseFloat(cs.top);
      const kx = parseFloat(cs.width) / 1376;
      const ky = parseFloat(cs.height) / 768;
      const c = hand.contour;
      for (let i = 0; i < c.length; i += 2) {
        const u = c[i] * kx;
        const v = c[i + 1] * ky;
        const x = L + m.a * u + m.c * v + m.e;
        const y = T + m.b * u + m.d * v + m.f;
        if (x >= base.left && x <= base.right && y > base.sub && y < handTop) handTop = y;
      }
    });
    // не выше верха героблока
    shift = Math.min(Math.max(0, base.bottom + M - handTop), base.title);
    gsap.set(content, { y: -shift });
  };
  const rebase = () => { measureBase(); bounce(); };

  const mm = gsap.matchMedia();
  mm.add({
    anim: '(min-width: 1024px), (min-width: 640px) and (orientation: landscape)',
    reduce: '(prefers-reduced-motion: reduce)',
  }, (context) => {
    const { anim, reduce } = context.conditions;
    if (!anim) return undefined;

    const handVars = (hand, which) => ({
      x: handAt(hand, which, 'x'),
      y: handAt(hand, which, 'y'),
      scale: handAt(hand, which, 'scale'),
      rotation: hand.rot,
      transformOrigin: '0 0',
    });

    if (reduce) {
      const prime = () => {
        hands.forEach((hand) => gsap.set(hand.el, handVars(hand, 'start')));
        rebase();
      };
      prime();
      window.addEventListener('resize', prime);
      document.fonts.ready.then(prime);
      return () => {
        window.removeEventListener('resize', prime);
        gsap.set(content, { clearProps: 'transform' });
        shift = 0;
      };
    }

    hero.classList.add('hero--cam');

    // Длина: анимация PIN_VH высот окна + удержание конечного кадра. Анимация в шкале
    // занимает 0…1, удержание — пустой отрезок после нее, длина которого ставится на refresh.
    const animLen = () => PIN_VH * window.innerHeight;
    const holdLen = () => Math.max(HOLD * animLen(), HOLD_MIN);
    const tl = gsap.timeline({
      defaults: { ease: 'none', duration: 1 },
      onUpdate: bounce,
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => `+=${animLen() + holdLen()}`,
        pin: true,
        scrub: SCRUB,
        invalidateOnRefresh: true,
      },
    });
    const hold = gsap.to({}, { duration: HOLD });
    tl.add(hold, 1);
    const setHold = () => hold.duration(holdLen() / animLen());

    // Руки: левый верхний угол и масштаб линейно по прогрессу, поворот постоянный
    hands.forEach((hand) => {
      tl.fromTo(hand.el, handVars(hand, 'start'), handVars(hand, 'end'), 0);
    });

    // Кадр комнаты раскрывается до всего героблока; кубики сменяются комнатой
    tl.fromTo(room, {
      left: () => box().k * ROOM.x,
      top: () => box().k * ROOM.y,
      width: () => box().k * ROOM.w,
      height: () => box().k * ROOM.h,
      rotation: ROOM.rot,
      transformOrigin: '0 0',
      opacity: ROOM.o,
      autoRound: false, // GSAP округляет px; без этого кадр старта съезжает на 0,3 px, а в конце остается полоса 0,5 px
    }, {
      // на 1 px за края героблока: дробный край давал светлый столбец сглаживания
      left: () => -box().off - 1,
      top: -1,
      width: () => box().W + 2,
      height: () => box().H + 2,
      rotation: 0,
      opacity: ROOM.oEnd,
      autoRound: false,
    }, 0);
    tl.fromTo(roomEnd, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.2);
    tl.to('.hero__room-fade', { opacity: 0, duration: 0.3 }, 0);
    tl.fromTo('.hero__room-edge', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
      .to('.hero__room-edge', { opacity: 0, duration: 0.3 }, 0.7);
    tl.fromTo(endFade, { opacity: 0 }, { opacity: 0.27, duration: 0.4 }, 0.6);
    tl.to(['.hero__note', '.hero__facts'], { opacity: 0, duration: 1 / 3 }, 0);

    const refresh = () => { place(); rebase(); };
    ScrollTrigger.addEventListener('refreshInit', setHold);
    ScrollTrigger.addEventListener('refresh', refresh);
    setHold();
    refresh();
    document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', setHold);
      ScrollTrigger.removeEventListener('refresh', refresh);
      hero.classList.remove('hero--cam');
      gsap.set(content, { clearProps: 'transform' });
      shift = 0;
    };
  });
});
