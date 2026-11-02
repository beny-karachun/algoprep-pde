/* Shared, buildless course components. Chapter scripts are not required. */
(() => {
  'use strict';
  const config = window.TP_CONFIG;
  if (!config) return;
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* Storage can be disabled. */ } }
  };
  const readJSON = (key, fallback) => {
    try { return JSON.parse(storage.get(key)) || fallback; } catch { return fallback; }
  };
  let progress = readJSON('tp_progress', {});
  if (typeof progress !== 'object' || Array.isArray(progress)) progress = {};
  let pageVersion = 0;
  const timers = new WeakMap();
  const quizStates = new WeakMap();
  const $all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const chapterBySlug = slug => config.chapters.find(chapter => chapter.slug === slug);
  const isPublic = chapter => chapter && (config.publicChapters || []).includes(chapter.slug);
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const safeFile = file => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(file) && !file.includes('..');
  function route(pathname = location.pathname) {
    let path;
    try { path = decodeURIComponent(pathname); } catch { return null; }
    const match = path.match(/^\/chapters\/([a-z0-9-]+)\/(?:([^/]+))?$/);
    if (!match || !chapterBySlug(match[1])) return null;
    const file = match[2] || 'index.html';
    if (!safeFile(file)) return null;
    return { chapter: chapterBySlug(match[1]), slug: match[1], file };
  }
  function currentChapter() { return chapterBySlug(document.body.dataset.chapter) || route()?.chapter; }
  function renderMath(root = document.body) {
    if (typeof window.renderMathInElement !== 'function') {
      if (!document.querySelector('.math-status')) {
        const status = element('p', 'math-status', 'לא ניתן לטעון את הנוסחאות. בדקו את החיבור ורעננו את הדף.');
        status.setAttribute('role', 'status');
        document.querySelector('main')?.prepend(status);
      }
      return;
    }
    document.querySelector('.math-status')?.remove();
    window.renderMathInElement(root, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false, trust: false, strict: 'warn',
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
    });
  }

  function initTheme() {
    const saved = storage.get('tp_theme');
    if (saved === 'dark' || saved === 'light') document.documentElement.dataset.theme = saved;
    else delete document.documentElement.dataset.theme;
    updateThemeButton();
  }
  function updateThemeButton() {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
              : false;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#262320' : '#FAF9F5');
    $all('[data-theme-toggle]').forEach(button => {
      button.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/></svg>';
      button.title = dark ? 'מצב בהיר' : 'מצב כהה';
      button.setAttribute('aria-label', dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה');
      button.setAttribute('aria-pressed', String(dark));
    });
  }
  function saveProgress() {
    storage.set('tp_progress', JSON.stringify(progress));
    updateProgress();
  }
  function updateProgress() {
    $all('[data-complete]').forEach(input => { input.checked = progress[input.dataset.complete]?.complete === true; });
    const count = Object.values(progress).filter(item => item?.complete === true).length;
    $all('[data-progress-summary]').forEach(node => {
      node.textContent = count ? `סומנו ${count} יחידות לימוד כהושלמו` : 'ההתקדמות שלכם תישמר במכשיר זה';
    });
    $all('[data-chapter-progress]').forEach(node => {
      const slug = node.dataset.chapterProgress;
      const completed = Object.entries(progress).filter(([key, value]) => key.startsWith(`${slug}/`) && value?.complete).length;
      node.textContent = completed ? `${completed} יחידות הושלמו` : '';
    });
  }

  // Convert local wall time using the configured IANA zone; do not use the visitor's zone.
  function examTimestamp(exam) {
    const [year, month, day] = exam.date.split('-').map(Number);
    const [hour, minute] = (exam.time || '00:00').split(':').map(Number);
    const wall = Date.UTC(year, month - 1, day, hour, minute);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: config.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    let result = wall;
    for (let i = 0; i < 3; i++) {
      const parts = Object.fromEntries(formatter.formatToParts(result).map(part => [part.type, part.value]));
      const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
      result += wall - shown;
    }
    return result;
  }
  const examTimes = config.exams.map(exam => {
    const timestamp = examTimestamp(exam);
    const nextDate = new Date(`${exam.date}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const expires = exam.time ? timestamp : examTimestamp({ ...exam, date: nextDate.toISOString().slice(0, 10) });
    return { ...exam, timestamp, expires };
  }).sort((a, b) => a.timestamp - b.timestamp);
  const dateLabel = exam => new Intl.DateTimeFormat('he-IL', { timeZone: config.timeZone, day: 'numeric', month: 'numeric', year: 'numeric' }).format(exam.timestamp);
  function nextExam(now = Date.now()) { return examTimes.find(exam => exam.expires > now); }
  function updateCountdowns() {
    const now = Date.now();
    const exam = nextExam(now);
    $all('[data-countdown]').forEach(node => {
      if (!exam) {
        if (node.dataset.exam !== 'none') {
          node.replaceChildren(element('p', '', 'טרם פורסם מועד נוסף לבחינה'));
          node.dataset.exam = 'none';
        }
        return;
      }
      if (node.dataset.exam !== exam.date) {
        node.dataset.exam = exam.date;
        node.replaceChildren();
        if (node.dataset.countdown === 'compact') {
          const link = element('a'); link.href = '/#exam';
          link.append(element('span', '', `הבחינה הבאה · ${dateLabel(exam)} · `), element('span', 'remaining'));
          link.title = exam.validity;
          node.append(link, element('span', 'validity', exam.validity));
        } else {
          node.append(element('h2', '', 'עד הבחינה הבאה'), element('time', 'exam-date', dateLabel(exam)));
          node.querySelector('time').dateTime = exam.date;
          const digits = element('div', 'countdown-digits'); digits.dir = 'ltr';
          const units = exam.time ? ['days', 'hours', 'minutes', 'seconds'] : ['days', 'hours'];
          const names = { days: 'ימים', hours: 'שעות', minutes: 'דקות', seconds: 'שניות' };
          units.forEach(unit => {
            const group = element('div'); const value = element('strong', '', '0'); value.dataset.unit = unit;
            group.append(value, element('span', '', names[unit])); digits.append(group);
          });
          node.append(digits, element('p', 'small', exam.validity), element('p', 'countdown-note', exam.time
            ? 'לפי שעון ישראל.' : 'שעת הבחינה תישלח בזימון אישי. הספירה היא לתחילת היום, לפי שעון ישראל.'));
        }
      }
      const remaining = Math.max(0, Math.floor((exam.timestamp - now) / 1000));
      const units = { days: Math.floor(remaining / 86400), hours: Math.floor(remaining / 3600) % 24, minutes: Math.floor(remaining / 60) % 60, seconds: remaining % 60 };
      if (node.dataset.countdown === 'compact') {
        node.querySelector('.remaining').textContent = remaining === 0 ? 'הבחינה היום' : `${units.days} ימים ו־${units.hours} שעות`;
      } else {
        $all('[data-unit]', node).forEach(value => { const next = String(units[value.dataset.unit]).padStart(2, '0'); if (value.textContent !== next) { value.textContent = next; value.classList.remove('tick'); void value.offsetWidth; value.classList.add('tick'); } });
      }
    });
  }
  function initSchedule() {
    $all('[data-exam-dates]').forEach(list => {
      list.replaceChildren(...examTimes.map(exam => {
        const item = element('li'); const time = element('time', '', dateLabel(exam)); time.dateTime = exam.date;
        item.append(time, element('p', '', exam.validity)); return item;
      }));
    });
  }

  function initAccess() {
    $all('[data-access-badge]').forEach(node => {
      const chapter = chapterBySlug(node.dataset.accessBadge);
      node.classList.toggle('free', isPublic(chapter));
      node.textContent = isPublic(chapter) ? 'זמין ללימוד' : 'בקרוב';
    });
    $all('.nav-links a').forEach(link => {
      if (new URL(link.href).pathname === location.pathname && !new URL(link.href).hash) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function initTimers(root = document) {
    $all('[data-timer]', root).forEach(node => {
      if (timers.has(node)) return;
      const duration = Math.min(86400, Math.max(1, Number(node.dataset.seconds) || 432));
      timers.set(node, { duration, remaining: duration, running: false, deadline: 0 });
      node.innerHTML = '<span>זמן לתרגול</span><output aria-label="זמן שנותר" aria-live="off"></output><button class="icon-button" type="button" data-timer-toggle>התחלה</button><button class="text-button" type="button" data-timer-reset>איפוס</button><span class="timer-status" role="status"></span>';
    });
    updateTimers();
  }
  function updateTimers() {
    $all('[data-timer]').forEach(node => {
      const state = timers.get(node); if (!state) return;
      if (state.running) {
        state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
        if (state.remaining === 0) {
          state.running = false;
          node.querySelector('.timer-status').textContent = 'הזמן הסתיים. אפשר להמשיך לתרגל.';
        }
      }
      const minutes = Math.floor(state.remaining / 60);
      node.querySelector('output').textContent = `${String(minutes).padStart(2, '0')}:${String(state.remaining % 60).padStart(2, '0')}`;
      node.querySelector('[data-timer-toggle]').textContent = state.running ? 'השהיה' : 'התחלה';
    });
  }

  function validatePractice(data) {
    if (data?.version !== 1 || !Array.isArray(data.questions) || !data.questions.length || data.questions.length > 200) throw new Error('Invalid question bank');
    if (data.title !== undefined && typeof data.title !== 'string') throw new Error('Invalid title');
    const ids = new Set();
    data.questions.forEach(question => {
      if (typeof question.id !== 'string' || !safeFile(question.id) || ids.has(question.id)
        || typeof question.prompt !== 'string' || typeof question.solution !== 'string'
        || !Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6
        || question.options.some(option => typeof option !== 'string')
        || !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length
        || (question.source !== undefined && typeof question.source !== 'string')
        || (question.difficulty !== undefined && ![1, 2, 3].includes(question.difficulty))
        || (question.tags !== undefined && (!Array.isArray(question.tags) || question.tags.some(tag => typeof tag !== 'string')))) throw new Error('Invalid question');
      ids.add(question.id);
    });
    return data;
  }
  async function initQuizzes(root = document) {
    const version = pageVersion;
    await Promise.all($all('[data-quiz-source]', root).map(async (node, quizIndex) => {
      if (quizStates.has(node)) return;
      quizStates.set(node, { loading: true });
      node.textContent = 'טוענים שאלות…';
      try {
        const chapter = currentChapter();
        const source = node.dataset.quizSource;
        const file = source.replace(/^\.\//, '');
        if (!safeFile(file) || !file.endsWith('.json')) throw new Error('Invalid practice path');
        const response = await fetch(new URL(source, location.href));
        if (!response.ok) throw new Error('התוכן עדיין אינו זמין. בקרוב.');
        const data = validatePractice(await response.json());
        if (version !== pageVersion || !node.isConnected) return;
        const state = { data, answered: new Map(), chapter: chapter?.slug || 'shared' };
        quizStates.set(node, state); node.replaceChildren();
        if (data.title && data.title !== document.querySelector('h1')?.textContent.trim()) node.append(element('h2', '', data.title));
        data.questions.forEach((question, index) => {
          const card = element('article', 'quiz-question'); card.dataset.questionIndex = String(index);
          const fieldset = element('fieldset');
          fieldset.append(element('legend', '', `${index + 1}. ${question.prompt}`));
          const options = element('div', 'quiz-options');
          question.options.forEach((option, optionIndex) => {
            const label = element('label', 'quiz-option'); const radio = element('input');
            radio.type = 'radio'; radio.name = `quiz-${quizIndex}-${index}`; radio.value = String(optionIndex);
            label.append(radio, element('span', '', option)); options.append(label);
          });
          fieldset.append(options); card.append(fieldset);
          if (question.source) card.append(element('p', 'source', question.source));
          const actions = element('div', 'actions'); const check = element('button', 'button', 'בדיקת תשובה');
          check.type = 'button'; check.dataset.quizCheck = ''; actions.append(check); card.append(actions);
          const feedback = element('p', 'quiz-feedback'); feedback.setAttribute('role', 'status');
          const solution = element('div', 'solution', question.solution); solution.hidden = true;
          solution.id = `quiz-solution-${quizIndex}-${index}`;
          const reveal = element('button', 'text-button', 'הצגת פתרון'); reveal.type = 'button';
          reveal.dataset.reveal = solution.id; reveal.setAttribute('aria-expanded', 'false'); reveal.setAttribute('aria-controls', solution.id);
          card.append(feedback, reveal, solution); node.append(card);
        });
        const score = element('p', 'quiz-score', `נבדקו 0 מתוך ${data.questions.length} שאלות`); score.setAttribute('role', 'status'); node.append(score);
        const reset = element('button', 'button secondary', 'תרגול מחדש'); reset.type = 'button'; reset.dataset.quizReset = ''; node.append(reset);
        renderMath(node);
      } catch (error) {
        if (version !== pageVersion || !node.isConnected) return;
        quizStates.delete(node);
        node.replaceChildren(element('p', 'license-status', error.message === 'התוכן עדיין אינו זמין. בקרוב.' ? error.message : 'לא ניתן לטעון שאלות. נסו שוב בעוד רגע'));
        const retry = element('button', 'button secondary', 'ניסיון נוסף'); retry.type = 'button'; retry.dataset.quizRetry = ''; node.append(retry);
      }
    }));
  }
  function checkAnswer(button) {
    const quiz = button.closest('[data-quiz-source]'); const state = quizStates.get(quiz); const card = button.closest('.quiz-question');
    const index = Number(card.dataset.questionIndex); const question = state.data.questions[index];
    const checked = card.querySelector('input:checked');
    if (!checked) { card.querySelector('.quiz-feedback').textContent = 'בחרו תשובה תחילה'; return; }
    const correct = Number(checked.value) === question.correctIndex;
    state.answered.set(question.id, correct);
    $all('input', card).forEach(input => {
      input.disabled = true;
      if (+input.value === question.correctIndex) input.closest('label').dataset.result = 'correct';
      else if (input.checked) input.closest('label').dataset.result = 'wrong';
    });
    button.disabled = true;
    card.querySelector('.quiz-feedback').textContent = correct ? 'תשובה נכונה' : 'התשובה אינה נכונה. התשובה הנכונה מסומנת.';
    const count = [...state.answered.values()].filter(Boolean).length;
    quiz.querySelector('.quiz-score').textContent = `נבדקו ${state.answered.size} מתוך ${state.data.questions.length} שאלות · ${count} תשובות נכונות`;
    const key = `${state.chapter}/quiz/${question.id}`;
    const previous = progress[key];
    progress[key] = { correct, attempts: (Number(previous?.attempts) || 0) + 1 };
    saveProgress();
  }

  function initPage() {
    pageVersion++;
    initAccess(); updateThemeButton(); initSchedule(); updateCountdowns(); updateProgress();
    initTimers(); renderMath(); initQuizzes();
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button, a'); if (!target) return;
    if (target.matches('.nav-links a') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      const url = new URL(target.href);
      const chapters = document.getElementById('chapters');
      if (chapters && url.origin === location.origin && url.pathname === location.pathname && url.hash === '#chapters') {
        event.preventDefault();
        history.replaceState(history.state, '', '#chapters');
        chapters.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      }
    }
    if (target.matches('[data-theme-toggle]')) {
      const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark'         : false;
      document.documentElement.dataset.theme = dark ? 'light' : 'dark'; storage.set('tp_theme', dark ? 'light' : 'dark'); updateThemeButton();
    }
    if (target.matches('[data-reveal]')) {
      const solution = document.getElementById(target.dataset.reveal); if (!solution) return;
      solution.hidden = !solution.hidden; target.setAttribute('aria-expanded', String(!solution.hidden));
      target.textContent = solution.hidden ? 'הצגת פתרון' : 'הסתרת פתרון'; if (!solution.hidden) renderMath(solution);
    }
    if (target.matches('[data-timer-toggle], [data-timer-reset]')) {
      const node = target.closest('[data-timer]'); const state = timers.get(node);
      if (target.matches('[data-timer-reset]')) { state.running = false; state.remaining = state.duration; }
      else {
        state.running = !state.running;
        if (state.running) {
          if (state.remaining === 0) state.remaining = state.duration;
          state.deadline = Date.now() + state.remaining * 1000;
        }
      }
      node.querySelector('.timer-status').textContent = ''; updateTimers();
    }
    if (target.matches('[data-quiz-check]')) checkAnswer(target);
    if (target.matches('[data-quiz-reset]')) {
      const quiz = target.closest('[data-quiz-source]'); const state = quizStates.get(quiz);
      state.answered.clear();
      $all('input', quiz).forEach(input => { input.checked = false; input.disabled = false; });
      $all('[data-result]', quiz).forEach(label => { delete label.dataset.result; });
      $all('[data-quiz-check]', quiz).forEach(button => { button.disabled = false; });
      $all('.quiz-feedback', quiz).forEach(node => { node.textContent = ''; });
      $all('.solution', quiz).forEach(node => { node.hidden = true; });
      $all('[data-reveal]', quiz).forEach(button => { button.setAttribute('aria-expanded', 'false'); button.textContent = 'הצגת פתרון'; });
      quiz.querySelector('.quiz-score').textContent = `נבדקו 0 מתוך ${state.data.questions.length} שאלות`;
      quiz.querySelector('input')?.focus();
    }
    if (target.matches('[data-quiz-retry]')) initQuizzes(target.parentElement.parentElement);
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-complete]')) {
      progress[event.target.dataset.complete] = { complete: event.target.checked }; saveProgress();
    }
  });
  window.addEventListener('popstate', () => { location.reload(); });
  window.addEventListener('storage', event => {
    if (event.key === 'tp_theme') { initTheme(); }
    if (event.key === 'tp_progress') {
      progress = readJSON('tp_progress', {});
      if (typeof progress !== 'object' || Array.isArray(progress)) progress = {};
      updateProgress();
    }
  });
  window.TP = Object.freeze({ init: initPage, renderMath, initQuizzes, nextExam, examTimestamp, route });
  initTheme(); initPage();
  setInterval(() => { updateCountdowns(); updateTimers(); }, 1000);
})();
