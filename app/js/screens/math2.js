// 🔢 Toán phần 2 (SPEC-math2.md) — màn của T8 How many more (3.1), T9 Number bonds (3.2), T10 Add it up (3.3), T11 Take
// away (3.4), T12 Story sums (3.5): dựng mục cho vòng chọn chung (`chooseLoop` ở screens/round.js) và phần Olly làm mẫu.
// Khung lượt chơi, sao, mức: screens/round.js + math.js.

import { h } from '../ui.js';
import { displayWords } from '../karaoke.js';
import { RESULT, getItem, applyResult } from '../progress.js';
import { showVi, praiseAndRead, ollyTap, chooseLoop } from './round.js';
import { numberWord, cap, explainVi, T7_PEOPLE, T7_THINGS } from '../math/math.js';
import { moreText, bondText, bondSides, countLine, opText, opHintLine, SUM_THINGS } from '../math/sums.js';
import { STORY_BY_ID, storyAsk, storySumVi, storyResult } from '../math/stories.js';
import { sentenceLine } from '../math/views.js';
import { answerTray, tenFrame, twoRows, ladybug, equation } from '../math/views2.js';

/** Thẻ đã chạm sai của mục đang chơi: mờ tại chỗ, không chạm lại được; giữ khi ra nền rồi quay lại (2.2). */
function trackTried(ctx, tray) {
  const { round } = ctx;
  const tried = round.tried?.index === round.index ? round.tried.ns : [];
  for (const n of tried) tray.cardOf(n)?.classList.add('tried');
  return (picked) => {
    picked.classList.add('tried');
    const ns = round.tried?.index === round.index ? round.tried.ns : [];
    round.tried = { index: round.index, ns: [...ns, Number(picked.dataset.n)] };
  };
}

const sayCount = (t) => (n) => t.say(numberWord(n)).catch(() => {});

// ---------- T8 ----------

/** T8: câu đố (karaoke) + hai hàng đồ + khay. Mức 1 có sẵn dây nối và viền phần hơn. */
export function buildT8(ctx, item) {
  const { t, stage, signal, app } = ctx;
  const q = moreText(item);
  const text = puzzleLine(app, q);
  const [top, bottom] = (item.top === 'more' ? [item.more, item.less] : [item.less, item.more]).map((p) => ({ ...p, face: T7_PEOPLE[p.name].emoji }));
  const rows = twoRows(top, bottom, T7_THINGS[item.thing].emoji, item.layout, sayCount(t));
  const tray = answerTray(item.options);
  stage.replaceChildren(text.el, rows.el, tray.el);
  if (item.level === 1) {
    rows.drawLines(signal).catch(() => {});
    rows.outlineExtras();
  }
  // Ghép cặp: mức 3 hàng dưới về thẳng cột trước; phần hơn CHƯA sáng — bé tự đếm (MATH-03).
  const match = async () => {
    await rows.align(signal);
    if (!rows.hasLines) await rows.drawLines(signal);
  };
  return {
    options: tray.cards,
    correct: tray.cardOf(item.answer),
    question: q.en,
    meaning: q.vi,
    speak: () => t.karaoke(q.en, text.words),
    explain: explainVi('t8', item),
    onWrong: trackTried(ctx, tray),
    onWrong1: async () => {
      await t.say("Let's match them!");
      await match();
    },
    afterCorrect: async () => {
      await match();
      rows.lightExtras();
      await t.say(countLine(item.answer));
    },
    reveal: async () => {
      await match();
      rows.lightExtras();
    },
    rows,
  };
}

// ---------- T9 ----------

/** T9: bọ rùa + khung 10 ô (cùng một bộ chấm) + khay. Khung: mức 1 luôn hiện; mức 2 khi sai / sau khi đúng; mức 3 thêm 🔍. */
export function buildT9(ctx, item) {
  const { t, stage } = ctx;
  const q = bondText(item);
  const [l, r] = bondSides(item);
  const bug = ladybug(item.total, [l, r], item.hidden);
  // Chấm cánh trái lấp trước, rồi cánh phải — ô nét đứt là chấm bị cánh úp che, không phải ô trống.
  const kindOf = (side) => (side === item.hidden ? 'dashed' : 'blue');
  const frame = tenFrame([...Array(l).fill(kindOf('left')), ...Array(r).fill(kindOf('right'))], { onCount: sayCount(t) });
  const hiddenCells = frame.cells.filter((c) => c.dataset.kind === 'dashed');
  const knownCells = frame.cells.filter((c) => c.dataset.kind === 'blue');
  const box = h('div.mt-framebox', { hidden: item.level > 1 }, frame.el);
  const zoom = item.level === 3 ? h('button.mt-zoom', { type: 'button', 'aria-label': 'Xem khung 10 ô', text: '🔍' }) : null;
  const showFrame = () => {
    box.hidden = false;
    zoom?.remove();
  };
  zoom?.addEventListener('click', showFrame);
  const tray = answerTray(item.options);
  stage.replaceChildren(h('div.mt-bugrow', {}, bug.el, box, zoom), tray.el);
  const openWing = () => {
    showFrame();
    bug.open();
    for (const c of hiddenCells) {
      c.classList.remove('glow');
      frame.setKind(Number(c.dataset.i), 'orange');
    }
  };
  return {
    options: tray.cards,
    correct: tray.cardOf(item.answer),
    question: q.en,
    speak: () => t.say(q.en),
    explain: explainVi('t9', item),
    onWrong: trackTried(ctx, tray),
    onWrong1: async () => {
      showFrame();
      hiddenCells.forEach((c) => c.classList.add('glow'));
      await t.say('Count the hidden spots!');
    },
    afterCorrect: async () => openWing(),
    reveal: async () => openWing(),
    // Làm mẫu: đếm cả N chấm, rồi phần đã thấy, rồi đếm tiếp phần bị che (3.2).
    demoCheck: async () => {
      showFrame();
      await t.say('Count with me!');
      for (const [i, c] of [...knownCells, ...hiddenCells].sort((a, b) => a.dataset.i - b.dataset.i).entries()) {
        c.classList.add('counted');
        await t.say(numberWord(i + 1));
      }
      frame.clearCount();
      knownCells.forEach((c) => c.classList.add('lit'));
      if (item.known) await t.say(`${cap(numberWord(item.known))} ${item.known === 1 ? 'spot' : 'spots'} we can see.`);
      for (const [i, c] of hiddenCells.entries()) {
        c.classList.add('glow');
        await t.say(numberWord(item.known + i + 1));
      }
      knownCells.forEach((c) => c.classList.remove('lit'));
      openWing();
    },
  };
}

// ---------- T10 / T11 ----------

/**
 * Khung 10 ô (+ số 0, 🔍) + phép tính + khay của một phép cộng / trừ (T10, T11, bước 2 của T12). Cộng: nhóm đầu xanh rồi
 * nhóm thêm cam; trừ: đủ số bị trừ, b ô cuối bị gạch tại chỗ (2.1). `hidden`: khung chỉ hiện khi sai (/ 🔍 nếu `zoom`).
 */
function opBoard(ctx, item, { emoji = null, hidden = false, zoom: withZoom = false } = {}) {
  const { t } = ctx;
  const { op, a, b } = item;
  const add = op === '+';
  const frame = tenFrame(add ? [...Array(a).fill('blue'), ...Array(b).fill('orange')] : Array(a).fill('blue'), { onCount: sayCount(t), emoji });
  const filled = frame.cells.slice(0, add ? a + b : a);
  if (!add) for (let i = a - b; i < a; i++) frame.cross(i, true);
  const left = add ? [] : filled.slice(0, a - b);
  // Nhóm có 0 đồ: số 0 cạnh khung, màu của nhóm đó (không vẽ chấm giả).
  const zeroTag = add && (a === 0 || b === 0) ? h(`span.mt-zerotag.${a === 0 ? 'blue' : 'orange'}`, { text: '0' }) : null;
  const box = h('div.mt-framebox', { hidden }, frame.el, zeroTag);
  const zoom = withZoom ? h('button.mt-zoom', { type: 'button', 'aria-label': 'Xem khung 10 ô', text: '🔍' }) : null;
  const showFrame = () => {
    box.hidden = false;
    zoom?.remove();
  };
  zoom?.addEventListener('click', showFrame);
  const eq = equation(a, op, b, item.answer);
  const tray = answerTray(item.options);
  // Nhóm bắt đầu đếm tiếp: số ban đầu (mức 2) hoặc số lớn hơn (mức 3) — sáng cả ô lẫn số trên phép tính.
  const startA = item.hint === 'count-on-bigger' || item.hint === 'no-more' ? a >= b : true;
  const startCells = startA ? filled.slice(0, a) : filled.slice(a);
  const restCells = startA ? filled.slice(a) : filled.slice(0, a);
  const light = async (cells, say) => {
    for (const [i, c] of cells.entries()) {
      c.classList.add('counted');
      if (say) await t.say(numberWord(say(i)));
      else await t.pause(350);
    }
  };
  /** Gợi ý khi sai lần 1; `speak` (làm mẫu): Olly đọc từng số khi đếm tiếp / đếm phần còn lại. */
  const hint = async ({ speak = false } = {}) => {
    showFrame();
    frame.clearCount();
    if (!add) {
      await t.say(opHintLine(item));
      if (item.answer > 0 && b > 0) await light(left, speak ? (i) => i + 1 : null);
      return;
    }
    if (item.hint === 'count-all') {
      await t.say(opHintLine(item));
      await light(filled, (i) => i + 1);
      return;
    }
    startCells.forEach((c) => c.classList.add('lit'));
    (startA ? eq.a : eq.b).classList.add('lit');
    if (item.hint === 'no-more' || !speak) {
      // Khi bé sai: chỉ chỉ chỗ bắt đầu, ô còn lại sáng lần lượt nhưng Olly không đọc kết quả.
      await t.say(opHintLine(item));
      if (item.hint !== 'no-more') await light(restCells, null);
      return;
    }
    if (item.hint === 'count-on-bigger') await t.say(`Which number is bigger? ${cap(numberWord(item.start))}!`);
    await t.say(`Start at ${numberWord(item.start)}. Count on!`);
    await light(restCells, (i) => item.start + i + 1);
  };
  const solve = async () => {
    showFrame();
    eq.solve();
  };
  return { row: h('div.mt-oprow', {}, box, zoom), eq, tray, hint, solve };
}

/** Câu chuyện / câu đố (karaoke) ở đầu màn; câu đọc sau không xóa nó. */
function puzzleLine(app, q) {
  const text = sentenceLine(q, showVi(app));
  text.el.classList.replace('mt-sentence', 'mt-puzzle');
  text.el.classList.add('mt-sumq');
  return text;
}

/** T10 / T11: câu chuyện (mức 1–2, karaoke, đồ trong khung) hoặc chỉ câu hỏi (mức 3, chấm; khung khi sai / 🔍) + khung + phép tính + khay. */
export function buildOp(ctx, item) {
  const { t, stage, app } = ctx;
  const { a, b } = item;
  const q = opText(item);
  const level3 = item.level === 3;
  const { row, eq, tray, hint, solve } = opBoard(ctx, item, { emoji: item.story ? SUM_THINGS[item.thing].emoji : null, hidden: level3, zoom: level3 });
  const text = item.story ? puzzleLine(app, q) : null;
  stage.replaceChildren(...(text ? [text.el] : []), row, eq.el, tray.el);
  return {
    options: tray.cards,
    correct: tray.cardOf(item.answer),
    question: q.en,
    meaning: q.vi,
    speak: () => (text ? t.karaoke(q.en, text.words) : t.say(q.en)),
    explain: explainVi(item.key, item),
    onWrong: trackTried(ctx, tray),
    onWrong1: () => hint(),
    afterCorrect: solve,
    reveal: solve,
    demoCheck: async () => {
      await hint({ speak: true });
      // Làm mẫu mức 3: đổi chỗ hai số vẫn cùng kết quả (3.3).
      if (item.hint === 'count-on-bigger' && a < b) {
        eq.el.after(h('p.mt-bridge.placed', { text: `${a} + ${b} = ${b} + ${a}` }));
        await t.say('Same answer!');
      }
      await solve();
    },
  };
}

// ---------- T12 ----------

const OP_WORDS = { '+': 'add', '−': 'take away' };
const sentencesOf = (text) => text.split(/(?<=[.?!])\s+/);

/**
 * T12: câu đố (karaoke) → bước 1 chọn \`+ add\` / \`− take away\` → bước 2 phép tính \`4 + 3 = ?\` + khay (khung 10 ô có đồ: mức 1
 * hiện sẵn, mức 2–3 khi sai). Bước đang làm và lần sai bước 1 lưu ở \`round.story\` (ra nền rồi quay lại: đúng bước, MATH-17).
 */
export function buildStory(ctx, item) {
  const { t, stage, app } = ctx;
  const s = STORY_BY_ID.get(item.id);
  const emoji = T7_THINGS[s.thing].emoji;
  const text = puzzleLine(app, { en: s.text, vi: s.vi });
  /** Các chữ của một cụm trong câu đố (để sáng cụm \`hint\`, đọc lại câu hỏi). */
  const wordsOf = (part) => {
    const from = displayWords(s.text.slice(0, s.text.indexOf(part))).length;
    return text.words.slice(from, from + displayWords(part).length);
  };
  const hintWords = wordsOf(s.hint);
  const ask = sentencesOf(s.text).at(-1);
  const askWords = wordsOf(ask);
  const askVi = sentencesOf(s.vi).at(-1);
  const signs = ['+', '−'].map((op) => h('button.mt-opcard', { type: 'button', 'aria-label': OP_WORDS[op], dataset: { op } },
    h('span.mt-opsign', { text: op }), h('span.mt-opword', { text: OP_WORDS[op] })));
  const sign = signs.find((c) => c.dataset.op === item.op);

  /** Dòng gợi ý sau khi chọn sai dấu lần 1: câu hỏi nhiều hơn / ít hơn + cụm hint và câu hỏi tiếng Việt. */
  const help = h('p.mt-storyhelp', { hidden: true });
  const showHelp = () => {
    hintWords.forEach((w) => w.classList.add('hintlit'));
    const more = storyAsk(s);
    help.hidden = false;
    help.replaceChildren(h('span.mt-storyhelp-en', { text: more.en }), showVi(app) ? h('span.mt-storyhelp-vi', { text: `${cap(s.hintVi)} → ${more.vi}` }) : null);
    return more;
  };

  /** Bước 1: câu đố + hai thẻ dấu; mức 1 có sẵn nhóm đồ ban đầu. */
  const stepOne = () => {
    const start = item.level === 1 ? tenFrame(Array(item.a).fill('blue'), { onCount: sayCount(t), emoji }) : null;
    stage.replaceChildren(text.el, ...(start ? [h('div.mt-oprow', {}, h('div.mt-framebox', {}, start.el))] : []), help,
      h('div.mt-tray.mt-optray', {}, ...signs));
    if (ctx.round?.wrong) showHelp();
  };
  /** Bước 2: phép tính hiện, dấu đã chọn; khung có đồ (mức 1 hiện sẵn). */
  const stepTwo = () => {
    help.remove();
    hintWords.forEach((w) => w.classList.remove('hintlit'));
    const board = opBoard(ctx, item, { emoji, hidden: item.level > 1 });
    stage.replaceChildren(text.el, board.row, board.eq.el, board.tray.el);
    return board;
  };
  const opView = {
    options: signs,
    correct: sign,
    question: `${s.text} Add or take away?`,
    meaning: s.vi,
    // Sau gợi ý chỉ hỏi lại "Add or take away?" — không đọc lại cả câu đố.
    speak: async () => {
      if (help.hidden) await t.karaoke(s.text, text.words);
      await t.say('Add or take away?');
    },
    explain: explainVi('t12', item),
    onWrong1: async () => {
      const more = showHelp();
      await t.karaoke(s.hint, hintWords);
      await t.say(more.en);
    },
  };
  const sumView = (board) => ({
    options: board.tray.cards,
    correct: board.tray.cardOf(item.answer),
    question: ask,
    meaning: askVi,
    speak: () => t.karaoke(ask, askWords),
    explain: storySumVi(item),
    onWrong: trackTried(ctx, board.tray),
    onWrong1: () => board.hint(),
  });

  return {
    story: true,
    /** Chơi mục → { result, line }; ghi thêm bản ghi bước chọn dấu (kiểu \`t12:wrong-op\`) cho Góc bố mẹ. */
    async run() {
      const { round, lesson } = ctx;
      let st = round.story?.index === round.index ? round.story : null;
      if (!st) st = round.story = { index: round.index, step: 1, opWrong: 0 };
      if (st.step === 1) {
        stepOne();
        await chooseLoop(ctx, opView);
        st.opWrong = round.wrong;
        st.step = 2;
        round.wrong = 0;
        const ref = { lessonId: lesson.id, activity: 'op', itemId: item.id };
        const opResult = st.opWrong === 0 ? RESULT.INDEPENDENT : st.opWrong === 1 ? RESULT.HELPED : RESULT.MISSED;
        getItem(app.db, ref).then((p) => app.db.put('progress', { ...applyResult(p, opResult), kind: 't12:wrong-op' })).catch(() => {});
        await t.say(item.op === '+' ? 'Add!' : 'Take away!');
      }
      const board = stepTwo();
      const sum = await chooseLoop(ctx, sumView(board));
      await board.solve();
      const result = storyResult(st.opWrong, sum);
      round.story = null;
      return { result, line: await praiseAndRead(ctx, item, result) };
    },
    /** Đã giải (quay lại từ nền đúng lúc đọc câu). */
    reveal() {
      const board = stepTwo();
      board.tray.cardOf(item.answer).classList.add('right');
      board.solve();
    },
    /** Olly làm mẫu: đọc câu đố → sáng cụm hint → nhiều hơn / ít hơn → chọn dấu → đếm → chọn kết quả. */
    async demo(dctx) {
      stepOne();
      await t.ask(opView.question, { speak: opView.speak, meaning: s.vi });
      await t.pause(400);
      const more = showHelp();
      await t.karaoke(s.hint, hintWords);
      await t.say(more.en);
      await t.say(item.op === '+' ? 'More! So we add.' : 'Fewer! So we take away.');
      await ollyTap(t, sign);
      t.endQuestion();
      const board = stepTwo();
      await t.ask(ask, { speak: () => t.karaoke(ask, askWords), meaning: askVi });
      await board.hint({ speak: true });
      await board.solve();
      await ollyTap(t, board.tray.cardOf(item.answer));
      t.endQuestion();
      await praiseAndRead(dctx, item, null);
      await t.pause(900);
    },
  };
}

// ---------- Olly làm mẫu ----------

/** Một lượt làm mẫu T8 → T12: hỏi → kiểm chứng (ghép cặp / đếm chấm / đếm tiếp / đếm phần còn lại) → chạm đáp án → đọc câu. */
export async function demoSums(dctx, item) {
  const { t } = dctx;
  if (item.key === 't12') return buildStory(dctx, item).demo(dctx);
  const view = item.key === 't8' ? buildT8(dctx, item) : item.key === 't9' ? buildT9(dctx, item) : buildOp(dctx, item);
  await t.ask(view.question, { speak: view.speak, meaning: view.meaning });
  await t.pause(400);
  if (view.demoCheck) await view.demoCheck();
  else await view.afterCorrect();
  await ollyTap(t, view.correct);
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}
