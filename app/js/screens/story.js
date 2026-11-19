// 📚 Truyện ngắn (SPEC-story.md): ① Nghe truyện (mục 4 — lật trang, karaoke, tiếng Việt bật / tắt, state machine 4.4:
// mỗi lúc chỉ MỘT luồng đọc / chờ, thao tác mới hủy luồng cũ + mọi hẹn giờ), ② Bé đọc (mục 5), ③ Câu hỏi (mục 6:
// chọn hình / chọn chữ / xếp thứ tự, sai 1 → hiện lại trang có đáp án, sai 2 → tiếng Việt + đáp án, sao 6.3).

import { h, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { isAbort, scaled } from '../timing.js';
import { displayWords } from '../karaoke.js';
import { tokenize } from '../text.js';
import { QUESTIONS } from '../captions.js';
import { needsVietnameseHelp } from '../settings.js';
import { recordLessonDone, recordItem, RESULT } from '../progress.js';
import { lessonImages, mediaBlob } from '../db.js';
import { Teacher, activityLayout } from '../read/teacher.js';
import { shuffle } from '../read/stages.js';
import { libraryImages, wordKey } from '../picture-library.js';
import { classifySentence, storyTokens, WORD_KIND } from '../story/words.js';
import { contentHash } from '../story/validate.js';
import {
  getStory, learnedNow, playableQuestions, orderCorrect, storyStars, recordListened, recordStoryRead, readLevel,
} from '../story/story.js';

const REST_MS = 1200; // nghỉ sau khi đọc xong trang rồi mới tự lật (4.2)
const WORD_IDLE_MS = 3000; // chạm từ xong 3 giây không chạm gì → đọc tiếp (4.3)
const NUDGE_MS = 3000; // tắt tự chạy: nút Trang sau nhún sau 3 giây (4.2)
const ORDER_SLOTS = ['first', 'next', 'last'];

const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

/** Màn truyện: `mode` = 'listen' (mặc định) | 'read' | 'quiz'; `page` = trang đang xem. */
export function storyScreen(app, params = {}) {
  let left = false;
  let cleanup = null;
  const urls = [];
  (async () => {
    const story = await getStory(app.db, params.storyId);
    if (left) return;
    if (!story) {
      app.go('read', { tab: 'story' });
      return;
    }
    const [images, lib, lp] = await Promise.all([lessonImages(app.db, story.id), libraryImages(app.db), learnedNow(app.db)]);
    if (left) return;
    const pageUrl = new Map();
    for (const p of story.pages) {
      const rec = images.get(p.id);
      const blob = rec ? mediaBlob(rec) : null;
      if (blob) {
        const url = URL.createObjectURL(blob);
        urls.push(url);
        pageUrl.set(p.id, url);
      }
    }
    const libUrl = (word) => {
      const rec = lib.get(wordKey(word));
      if (!rec) return null;
      const url = URL.createObjectURL(mediaBlob(rec));
      urls.push(url);
      return url;
    };
    const env = { app, story, params, lp, pageUrl, libUrl };
    app.root.dataset.story = story.id;
    if (params.mode === 'quiz') cleanup = quizMode(env);
    else if (params.mode === 'read') cleanup = readMode(env);
    else cleanup = listenMode(env);
  })().catch((err) => {
    console.error(err);
    toast('Không mở được truyện này.');
  });
  return () => {
    left = true;
    try {
      cleanup?.();
    } finally {
      urls.forEach((u) => URL.revokeObjectURL(u));
    }
  };
}

// ---------- Phần dùng chung ----------

const back = (app) => app.go(app.timeUp ? 'sleep' : 'read', { tab: 'story' });

/** Hình của trang: ảnh trang, không thì emoji của trang (hoặc emoji bìa) cỡ lớn trên nền nhạt (8.4). Ảnh hỏng → emoji. */
function pageArt({ story, pageUrl }, page, cls = 'story-art') {
  const emoji = () => h('div.story-emoji', { text: page.emoji || story.cover || '📖' });
  const art = h(`div.${cls}`, { dataset: { page: page.id } });
  const url = pageUrl.get(page.id);
  if (url) {
    const img = h('img', { src: url, alt: '', draggable: false });
    img.addEventListener('error', () => {
      console.warn('Ảnh trang hỏng', story.id, page.id);
      img.replaceWith(emoji());
    }, { once: true });
    art.append(img);
  } else {
    art.append(emoji());
  }
  return art;
}

/** Các từ của một câu thành nút; từ tricky gạch chân, từ mới nhạt màu (3.2). */
function sentenceWords(text, lp) {
  return displayWords(text).map((w) => {
    const tok = storyTokens(w)[0];
    const kind = tok ? classifySentence(tok.text, lp)[0]?.kind : null;
    const say = tokenize(w)[0] ?? w;
    return h(`button.sword${kind === WORD_KIND.TRICKY ? '.tricky' : kind === WORD_KIND.NEW ? '.new-word' : ''}`, {
      type: 'button', dataset: { word: say, kind: kind ?? '' }, text: w,
    });
  });
}

// ---------- ① Nghe truyện (mục 4) ----------

function listenMode({ app, story, params, lp, pageUrl }) {
  const activity = app.startActivity();
  const pages = story.pages;
  const last = pages.length - 1;
  let index = Math.min(Math.max(0, params.page ?? 0), last);
  let sentence = 0; // câu đang đọc của trang
  let state = params.continueDirectly ? 'PAUSED' : 'PLAYING'; // quay lại từ nền → đang dừng, không tự đọc (4.3)
  let run = null;
  const timers = new Set();
  let groups = []; // [{ el, wordEls }] từng câu của trang

  app.root.className = 'child-screen scene-screen story-screen';
  const viBtn = h('button.scene-btn.vi-toggle', { type: 'button', 'aria-label': 'Tiếng Việt', text: '🇻🇳 VI' });
  const pauseBtn = h('button.scene-btn', { type: 'button', 'aria-label': 'Dừng', text: '⏸' });
  const readBtn = h('button.scene-btn', { type: 'button', 'aria-label': 'Con tự đọc', text: '📖' });
  const counter = h('span.scene-counter');
  const frame = h('div.scene-frame.story-frame', { role: 'img', 'aria-label': story.title });
  const sentenceBox = h('div.sentence.scene-sentence.story-sentences');
  const viLine = h('p.sentence-vi.scene-vi');
  const textBar = h('div.scene-text', {}, sentenceBox, viLine);
  const prevBtn = h('button.scene-btn.big', { type: 'button', 'aria-label': 'Trang trước', text: '◀' });
  const againBtn = h('button.scene-btn.big', { type: 'button', 'aria-label': 'Nghe lại trang', text: '🔁' });
  const nextBtn = h('button.scene-btn.big', { type: 'button', 'aria-label': 'Trang sau', text: '▶' });
  const dots = h('div.story-dots', { 'aria-hidden': 'true' }, ...pages.map(() => h('span.story-dot')));
  app.root.append(
    h('header.scene-top', {},
      h('button.scene-btn', { type: 'button', 'aria-label': 'Về', text: '←', onclick: () => { play('tap'); back(app); } }),
      h('h1.scene-title', { text: story.title }), readBtn, viBtn, pauseBtn, counter),
    h('main.scene-main', {}, frame,
      h('div.scene-side', {}, textBar, h('div.scene-controls', {}, prevBtn, againBtn, nextBtn), dots)),
  );

  /** Hủy luồng cũ (giọng đọc, karaoke) + MỌI hẹn giờ, tạo luồng mới (4.4). */
  const newRun = () => {
    run?.abort();
    for (const id of timers) clearTimeout(id);
    timers.clear();
    nextBtn.classList.remove('nudge');
    run = new AbortController();
    if (activity.aborted) run.abort();
    else activity.addEventListener('abort', () => run.abort(), { once: true });
    return new Teacher(app, { signal: run.signal, stage: textBar, replayBtn: h('button') });
  };
  /** Hẹn giờ gắn với luồng hiện tại: chạy thì kiểm tra lại luồng chưa bị hủy và không đang dừng. */
  const later = (ms, fn) => {
    const signal = run.signal;
    const id = setTimeout(() => {
      timers.delete(id);
      if (signal.aborted || state === 'PAUSED') return;
      fn();
    }, scaled(ms));
    timers.add(id);
  };
  const setState = (s) => {
    state = s;
    app.root.dataset.state = s;
    const paused = s === 'PAUSED';
    pauseBtn.textContent = paused ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', paused ? 'Chạy' : 'Dừng');
    pauseBtn.classList.toggle('play', paused);
  };

  function showVi() {
    const on = app.settings.showVi !== false;
    viLine.style.visibility = on ? 'visible' : 'hidden';
    viBtn.setAttribute('aria-pressed', String(on));
    viBtn.classList.toggle('off', !on);
  }

  /** Chiều cao thanh chữ = trang cao nhất của truyện (mọi câu EN + VI) ở bề rộng hiện tại (4.1). */
  function reserveTextHeight() {
    const probe = h('div.scene-text.probe', { 'aria-hidden': 'true' });
    probe.style.width = `${textBar.clientWidth}px`;
    document.body.append(probe);
    let max = 0;
    for (const p of pages) {
      probe.replaceChildren(
        h('div.sentence.scene-sentence.story-sentences', {}, ...p.sentences.map((s) => h('span.story-sent', {}, ...displayWords(s.en).map((w) => h('span.sword', { text: w }))))),
        h('p.sentence-vi.scene-vi', { text: p.sentences.map((s) => s.vi).filter(Boolean).join(' ') }));
      max = Math.max(max, probe.scrollHeight);
    }
    probe.remove();
    textBar.style.minHeight = `${Math.min(max, window.innerHeight * 0.4)}px`;
  }

  /** Hiện trang `i` (chưa đọc). */
  function show(i, animate = false) {
    const changed = i !== index;
    index = i;
    sentence = 0;
    if (app.current?.name === 'story') app.current.params.page = i; // ra nền rồi quay lại: đúng trang này
    const page = pages[i];
    const art = pageArt({ story, pageUrl }, page);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (animate && changed && !reduce) art.classList.add('turning');
    frame.replaceChildren(art);
    groups = page.sentences.map((s) => {
      const wordEls = sentenceWords(s.en, lp);
      return { el: h('span.story-sent', { dataset: { sid: s.id } }, ...wordEls), wordEls };
    });
    sentenceBox.replaceChildren(...groups.map((g) => g.el));
    viLine.textContent = page.sentences.map((s) => s.vi).filter(Boolean).join(' ');
    counter.textContent = `${i + 1} / ${pages.length}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === last;
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= i));
    markCurrent(0);
  }

  function markCurrent(k) {
    sentence = k;
    groups.forEach((g, j) => g.el.classList.toggle('current', j === k));
  }

  /** Đọc trang `i` từ câu `from` (4.2). Hết trang: nghỉ 1,2 giây rồi tự lật (bật tự chạy) hoặc nút Trang sau nhún. */
  async function playPage(i, { from = 0, animate = true } = {}) {
    const t = newRun();
    setState('PLAYING');
    if (i !== index || !groups.length || animate === 'force') show(i, animate);
    try {
      if (from === 0 && animate) await t.pause(300);
      const page = pages[i];
      for (let k = from; k < page.sentences.length; k++) {
        markCurrent(k);
        await t.karaoke(page.sentences[k].en, groups[k].wordEls);
        if (app.settings.readVietnamese && page.sentences[k].vi) await t.sayVi(page.sentences[k].vi);
      }
      setState('PAGE_DONE');
      if (i === last) {
        await finish(t);
        return;
      }
      if (app.settings.sceneAutoNext !== false) later(REST_MS, () => playPage(i + 1));
      else later(NUDGE_MS, () => nextBtn.classList.add('nudge'));
    } catch (err) {
      if (!isAbort(err)) console.error(err);
    }
  }

  let ended = false;
  async function finish(t) {
    setState('END');
    groups = []; // thanh chữ thành bảng "The end!" → nghe lại phải dựng lại trang
    if (!ended) {
      ended = true;
      recordListened(app.db, story.id).catch(() => {});
    }
    play('tada');
    const quizBtn = h('button.big-btn.primary.bounce', {
      type: 'button', 'aria-label': 'Trả lời câu hỏi', text: '❓',
      onclick: () => { play('tap'); app.go('story', { storyId: story.id, mode: 'quiz' }); },
    });
    const readSelf = h('button.big-btn', {
      type: 'button', 'aria-label': 'Con tự đọc', text: '📖',
      onclick: () => { play('tap'); app.go('story', { storyId: story.id, mode: 'read', heard: true }); },
    });
    const again = h('button.big-btn', { type: 'button', 'aria-label': 'Nghe lại từ đầu', text: '🔁', onclick: () => { play('tap'); ended = false; playPage(0); } });
    sentenceBox.replaceChildren(h('div.scene-done', {},
      h('p.done-title', { text: 'The end!' }),
      h('div.done-actions', {}, quizBtn, readSelf, again)));
    viLine.textContent = '';
    await t.say('The end!').catch(() => {});
  }

  // ---------- Thao tác (bảng 4.3) ----------
  pauseBtn.addEventListener('click', () => {
    play('tap');
    if (state === 'PAUSED') {
      playPage(index, { from: sentence, animate: false });
    } else if (state !== 'END') {
      newRun();
      groups.forEach((g) => g.wordEls.forEach((el) => el.classList.remove('reading')));
      setState('PAUSED');
    }
  });
  againBtn.addEventListener('click', () => { play('tap'); playPage(index, { animate: false }); });
  prevBtn.addEventListener('click', () => { if (index > 0) { play('tap'); playPage(index - 1); } });
  nextBtn.addEventListener('click', () => { if (index < last) { play('tap'); playPage(index + 1); } });
  readBtn.addEventListener('click', () => {
    play('tap');
    app.go('story', { storyId: story.id, mode: 'read', page: state === 'END' ? 0 : index, heard: ended });
  });
  viBtn.addEventListener('click', async () => {
    play('tap');
    await app.setSetting('showVi', app.settings.showVi === false);
    showVi(); // chỉ ẩn / hiện chữ, không ngắt giọng đọc
    reserveTextHeight();
  });
  // Chạm từ: đọc riêng từ đó; 3 giây không chạm gì → đọc lại từ đầu câu đang đọc (đang dừng thì thôi).
  sentenceBox.addEventListener('click', (e) => {
    const el = e.target.closest('.sword');
    if (!el || !el.dataset.word) return;
    const wasPaused = state === 'PAUSED';
    const wasDone = state === 'PAGE_DONE';
    const t = newRun();
    setState(wasPaused ? 'PAUSED' : 'WORD');
    groups.forEach((g) => g.wordEls.forEach((x) => x.classList.remove('reading')));
    el.classList.add('reading');
    t.say(el.dataset.word, { rate: app.settings.rate * 0.8 }).catch(() => {}).finally(() => {
      el.classList.remove('reading');
      if (run.signal.aborted || state === 'PAUSED') return;
      later(WORD_IDLE_MS, () => {
        if (wasDone && index < last && app.settings.sceneAutoNext !== false) playPage(index + 1);
        else if (wasDone) setState('PAGE_DONE');
        else playPage(index, { from: sentence, animate: false });
      });
    });
  });

  const onResize = () => reserveTextHeight();
  window.addEventListener('resize', onResize);

  showVi();
  show(index);
  requestAnimationFrame(() => {
    reserveTextHeight();
    if (state === 'PAUSED') {
      newRun();
      setState('PAUSED');
    } else {
      playPage(index, { animate: false });
    }
  });
  return () => {
    window.removeEventListener('resize', onResize);
    run?.abort();
    for (const id of timers) clearTimeout(id);
  };
}

// ---------- ② Bé đọc (mục 5) ----------

function readMode({ app, story, params, lp, pageUrl }) {
  const signal = app.startActivity();
  const layout = activityLayout(app, { onHome: () => back(app) });
  app.root.classList.add('story-read');
  const t = new Teacher(app, { signal, stage: layout.stage, replayBtn: layout.replayBtn });
  const heard = Boolean(params.heard); // vừa nghe hết truyện trong lượt mở này → không đọc mẫu tự động
  const start = Math.min(Math.max(0, params.page ?? 0), story.pages.length - 1);
  const total = story.pages.slice(start).reduce((n, p) => n + p.sentences.length, 0);
  let done = 0;

  (async () => {
    for (let i = start; i < story.pages.length; i++) {
      if (app.current?.name === 'story') app.current.params.page = i;
      const page = story.pages[i];
      for (const s of page.sentences) {
        const wordEls = sentenceWords(s.en, lp);
        wordEls.forEach((el) => el.addEventListener('click', () => {
          if (app.speaker.speaking) return;
          el.classList.add('reading');
          t.say(el.dataset.word, { rate: app.settings.rate * 0.8 }).catch(() => {}).finally(() => el.classList.remove('reading'));
        }));
        const listenBtn = h('button.scene-btn', { type: 'button', 'aria-label': 'Nghe mẫu', text: '🔊' });
        listenBtn.addEventListener('click', () => {
          if (app.speaker.speaking) return;
          play('tap');
          t.karaoke(s.en, wordEls).catch(() => {});
        });
        const skipBtn = h('button.scene-btn', { type: 'button', 'aria-label': 'Bỏ qua', text: '⏭' });
        const viLine = s.vi && app.settings.showVi !== false ? h('p.sentence-vi', { text: s.vi }) : null;
        layout.stage.replaceChildren(
          pageArt({ story, pageUrl }, page, 'story-art.small'),
          h('div.sentence.story-read-sentence', {}, ...wordEls),
          viLine,
          h('div.story-read-tools', {}, listenBtn, skipBtn));
        if (!heard) await t.karaoke(s.en, wordEls); // chưa nghe hết truyện → Olly đọc mẫu trước
        const result = await readOne(t, s, wordEls, skipBtn, layout.stage);
        if (result.skipped) await recordStoryRead(app.db, story.id, s, { skipped: true }).catch(() => {});
        else await recordStoryRead(app.db, story.id, s, { level: result.level }).catch(() => {});
        layout.setProgress(++done / total);
      }
    }
    layout.setProgress(1);
    play('tada');
    layout.stage.replaceChildren(h('div.done-panel', {},
      h('p.done-title', { text: 'Great reading!' }),
      h('div.done-actions', {},
        h('button.big-btn.primary.bounce', { type: 'button', 'aria-label': 'Trả lời câu hỏi', text: '❓', onclick: () => app.go('story', { storyId: story.id, mode: 'quiz' }) }),
        h('button.big-btn', { type: 'button', 'aria-label': 'Về', text: '📚', onclick: () => back(app) }))));
    t.celebrate();
    await t.say('Great reading!');
  })().catch((err) => {
    if (!isAbort(err)) console.error(err);
  });
  return null;
}

/**
 * Bé đọc một câu (5): có nhận dạng → bé bấm 🎤 rồi đọc (nghe được → xanh / xám, Olly đọc lại từ xám); không có → ✅
 * "Con đọc xong". ⏭ bỏ qua câu (trước khi bấm 🎤 / ✅) → `skipped`, không tính đã đọc.
 */
async function readOne(t, s, wordEls, skipBtn, stage) {
  const { app } = t;
  await t.ask(QUESTIONS.readSentence(), { meaning: s.vi });
  const words = wordEls.map((el) => el.dataset.word).filter(Boolean);
  const canHear = app.mic.ready && app.recognizer.enabled;
  const goBtn = canHear
    ? h('button.big-btn.done-btn', { type: 'button', 'aria-label': 'Con đọc', text: '🎤' })
    : h('button.big-btn.done-btn', { type: 'button', 'aria-label': 'Con đọc xong', text: '✅' });
  stage.append(goBtn);
  const picked = await t.waitTap([goBtn, skipBtn]);
  play('pop');
  goBtn.remove();
  if (picked === skipBtn) {
    t.endQuestion();
    return { skipped: true };
  }
  if (!canHear) {
    t.endQuestion();
    return { level: null };
  }
  skipBtn.disabled = true;
  const heard = await t.hearSentence(s.en);
  if (!heard) {
    t.endQuestion();
    return { level: null };
  }
  wordEls.forEach((el) => el.classList.add(heard.has(el.dataset.word) ? 'heard' : 'missed'));
  const level = readLevel(words, heard, Boolean(s.chunks?.length));
  if (words.every((w) => heard.has(w))) {
    play('ding');
    await t.say('Great reading!');
  } else {
    for (const el of wordEls.filter((x) => x.classList.contains('missed'))) {
      el.classList.add('reading');
      await t.say(el.dataset.word, { rate: app.settings.rate * 0.8 });
      el.classList.remove('reading');
      await t.pause(150);
    }
    await t.karaoke(s.en, wordEls);
  }
  t.endQuestion();
  return { level };
}

// ---------- ③ Câu hỏi (mục 6) ----------

function quizMode({ app, story, pageUrl, libUrl }) {
  const signal = app.startActivity();
  const layout = activityLayout(app, { onHome: () => back(app) });
  app.root.classList.add('story-quiz');
  const t = new Teacher(app, { signal, stage: layout.stage, replayBtn: layout.replayBtn });
  const questions = playableQuestions(story, (id) => pageUrl.has(id));
  const pageById = new Map(story.pages.map((p) => [p.id, p]));
  const results = [];

  (async () => {
    for (const [k, q] of questions.entries()) {
      app.root.dataset.question = q.id;
      const result = q.type === 'order' ? await orderQuestion(q) : await chooseQuestion(q);
      recordItem(app.db, { lessonId: story.id, activity: 'quiz', itemId: q.id }, result).catch(() => {});
      results.push(result);
      layout.setProgress((k + 1) / questions.length);
      await t.pause(500);
    }
    const stars = storyStars(results);
    // Dấu nội dung lúc ghi sao (7.2): truyện bị sửa sau đó → sao cũ hiện mờ "Truyện đã sửa".
    const done = await recordLessonDone(app.db, story.id, stars);
    await app.db.put('progress', { ...done, contentHash: contentHash(story) });
    layout.setProgress(1);
    play('tada');
    layout.stage.replaceChildren(h('div.done-panel', {},
      h('p.done-title', { text: 'Great job!' }),
      stars != null ? h('p.done-stars', { 'aria-label': `${stars} sao`, text: starText(stars) }) : null,
      h('div.done-actions', {},
        h('button.big-btn', { type: 'button', 'aria-label': 'Làm lại', text: '🔁', onclick: () => app.go('story', { storyId: story.id, mode: 'quiz' }) }),
        h('button.big-btn', { type: 'button', 'aria-label': 'Nghe truyện', text: '👂', onclick: () => app.go('story', { storyId: story.id }) }),
        h('button.big-btn.primary', { type: 'button', 'aria-label': 'Về', text: '📚', onclick: () => back(app) }))));
    t.celebrate();
    await t.say(stars === 3 ? 'Wow! Three stars!' : 'Great job! You did it!');
  })().catch((err) => {
    if (!isAbort(err)) console.error(err);
  });

  /** Câu hỏi + dòng tiếng Việt, Olly đọc karaoke. */
  function questionHeader(q) {
    const wordEls = displayWords(q.en).map((w) => h('span.sword', { text: w }));
    const vi = q.vi && app.settings.showVi !== false ? h('p.sentence-vi', { text: q.vi }) : null;
    return { el: h('div.story-question', {}, h('div.sentence.small', {}, ...wordEls), vi), wordEls };
  }
  /** Sai lần 1: hiện thu nhỏ trang có đáp án + Olly đọc lại câu của trang (6.2). */
  async function showPage(page, slot) {
    const words = page.sentences.map((s) => h('span.story-sent', {}, ...displayWords(s.en).map((w) => h('span.sword', { text: w }))));
    slot.replaceChildren(h('div.story-hint-page', {}, pageArt({ story, pageUrl }, page, 'story-art.tiny'), h('div.sentence.small', {}, ...words)));
    for (const [j, s] of page.sentences.entries()) await t.karaoke(s.en, [...words[j].children]);
  }

  /** `pick` (chọn hình) / `word` (chọn chữ) — chấm như SPEC 4.3, gợi ý theo 6.2. */
  async function chooseQuestion(q) {
    const head = questionHeader(q);
    const hint = h('div.story-hint');
    const choices = shuffle([...q.options]);
    const buttons = choices.map((o) => {
      if (q.type === 'pick') {
        const url = libUrl(o);
        return h('button.pic-choice', { type: 'button', 'aria-label': o, dataset: { choice: o } },
          url ? h('img', { src: url, alt: '', draggable: false }) : (q.emoji?.[o] ?? o));
      }
      return h('button.word-choice', { type: 'button', 'aria-label': o, dataset: { choice: o }, text: o });
    });
    const correct = buttons[choices.indexOf(q.answer)];
    const answerLine = h('div.story-answer', { hidden: true });
    layout.stage.replaceChildren(head.el, hint, h('div.choices', {}, ...buttons), answerLine);
    const speak = () => t.karaoke(q.en, head.wordEls);
    await t.ask(q.en, { meaning: q.vi, speak });
    let wrong = 0;
    for (;;) {
      const picked = await t.waitTap(wrong >= 2 ? [correct] : buttons.filter((b) => !b.disabled));
      if (picked === correct) {
        play('ding');
        correct.classList.add('right');
        t.celebrate(correct);
        t.endQuestion();
        answerLine.replaceChildren(...displayWords(q.say).map((w) => h('span.sword', { text: w })));
        answerLine.hidden = false;
        await t.say(wrong === 0 ? 'Yes! Well done!' : wrong === 1 ? 'Yes! Good job!' : 'That is it!');
        await t.karaoke(q.say, [...answerLine.children]);
        return wrong === 0 ? RESULT.INDEPENDENT : wrong === 1 ? RESULT.HELPED : RESULT.MISSED;
      }
      wrong++;
      play('boing');
      picked.classList.add('dim', 'shake');
      picked.disabled = true; // mờ tại chỗ, không chạm lại
      if (wrong === 1) {
        await t.say("Let's look again!");
        await showPage(pageById.get(q.page), hint);
        await speak();
      } else {
        if (q.explainVi && needsVietnameseHelp(app.settings, wrong)) await t.explainVi(q.explainVi);
        correct.classList.add('hint');
        await t.say(q.say);
      }
    }
  }

  /** `order` — xếp 3 hình trang vào first / next / last; đủ 3 ô thì tự chấm (6.2). */
  async function orderQuestion(q) {
    const head = questionHeader(q);
    const hint = h('div.story-hint');
    const cards = q.pages.map((id) => {
      const card = h('button.order-card', { type: 'button', 'aria-label': `Trang ${story.pages.findIndex((p) => p.id === id) + 1}`, dataset: { page: id } },
        pageArt({ story, pageUrl }, pageById.get(id), 'story-art.card'));
      return card;
    });
    // Không bao giờ hiện sẵn đúng thứ tự.
    let order = shuffle([...cards]);
    while (order.every((c, k) => c === cards[k])) order = shuffle([...cards]);
    const tray = h('div.order-tray', {}, ...order);
    const slots = ORDER_SLOTS.map((label) => h('div.order-slot', { dataset: { slot: label } }, h('span.order-label', { text: label })));
    const placed = [null, null, null];
    const locked = [false, false, false];
    layout.stage.replaceChildren(head.el, hint, h('div.order-slots', {}, ...slots), tray);
    const speak = () => t.karaoke(q.en, head.wordEls);
    await t.ask(q.en, { meaning: q.vi, speak });
    const put = (card, k) => {
      placed[k] = card;
      slots[k].append(card);
    };
    const takeBack = (k) => {
      tray.append(placed[k]);
      placed[k] = null;
    };
    for (let attempt = 1; ; attempt++) {
      // Bé đặt tới khi đủ 3 ô.
      while (placed.some((c) => !c)) {
        const free = cards.filter((c) => !placed.includes(c));
        const movable = placed.filter((c, k) => c && !locked[k]);
        const card = await t.waitTap([...free, ...movable]);
        play('pop');
        const at = placed.indexOf(card);
        if (at >= 0) takeBack(at);
        else put(card, placed.indexOf(null));
      }
      const ok = orderCorrect(placed.map((c) => c.dataset.page), q.pages);
      if (ok.every(Boolean)) {
        play('ding');
        slots.forEach((s) => s.classList.add('right'));
        t.celebrate(slots[1]);
        t.endQuestion();
        await t.say(attempt === 1 ? 'Yes! Well done!' : 'Yes! Good job!');
        return attempt === 1 ? RESULT.INDEPENDENT : RESULT.HELPED;
      }
      play('boing');
      if (attempt === 1) {
        // Ô đúng giữ lại (viền xanh), thẻ sai về khay; Olly đọc câu đầu của từng trang còn trong khay.
        ok.forEach((good, k) => {
          if (good) {
            locked[k] = true;
            slots[k].classList.add('right');
          } else {
            takeBack(k);
          }
        });
        await t.say("Let's look again!");
        for (const card of [...tray.children]) {
          const page = pageById.get(card.dataset.page);
          card.classList.add('hint');
          await t.say(page.sentences[0].en);
          card.classList.remove('hint');
        }
        continue;
      }
      // Lần chấm 2 sai: tiếng Việt + Olly xếp nốt đúng thứ tự, đọc lần lượt 3 trang → missed.
      if (q.explainVi && needsVietnameseHelp(app.settings, 2)) await t.explainVi(q.explainVi);
      placed.forEach((c, k) => { if (c) takeBack(k); });
      q.pages.forEach((id, k) => {
        put(cards.find((c) => c.dataset.page === id), k);
        slots[k].classList.add('right');
      });
      for (const id of q.pages) await t.say(pageById.get(id).sentences[0].en);
      t.endQuestion();
      return RESULT.MISSED;
    }
  }
  return null;
}
