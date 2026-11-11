// 🖼️ Tả tranh — chế độ Nghe xem (SPEC-ta-tranh mục 3–6): tranh 4:3 + mũi tên chỉ chỗ câu đang tả + thanh chữ karaoke dưới tranh
// + dòng tiếng Việt bật / tắt. Mỗi lúc chỉ MỘT luồng chạy (đọc câu / đọc từ / nghỉ / chờ): thao tác mới hủy luồng cũ (5.1).

import { h, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { isAbort, scaled, abortError } from '../timing.js';
import { tokenize } from '../text.js';
import { displayWords } from '../karaoke.js';
import { arrowGeometry, pickSentence, hitRadius, hitCenter } from '../scene.js';
import { SCENE_BY_ID } from '../data/builtin-scenes.js';
import { recordLessonDone, recordItem, starsFor, RESULT } from '../progress.js';
import { QUESTIONS } from '../captions.js';
import { needsVietnameseHelp } from '../settings.js';
import { lessonImages, mediaBlob, SCENE_IMAGE } from '../db.js';
import { Teacher } from '../read/teacher.js';

const ARRIVE_MS = 400;
const LOOK_MS = 300;
const REST_MS = 1200;
const WORD_IDLE_MS = 3000;

/** Tranh có sẵn (SVG) hoặc tranh bố mẹ tạo (kho `scenes` + ảnh trong `images`). */
export function sceneScreen(app, params = {}) {
  const builtin = SCENE_BY_ID.get(params.sceneId);
  if (builtin) return buildScene(app, params, builtin, (art) => { art.innerHTML = builtin.svg; });
  let cleanup = null;
  let url = null;
  let left = false;
  (async () => {
    const scene = await app.db.get('scenes', params.sceneId);
    if (left) return;
    if (!scene || !scene.sentences?.length) {
      app.go('read', { tab: 'scene' });
      return;
    }
    const img = (await lessonImages(app.db, scene.id)).get(SCENE_IMAGE);
    if (left) return;
    if (img) url = URL.createObjectURL(mediaBlob(img));
    cleanup = buildScene(app, params, scene, (art) => {
      if (url) art.append(h('img', { src: url, alt: '', draggable: false }));
      else art.append(h('div.scene-missing', { text: 'Tranh này đang bị lỗi — nhờ bố mẹ sửa nhé' }));
    });
  })().catch((err) => console.error(err));
  return () => {
    left = true;
    cleanup?.();
    if (url) URL.revokeObjectURL(url);
  };
}

function buildScene(app, params, scene, fillArt) {
  const activity = app.startActivity();
  const sentences = scene.sentences;
  const last = sentences.length - 1;
  let index = Math.min(Math.max(0, params.index ?? 0), last);
  let paused = Boolean(params.continueDirectly); // quay lại từ nền → đang Dừng (5.3)
  let readingDone = false;
  let run = null;
  let idleTimer = null;
  let wordEls = [];

  // ---------- Bố cục ----------
  app.root.className = 'child-screen scene-screen';
  const back = () => app.go('read', { tab: 'scene' });
  const viBtn = h('button.scene-btn.vi-toggle', { type: 'button', 'aria-label': 'Tiếng Việt', text: '🇻🇳 VI' });
  const pauseBtn = h('button.scene-btn', { type: 'button', 'aria-label': 'Dừng', text: '⏸' });
  const counter = h('span.scene-counter');
  const art = h('div.scene-art');
  fillArt(art);
  const arrow = h('div.scene-arrow', { 'aria-hidden': 'true', hidden: true });
  arrow.innerHTML = '<svg viewBox="0 0 100 36" preserveAspectRatio="none"><path d="M0 13 H70 V2 L100 18 L70 34 V23 H0 Z" fill="#e03131" stroke="#fff" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  const frame = h('div.scene-frame', { role: 'img', 'aria-label': scene.title }, art, arrow);
  const sentenceBox = h('div.sentence.scene-sentence');
  const viLine = h('p.sentence-vi.scene-vi');
  const textBar = h('div.scene-text', {}, sentenceBox, viLine);
  const prevBtn = h('button.scene-btn.big', { type: 'button', 'aria-label': 'Câu trước', text: '⏮' });
  const againBtn = h('button.scene-btn.big', { type: 'button', 'aria-label': 'Nghe lại', text: '🔁' });
  const nextBtn = h('button.scene-btn.big', { type: 'button', 'aria-label': 'Câu sau', text: '⏭' });
  app.root.append(
    h('header.scene-top', {},
      h('button.scene-btn', { type: 'button', 'aria-label': 'Về', text: '←', onclick: () => { play('tap'); back(); } }),
      h('h1.scene-title', { text: scene.title }), viBtn, pauseBtn, counter),
    h('main.scene-main', {}, frame, h('div.scene-side', {}, textBar, h('div.scene-controls', {}, prevBtn, againBtn, nextBtn))),
  );

  // ---------- Luồng chạy ----------
  /** Hủy luồng cũ, tạo Teacher mới gắn với luồng mới (5.1). */
  const newRun = () => {
    run?.abort();
    clearTimeout(idleTimer);
    run = new AbortController();
    if (activity.aborted) run.abort();
    else activity.addEventListener('abort', () => run.abort(), { once: true });
    return new Teacher(app, { signal: run.signal, stage: textBar, replayBtn: h('button') });
  };
  const box = () => ({ w: frame.clientWidth, h: frame.clientHeight });

  /** Đặt mũi tên cho câu `i`; `animate` = trượt 400 ms (từ vị trí đang đứng), không thì nhảy thẳng. */
  function placeArrow(i, animate) {
    const s = sentences[i];
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    arrow.classList.toggle('moving', Boolean(animate && !reduce));
    arrow.classList.remove('arrived');
    if (!s.point || !frame.clientWidth) {
      arrow.classList.add('gone');
      arrow.dataset.sentence = '';
      return;
    }
    const g = arrowGeometry(s.point, s.from, box());
    if (arrow.hidden || arrow.classList.contains('gone')) {
      // Từ câu không có điểm: hiện ra ở đúng chỗ mới (không trượt từ chỗ cũ).
      arrow.classList.remove('moving');
    }
    arrow.hidden = false;
    arrow.classList.remove('gone');
    Object.assign(arrow.style, { left: `${g.tail.x}px`, top: `${g.tail.y}px`, width: `${g.length}px`, transform: `rotate(${g.angle}deg)` });
    arrow.dataset.sentence = s.sid;
    arrow.dataset.from = g.from;
  }

  /** Thanh chữ: chiều cao = câu dài nhất của tranh (EN + VI) ở bề rộng hiện tại → không nhảy khi đổi câu / bật tắt VI (3.2). */
  function reserveTextHeight() {
    const probe = h('div.scene-text.probe', { 'aria-hidden': 'true' });
    probe.style.width = `${textBar.clientWidth}px`;
    document.body.append(probe);
    let max = 0;
    for (const s of sentences) {
      probe.replaceChildren(h('div.sentence.scene-sentence', {}, ...displayWords(s.en).map((w) => h('span.sword', { text: w }))), h('p.sentence-vi.scene-vi', { text: s.vi }));
      max = Math.max(max, probe.scrollHeight);
    }
    probe.remove();
    textBar.style.minHeight = `${Math.min(max, window.innerHeight * 0.4)}px`;
  }

  function showVi() {
    const on = app.settings.showVi !== false;
    viLine.style.visibility = on ? 'visible' : 'hidden';
    viBtn.setAttribute('aria-pressed', String(on));
    viBtn.classList.toggle('off', !on);
  }

  /** Hiện câu `i` (chưa đọc). */
  function show(i, animate) {
    index = i;
    if (app.current?.name === 'scene') app.current.params.index = i; // ra nền rồi quay lại: đúng câu này
    readingDone = false;
    const s = sentences[i];
    wordEls = displayWords(s.en).map((w) => h('button.sword', { type: 'button', dataset: { word: tokenize(w)[0] ?? w }, text: w }));
    sentenceBox.replaceChildren(...wordEls);
    viLine.textContent = s.vi ?? '';
    counter.textContent = `${i + 1}/${sentences.length}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === last;
    placeArrow(i, animate);
  }

  function setPaused(on) {
    paused = on;
    pauseBtn.textContent = on ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', on ? 'Chạy' : 'Dừng');
    pauseBtn.classList.toggle('play', on);
  }

  /** Chuyển tới câu `i` rồi đọc (5.2: ⏭ ⏮ đọc ngay, không chờ 1,2 giây). */
  async function playFrom(i, { animate = true } = {}) {
    const t = newRun();
    setPaused(false);
    show(i, animate && i !== index);
    try {
      await t.pause(animate ? ARRIVE_MS : 0);
      arrow.classList.add('arrived');
      await t.pause(LOOK_MS);
      const s = sentences[i];
      await t.karaoke(s.en, wordEls);
      if (app.settings.readVietnamese && s.vi) await t.sayVi(s.vi);
      readingDone = true;
      await t.pause(REST_MS); // nghỉ 1,2 giây SAU khi đọc xong toàn bộ âm thanh của câu (2.4)
      if (i < last) {
        if (app.settings.sceneAutoNext !== false) playFrom(i + 1);
      } else {
        finish();
      }
    } catch (err) {
      if (!isAbort(err)) console.error(err);
    }
  }

  function finish() {
    recordLessonDone(app.db, scene.id, null).catch(() => {});
    play('tada');
    const again = h('button.big-btn.primary', { type: 'button', 'aria-label': 'Nghe lại từ đầu', text: '🔁 Nghe lại', onclick: () => playFrom(0) });
    const home = h('button.big-btn', { type: 'button', 'aria-label': 'Về', text: '📖', onclick: back });
    const find = findable ? h('button.big-btn', { type: 'button', 'aria-label': 'Tìm trong tranh', text: '🔍 Tìm', onclick: () => app.go('scene', { sceneId: scene.id, mode: 'find' }) }) : null;
    const panel = h('div.scene-done', {}, h('p.done-title', { text: 'Great listening!' }), h('div.done-actions', {}, again, find, home));
    sentenceBox.replaceChildren(panel);
    viLine.textContent = '';
    arrow.classList.add('gone');
    newRun().say('Great listening!').catch(() => {});
  }

  // ---------- 🔍 Tìm trong tranh (SPEC-ta-tranh mục 9, 11) ----------
  const findable = sentences.some((s) => s.point);
  const findBtn = h(`button.scene-btn.find-btn${findable ? '' : '.dim'}`, {
    type: 'button', 'aria-label': 'Tìm trong tranh', text: '🔍',
    onclick: () => {
      play('tap');
      if (!findable) {
        toast('Bố mẹ cần đặt mũi tên cho tranh này (Góc bố mẹ → Bài học → Tả tranh).', 4000);
        return;
      }
      app.go('scene', { sceneId: scene.id, mode: 'find' });
    },
  });
  if (params.mode === 'find' && findable) return startFind();
  viBtn.after(findBtn);

  function startFind() {
    const items = sentences.map((s, i) => [s, i]).filter(([s]) => s.point);
    for (const b of [pauseBtn, prevBtn, againBtn, nextBtn]) b.hidden = true;
    const replayBtn = h('button.scene-btn.big', { type: 'button', 'aria-label': 'Nghe lại', title: 'Nghe lại câu hỏi', text: '🔊', hidden: true });
    againBtn.after(replayBtn);
    app.root.querySelector('.scene-title').textContent = `🔍 ${scene.title}`;
    const t = new Teacher(app, { signal: activity, stage: textBar, replayBtn });
    const ring = h('div.find-ring', { 'aria-hidden': 'true', hidden: true });
    frame.append(ring);
    const results = [];

    /** Chờ bé chạm vào tranh (bỏ qua khi Olly đang nói) → toạ độ px trong khung. */
    const waitFrameTap = () => new Promise((resolve, reject) => {
      const onTap = (e) => {
        if (app.speaker.speaking) return;
        const r = frame.getBoundingClientRect();
        cleanup();
        resolve({ x: e.clientX - r.left, y: e.clientY - r.top });
      };
      const onAbort = () => { cleanup(); reject(abortError()); };
      const cleanup = () => {
        frame.removeEventListener('click', onTap);
        activity.removeEventListener('abort', onAbort);
      };
      frame.addEventListener('click', onTap);
      activity.addEventListener('abort', onAbort, { once: true });
    });
    const missAt = ({ x, y }) => {
      const dot = h('span.miss-dot', { 'aria-hidden': 'true', style: { left: `${x}px`, top: `${y}px` } });
      frame.append(dot);
      setTimeout(() => dot.remove(), 900);
    };
    const showRing = (s) => {
      const b = box();
      const r = hitRadius(s, b);
      const c = hitCenter(s); // vòng bao quanh đối tượng, không phải quanh đầu mũi tên
      Object.assign(ring.style, { left: `${c.x * b.w - r}px`, top: `${c.y * b.h - r}px`, width: `${2 * r}px`, height: `${2 * r}px` });
      ring.hidden = false;
    };

    (async () => {
      await new Promise((r) => requestAnimationFrame(r));
      reserveTextHeight();
      for (const [k, [s, i]] of items.entries()) {
        show(i, false);
        arrow.classList.add('gone');
        ring.hidden = true;
        counter.textContent = `${k + 1}/${items.length}`;
        const speak = async () => {
          await t.karaoke(s.en, wordEls);
          await t.say(QUESTIONS.findInPicture());
        };
        await t.ask(QUESTIONS.findInPicture(), { meaning: s.vi, speak });
        let wrong = 0;
        let result;
        for (;;) {
          const tap = await waitFrameTap();
          const b = box();
          const c = hitCenter(s);
          const hit = Math.hypot(tap.x - c.x * b.w, tap.y - c.y * b.h) <= hitRadius(s, b);
          if (hit) {
            play('ding');
            placeArrow(i, false);
            arrow.classList.add('arrived');
            ring.hidden = true;
            t.celebrate();
            result = wrong === 0 ? RESULT.INDEPENDENT : wrong === 1 ? RESULT.HELPED : RESULT.MISSED;
            if (wrong < 2) await t.say(wrong === 0 ? 'Yes! Well done!' : 'Yes! Good job!');
            break;
          }
          wrong++;
          play('boing');
          missAt(tap);
          if (wrong === 1) {
            await t.say('Oops! Listen again.');
            for (const kw of s.keywords ?? []) await t.say(kw, { rate: app.settings.rate * 0.8 });
            await t.karaoke(s.en, wordEls);
          } else if (wrong === 2) {
            // Câu tiếng Việt đã có dấu câu cuối: bỏ đi rồi mới thêm "." (tránh "bầu trời..").
            if (s.vi && needsVietnameseHelp(app.settings, wrong)) await t.explainVi(`Câu "${s.en}" nghĩa là: ${s.vi.replace(/[.!?。]+$/, '')}. Bé chạm vào chỗ mũi tên chỉ nhé.`);
            placeArrow(i, false);
            showRing(s);
            await t.say('Look! It is here. Tap it!');
          }
        }
        t.endQuestion();
        recordItem(app.db, { lessonId: scene.id, activity: 'find', itemId: s.sid }, result).catch(() => {});
        results.push(result);
        await t.pause(700);
      }
      const stars = starsFor(results);
      await recordLessonDone(app.db, scene.id, stars, Date.now(), 'find');
      play('tada');
      arrow.classList.add('gone');
      viLine.textContent = '';
      sentenceBox.replaceChildren(h('div.scene-done', {},
        h('p.done-title', { text: 'Great finding!' }),
        stars != null ? h('p.done-stars', { 'aria-label': `${stars} sao`, text: '⭐'.repeat(stars) + '☆'.repeat(3 - stars) }) : null,
        h('div.done-actions', {},
          h('button.big-btn.primary', { type: 'button', 'aria-label': 'Chơi lại', text: '🔁', onclick: () => app.go('scene', { sceneId: scene.id, mode: 'find' }) }),
          h('button.big-btn', { type: 'button', 'aria-label': 'Nghe tranh', text: '👂', onclick: () => app.go('scene', { sceneId: scene.id }) }),
          h('button.big-btn', { type: 'button', 'aria-label': 'Về', text: '📖', onclick: back }))));
      t.celebrate();
      await t.say(stars === 3 ? 'Wow! Three stars!' : 'Great finding! You did it!');
    })().catch((err) => {
      if (!isAbort(err)) console.error(err);
    });
    const onResizeFind = () => {
      if (!arrow.classList.contains('gone')) placeArrow(index, false);
      reserveTextHeight();
    };
    window.addEventListener('resize', onResizeFind);
    return () => window.removeEventListener('resize', onResizeFind);
  }

  // ---------- Thao tác (bảng 5.2) ----------
  pauseBtn.addEventListener('click', () => {
    play('tap');
    if (paused) {
      playFrom(index, { animate: false });
    } else {
      newRun(); // hủy giọng đọc + hẹn giờ
      setPaused(true);
      placeArrow(index, false); // mũi tên nhảy ngay về vị trí cuối của câu
      wordEls.forEach((el) => el.classList.remove('reading'));
    }
  });
  againBtn.addEventListener('click', () => { play('tap'); playFrom(index, { animate: false }); });
  prevBtn.addEventListener('click', () => { if (index > 0) { play('tap'); playFrom(index - 1); } });
  nextBtn.addEventListener('click', () => { if (index < last) { play('tap'); playFrom(index + 1); } });
  viBtn.addEventListener('click', async () => {
    play('tap');
    await app.setSetting('showVi', app.settings.showVi === false);
    showVi(); // chỉ ẩn / hiện chữ, không ngắt âm thanh
  });

  // Chạm từ: đọc riêng từ đó; 3 giây không chạm gì → đọc dở thì đọc lại câu, đọc xong rồi thì sang câu sau.
  sentenceBox.addEventListener('click', (e) => {
    const el = e.target.closest('.sword');
    if (!el || !el.dataset.word) return;
    const t = newRun();
    const wasDone = readingDone;
    wordEls.forEach((x) => x.classList.remove('reading'));
    el.classList.add('reading');
    t.say(el.dataset.word, { rate: app.settings.rate * 0.8 }).catch(() => {}).finally(() => {
      el.classList.remove('reading');
      if (run.signal.aborted || paused) return;
      idleTimer = setTimeout(() => {
        if (wasDone && index < last) playFrom(index + 1);
        else if (!wasDone) playFrom(index, { animate: false });
      }, scaled(WORD_IDLE_MS));
    });
  });
  // Chạm thanh chữ (ngoài các từ) = nghe lại.
  textBar.addEventListener('click', (e) => {
    if (e.target.closest('.sword, .scene-done')) return;
    playFrom(index, { animate: false });
  });
  // Chạm tranh: trúng vùng của câu nào thì nhảy tới câu đó; ngoài mọi vùng thì không làm gì (4.4).
  frame.addEventListener('click', (e) => {
    const r = frame.getBoundingClientRect();
    const j = pickSentence(sentences, { x: e.clientX - r.left, y: e.clientY - r.top }, box(), index);
    if (j < 0) return;
    play('tap');
    playFrom(j);
  });

  // Xoay màn / đổi cỡ: tính lại mũi tên + chiều cao thanh chữ, không ngắt giọng đọc (5.3).
  const onResize = () => {
    placeArrow(index, false);
    reserveTextHeight();
  };
  window.addEventListener('resize', onResize);

  showVi();
  requestAnimationFrame(() => {
    reserveTextHeight();
    if (paused) {
      show(index, false);
      setPaused(true);
    } else {
      playFrom(index, { animate: false });
    }
  });
  return () => {
    window.removeEventListener('resize', onResize);
    run?.abort();
    clearTimeout(idleTimer);
  };
}
