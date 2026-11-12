// Khu 🧩 Quest / Thử thách (SPEC-quest.md): Quest 1 Read and Do (cầm đồ → ô đích hình mờ → chấm 3 trường thing /
// place / where, câu hai việc giữ việc đúng), Quest 2 Build a Sentence (thẻ từ, chấm theo chuỗi chữ, giữ thẻ đúng chỗ).
// Khung lượt chơi (chọn mức, làm mẫu, 8 mục, đọc câu, sao, ra nền quay lại) ở screens/round.js. Nội dung chỉ từ bài Read
// bé đã đọc xong (quest/content.js).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { QUESTIONS } from '../captions.js';
import { needsVietnameseHelp } from '../settings.js';
import { RESULT, getLessonProgress } from '../progress.js';
import { BUILTIN_LESSONS } from '../data/builtin-lessons.js';
import { libraryImages, wordKey } from '../picture-library.js';
import { mediaBlob } from '../db.js';
import { seeded } from '../math/math.js';
import { sentenceLine } from '../math/views.js';
import { roundListScreen, roundLessonScreen, showVi, shake, waitPick, ollyTap } from './round.js';
import { learnedPhonics, questPool } from '../quest/content.js';
import {
  BUILTIN_QUESTS, QUEST_BY_ID, makeQ1, makeQ2, judgeQ1, q1WrongLine, q1HintWords, q2Wrong, q2Prefix, questKindsAt,
  questSentence, questRef, questExplainVi,
} from '../quest/quest.js';

const LEVEL_VI = {
  q1: ['Olly đọc câu', 'Bé tự đọc', 'Thêm under, hai việc'],
  q2: ['Câu ngắn, Olly đọc', 'Bé tự đọc', 'Tự xếp cả câu'],
};
/** Vị trí đặt được của từng chỗ (SPEC-quest 4.4); under chỉ từ mức 3. */
const PLACE_WHERE = { box: ['in', 'on'], bag: ['in'], cup: ['in'], bed: ['on', 'under'] };
const EMPTY = { en: "Let's read more first!", vi: 'Bé đọc thêm bài ở khu Tập đọc rồi quay lại nhé!' };

// ---------- Nội dung bé đã học (SPEC-quest 2.2) ----------

/** Nhóm có bài Phonics đã đọc xong ở khu Read; chưa xong bài nào → nhóm 1. */
async function questContent(app) {
  const groups = [];
  for (const l of BUILTIN_LESSONS) {
    if (l.track !== 'phonics') continue;
    if ((await getLessonProgress(app.db, l.id)).completedAt) groups.push(l.group);
  }
  const lp = learnedPhonics(groups.length ? groups : [1]);
  return { lp, pool: questPool(BUILTIN_LESSONS, lp) };
}

const MAKERS = { q1: makeQ1, q2: makeQ2 };

/** Hình của từ: ảnh trong 🖼️ Kho ảnh nếu có, không thì emoji (lưu sẵn trong mục để quay lại từ nền vẫn có). */
function picsOf(words, pool, lib) {
  const out = {};
  for (const w of words) {
    const rec = lib.get(wordKey(w));
    out[w] = rec ? { url: URL.createObjectURL(mediaBlob(rec)) } : { emoji: pool.byWord.get(w)?.emoji ?? '❓' };
  }
  return out;
}
const picEl = (pic) => (pic?.url ? h('img', { src: pic.url, alt: '', draggable: false }) : h('span.emoji', { text: pic?.emoji ?? '❓' }));

/** Từ chức năng đã giới thiệu chưa (SPEC-quest 2.4): bản ghi "quest/word/<từ>". */
const wordSeen = async (db, w) => Boolean(await db.get('progress', `quest/word/${w}`));
const markWord = (db, w) => db.put('progress', { key: `quest/word/${w}`, lessonId: 'quest-words', seenAt: Date.now() });

const QUEST_CONFIG = {
  zone: 'quest',
  route: 'quest-lesson',
  rootClass: 'quest',
  lessons: BUILTIN_QUESTS,
  byId: QUEST_BY_ID,
  allLevelsSetting: 'questAllLevels',
  emptyLine: EMPTY,
  levelVi: (lesson) => LEVEL_VI[lesson.key],
  kindsAt: (lesson, level) => questKindsAt(lesson.key, level),
  async available(app, lesson) {
    const { lp, pool } = await questContent(app);
    return MAKERS[lesson.key](1, seeded(1), pool, lp).length > 0;
  },
  async makeItems(app, lesson, level) {
    const { lp, pool } = await questContent(app);
    const items = MAKERS[lesson.key](level, Math.random, pool, lp);
    const lib = await libraryImages(app.db);
    // Hình của mọi từ trên màn mục (đồ, chỗ đặt, thẻ nhiễu) — lưu trong mục.
    for (const it of items) {
      if (lesson.key !== 'q1') continue;
      it.pics = picsOf([...it.shelf, ...it.places], pool, lib);
      it.viOf = Object.fromEntries([...it.shelf, ...it.places].map((w) => [w, pool.byWord.get(w)?.vi ?? w]));
    }
    return items;
  },
  itemRef: questRef,
  sentenceOf: (lesson, item) => questSentence(lesson.key, item),
  runItem: (ctx, item) => (ctx.lesson.key === 'q1' ? runQ1(ctx, item) : runQ2(ctx, item)),
  showSolved: (ctx, item) => (ctx.lesson.key === 'q1' ? buildQ1(ctx, item, { solved: true }).line : solvedQ2(ctx, item)),
  demoSteps: (dctx, opts) => demoSteps(dctx, opts),
  // 🔊 không tính là trợ giúp; đếm số lần bấm để bố mẹ xem (SPEC-quest 10.2).
  onStart(ctx) {
    ctx.layout.replayBtn.addEventListener('click', () => {
      const key = `quest/listen/${ctx.lesson.key}`;
      ctx.app.db.get('progress', key)
        .then((p) => ctx.app.db.put('progress', { key, lessonId: 'quest-listen', count: (p?.count ?? 0) + 1 }))
        .catch(() => {});
    });
  },
};

export const questScreen = (app) => roundListScreen(app, QUEST_CONFIG);
export const questLessonScreen = (app, params = {}) => roundLessonScreen(app, params, QUEST_CONFIG);

/** Olly khen theo kết quả rồi đọc câu trên màn (karaoke) — câu ở lại. */
async function praise(ctx, line, sentence, result) {
  const { t, app } = ctx;
  if (result === RESULT.INDEPENDENT) await t.say('Yes! Well done!');
  else if (result === RESULT.HELPED) await t.say('Yes! Good job!');
  await t.karaoke(sentence.en, line.words);
  if (app.settings.readVietnamese && sentence.vi) await t.sayVi(sentence.vi);
}

// ---------- Quest 1 — Read and Do (SPEC-quest 4) ----------

/** Dựng màn một mục Quest 1. `solved`: đặt sẵn mọi đồ đúng chỗ (quay lại từ nền đúng lúc đọc câu / làm mẫu xong). */
function buildQ1(ctx, item, { solved = false, done = null } = {}) {
  const { stage, round, app } = ctx;
  const level = round?.level ?? 1;
  const line = sentenceLine({ en: item.text, vi: level === 1 ? item.vi : null }, showVi(app));
  line.el.classList.replace('mt-sentence', 'qt-instruction');
  const nudge = h('p.qt-nudge', { 'aria-live': 'polite' });
  const targets = [];
  const places = item.places.map((place) => {
    const box = h('div.qt-place', { dataset: { place } });
    const wheres = PLACE_WHERE[place].filter((w) => w !== 'under' || level === 3);
    for (const where of wheres) {
      const tg = h(`button.qt-target.where-${where}`, { type: 'button', 'aria-label': `${where} the ${place}`, dataset: { place, where }, hidden: true });
      targets.push(tg);
      box.append(tg);
    }
    box.prepend(h('span.qt-place-pic', {}, picEl(item.pics?.[place])));
    return box;
  });
  const things = item.shelf.map((thing) => h('button.qt-thing', { type: 'button', 'aria-label': thing, dataset: { thing } }, picEl(item.pics?.[thing])));
  const shelf = h('div.qt-shelf', {}, ...things);
  stage.replaceChildren(line.el, nudge, h('div.qt-places', {}, ...places), shelf);
  const view = {
    line, nudge, targets, things, places,
    thingEl: (thing) => things.find((x) => x.dataset.thing === thing),
    targetEl: (place, where) => targets.find((x) => x.dataset.place === place && x.dataset.where === where),
    placeEl: (place) => places.find((x) => x.dataset.place === place),
    /** Đồ vào đúng vị trí trong / trên / dưới chỗ đặt (giữ lại). */
    put(thing, place, where) {
      const el = view.thingEl(thing);
      el.classList.remove('holding', 'hint');
      el.classList.add('placed', `at-${where}`);
      el.disabled = true;
      view.placeEl(place).append(el);
    },
    showTargets(thing) {
      for (const tg of targets) {
        tg.hidden = !thing;
        tg.replaceChildren(...(thing ? [picEl(item.pics?.[thing])] : []));
      }
    },
  };
  const finished = solved ? item.actions.map(() => true) : done;
  item.actions.forEach((a, i) => finished?.[i] && view.put(a.thing, a.place, a.where));
  return view;
}

async function runQ1(ctx, item) {
  const { app, t, round } = ctx;
  // Trạng thái từng việc nằm trong lượt → ra nền rồi quay lại vẫn giữ việc đúng, lần sai (SPEC-quest 4.2).
  const st = round.q1 ?? (round.q1 = { done: item.actions.map(() => false), wrong: item.actions.map(() => 0), vi: [], hint: null });
  const view = buildQ1(ctx, item, { done: st.done });
  const readIt = () => t.karaoke(item.text, view.line.words);
  if (round.level === 1) await t.ask(item.text, { speak: readIt });
  else {
    // Mức 2–3 bé tự đọc; 🔊 đọc câu hộ (không tính trợ giúp).
    await t.say(QUESTIONS.readAndDo());
    await t.ask(item.text, { speak: async () => {} });
    t.questionSpeak = readIt;
  }
  let holding = null;
  let nudged = false;
  const hold = (el) => {
    holding?.classList.remove('holding');
    holding = el;
    el?.classList.add('holding');
    view.showTargets(el?.dataset.thing ?? null);
    view.nudge.textContent = el ? 'Now tap a place.' : '';
    const h2 = st.hint != null ? item.actions[st.hint] : null;
    if (el && h2 && el.dataset.thing === h2.thing) view.targetEl(h2.place, h2.where)?.classList.add('hint');
  };
  while (st.done.some((d) => !d)) {
    const free = view.things.filter((x) => !x.classList.contains('placed'));
    const picked = await waitPick(ctx, holding ? [...free, ...view.targets.filter((x) => !x.hidden)] : [...free, ...view.places]);
    if (picked.classList.contains('qt-thing')) {
      play('tap');
      hold(holding === picked ? null : picked);
      continue;
    }
    if (picked.classList.contains('qt-place')) {
      // Chạm chỗ đặt khi chưa cầm đồ: không tính sai, nhắc tối đa một lần (4.2).
      if (!nudged) {
        nudged = true;
        await t.say('Tap a thing first.');
      }
      continue;
    }
    const pick = { thing: holding.dataset.thing, place: picked.dataset.place, where: picked.dataset.where };
    const el = holding;
    hold(null);
    const j = judgeQ1(item.actions, st.done, pick);
    if (!j.error) {
      play('pop');
      st.done[j.index] = true;
      if (st.hint === j.index) st.hint = null;
      view.put(pick.thing, pick.place, pick.where);
      continue;
    }
    // Sai: đồ bay tới rồi về kệ; chỉ việc đó đếm sai.
    const a = item.actions[j.index];
    st.wrong[j.index]++;
    play('boing');
    view.placeEl(pick.place).append(el);
    el.classList.add(`at-${pick.where}`);
    await t.pause(500);
    el.classList.remove(`at-${pick.where}`);
    // Về đúng chỗ cũ trên kệ (trước đồ kế tiếp còn ở kệ).
    const shelfEl = ctx.stage.querySelector('.qt-shelf');
    const after = view.things.slice(view.things.indexOf(el) + 1).find((x) => x.parentElement === shelfEl);
    shelfEl.insertBefore(el, after ?? null);
    shake(el);
    for (const w of view.line.words) w.classList.toggle('qt-hint-word', q1HintWords(a, j.error).includes(w.dataset.word));
    if (st.wrong[j.index] === 1) {
      await t.say(q1WrongLine(a, pick, j.error));
    } else {
      if (!st.vi[j.index] && needsVietnameseHelp(app.settings, 2)) {
        st.vi[j.index] = true;
        const byWord = new Map(Object.entries(item.viOf ?? {}).map(([w, vi]) => [w, { vi }]));
        await t.explainVi(questExplainVi('q1', item, { action: a, error: j.error, byWord }));
      }
      st.hint = j.index;
      view.thingEl(a.thing).classList.add('hint');
      await t.say(q1WrongLine(a, pick, j.error));
    }
  }
  for (const w of view.line.words) w.classList.remove('qt-hint-word');
  view.nudge.textContent = '';
  t.endQuestion();
  t.celebrate(ctx.stage.querySelector('.qt-places'));
  play('ding');
  const result = st.wrong.every((n) => n === 0) ? RESULT.INDEPENDENT : st.wrong.some((n) => n >= 2) ? RESULT.MISSED : RESULT.HELPED;
  round.q1 = null;
  await praise(ctx, view.line, questSentence('q1', item), result);
  return { result, line: view.line };
}

// ---------- Quest 2 — Build a Sentence (SPEC-quest 5) ----------

function buildQ2(ctx, item) {
  const { stage } = ctx;
  const slots = item.words.map((_, i) => h('div.qt-slot', { dataset: { index: String(i) } }));
  const tokens = [...item.words, ...(item.extra ? [item.extra] : [])].map((w, i) => h('button.qt-token', {
    type: 'button', 'aria-label': w, dataset: { word: w, token: `${w.toLowerCase()}-${i}` }, text: w,
  }));
  const tray = h('div.qt-tray', {}, ...shuffleEls(tokens));
  const row = h('div.qt-row', {}, ...slots, h('span.qt-dot', { text: '.' }));
  stage.replaceChildren(item.emoji ? h('div.spell-pic', { 'aria-hidden': 'true', text: item.emoji }) : null, row, tray);
  return { slots, tokens, tray, row };
}

/** Xáo thẻ nhưng không để đúng thứ tự câu (bé phải xếp). */
function shuffleEls(els) {
  for (let k = 0; k < 20; k++) {
    const a = [...els].sort(() => Math.random() - 0.5);
    if (a.some((x, i) => x !== els[i])) return a;
  }
  return [...els].reverse();
}

/** Thay hàng thẻ bằng câu (karaoke) sau khi xong. */
function sentenceOfRow(ctx, item, view) {
  const line = sentenceLine({ en: item.en, vi: item.vi }, showVi(ctx.app));
  line.el.classList.add('qt-built');
  view.row.replaceWith(line.el);
  view.tray.remove();
  return line;
}

function solvedQ2(ctx, item) {
  const view = buildQ2(ctx, item);
  return sentenceOfRow(ctx, item, view);
}

async function runQ2(ctx, item) {
  const { app, t, round } = ctx;
  const view = buildQ2(ctx, item);
  const { slots, tokens, tray } = view;
  const locked = new Set();
  const place = (tok, i) => {
    slots[i].append(tok);
    tok.classList.add('placed');
  };
  // Mức 1–2: thẻ đầu câu đặt sẵn, khóa.
  for (let i = 0; i < item.given; i++) {
    const tok = tokens.find((x) => x.dataset.word === item.words[i] && !x.classList.contains('placed'));
    place(tok, i);
    locked.add(tok);
    tok.classList.add('locked');
  }
  const sayIt = () => t.say(item.en);
  if (round.level === 1) {
    await t.ask(QUESTIONS.makeSentence(), { speak: async () => { await t.say(QUESTIONS.makeSentence()); await sayIt(); } });
  } else {
    await t.ask(QUESTIONS.makeSentence());
    t.questionSpeak = async () => { await t.say(QUESTIONS.makeSentence()); await sayIt(); };
  }
  let result = null;
  while (!result) {
    while (slots.some((s) => !s.firstChild)) {
      const movable = tokens.filter((x) => !locked.has(x));
      const tok = await waitPick(ctx, movable);
      play('tap');
      if (tok.parentElement === tray) place(tok, slots.findIndex((s) => !s.firstChild));
      else {
        tok.classList.remove('placed');
        tray.append(tok);
      }
    }
    await t.pause(300);
    const placed = slots.map((s) => s.firstChild.dataset.word);
    const wrong = q2Wrong(placed, item.words);
    if (!wrong.length) {
      play('ding');
      result = round.wrong === 0 ? RESULT.INDEPENDENT : round.wrong === 1 ? RESULT.HELPED : RESULT.MISSED;
      break;
    }
    round.wrong++;
    play('boing');
    // Thẻ đúng chữ đúng chỗ: giữ + khóa; thẻ sai về khay (5.1).
    slots.forEach((s, i) => {
      const tok = s.firstChild;
      if (wrong.includes(i)) {
        tok.classList.remove('placed');
        tray.append(tok);
        shake(tok);
      } else {
        locked.add(tok);
        tok.classList.add('locked');
      }
    });
    if (round.wrong === 1) {
      const prefix = q2Prefix(slots.map((s) => s.firstChild?.dataset.word), item.words);
      await t.say(prefix.length ? `${prefix.join(' ')}…?` : 'Which word is first?');
    } else {
      if (needsVietnameseHelp(app.settings, round.wrong)) await t.explainVi(questExplainVi('q2', item));
      // Olly xếp nốt (5.3): bé không phải xếp lại cả câu.
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].firstChild) continue;
        const tok = tokens.find((x) => x.parentElement === tray && x.dataset.word === item.words[i]);
        place(tok, i);
        tok.classList.add('hint');
        await t.pause(350);
      }
      result = RESULT.MISSED;
    }
  }
  t.endQuestion();
  t.celebrate(view.row);
  const line = sentenceOfRow(ctx, item, view);
  await praise(ctx, line, questSentence('q2', item), result);
  return { result, line };
}

// ---------- Olly làm mẫu (3) + giới thiệu từ chức năng (2.4) ----------

/** Thẻ chữ to + câu giới thiệu từ Quest (put / under); ghi "đã giới thiệu". */
async function introduceWord(dctx, word) {
  const { t, stage, app } = dctx;
  const lines = {
    put: { en: 'This word is put. Put means: move it there.', vi: 'put = đặt (để vào chỗ nào đó)' },
    under: { en: 'This word is under. Under means: below it.', vi: 'under = ở dưới' },
  }[word];
  stage.replaceChildren(h('div.qt-intro', {}, h('p.word-card', { text: word }), h('p.sentence-vi', { text: lines.vi })));
  await t.say(lines.en);
  await t.pause(600);
  await markWord(app.db, word);
}

/** Mục làm mẫu: lấy từ một lượt sinh khác, ưu tiên mục không có trong lượt của bé. */
async function demoItem(dctx) {
  const { app, lesson, round } = dctx;
  const { lp, pool } = await questContent(app);
  const ids = new Set(round.items.map((x) => x.id));
  const items = MAKERS[lesson.key](round.level, seeded(round.items.length + round.level), pool, lp);
  const it = items.find((x) => !ids.has(x.id) && (lesson.key !== 'q1' || x.actions.length === 1)) ?? items[0];
  if (lesson.key === 'q1') it.pics = picsOf([...it.shelf, ...it.places], pool, await libraryImages(app.db));
  return it;
}

async function demoQ1(dctx, item) {
  const { t } = dctx;
  const view = buildQ1(dctx, item);
  await t.ask(item.text, { speak: () => t.karaoke(item.text, view.line.words) });
  for (const a of item.actions) {
    const el = view.thingEl(a.thing);
    el.classList.add('holding', 'olly-tap');
    view.showTargets(a.thing);
    await t.pause(700);
    const tg = view.targetEl(a.place, a.where);
    tg?.classList.add('olly-tap');
    await t.pause(500);
    play('pop');
    view.showTargets(null);
    view.put(a.thing, a.place, a.where);
  }
  t.endQuestion();
  await praise(dctx, view.line, questSentence('q1', item), null);
  await t.pause(900);
}

async function demoQ2(dctx, item) {
  const { t } = dctx;
  const view = buildQ2(dctx, item);
  await t.ask(QUESTIONS.makeSentence(), { speak: async () => { await t.say(QUESTIONS.makeSentence()); await t.say(item.en); } });
  const used = new Set();
  for (let i = 0; i < item.words.length; i++) {
    const tok = view.tokens.find((x) => !used.has(x) && x.dataset.word === item.words[i]);
    used.add(tok);
    await ollyTap(t, tok);
    view.slots[i].append(tok);
    tok.classList.add('placed');
  }
  t.endQuestion();
  const line = sentenceOfRow(dctx, item, view);
  await praise(dctx, line, questSentence('q2', item), null);
  await t.pause(900);
}

/** Làm mẫu 1 lượt (Quest ngắn, bản rút gọn cũng 1 lượt — ⏭ vẫn có khi đã có sao). */
async function demoSteps(dctx) {
  const { lesson, round, app } = dctx;
  if (lesson.key === 'q1') {
    // Từ chức năng: giới thiệu trước khi chơi, chỉ lần đầu (2.4).
    if (!(await wordSeen(app.db, 'put'))) await introduceWord(dctx, 'put');
    if (round.level === 3 && !(await wordSeen(app.db, 'under'))) await introduceWord(dctx, 'under');
    await demoQ1(dctx, await demoItem(dctx));
  } else {
    await demoQ2(dctx, await demoItem(dctx));
  }
}
