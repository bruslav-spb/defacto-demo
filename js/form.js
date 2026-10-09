// Заявка на проверку: проверка двух обязательных полей и состояние «принято».
// Бэкенда у демо нет, поэтому отправка остается на странице: вместо ухода
// на action="#" форма показывает подтверждение с названным следующим шагом.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('request-form');
  const fields = document.getElementById('request-fields');
  const done = document.getElementById('request-done');
  if (!form || !fields || !done) return;

  // Поле «телефон или мессенджер» принимает и номер, и ник, поэтому маски нет:
  // достаточно пяти цифр либо @ника. Имя не проверяем — оно необязательное.
  const checks = {
    'f-phone': (value) => value.replace(/\D/g, '').length >= 5 || /@[\wа-яё.]{3,}/i.test(value),
    'f-address': (value) => value.trim().length >= 5,
  };

  const inputs = Object.keys(checks)
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const hintOf = (input) => document.getElementById(`${input.id}-hint`);

  // Подсказка и текст ошибки живут в одном элементе: слот всегда занят,
  // поэтому появление ошибки не сдвигает кнопку вниз.
  const reset = (input) => {
    const hint = hintOf(input);
    input.removeAttribute('aria-invalid');
    if (hint) hint.textContent = hint.dataset.hint;
  };

  const fail = (input) => {
    const hint = hintOf(input);
    input.setAttribute('aria-invalid', 'true');
    if (hint && hint.dataset.error) hint.textContent = hint.dataset.error;
  };

  inputs.forEach((input) => {
    const hint = hintOf(input);
    if (hint) hint.dataset.hint = hint.textContent;
    // Ошибка снимается, как только человек начал исправлять
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') reset(input);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const invalid = inputs.filter((input) => {
      if (checks[input.id](input.value)) {
        reset(input);
        return false;
      }
      fail(input);
      return true;
    });

    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    form.querySelectorAll('.field__input').forEach((input) => {
      input.disabled = true;
    });
    fields.hidden = true;
    done.hidden = false;
    // preventScroll: подтверждение встает на место полей и уже находится в кадре
    done.focus({ preventScroll: true });
  });
});
