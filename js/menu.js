// Мобильное меню: кнопка 44 × 44 открывает и закрывает список разделов.
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.hidden = !open;
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Переход по ссылке закрывает меню
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Липкая панель (постановки 25, 26): когда героблок целиком ушел за верх окна, шапка
  // закрепляется сверху; при возврате к героблоку уходит (анимация — в CSS).
  // Наблюдаем не .hero, а сторож после него: refresh ScrollTrigger переставляет героблок
  // в pin-spacer и IO отдает нулевые записи (rootBounds null, bottom 0 → ложное «ушел»).
  // Поле наблюдения: от 1 px под верхом окна и вниз без предела, так что «не пересекается»
  // = «верх сторожа ≤ 0» (сторож нулевой высоты на самой кромке поля считается внутри);
  // и прыжок по якорю через весь героблок тоже дает запись.
  const header = toggle.closest('.site-header');
  const sentinel = document.querySelector('.hero-sentinel');
  if (!header || !sentinel) return;
  new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (!entry.rootBounds || !entry.boundingClientRect.width) return;
    const stuck = !entry.isIntersecting;
    if (stuck) {
      header.classList.remove('is-leaving');
      header.classList.add('is-stuck');
    } else if (header.classList.contains('is-stuck')) {
      setOpen(false);
      header.classList.add('is-leaving');
    }
  }, { rootMargin: '-1px 0px 1000000px 0px' }).observe(sentinel);
  header.addEventListener('animationend', (event) => {
    if (event.animationName === 'header-out') header.classList.remove('is-stuck', 'is-leaving');
  });
});
