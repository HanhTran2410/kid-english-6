// Khu 🧩 Quest / Thử thách (SPEC-quest.md): Quest 1 Read and Do (cầm đồ → ô đích hình mờ → chấm 3 trường thing /
// place / where, câu hai việc giữ việc đúng), Quest 2 Build a Sentence (thẻ từ, chấm theo chuỗi chữ, giữ thẻ đúng chỗ),
// Quest 3 Guess the Word (2 câu gợi ý → chạm hình / từ; sai 1 → âm đầu phát từ file; lựa chọn giữ nguyên chỗ).
// Khung lượt chơi (chọn mức, làm mẫu, 8 mục, đọc câu, sao, ra nền quay lại) ở screens/round.js. Nội dung chỉ từ bài Read
// bé đã đọc xong (quest/content.js).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { playPhoneme } from '../speech/phoneme.js';
import { QUESTIONS } from '../captions.js';
import { needsVietnameseHelp } from '../settings.js';
import { RESULT, getLessonProgress } from '../progress.js';
import { BUILTIN_LESSONS } from '../data/builtin-lessons.js';
import { libraryImages, wordKey } from '../picture-library.js';
import { mediaBlob } from '../db.js';
import { seeded } from '../math/math.js';
import { sentenceLine } from '../math/views.js';
import { roundListScreen, roundLessonScreen, showVi, shake, waitPick, ollyTap, chooseLoop } from './round.js';
import { learnedPhonics, questPool } from '../quest/content.js';
import {
  BUILTIN_QUESTS, QUEST_BY_ID, makeQ1, makeQ2, makeQ3, judgeQ1, q1WrongLine, q1HintWords, q2Wrong, q2Prefix,
  questKindsAt, questSentence, questRef, questExplainVi, firstSoundOf,
} from '../quest/quest.js';
import { makeQ4, entryCells } from '../quest/crossword.js';

const LEVEL_VI = {
  q1: ['Olly đọc câu', 'Bé tự đọc', 'Thêm under, hai việc'],
  q2: ['Câu ngắn, Olly đọc', 'Bé tự đọc', 'Tự xếp cả câu'],
  q3: ['Chọn hình', 'Đọc 3 từ', '4 từ, có từ giống chữ'],
  q4: ['Từ 3 chữ, Olly đánh vần', 'Olly đọc từ, 1 chữ thừa', 'Chỉ có hình, 2 chữ thừa'],
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

const MAKERS = { q1: makeQ1, q2: makeQ2, q3: makeQ3, q4: makeQ4 };
const RUNNERS = {
  q1: (ctx, item) => runQ1(ctx, item),
  q2: (ctx, item) => runQ2(ctx, item),
  q3: (ctx, item) => runQ3(ctx, item),
  q4: (ctx, item) => runQ4(ctx, item),
};

/** Hình + nghĩa của mục (lưu trong mục để quay lại từ nền vẫn có). */
function decorate(key, it, pool, lib) {
  if (key === 'q1') {
    it.pics = picsOf([...it.shelf, ...it.places], pool, lib);
    it.viOf = Object.fromEntries([...it.shelf, ...it.places].map((w) => [w, pool.byWord.get(w)?.vi ?? w]));
  } else if (key === 'q3') {
    it.pics = picsOf(it.options, pool, lib);
    it.viOf = pool.byWord.get(it.word)?.vi ?? it.word;
  } else if (key === 'q4') {
    // Mỗi mục mang đủ hình / nghĩa / âm của cả lưới (lần chơi bắt đầu ở mục đầu lưới, kể cả khi quay lại từ nền).
    const words = it.grid.entries.map((e) => e.word);
    it.pics = picsOf(words, pool, lib);
    it.viOf = Object.fromEntries(words.map((w) => [w, pool.byWord.get(w)?.vi ?? w]));
    it.soundsOf = Object.fromEntries(words.map((w) => [w, pool.byWord.get(w)?.sounds ?? []]));
  }
  return it;
}

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
    let items = MAKERS[lesson.key](level, Math.random, pool, lp);
    // Quest 4: hiếm khi 20 bộ từ đều không ghép được lưới ở mức cao → sinh lại (không bao giờ hiện lưới sai, 7.5).
    for (let k = 0; !items.length && lesson.key === 'q4' && k < 5; k++) items = makeQ4(level, Math.random, pool, lp);
    const lib = await libraryImages(app.db);
    return items.map((it) => decorate(lesson.key, it, pool, lib));
  },
  itemRef: questRef,
  sentenceOf: (lesson, item) => questSentence(lesson.key, item),
  runItem: (ctx, item) => RUNNERS[ctx.lesson.key](ctx, item),
  showSolved(ctx, item) {
    if (ctx.lesson.key === 'q1') return buildQ1(ctx, item, { solved: true }).line;
    return ctx.lesson.key === 'q3' ? solvedQ3(ctx, item) : solvedQ2(ctx, item);
  },
  // Quest 3: câu tổng kết bé chưa đọc được → không có phần bé đọc (Olly đã đọc khi khen). Quest 4 không có câu đọc (3).
  readable: (lesson, item) => (lesson.key === 'q3' ? item.sumReadable : lesson.key !== 'q4'),
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

// ---------- Quest 3 — Guess the Word (SPEC-quest 6) ----------

/**
 * Màn một mục Quest 3: 2 câu gợi ý + lựa chọn (giữ nguyên chỗ suốt mục). Mức 1: hình; mức 2–3: chữ, chữ đầu bọc riêng
 * để sáng như nhau sau lần sai 1. `withPics`: làm mẫu mức 2 — chữ kèm hình nhỏ.
 */
function buildQ3(ctx, item, { withPics = false } = {}) {
  const { stage, app } = ctx;
  const line = sentenceLine({ en: item.en.join(' '), vi: item.show === 1 ? item.vi.join(' ') : null }, showVi(app));
  line.el.classList.replace('mt-sentence', 'qt-clue');
  const options = item.options.map((w) => {
    const g = firstSoundOf(w).grapheme;
    const body = item.show === 1
      ? [picEl(item.pics?.[w])]
      : [h('span.qt-word', {}, h('span.qt-first', { text: g }), h('span', { text: w.slice(g.length) })),
        withPics ? h('span.qt-mini', {}, picEl(item.pics?.[w])) : null];
    return h(`button.qt-choice${item.show === 1 ? '.pic' : ''}`, { type: 'button', 'aria-label': w, dataset: { word: w } }, ...body);
  });
  stage.replaceChildren(line.el, h(`div.qt-choices.n${options.length}`, {}, ...options));
  return { line, options, correct: options[item.options.indexOf(item.word)] };
}

/** Câu tổng kết dưới lựa chọn (câu ở lại để bé đọc). */
function sumLine(ctx, item) {
  const line = sentenceLine({ en: item.sum, vi: item.sumVi }, showVi(ctx.app));
  line.el.classList.add('qt-sum');
  ctx.stage.append(line.el);
  return line;
}

function solvedQ3(ctx, item) {
  buildQ3(ctx, item).correct.classList.add('right');
  return sumLine(ctx, item);
}

async function runQ3(ctx, item) {
  const { t, stage, signal, round } = ctx;
  const view = buildQ3(ctx, item);
  const clues = item.en.join(' ');
  const speak = async () => {
    await t.say(QUESTIONS.whatIsIt());
    await t.karaoke(clues, view.line.words);
  };
  const firsts = () => stage.querySelectorAll('.qt-first').forEach((el) => el.classList.add('lit'));
  // Lựa chọn đã chạm sai mờ đi, vẫn ở chỗ cũ, không chạm lại được — giữ cả khi ra nền rồi quay lại (6.1).
  const tried = round.q3Tried ?? (round.q3Tried = []);
  for (const o of view.options) if (tried.includes(o.dataset.word)) o.classList.add('tried');
  if (round.wrong >= 1) firsts();
  const result = await chooseLoop(ctx, {
    options: view.options, correct: view.correct, question: clues, meaning: item.vi.join(' '), speak,
    explain: questExplainVi('q3', item, { byWord: new Map([[item.word, { vi: item.viOf }]]) }),
    onWrong(picked) {
      picked.classList.add('tried');
      tried.push(picked.dataset.word);
    },
    async onWrong1() {
      // Âm đầu: phát từ file âm rời, không đọc tên chữ; chữ đầu của MỌI lựa chọn sáng như nhau (6.1).
      firsts();
      await t.say(QUESTIONS.startsWith());
      await playPhoneme(item.first.sound, { stage, signal }).catch(() => {});
      await t.pause(400);
    },
  });
  round.q3Tried = null;
  const line = sumLine(ctx, item);
  await praise(ctx, line, questSentence('q3', item), result);
  return { result, line };
}

// ---------- Quest 4 — Mini Crossword (SPEC-quest 7) ----------

const ARROW = { across: '→', down: '↓' };
const cellKey = (c) => `${c.row},${c.col}`;

/**
 * Màn một lưới: ô chữ (mỗi ô một DỮ LIỆU dùng chung cho mọi từ đi qua — 7.2), hình gợi ý có số + mũi tên chiều, khay chữ.
 * `locked[i]`: từ i đã đúng → ô của nó xanh, có chữ, không ghi đè.
 */
function buildQ4(ctx, item, locked) {
  const { stage } = ctx;
  const { grid } = item;
  const board = h('div.cw-grid', { role: 'grid', 'aria-label': 'Ô chữ' });
  board.style.setProperty('--rows', String(grid.rows));
  board.style.setProperty('--cols', String(grid.cols));
  const cells = new Map();
  // Số như ô chữ thật: theo ô bắt đầu (trên → dưới, trái → phải); từ ngang và dọc chung ô đầu thì chung số (1→, 1↓).
  const starts = [...new Set(grid.entries.map(cellKey))]
    .sort((a, b) => a.split(',')[0] - b.split(',')[0] || a.split(',')[1] - b.split(',')[1]);
  const numOf = (e) => starts.indexOf(cellKey(e)) + 1;
  for (const c of grid.cells) {
    const num = starts.indexOf(cellKey(c)) + 1;
    const el = h('button.cw-cell', { type: 'button', 'aria-label': `Ô ${c.row + 1}-${c.col + 1}`, dataset: { key: cellKey(c), entries: c.entries.join(' ') } },
      num ? h('span.cw-num', { text: String(num) }) : null, h('span.cw-letter'));
    el.style.gridRow = String(c.row + 1);
    el.style.gridColumn = String(c.col + 1);
    cells.set(cellKey(c), { ...c, el, letterEl: el.querySelector('.cw-letter'), tile: null });
    board.append(el);
  }
  const clues = grid.entries.map((e, i) => h('button.cw-clue', { type: 'button', 'aria-label': `Từ ${numOf(e)} ${ARROW[e.dir]}`, dataset: { entry: String(i) } },
    h('span.cw-pic', {}, picEl(item.pics?.[e.word])), h('span.cw-tag', { text: `${numOf(e)}${ARROW[e.dir]}` })));
  const tray = h('div.cw-tray');
  const nudge = h('p.qt-nudge', { 'aria-live': 'polite' });
  const byNumber = [...clues].sort((a, b) => {
    const [ea, eb] = [grid.entries[a.dataset.entry], grid.entries[b.dataset.entry]];
    return numOf(ea) - numOf(eb) || (ea.dir === 'across' ? -1 : 1);
  });
  stage.replaceChildren(h('div.cw-wrap', {}, board, h('div.cw-side', {}, h('div.cw-clues', {}, ...byNumber), nudge, tray)));
  const view = {
    board, cells, clues, tray, nudge,
    cellsOf: (i) => entryCells(grid.entries[i]).map((c) => cells.get(cellKey(c))),
    isLocked: (cell) => cell.entries.some((j) => locked[j]),
    lock(i) {
      locked[i] = true;
      for (const cell of view.cellsOf(i)) {
        cell.tile?.remove();
        cell.tile = null;
        cell.letterEl.textContent = cell.letter;
        cell.el.classList.add('locked');
      }
      clues[i].classList.add('done');
    },
  };
  grid.entries.forEach((_, i) => locked[i] && view.lock(i));
  return view;
}

/** Olly nói từ theo mức (7.1): mức 1 đánh vần âm (file âm rời), mức 2 đọc từ, mức 3 không đọc (🔊 đọc được). */
async function sayCrossWord(ctx, item, word) {
  const { t, stage, signal, round } = ctx;
  const spell = async () => {
    await t.say(QUESTIONS.spellIt(word));
    if ((round?.level ?? 1) === 1) {
      for (const s of item.soundsOf?.[word] ?? []) await playPhoneme(s, { stage, signal }).catch(() => {});
    }
  };
  const meaning = item.viOf?.[word];
  if ((round?.level ?? 1) < 3) {
    await t.ask(QUESTIONS.spellIt(word), { meaning, speak: spell });
  } else {
    await t.ask(QUESTIONS.spellPicture(), { speak: () => t.say(QUESTIONS.spellPicture()) });
    t.questionSpeak = spell;
  }
}

async function runQ4(ctx, item) {
  const { app, t, round } = ctx;
  const n = item.grid.entries.length;
  // Trạng thái lưới nằm trong lượt → ra nền rồi quay lại vẫn giữ từ đã khóa, lần sai (SPEC-quest 3, 7.3).
  if (round.q4?.gridIndex !== item.gridIndex) {
    round.q4 = { gridIndex: item.gridIndex, locked: Array(n).fill(false), wrong: Array(n).fill(0), results: Array(n).fill(null) };
  }
  const st = round.q4;
  const view = buildQ4(ctx, item, st.locked);
  let current = -1;
  const words = item.grid.entries.map((e) => e.word);
  const extrasOf = (i) => round.items.find((x) => x.gridIndex === item.gridIndex && x.entry === i)?.extras ?? [];
  /** Bỏ chữ chưa chấm (kể cả ở ô giao nhau) khi đổi từ — 7.2. */
  const clearPending = () => {
    for (const cell of view.cells.values()) {
      if (cell.tile && !view.isLocked(cell)) {
        cell.tile = null;
        cell.letterEl.textContent = '';
      }
    }
  };
  const select = async (i) => {
    clearPending();
    current = i;
    for (const cell of view.cells.values()) cell.el.classList.remove('active', 'across', 'down');
    for (const cell of view.cellsOf(i)) cell.el.classList.add('active', item.grid.entries[i].dir);
    view.clues.forEach((c, k) => c.classList.toggle('active', k === i));
    // Khay: chữ của các ô chưa khóa + chữ nhiễu theo mức (7.1, 7.3).
    const letters = view.cellsOf(i).filter((c) => !view.isLocked(c)).map((c) => c.letter);
    const tiles = shuffleEls([...letters, ...extrasOf(i)].map((ch, k) => h('button.cw-tile', { type: 'button', 'aria-label': ch, dataset: { letter: ch, tile: String(k) }, text: ch })));
    view.tray.replaceChildren(...tiles);
    view.nudge.textContent = '';
    play('tap');
    await sayCrossWord(ctx, item, words[i]);
  };
  /** Chốt từ i: khóa ô (kể cả ô giao nhau), ghi kết quả một lần, bỏ chọn. */
  const finish = async (i, result, line) => {
    view.lock(i);
    st.results[i] = result;
    t.endQuestion();
    for (const cell of view.cells.values()) cell.el.classList.remove('active', 'across', 'down', 'hint');
    view.clues[i].classList.remove('active');
    view.tray.replaceChildren();
    current = -1;
    await t.say(line);
  };
  await t.ask(QUESTIONS.tapPicture(), { speak: () => t.say(QUESTIONS.tapPicture()) });
  while (st.locked.some((x) => !x)) {
    const open = view.clues.filter((_, i) => !st.locked[i]);
    const openCells = [...view.cells.values()].filter((c) => !view.isLocked(c)).map((c) => c.el);
    const tiles = [...view.tray.querySelectorAll('.cw-tile:not([hidden])')];
    const picked = await waitPick(ctx, [...open, ...openCells, ...tiles]);
    if (picked.classList.contains('cw-clue')) {
      await select(Number(picked.dataset.entry));
      continue;
    }
    if (picked.classList.contains('cw-cell')) {
      const cell = view.cells.get(picked.dataset.key);
      const mine = current >= 0 && cell.entries.includes(current);
      if (mine && cell.tile) {
        // Chạm chữ đã đặt (chưa chấm) → về khay.
        play('tap');
        cell.tile.hidden = false;
        cell.tile = null;
        cell.letterEl.textContent = '';
      } else if (!mine) {
        const next = cell.entries.find((j) => !st.locked[j]);
        await select(next);
      }
      continue;
    }
    // Chữ trong khay → ô trống kế tiếp của từ đang chọn.
    const empty = view.cellsOf(current).find((c) => !view.isLocked(c) && !c.tile);
    if (!empty) continue;
    play('tap');
    empty.tile = picked;
    empty.letterEl.textContent = picked.dataset.letter;
    picked.hidden = true;
    if (view.cellsOf(current).some((c) => !view.isLocked(c) && !c.tile)) continue;
    // Đủ ô → chấm, chỉ phản hồi ở từ đang chọn (7.2).
    await t.pause(250);
    const i = current;
    const wrongCells = view.cellsOf(i).filter((c) => !view.isLocked(c) && c.tile.dataset.letter !== c.letter);
    if (!wrongCells.length) {
      play('ding');
      t.celebrate(view.clues[i]);
      await finish(i, st.wrong[i] === 0 ? RESULT.INDEPENDENT : RESULT.HELPED, `Yes! ${words[i]}!`);
      continue;
    }
    st.wrong[i]++;
    play('boing');
    for (const c of wrongCells) {
      c.tile.hidden = false;
      c.tile = null;
      c.letterEl.textContent = '';
      shake(c.el);
    }
    if (st.wrong[i] === 1) {
      await t.say('Try again!');
      if (round.level < 3) await sayCrossWord(ctx, item, words[i]);
      continue;
    }
    // Sai 2: tiếng Việt (nghĩa + số chữ) rồi Olly điền nốt, khóa → missed (7.3).
    if (needsVietnameseHelp(app.settings, 2)) {
      const byWord = new Map(Object.entries(item.viOf ?? {}).map(([w, vi]) => [w, { vi }]));
      await t.explainVi(questExplainVi('q4', { word: words[i] }, { byWord }));
    }
    for (const c of view.cellsOf(i)) {
      if (view.isLocked(c) || c.tile) continue;
      c.letterEl.textContent = c.letter;
      c.el.classList.add('hint');
      await t.pause(300);
    }
    await finish(i, RESULT.MISSED, words[i]);
  }
  t.celebrate(view.board);
  play('ding');
  const results = [...st.results];
  round.q4 = null;
  await t.pause(600);
  return { results, line: null };
}

async function demoQ4(dctx, item) {
  const { t } = dctx;
  const locked = item.grid.entries.map(() => false);
  const view = buildQ4(dctx, item, locked);
  // Olly chạm hình gợi ý của từ 1 rồi đặt từng chữ, từ đúng thì khóa.
  await ollyTap(t, view.clues[0]);
  view.clues[0].classList.remove('right');
  for (const cell of view.cellsOf(0)) cell.el.classList.add('active', item.grid.entries[0].dir);
  await sayCrossWord(dctx, item, item.grid.entries[0].word);
  for (const cell of view.cellsOf(0)) {
    cell.letterEl.textContent = cell.letter;
    play('tap');
    await t.pause(450);
  }
  view.lock(0);
  t.endQuestion();
  play('ding');
  await t.say(`Yes! ${item.grid.entries[0].word}!`);
  await t.pause(900);
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
  const it = lesson.key === 'q4'
    ? items[0] ?? round.items[0] // mục đầu của một lưới khác (lưới sinh ngẫu nhiên)
    : items.find((x) => !ids.has(x.id) && (lesson.key !== 'q1' || x.actions.length === 1)) ?? items[0];
  return decorate(lesson.key, it, pool, await libraryImages(app.db));
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

async function demoQ3(dctx, item) {
  const { t } = dctx;
  // Mức 2: chữ kèm hình nhỏ ở phần làm mẫu, khi bé chơi thì chỉ có chữ (6.2).
  const view = buildQ3(dctx, item, { withPics: item.show === 2 });
  const clues = item.en.join(' ');
  const speak = async () => {
    await t.say(QUESTIONS.whatIsIt());
    await t.karaoke(clues, view.line.words);
  };
  await t.ask(clues, { meaning: item.vi.join(' '), speak });
  await ollyTap(t, view.correct);
  t.endQuestion();
  const line = sumLine(dctx, item);
  await praise(dctx, line, questSentence('q3', item), null);
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
  } else if (lesson.key === 'q3') {
    await demoQ3(dctx, await demoItem(dctx));
  } else if (lesson.key === 'q4') {
    await demoQ4(dctx, await demoItem(dctx));
  } else {
    await demoQ2(dctx, await demoItem(dctx));
  }
}
