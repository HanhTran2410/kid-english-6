// Khung chung của một lượt chơi có mức (SPEC-math 3, 6; dùng cho 🔢 Toán và 🧩 Quest — SPEC-quest 11.1): danh sách bài
// (mọi bài mở sẵn, ⭐ "Tiếp theo"), chọn mức đã mở, Olly làm mẫu (⏭ / ▶), các mục có chấm (đúng ngay / sai 1 lần →
// gợi ý / sai 2 lần → tiếng Việt + đáp án), bé đọc câu ở 2–3 mục (không tính sao), sao + mở mức. Lượt đang dở nằm trong
// `app.current.params.round` → ra nền rồi quay lại đúng mục. Mỗi khu truyền cấu hình `cfg`:
//   { zone, route, rootClass, lessons, byId, allLevelsSetting, levelVi(lesson), kindsAt(lesson, level),
//     makeItems(app, lesson, level, weak) → mục, itemRef(lesson, item), sentenceOf(lesson, item) → { en, vi },
//     runItem(ctx, item) → { result, line }, showSolved(ctx, item) → line, demoSteps(dctx, { short }),
//     tùy chọn: available(app, lesson) → false = chưa đủ nội dung (thẻ mờ, không mở lượt; SPEC-quest 2.5),
//     emptyLine { en, vi } (câu Olly nói khi đó), onStart(ctx) (gắn thêm việc khi mở màn bài),
//     readable(lesson, item) → false = bé chưa đọc được câu của mục, bỏ phần bé đọc (Olly đã đọc khi khen),
//     cardNote(lesson, totalOf) → dòng gợi ý nhỏ trên thẻ bài (totalOf(id) = tiến độ bài khác), null = không có }
//   runItem có thể trả { results: [...] } để chấm nhiều mục liền nhau trong một lần chơi (Quest 4: một lưới nhiều từ).

import { h, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { isAbort } from '../timing.js';
import { mascotElement } from '../mascot.js';
import { homeButton } from './child.js';
import { ZONE_BY_ID } from '../zones.js';
import { activityLayout, Teacher } from '../read/teacher.js';
import { sentenceResult } from '../read/sentence-stages.js';
import { QUESTIONS } from '../captions.js';
import { needsVietnameseHelp } from '../settings.js';
import { RESULT, getItem, applyResult, recordItem, getLessonProgress, recordLessonDone, starsFor } from '../progress.js';
import { MAX_LEVEL, readPlan, unlockedLevel, weakKind } from '../math/math.js';
import { sentenceLine } from '../math/views.js';

const LEVEL_WORDS = ['zero', 'one', 'two', 'three'];
const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
const say = (app, text) => app.speaker.speak(text).catch(() => {});

/** Tiến độ từng mức của bài: { 1: {...}, 2: {...}, 3: {...} } (khóa "lesson:<id>/L<n>", SPEC-math 6.2). */
export async function levelProgress(db, lessonId) {
  const out = {};
  for (let L = 1; L <= MAX_LEVEL; L++) out[L] = await getLessonProgress(db, lessonId, `L${L}`);
  return out;
}
const bestOf = (levels) => Object.fromEntries(Object.entries(levels).map(([k, p]) => [k, p.bestStars]));

/** Ghi kết quả mục kèm kiểu câu `kind` (SPEC-math 6.4). */
async function recordKind(db, ref, result, kind) {
  await db.put('progress', { ...applyResult(await getItem(db, ref), result), kind });
}

/** AbortController con: hủy theo signal cha, hoặc tự hủy (nút ⏭). */
function linked(signal) {
  const c = new AbortController();
  const on = () => c.abort();
  signal.addEventListener('abort', on, { once: true });
  c.dispose = () => signal.removeEventListener('abort', on);
  return c;
}

/** Nút ▶ / ⏭ (3.4): bấm khi Olly đang nói thì dừng câu đang nói rồi mới làm. */
function pressed(app, btn, signal) {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Đã dừng', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    btn.addEventListener('click', () => {
      signal.removeEventListener('abort', onAbort);
      app.speaker.cancel();
      play('tap');
      resolve();
    }, { once: true });
  });
}

// ---------- Danh sách bài ----------

/** Danh sách bài của khu (mọi bài mở sẵn, ⭐ "Tiếp theo"): sao của mức cao nhất đã chơi + nhãn "Mức N" (SPEC-math 6.3). */
export function roundListScreen(app, cfg) {
  const info = ZONE_BY_ID.get(cfg.zone);
  app.root.className = `child-screen read-list zone-list-${cfg.zone}`;
  const list = h('div.lesson-cards');
  app.root.append(h('header.child-top', {}, homeButton(app), h('h1.read-title', { text: `${info.emoji} ${info.en}` }), mascotElement('read-olly')), list);
  say(app, info.intro);
  (async () => {
    const lessons = cfg.lessons;
    const totals = await Promise.all(lessons.map((l) => getLessonProgress(app.db, l.id)));
    const levels = await Promise.all(lessons.map((l) => levelProgress(app.db, l.id)));
    const next = lessons.findIndex((_, i) => !totals[i].completedAt);
    const ready = await Promise.all(lessons.map((l) => (cfg.available ? cfg.available(app, l) : true)));
    const totalOf = (id) => totals[lessons.findIndex((x) => x.id === id)];
    const noteOf = (l) => cfg.cardNote?.(l, totalOf) ?? null;
    lessons.forEach((l, i) => {
      // Sao của mức cao nhất đã chơi, kèm nhãn "Mức N" (6.3).
      const played = [3, 2, 1].find((L) => levels[i][L].plays);
      list.append(h(`button.lesson-card${i === next ? '.next' : ''}${ready[i] ? '' : '.dim'}`, {
        type: 'button', 'aria-label': l.title, dataset: { lesson: l.id },
        onclick: () => {
          play('tap');
          app.go(cfg.route, { lessonId: l.id });
        },
      },
      h('span.lesson-emoji', { text: l.emoji }),
      h('span.lesson-title', { text: l.title }),
      h('span.lesson-vi', { text: l.titleVi }),
      h('span.lesson-stars', { text: starText(played ? levels[i][played].bestStars : 0) }),
      played ? h('span.mt-level-chip', { text: `Mức ${played}` }) : null,
      i === next ? h('span.next-badge', { text: '⭐ Tiếp theo' }) : null,
      noteOf(l) ? h('span.lesson-note', { text: noteOf(l) }) : null));
    });
  })().catch((err) => {
    console.error(err);
    toast('Không đọc được danh sách bài.');
  });
}

// ---------- Một bài ----------

/** Màn một bài: chọn mức → làm mẫu → các mục có chấm → đọc câu → sao + mở mức. */
export function roundLessonScreen(app, params, cfg) {
  const lesson = cfg.byId.get(params.lessonId);
  if (!lesson) {
    queueMicrotask(() => app.go(cfg.zone));
    return null;
  }
  const signal = app.startActivity();
  const layout = activityLayout(app, { onHome: () => app.go(cfg.zone) });
  const t = new Teacher(app, { signal, stage: layout.stage, replayBtn: layout.replayBtn });
  app.root.dataset.lesson = lesson.id;
  app.root.classList.add(cfg.rootClass);
  const ctx = { app, t, stage: layout.stage, signal, lesson, layout, round: null, cfg };
  cfg.onStart?.(ctx);
  runLesson(ctx, params).catch((err) => {
    if (isAbort(err)) return;
    console.error(err);
    toast('Có lỗi khi học bài này.');
  });
  return null;
}

async function runLesson(ctx, params) {
  const { app, lesson, t, layout, cfg } = ctx;
  if (cfg.available && !(await cfg.available(app, lesson))) {
    // Chưa đủ nội dung bé đã học (SPEC-quest 2.5): không mở lượt, không tính lượt.
    ctx.stage.replaceChildren(h('div.done-panel', {}, h('p.done-title', { text: cfg.emptyLine.en }), h('p.level-sub', { text: cfg.emptyLine.vi }),
      h('button.big-btn.primary', { type: 'button', 'aria-label': 'Quay lại', text: '↩️', onclick: () => app.go(cfg.zone) })));
    app.root.dataset.empty = '1';
    await t.say(cfg.emptyLine.en).catch(() => {});
    return;
  }
  const levels = await levelProgress(app.db, lesson.id);
  const unlocked = unlockedLevel(bestOf(levels), app.settings[cfg.allLevelsSetting]);
  // Ra nền rồi quay lại (bấm ▶ ở lớp "Bắt đầu") → tiếp lượt đang dở; mở bài mới / tải lại → lượt mới (3.6).
  let round = params.continueDirectly && params.round?.lessonId === lesson.id ? params.round : null;
  if (!round) {
    const level = unlocked > 1 ? await chooseLevel(ctx, unlocked, levels) : 1;
    const records = await app.db.getAllByIndex('progress', 'lessonId', lesson.id);
    const weak = weakKind(records, cfg.kindsAt(lesson, level));
    round = {
      lessonId: lesson.id, level, items: await cfg.makeItems(app, lesson, level, weak), readAt: readPlan(),
      index: 0, results: [], wrong: 0, phase: 'demo', firstAtLevel: !levels[level].plays,
    };
  }
  ctx.round = round;
  if (app.current?.name === cfg.route) app.current.params.round = round;
  app.root.dataset.level = String(round.level);

  if (round.phase === 'demo') {
    const total = await getLessonProgress(app.db, lesson.id);
    await runDemo(ctx, { short: total.bestStars > 0 });
    round.phase = 'item';
  }

  const count = round.items.length;
  layout.setProgress(round.index / count);
  while (round.index < count) {
    const item = round.items[round.index];
    app.root.dataset.index = String(round.index);
    let line = null;
    if (round.phase === 'item') {
      const out = await cfg.runItem(ctx, item);
      // Một lần chơi có thể chấm nhiều mục liền nhau (Quest 4: một lưới = 3–4 từ): `out.results` theo thứ tự mục.
      const results = out.results ?? [out.result];
      results.forEach((result, k) => {
        round.results[round.index + k] = result;
        const it = round.items[round.index + k];
        recordKind(app.db, cfg.itemRef(lesson, it), result, it.kind).catch(() => {});
      });
      round.index += results.length - 1;
      round.wrong = 0;
      round.phase = round.readAt.includes(round.index) && (cfg.readable?.(lesson, item) ?? true) ? 'read' : 'next';
      line = out.line;
    }
    if (round.phase === 'read') {
      if (!line) line = cfg.showSolved(ctx, item); // quay lại từ nền đúng lúc đang đọc câu
      await runRead(ctx, item, line);
    }
    round.index++;
    round.phase = 'item';
    layout.setProgress(round.index / count);
    // Sang mục sau 1,2 giây sau khi Olly nói xong (3.4).
    await t.pause(1200);
  }
  await finishRound(ctx, unlocked);
}

async function chooseLevel(ctx, unlocked, levels) {
  const { app, t, stage, lesson, cfg } = ctx;
  const buttons = Array.from({ length: unlocked }, (_, i) => i + 1).map((L) => h(`button.level-btn${L === unlocked ? '.suggested' : ''}`, {
    type: 'button', 'aria-label': `Mức ${L}`, dataset: { level: String(L) },
  },
  h('span.level-en', { text: `Level ${L}` }),
  h('span.level-vi', { text: cfg.levelVi(lesson)[L - 1] }),
  h('span.level-stars', { text: starText(levels[L].bestStars) })));
  stage.replaceChildren(h('div.level-panel', {},
    h('p.level-title', {}, h('span', { text: `${lesson.emoji} ${lesson.title}` })),
    h('p.level-sub', { text: lesson.titleVi }),
    h('div.level-list', {}, ...buttons)));
  t.say('Pick a level!').catch(() => {});
  const picked = await t.waitTap(buttons);
  play('pop');
  app.speaker.cancel();
  return Number(picked.dataset.level);
}

export const showVi = (app) => app.settings.showVi !== false;

/** Olly khen (theo kết quả) rồi đọc câu so sánh trọn vẹn (karaoke) — câu ở lại trên màn. */
export async function praiseAndRead(ctx, item, result) {
  const { app, t, stage, lesson, cfg } = ctx;
  if (result === RESULT.INDEPENDENT) await t.say('Yes! Well done!');
  else if (result === RESULT.HELPED) await t.say('Yes! Good job!');
  const s = cfg.sentenceOf(lesson, item);
  stage.querySelector('.mt-sentence')?.remove();
  const line = sentenceLine(s, showVi(app));
  stage.append(line.el);
  await t.karaoke(s.en, line.words);
  if (app.settings.readVietnamese && s.vi) await t.sayVi(s.vi);
  return line;
}

export const shake = (el) => {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
};

/** Chờ bé chạm; 20 giây không chạm → nhắc lại câu hỏi MỘT lần, 🔊 sáng viền một lần (3.5). */
export function waitPick(ctx, targets) {
  const { t, layout } = ctx;
  return t.waitTap(targets, {
    onIdle: () => {
      layout.replayBtn.classList.add('glow');
      setTimeout(() => layout.replayBtn.classList.remove('glow'), 2500);
      (t.questionSpeak ? t.questionSpeak() : t.say(t.question ?? '')).catch(() => {});
    },
  });
}

/**
 * Bé chọn (3.2): đúng ngay → INDEPENDENT; sai 1 → `onWrong1` (hình kiểm chứng) rồi hỏi lại; đúng sau đó → HELPED;
 * sai 2 → giải thích tiếng Việt một lần, đáp án sáng, bé chạm đáp án → MISSED. Lần sai lưu ở `round.wrong`
 * (ra nền rồi quay lại vẫn tính).
 */
export async function chooseLoop(ctx, view) {
  const { app, t, round } = ctx;
  const { options, correct, question, meaning, speak, explain, onWrong1, onPick } = view;
  await t.ask(question, { speak, meaning });
  for (;;) {
    if (round.wrong >= 2) correct.classList.add('hint');
    const picked = await waitPick(ctx, round.wrong >= 2 ? [correct] : options);
    await onPick?.(picked);
    if (picked === correct) {
      play('ding');
      correct.classList.remove('hint');
      correct.classList.add('right');
      t.celebrate(correct);
      t.endQuestion();
      return round.wrong === 0 ? RESULT.INDEPENDENT : round.wrong === 1 ? RESULT.HELPED : RESULT.MISSED;
    }
    round.wrong++;
    play('boing');
    shake(picked);
    await view.onWrong?.(picked);
    if (round.wrong === 1) {
      await onWrong1();
      await speak();
    } else {
      if (needsVietnameseHelp(app.settings, round.wrong)) await t.explainVi(explain);
      correct.classList.add('hint');
      await t.say('This one!');
    }
  }
}

// ---------- Bé đọc câu (3.3): luyện, không tính sao ----------

async function runRead(ctx, item, line) {
  const { app, stage, signal, lesson, layout, cfg } = ctx;
  const sub = linked(signal);
  const rt = new Teacher(app, { signal: sub.signal, stage, replayBtn: layout.replayBtn });
  const skip = h('button.big-btn.mt-skip', { type: 'button', 'aria-label': 'Bỏ qua phần đọc', text: '⏭' });
  skip.addEventListener('click', () => {
    play('tap');
    app.speaker.cancel();
    sub.abort();
  });
  app.root.append(skip);
  const s = cfg.sentenceOf(lesson, item);
  let result = null;
  try {
    await rt.say('Read it with me!');
    await rt.karaoke(s.en, line.words);
    await rt.ask(QUESTIONS.readSentence(), { meaning: s.vi });
    const heard = await rt.hearSentence(s.en);
    if (!heard) {
      const done = h('button.big-btn.done-btn', { type: 'button', 'aria-label': 'Con đọc xong', text: '✅' });
      stage.append(done);
      try {
        await rt.waitTap([done]);
        play('pop');
      } finally {
        done.remove();
      }
      result = RESULT.PRACTICED;
    } else {
      const words = line.words.map((el) => el.dataset.word);
      line.words.forEach((el) => el.classList.add(heard.has(el.dataset.word) ? 'heard' : 'missed'));
      result = sentenceResult(words, heard);
      if (result === RESULT.INDEPENDENT) {
        play('ding');
        await rt.say('Great reading!');
      } else {
        await rt.say('Good try! Listen.');
        await rt.karaoke(s.en, line.words);
      }
    }
  } catch (err) {
    if (!isAbort(err) || signal.aborted) throw err; // ⏭: bỏ phần đọc, sang mục sau
  } finally {
    skip.remove();
    rt.endQuestion();
    sub.dispose();
  }
  if (result) recordItem(app.db, { lessonId: lesson.id, activity: 'read', itemId: s.en }, result).catch(() => {});
}

// ---------- Olly làm mẫu (3.1) ----------

/** Olly "chạm" đáp án: sáng + sao. */
export async function ollyTap(t, el) {
  el.classList.add('olly-tap');
  play('ding');
  el.classList.add('right');
  t.celebrate(el);
  await t.pause(500);
}

async function runDemo(ctx, { short }) {
  const { app, signal, stage, layout } = ctx;
  const sub = linked(signal);
  const dt = new Teacher(app, { signal: sub.signal, stage, replayBtn: layout.replayBtn });
  const dctx = { ...ctx, t: dt, signal: sub.signal };
  app.root.dataset.phase = 'demo';
  let skipped = false;
  let skip = null;
  if (short) {
    skip = h('button.big-btn.mt-skip', { type: 'button', 'aria-label': 'Bỏ qua phần làm mẫu', text: '⏭' });
    skip.addEventListener('click', () => {
      play('tap');
      skipped = true;
      app.speaker.cancel();
      sub.abort();
    });
    app.root.append(skip);
  }
  try {
    await ctx.cfg.demoSteps(dctx, { short });
  } catch (err) {
    if (!isAbort(err) || signal.aborted) throw err;
  } finally {
    skip?.remove();
    dt.endQuestion();
    sub.dispose();
  }
  if (!skipped) {
    const go = h('button.big-btn.primary.mt-go', { type: 'button', 'aria-label': 'Đến lượt con', text: '▶' });
    stage.append(go);
    ctx.t.say('Your turn!').catch(() => {});
    await pressed(app, go, signal);
  }
  delete app.root.dataset.phase;
}

// ---------- Kết thúc lượt: sao + mở mức (6.2, 6.3) ----------

async function finishRound(ctx, unlockedBefore) {
  const { app, t, layout, lesson, round, cfg } = ctx;
  const stars = starsFor(round.results);
  const now = Date.now();
  await recordLessonDone(app.db, lesson.id, stars, now, `L${round.level}`);
  await recordLessonDone(app.db, lesson.id, stars, now);
  const unlocked = unlockedLevel(bestOf(await levelProgress(app.db, lesson.id)), app.settings[cfg.allLevelsSetting]);
  if (app.current?.name === cfg.route) delete app.current.params.round;
  layout.setProgress(1);
  play('tada');
  const opened = unlocked > unlockedBefore;
  const leave = () => app.go(app.timeUp ? 'sleep' : cfg.zone);
  layout.stage.replaceChildren(h('div.done-panel', {},
    h('p.done-title', { text: 'Great job!' }),
    h('p.done-stars', { 'aria-label': `${stars} sao`, text: starText(stars) }),
    h('p.mt-level-chip', { text: `Mức ${round.level}` }),
    opened ? h('p.mt-unlock', { text: `🔓 Đã mở Mức ${unlocked}!` }) : null,
    h('div.done-actions', {},
      h('button.big-btn', { type: 'button', 'aria-label': 'Học lại', text: '🔁', onclick: () => app.go(cfg.route, { lessonId: lesson.id }) }),
      h('button.big-btn.primary', { type: 'button', 'aria-label': 'Bài khác', text: ZONE_BY_ID.get(cfg.zone).emoji, onclick: leave }))));
  t.celebrate();
  await t.say(stars === 3 ? 'Wow! Three stars! Great job!' : 'Great job! You did it!').catch(() => {});
  if (opened) await t.say(`Level ${LEVEL_WORDS[unlocked]} is open!`).catch(() => {});
}
