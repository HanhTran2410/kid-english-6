// Khu 🔢 Math / Toán (SPEC-math.md): danh sách bài (mọi bài mở sẵn, ⭐ "Tiếp theo"), chọn mức đã mở, Olly làm mẫu,
// 8 mục có chấm (đúng ngay / sai 1 lần → hình kiểm chứng / sai 2 lần → tiếng Việt + đáp án), bé đọc câu ở 2–3 mục
// (không tính sao), sao + mở mức. Lượt đang dở nằm trong `app.current.params.round` → ra nền rồi quay lại đúng mục (3.6).

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
import {
  BUILTIN_MATH, MATH_BY_ID, MATH_ITEMS, MAX_LEVEL, makeItems, sentenceOf, itemRef, readPlan, unlockedLevel, weakKind, kindsAt,
  explainVi, numberWord, pairLineT2, blocksLine, tensLine, signsAt, tensOf, onesOf, cap,
  orderedT4, SLOT_LABELS, puzzleText, T7_THINGS, T7_BY_ID, t7Item, T5_LINE,
} from '../math/math.js';
import {
  numberCard, crocEl, signCard, groupEl, drawPairs, makeBoard, sentenceLine, reducedMotion, rodEl, orderBoard, numberLine, personCard,
} from '../math/views.js';

const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
const say = (app, text) => app.speaker.speak(text).catch(() => {});

/** Mô tả mức trên nút chọn mức. */
const LEVEL_VI = {
  t1: ['Số tới 10', 'Số tới 20', 'Số sát nhau'],
  t2: ['Tới 6 con', 'Tới 10 con', 'Tới 10 con, sát nhau'],
  t3: ['🐊 > và <', '🐊 thêm =', 'Chỉ dấu > < ='],
  t6: ['Xếp số', 'So hàng chục', 'So hàng đơn vị'],
  t4: ['Số tới 10', 'Số tới 20', 'Lớn → nhỏ'],
  t5: ['Trước – sau', 'Thêm ở giữa', 'Hơn một – kém một'],
  t7: ['Có hình đồ vật', 'Đọc rồi chọn', 'Số tới 20'],
};

/** Tia số: 11 số; iPhone dọc chỉ đủ chỗ cho 7 ô ≥ 48 px (SPEC-math 8.2). */
const lineLen = () => (window.innerWidth < 600 ? 7 : T5_LINE);

/** T7 mức 3 có câu đố số tới 20 khi bé đã có ⭐⭐ ở T5 (4.7). */
async function allow20(db) {
  const t5 = await levelProgress(db, 'math-t5');
  return Object.values(t5).some((p) => p.bestStars >= 2);
}

/** Tiến độ từng mức của bài: { 1: {...}, 2: {...}, 3: {...} } (khóa "lesson:<id>/L<n>", SPEC-math 6.2). */
async function levelProgress(db, lessonId) {
  const out = {};
  for (let L = 1; L <= MAX_LEVEL; L++) out[L] = await getLessonProgress(db, lessonId, `L${L}`);
  return out;
}
const bestOf = (levels) => Object.fromEntries(Object.entries(levels).map(([k, p]) => [k, p.bestStars]));

/** Ghi kết quả mục kèm kiểu câu `kind` (6.4). */
async function recordMath(db, ref, result, kind) {
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

export function mathScreen(app) {
  const info = ZONE_BY_ID.get('math');
  app.root.className = 'child-screen read-list zone-list-math';
  const list = h('div.lesson-cards');
  app.root.append(h('header.child-top', {}, homeButton(app), h('h1.read-title', { text: `${info.emoji} ${info.en}` }), mascotElement('read-olly')), list);
  say(app, info.intro);
  (async () => {
    const lessons = BUILTIN_MATH;
    const totals = await Promise.all(lessons.map((l) => getLessonProgress(app.db, l.id)));
    const levels = await Promise.all(lessons.map((l) => levelProgress(app.db, l.id)));
    const next = lessons.findIndex((_, i) => !totals[i].completedAt);
    lessons.forEach((l, i) => {
      // Sao của mức cao nhất đã chơi, kèm nhãn "Mức N" (6.3).
      const played = [3, 2, 1].find((L) => levels[i][L].plays);
      list.append(h(`button.lesson-card${i === next ? '.next' : ''}`, {
        type: 'button', 'aria-label': l.title, dataset: { lesson: l.id },
        onclick: () => {
          play('tap');
          app.go('math-lesson', { lessonId: l.id });
        },
      },
      h('span.lesson-emoji', { text: l.emoji }),
      h('span.lesson-title', { text: l.title }),
      h('span.lesson-vi', { text: l.titleVi }),
      h('span.lesson-stars', { text: starText(played ? levels[i][played].bestStars : 0) }),
      played ? h('span.mt-level-chip', { text: `Mức ${played}` }) : null,
      i === next ? h('span.next-badge', { text: '⭐ Tiếp theo' }) : null));
    });
  })().catch((err) => {
    console.error(err);
    toast('Không đọc được danh sách bài.');
  });
}

// ---------- Một bài ----------

export function mathLessonScreen(app, params = {}) {
  const lesson = MATH_BY_ID.get(params.lessonId);
  if (!lesson) {
    queueMicrotask(() => app.go('math'));
    return null;
  }
  const signal = app.startActivity();
  const layout = activityLayout(app, { onHome: () => app.go('math') });
  const t = new Teacher(app, { signal, stage: layout.stage, replayBtn: layout.replayBtn });
  app.root.dataset.lesson = lesson.id;
  app.root.classList.add('math');
  const ctx = { app, t, stage: layout.stage, signal, lesson, layout, round: null };
  runLesson(ctx, params).catch((err) => {
    if (isAbort(err)) return;
    console.error(err);
    toast('Có lỗi khi học bài này.');
  });
  return null;
}

async function runLesson(ctx, params) {
  const { app, lesson, t, layout } = ctx;
  const levels = await levelProgress(app.db, lesson.id);
  const unlocked = unlockedLevel(bestOf(levels), app.settings.mathAllLevels);
  // Ra nền rồi quay lại (bấm ▶ ở lớp "Bắt đầu") → tiếp lượt đang dở; mở bài mới / tải lại → lượt mới (3.6).
  let round = params.continueDirectly && params.round?.lessonId === lesson.id ? params.round : null;
  if (!round) {
    const level = unlocked > 1 ? await chooseLevel(ctx, unlocked, levels) : 1;
    const records = await app.db.getAllByIndex('progress', 'lessonId', lesson.id);
    const weak = weakKind(records, kindsAt(lesson.key, level));
    const maxGroup = window.innerWidth < 600 ? 8 : 10;
    const opts = { weak, maxGroup, lineLen: lineLen(), allow20: lesson.key === 't7' && await allow20(app.db) };
    round = {
      lessonId: lesson.id, level, items: makeItems(lesson.key, level, Math.random, opts), readAt: readPlan(),
      index: 0, results: [], wrong: 0, phase: 'demo', firstAtLevel: !levels[level].plays,
    };
  }
  ctx.round = round;
  if (app.current?.name === 'math-lesson') app.current.params.round = round;
  app.root.dataset.level = String(round.level);

  if (round.phase === 'demo') {
    const total = await getLessonProgress(app.db, lesson.id);
    await runDemo(ctx, { short: total.bestStars > 0 });
    round.phase = 'item';
  }

  layout.setProgress(round.index / MATH_ITEMS);
  while (round.index < MATH_ITEMS) {
    const item = round.items[round.index];
    app.root.dataset.index = String(round.index);
    let line = null;
    if (round.phase === 'item') {
      const out = await runItem(ctx, item);
      round.results[round.index] = out.result;
      round.wrong = 0;
      round.phase = round.readAt.includes(round.index) ? 'read' : 'next';
      line = out.line;
      const ref = itemRef(lesson, item);
      recordMath(app.db, ref, out.result, item.kind).catch(() => {});
    }
    if (round.phase === 'read') {
      if (!line) line = showSolved(ctx, item); // quay lại từ nền đúng lúc đang đọc câu
      await runRead(ctx, item, line);
    }
    round.index++;
    round.phase = 'item';
    layout.setProgress(round.index / MATH_ITEMS);
    // Sang mục sau 1,2 giây sau khi Olly nói xong (3.4).
    await t.pause(1200);
  }
  await finishRound(ctx, unlocked);
}

async function chooseLevel(ctx, unlocked, levels) {
  const { app, t, stage, lesson } = ctx;
  const buttons = Array.from({ length: unlocked }, (_, i) => i + 1).map((L) => h(`button.level-btn${L === unlocked ? '.suggested' : ''}`, {
    type: 'button', 'aria-label': `Mức ${L}`, dataset: { level: String(L) },
  },
  h('span.level-en', { text: `Level ${L}` }),
  h('span.level-vi', { text: LEVEL_VI[lesson.key][L - 1] }),
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

// ---------- Các kiểu mục ----------

const showVi = (app) => app.settings.showVi !== false;

/** Olly khen (theo kết quả) rồi đọc câu so sánh trọn vẹn (karaoke) — câu ở lại trên màn. */
async function praiseAndRead(ctx, item, result) {
  const { app, t, stage, lesson } = ctx;
  if (result === RESULT.INDEPENDENT) await t.say('Yes! Well done!');
  else if (result === RESULT.HELPED) await t.say('Yes! Good job!');
  const s = sentenceOf(lesson.key, item);
  stage.querySelector('.mt-sentence')?.remove();
  const line = sentenceLine(s, showVi(app));
  stage.append(line.el);
  await t.karaoke(s.en, line.words);
  if (app.settings.readVietnamese && s.vi) await t.sayVi(s.vi);
  return line;
}

const shake = (el) => {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
};

/** Chờ bé chạm; 20 giây không chạm → nhắc lại câu hỏi MỘT lần, 🔊 sáng viền một lần (3.5). */
function waitPick(ctx, targets) {
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
async function chooseLoop(ctx, view) {
  const { app, t, round } = ctx;
  const { options, correct, question, speak, explain, onWrong1, onPick } = view;
  await t.ask(question, { speak });
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

/** Dựng màn của một mục; trả về các phần để chọn / làm mẫu / hiện đã giải. */
function buildView(ctx, item) {
  const key = ctx.lesson.key;
  if (key === 't2') return buildGroups(ctx, item);
  if (key === 't3') return buildSign(ctx, item);
  if (key === 't6' && item.make != null) return buildMake(ctx, item);
  if (key === 't4') return buildOrder(ctx, item);
  if (key === 't5') return buildLine(ctx, item);
  if (key === 't7') return buildPuzzle(ctx, item);
  return buildCompare(ctx, item, key === 't6' ? 'tens' : 'blocks');
}

/** T4: hàng 4 chỗ (first / next / next / last) + khay thẻ số. */
function buildOrder(ctx, item) {
  const board = orderBoard(item.numbers, SLOT_LABELS);
  ctx.stage.replaceChildren(board.el);
  const question = item.order === 'desc' ? QUESTIONS.biggestFirst() : QUESTIONS.smallestFirst();
  const target = orderedT4(item);
  const cardOf = (n) => board.cards.find((c) => Number(c.dataset.n) === n);
  return {
    order: board,
    target,
    cardOf,
    question,
    speak: () => ctx.t.say(question),
    solve: () => target.forEach((n, i) => board.place(cardOf(n), i)),
  };
}

/**
 * T4 (4.4): chạm lần lượt 4 thẻ, mỗi thẻ đúng bay vào chỗ kế tiếp. Chạm sai → rung, "Find the smallest number left.";
 * sai lần 2 ở cùng chỗ → tiếng Việt (một lần) + số đúng sáng. Cả hàng một kết quả: không sai → independent; có sai
 * nhưng chưa phải xem đáp án → helped; có chỗ phải xem đáp án → missed.
 */
async function runOrder(ctx, item, view) {
  const { app, t, round } = ctx;
  const { order: board, target, cardOf } = view;
  await t.ask(view.question, { speak: view.speak });
  let missed = false;
  let viSaid = false;
  for (let i = 0; i < target.length;) {
    const remaining = board.cards.filter((c) => !c.classList.contains('placed'));
    const correct = cardOf(target[i]);
    const shown = correct.classList.contains('hint');
    const picked = await waitPick(ctx, shown ? [correct] : remaining);
    if (picked === correct) {
      play('pop');
      correct.classList.remove('hint');
      board.place(correct, i);
      await t.say(`${cap(SLOT_LABELS[i])}, ${numberWord(target[i])}.`);
      i++;
      round.slotWrong = 0;
      continue;
    }
    round.wrong++;
    round.slotWrong = (round.slotWrong ?? 0) + 1;
    play('boing');
    shake(picked);
    if (round.slotWrong >= 2) {
      missed = true;
      if (!viSaid && needsVietnameseHelp(app.settings, 2)) {
        viSaid = true;
        await t.explainVi(explainVi('t4', item));
      }
      correct.classList.add('hint');
      await t.say('This one!');
    } else {
      await t.say(item.order === 'desc' ? 'Find the biggest number left.' : 'Find the smallest number left.');
    }
  }
  round.slotWrong = 0;
  play('ding');
  t.celebrate(board.el);
  t.endQuestion();
  const result = round.wrong === 0 ? RESULT.INDEPENDENT : missed ? RESULT.MISSED : RESULT.HELPED;
  return { result, line: await praiseAndRead(ctx, item, result) };
}

/** T5: tia số, ếch đứng ở số được hỏi; bé chạm số → ếch nhảy từng bước, Olly đếm bước (4.5). */
function buildLine(ctx, item) {
  const { t, stage } = ctx;
  const line = numberLine(item.line, item.n);
  stage.replaceChildren(line.el);
  line.set(item.n);
  const tickOf = (n) => line.ticks[n - item.line[0]];
  for (const x of [item.n, item.m]) if (x != null) tickOf(x).classList.add('given');
  const question = {
    after: QUESTIONS.comesAfter(item.n), before: QUESTIONS.comesBefore(item.n), between: QUESTIONS.between(item.n, item.m),
    more: QUESTIONS.oneMore(item.n), less: QUESTIONS.oneLess(item.n),
  }[item.ask];
  const hint = item.ask === 'between'
    ? `It is between ${numberWord(item.n)} and ${numberWord(item.m)}.`
    : { after: 'One jump forward!', more: 'One more means one jump forward.', before: 'One jump back!', less: 'One less means one jump back.' }[item.ask];
  const jumpTo = (n) => line.jump(n, (k) => t.say(`${cap(numberWord(k))} ${k === 1 ? 'jump' : 'jumps'}!`));
  return {
    options: line.ticks,
    correct: tickOf(item.answer),
    question,
    speak: () => t.say(question),
    explain: explainVi('t5', item),
    line,
    onPick: async (picked) => {
      await jumpTo(Number(picked.dataset.n));
    },
    // Sai → ếch nhảy về chỗ cũ: "One jump only!" (4.5).
    onWrong: async () => {
      await t.say('One jump only!');
      line.set(item.n);
    },
    onWrong1: () => t.say(hint),
    afterCorrect: async () => line.set(item.answer),
  };
}

/** T7: câu đố (Olly đọc karaoke) + hai thẻ nhân vật; mức 1 đồ vật luôn hiện, mức 2–3 hiện khi sai / sau khi đúng. */
function buildPuzzle(ctx, item) {
  const { t, stage, round, app } = ctx;
  const q = puzzleText(item);
  const text = sentenceLine(q, showVi(app));
  text.el.classList.replace('mt-sentence', 'mt-puzzle'); // câu so sánh đọc sau không xóa câu đố
  const emoji = T7_THINGS[item.thing].emoji;
  const cards = item.people.map((p, i) => personCard(p, emoji, i ? 'right' : 'left'));
  stage.replaceChildren(text.el, h('div.mt-row.mt-people', {}, ...cards));
  const showAll = () => cards.forEach((c) => c.showThings());
  if (round.level === 1) showAll();
  const count = async () => {
    showAll();
    await t.say(`Let's count! ${item.people.map((p) => `${p.name} has ${numberWord(p.n)} ${item.thing}.`).join(' ')}`);
  };
  return {
    options: cards,
    correct: cards[item.side === 'left' ? 0 : 1],
    question: q.en,
    speak: () => t.karaoke(q.en, text.words),
    explain: explainVi('t7', item),
    onWrong1: count,
    demoCheck: count,
    afterCorrect: async () => showAll(),
  };
}

/** T1 / T6 (mức 2–3): hai thẻ số + cột khối / que chục. */
function buildCompare(ctx, item, pic) {
  const { t, stage, round } = ctx;
  const L = numberCard(item.a, 'left');
  const R = numberCard(item.b, 'right');
  const cards = [L, R];
  const correct = item.side === 'left' ? L : R;
  const small = Math.max(item.a, item.b) > 10;
  const showAll = () => cards.forEach((c) => c.showPic(pic, { smallBlocks: small }));
  const extras = [];
  // T1 mức 3: hình chỉ hiện khi sai hoặc bấm 🔍 (4.8).
  if (pic === 'blocks' && round.level === 3) {
    const zoom = h('button.mt-zoom', { type: 'button', 'aria-label': 'Xem cột khối', text: '🔍' });
    zoom.addEventListener('click', () => {
      showAll();
      zoom.remove();
    });
    extras.push(zoom);
  }
  stage.replaceChildren(h('div.mt-row', {}, L, R), ...extras);
  if (pic === 'tens' || round.level === 1) showAll();
  const question = item.ask === 'bigger' ? QUESTIONS.whichBigger() : QUESTIONS.whichSmaller();
  const check = async () => {
    showAll();
    extras.forEach((e) => e.remove());
    if (pic === 'tens') {
      const part = tensOf(item.a) !== tensOf(item.b) ? 'tens' : 'ones';
      cards.forEach((c) => c.classList.add(`look-${part}`));
      await t.say(tensLine(item.a, item.b));
    } else {
      await t.say(blocksLine(item.a, item.b));
    }
  };
  return {
    options: cards,
    correct,
    question,
    speak: async () => {
      await t.say(question);
      await t.say(`${cap(numberWord(item.a))} or ${numberWord(item.b)}?`);
    },
    explain: explainVi(ctx.lesson.key, item),
    onWrong1: check,
    demoCheck: check,
    afterCorrect: async () => {
      showAll();
      extras.forEach((e) => e.remove());
    },
  };
}

/** T2: hai nhóm đồ vật + nút "= The same". */
function buildGroups(ctx, item) {
  const { t, stage, signal } = ctx;
  const counter = (n) => t.say(numberWord(n)).catch(() => {});
  const left = groupEl(item.left, 'left', counter);
  const right = groupEl(item.right, 'right', counter);
  const same = h('button.mt-same', { type: 'button', 'aria-label': 'Bằng nhau', dataset: { side: 'same' }, text: '= The same' });
  const board = h('div.mt-board', {}, left.box, same, right.box);
  stage.replaceChildren(board);
  const correct = item.answer === 'left' ? left.pickBtn : item.answer === 'right' ? right.pickBtn : same;
  const question = item.ask === 'more' ? QUESTIONS.whichMore() : QUESTIONS.whichFewer();
  const pairs = async () => {
    await drawPairs(board, left.things, right.things, signal);
    await t.say(pairLineT2(item));
  };
  return {
    options: [left.pickBtn, right.pickBtn, same],
    correct,
    question,
    speak: () => t.say(question),
    explain: explainVi('t2', item),
    onWrong1: async () => {
      await t.say("Let's check!");
      await pairs();
    },
    afterCorrect: pairs,
    groups: { left, right },
    demoCheck: pairs,
  };
}

/** T3: số – ô dấu – số, khay dấu. */
function buildSign(ctx, item) {
  const { t, stage, round } = ctx;
  const A = numberCard(item.a, 'left', { tappable: false });
  const B = numberCard(item.b, 'right', { tappable: false });
  const slot = h('div.mt-slot', { 'aria-label': 'Ô dấu' });
  const signs = signsAt(round.level).map((s) => signCard(s, item.croc));
  const correct = signs.find((s) => s.dataset.sign === item.sign);
  stage.replaceChildren(h('div.mt-row.sign-row', {}, A, slot, B), h('div.mt-tray', {}, ...signs));
  const small = Math.max(item.a, item.b) > 10;
  const showBlocks = () => [A, B].forEach((c) => c.showPic('blocks', { smallBlocks: small }));
  const place = (sign) => slot.replaceChildren(h('span.mt-sign-char', { text: sign }));
  return {
    options: signs,
    correct,
    question: QUESTIONS.whichSign(),
    speak: async () => {
      await t.say(QUESTIONS.whichSign());
      await t.say(`${cap(numberWord(item.a))}… ${numberWord(item.b)}.`);
    },
    explain: explainVi('t3', item),
    // Dấu bay vào ô; sai thì bật về khay (4.3).
    onPick: (picked) => place(picked.dataset.sign),
    onWrong: async () => {
      await ctx.t.pause(350);
      slot.replaceChildren();
    },
    onWrong1: async () => {
      showBlocks();
      await t.say(item.sign === '=' ? 'Look! They are the same number.' : 'The crocodile eats the bigger number. Which is bigger?');
    },
    afterCorrect: () => crocBite(ctx, slot, item),
    slot,
    place,
    showBlocks,
  };
}

/** Cá sấu ngoạm số lớn rồi mờ dần thành dấu (4.3); mức 3 / dấu = / giảm chuyển động: hiện thẳng dấu kèm viền sáng. */
async function crocBite(ctx, slot, item) {
  if (item.croc && item.sign !== '=' && !reducedMotion()) {
    const croc = crocEl(item.sign);
    croc.classList.add('chomp');
    slot.replaceChildren(croc);
    await ctx.t.pause(900);
  }
  slot.replaceChildren(h('span.mt-sign-char', { text: item.sign }));
  slot.classList.add('placed');
}

/** T6 mức 1: xếp số bằng thanh chục + khối lẻ. */
function buildMake(ctx, item) {
  const { stage } = ctx;
  const board = makeBoard();
  stage.replaceChildren(h('div.mt-target', { text: String(item.make) }), board.el);
  return { board, question: QUESTIONS.makeNumber(item.make), speak: () => ctx.t.say(`Make ${numberWord(item.make)}!`) };
}

/** Một mục có chấm → { result, line } (line = câu so sánh đang hiện, để phần đọc dùng tiếp). */
async function runItem(ctx, item) {
  const view = buildView(ctx, item);
  if (view.board) return runMake(ctx, item, view);
  if (view.order) return runOrder(ctx, item, view);
  const result = await chooseLoop(ctx, view);
  await view.afterCorrect?.();
  return { result, line: await praiseAndRead(ctx, item, result) };
}

async function runMake(ctx, item, { board, question, speak }) {
  const { app, t, round } = ctx;
  const n = item.make;
  const showAnswer = () => {
    board.set(n);
    board.lock(true);
    board.done.classList.add('hint');
  };
  await t.ask(question, { speak });
  if (round.wrong >= 2) showAnswer();
  for (;;) {
    await waitPick(ctx, [board.done]);
    if (board.tens === tensOf(n) && board.ones === onesOf(n)) {
      play('ding');
      board.done.classList.remove('hint');
      board.lock(true);
      t.celebrate(board.el);
      t.endQuestion();
      const result = round.wrong === 0 ? RESULT.INDEPENDENT : round.wrong === 1 ? RESULT.HELPED : RESULT.MISSED;
      return { result, line: await praiseAndRead(ctx, item, result) };
    }
    round.wrong++;
    play('boing');
    shake(board.el);
    const made = board.tens * 10 + board.ones;
    if (round.wrong === 1) {
      await t.say(`You made ${numberWord(made)}.`);
      await t.say(sentenceOf('t6', item).en);
      await speak();
    } else {
      if (needsVietnameseHelp(app.settings, round.wrong)) await t.explainVi(explainVi('t6', item));
      showAnswer();
      await t.say(sentenceOf('t6', item).en);
    }
  }
}

/** Hiện mục ở trạng thái đã giải (quay lại từ nền đúng lúc đọc câu). */
function showSolved(ctx, item) {
  const view = buildView(ctx, item);
  if (view.board) {
    view.board.set(item.make);
    view.board.lock(true);
  } else if (view.order) {
    view.solve();
  } else {
    view.correct.classList.add('right');
    if (ctx.lesson.key === 't3') view.place(item.sign);
    else if (ctx.lesson.key !== 't2') view.afterCorrect(); // hiện cột khối / que chục
  }
  const line = sentenceLine(sentenceOf(ctx.lesson.key, item), showVi(ctx.app));
  ctx.stage.append(line.el);
  return line;
}

// ---------- Bé đọc câu (3.3): luyện, không tính sao ----------

async function runRead(ctx, item, line) {
  const { app, stage, signal, lesson, layout } = ctx;
  const sub = linked(signal);
  const rt = new Teacher(app, { signal: sub.signal, stage, replayBtn: layout.replayBtn });
  const skip = h('button.big-btn.mt-skip', { type: 'button', 'aria-label': 'Bỏ qua phần đọc', text: '⏭' });
  skip.addEventListener('click', () => {
    play('tap');
    app.speaker.cancel();
    sub.abort();
  });
  app.root.append(skip);
  const s = sentenceOf(lesson.key, item);
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
async function ollyTap(t, el) {
  el.classList.add('olly-tap');
  play('ding');
  el.classList.add('right');
  t.celebrate(el);
  await t.pause(500);
}

async function demoCompare(dctx, item, pic, { before = null } = {}) {
  const { t } = dctx;
  const view = buildCompare(dctx, item, pic);
  await t.ask(view.question, { speak: view.speak });
  await t.pause(400);
  if (before) await before();
  await view.demoCheck();
  await ollyTap(t, view.correct);
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}

async function demoGroups(dctx, item) {
  const { t } = dctx;
  const view = buildGroups(dctx, item);
  await t.ask(view.question, { speak: view.speak });
  // Olly đếm từng con (chạm thật vào đồ để sáng + đếm).
  for (const side of ['left', 'right']) {
    for (const el of view.groups[side].things) {
      el.click();
      await t.pause(450);
    }
    await t.pause(300);
  }
  await view.demoCheck();
  await ollyTap(t, view.correct);
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}

async function demoSign(dctx, item) {
  const { t } = dctx;
  const view = buildSign(dctx, item);
  await t.ask(view.question, { speak: view.speak });
  if (item.croc && item.sign !== '=') await t.say('The crocodile is hungry. It always eats the bigger number!');
  await ollyTap(t, view.correct);
  await view.afterCorrect();
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}

/** T3 bước 1: nối với T1 — "bigger" → "greater than", hiện "7 is bigger than 4" → "7 > 4". */
async function demoBiggerToGreater(dctx) {
  const { t, stage } = dctx;
  const text = h('p.mt-bridge', { text: '7 is bigger than 4' });
  stage.replaceChildren(text);
  await t.say('Seven is bigger than four.');
  await t.say('In math, we say: seven is greater than four. And we write it like this!');
  text.textContent = '7 > 4';
  text.classList.add('placed');
  await t.say('Seven is greater than four.');
  await t.pause(800);
}

async function demoMake(dctx, n) {
  const { t, stage } = dctx;
  // Mười khối gộp thành một thanh (4.6 mức 1).
  const ones = Array.from({ length: 10 }, () => h('span.mt-one'));
  const row = h('div.mt-ones.row', {}, ...ones);
  stage.replaceChildren(row);
  for (let i = 0; i < 10; i++) {
    ones[i].classList.add('counted');
    await t.say(numberWord(i + 1));
  }
  row.replaceWith(h('div.mt-rods', {}, rodEl()));
  await t.say('Ten ones make one ten!');
  await t.pause(600);
  const view = buildMake(dctx, { make: n });
  view.board.lock(true); // Olly xếp, bé xem
  await t.ask(view.question, { speak: view.speak });
  for (let i = 1; i <= tensOf(n); i++) {
    view.board.addTen();
    await t.say(numberWord(i * 10));
  }
  for (let i = 1; i <= onesOf(n); i++) {
    view.board.addOne();
    await t.say(numberWord(tensOf(n) * 10 + i));
  }
  view.board.lock(true);
  await ollyTap(t, view.board.done);
  t.endQuestion();
  await praiseAndRead(dctx, { make: n }, null);
  await t.pause(900);
}

/** T4: Olly chạm lần lượt first / next / next / last. */
async function demoOrder(dctx, item) {
  const { t } = dctx;
  const view = buildOrder(dctx, item);
  await t.ask(view.question, { speak: view.speak });
  for (const [i, n] of view.target.entries()) {
    const card = view.cardOf(n);
    card.classList.add('olly-tap');
    play('pop');
    view.order.place(card, i);
    await t.say(`${cap(SLOT_LABELS[i])}, ${numberWord(n)}.`);
  }
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}

/** Một mục T5 cho phần làm mẫu: tia số quanh đáp án, không vượt phạm vi mức. */
function t5Demo(ask, n, level) {
  const max = level === 1 ? 10 : 20;
  const len = lineLen();
  const answer = n + (ask === 'before' || ask === 'less' ? -1 : 1);
  const start = Math.max(0, Math.min(max - len + 1, answer - Math.floor(len / 2)));
  return { ask, n, m: ask === 'between' ? n + 2 : null, answer, line: [start, start + len - 1] };
}

async function demoLine(dctx, item) {
  const { t } = dctx;
  const view = buildLine(dctx, item);
  await t.ask(view.question, { speak: view.speak });
  if (item.ask === 'more') await t.say('One more means one jump forward.');
  if (item.ask === 'less') await t.say('One less means one jump back.');
  await t.pause(300);
  await view.onPick(view.correct);
  await ollyTap(t, view.correct);
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}

async function demoPuzzle(dctx, item) {
  const { t } = dctx;
  const view = buildPuzzle(dctx, item);
  await t.ask(view.question, { speak: view.speak });
  await view.demoCheck();
  await ollyTap(t, view.correct);
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}

/** Các lượt làm mẫu theo bài (3.1, mục 4); `short` (đã có sao): 1 lượt. */
async function demoSteps(dctx, { short }) {
  const { lesson, round } = dctx;
  const steps = [];
  if (lesson.key === 't1') {
    steps.push(() => demoCompare(dctx, { a: 7, b: 4, ask: 'bigger', side: 'left' }, 'blocks'));
    steps.push(() => demoCompare(dctx, { a: 8, b: 5, ask: 'smaller', side: 'right' }, 'blocks'));
  } else if (lesson.key === 't2') {
    steps.push(() => demoGroups(dctx, { left: { thing: 'mouse', n: 5 }, right: { thing: 'elephant', n: 3 }, ask: 'more', answer: 'left' }));
    steps.push(() => demoGroups(dctx, { left: { thing: 'bear', n: 2 }, right: { thing: 'ant', n: 6 }, ask: 'fewer', answer: 'left' }));
  } else if (lesson.key === 't3') {
    const croc = round.level < 3;
    if (!short) steps.push(() => demoBiggerToGreater(dctx));
    steps.push(() => demoSign(dctx, { a: 7, b: 4, sign: '>', croc }));
    if (!short) steps.push(() => demoSign(dctx, { a: 4, b: 7, sign: '<', croc }));
    if (round.level >= 2 && round.firstAtLevel) steps.push(() => demoSign(dctx, { a: 7, b: 7, sign: '=', croc }));
  } else if (lesson.key === 't4') {
    // Mức 3 xếp lớn → nhỏ: lượt mẫu riêng "Put the biggest number first." (4.4).
    if (round.level === 3) steps.push(() => demoOrder(dctx, { numbers: [5, 9, 3, 7], order: 'desc' }));
    else steps.push(() => demoOrder(dctx, { numbers: [7, 3, 9, 5], order: 'asc' }));
  } else if (lesson.key === 't5') {
    const L = round.level;
    // Kiểu mới của mức đứng trước để bản rút gọn vẫn có.
    const plan = L === 1 ? [['after', 7], ['before', 4]] : L === 2 ? [['between', 12], ['after', 15]] : [['more', 9], ['less', 12]];
    for (const [ask, n] of plan) steps.push(() => demoLine(dctx, t5Demo(ask, n, L)));
  } else if (lesson.key === 't7') {
    steps.push(() => demoPuzzle(dctx, t7Item(T7_BY_ID.get('p1'), 'more')));
    steps.push(() => demoPuzzle(dctx, t7Item(T7_BY_ID.get('p2'), 'fewer')));
  } else if (round.level === 1) {
    steps.push(() => demoMake(dctx, 34));
  } else {
    // Luôn có một ví dụ cùng chục để bé thấy vì sao phải so đơn vị (4.6).
    steps.push(() => demoCompare(dctx, { a: 34, b: 37, ask: 'bigger', side: 'right' }, 'tens'));
    if (!short) steps.unshift(() => demoCompare(dctx, { a: 52, b: 34, ask: 'bigger', side: 'left' }, 'tens'));
  }
  // Chơi lại bài đã có sao: rút còn 1 lượt (bước "=" lần đầu chơi mức 2 vẫn giữ).
  const run = short && lesson.key !== 't3' ? steps.slice(0, 1) : steps;
  for (const step of run) await step();
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
    await demoSteps(dctx, { short });
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
  const { app, t, layout, lesson, round } = ctx;
  const stars = starsFor(round.results);
  const now = Date.now();
  await recordLessonDone(app.db, lesson.id, stars, now, `L${round.level}`);
  await recordLessonDone(app.db, lesson.id, stars, now);
  const unlocked = unlockedLevel(bestOf(await levelProgress(app.db, lesson.id)), app.settings.mathAllLevels);
  if (app.current?.name === 'math-lesson') delete app.current.params.round;
  layout.setProgress(1);
  play('tada');
  const opened = unlocked > unlockedBefore;
  const leave = () => app.go(app.timeUp ? 'sleep' : 'math');
  layout.stage.replaceChildren(h('div.done-panel', {},
    h('p.done-title', { text: 'Great job!' }),
    h('p.done-stars', { 'aria-label': `${stars} sao`, text: starText(stars) }),
    h('p.mt-level-chip', { text: `Mức ${round.level}` }),
    opened ? h('p.mt-unlock', { text: `🔓 Đã mở Mức ${unlocked}!` }) : null,
    h('div.done-actions', {},
      h('button.big-btn', { type: 'button', 'aria-label': 'Học lại', text: '🔁', onclick: () => app.go('math-lesson', { lessonId: lesson.id }) }),
      h('button.big-btn.primary', { type: 'button', 'aria-label': 'Bài khác', text: '🔢', onclick: leave }))));
  t.celebrate();
  await t.say(stars === 3 ? 'Wow! Three stars! Great job!' : 'Great job! You did it!').catch(() => {});
  if (opened) await t.say(`Level ${numberWord(unlocked)} is open!`).catch(() => {});
}
