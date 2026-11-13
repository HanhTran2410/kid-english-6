// 🔢 Toán phần 2 (SPEC-math2.md) — màn của T8 How many more (3.1) và T9 Number bonds (3.2): dựng mục cho vòng chọn
// chung (`chooseLoop` ở screens/round.js) và phần Olly làm mẫu. Khung lượt chơi, sao, mức: screens/round.js + math.js.

import { h } from '../ui.js';
import { showVi, praiseAndRead, ollyTap } from './round.js';
import { numberWord, cap, explainVi, T7_PEOPLE, T7_THINGS } from '../math/math.js';
import { moreText, bondText, bondSides, countLine } from '../math/sums.js';
import { sentenceLine } from '../math/views.js';
import { answerTray, tenFrame, twoRows, ladybug } from '../math/views2.js';

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
  const text = sentenceLine(q, showVi(app));
  text.el.classList.replace('mt-sentence', 'mt-puzzle'); // câu đọc sau không xóa câu đố
  text.el.classList.add('mt-sumq');
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

// ---------- Olly làm mẫu ----------

/** Một lượt làm mẫu T8 / T9: hỏi → kiểm chứng (ghép cặp / đếm chấm) → chạm đáp án → đọc câu. */
export async function demoSums(dctx, item) {
  const { t } = dctx;
  const view = item.key === 't8' ? buildT8(dctx, item) : buildT9(dctx, item);
  await t.ask(view.question, { speak: view.speak, meaning: view.meaning });
  await t.pause(400);
  if (view.demoCheck) await view.demoCheck();
  else await view.afterCorrect();
  await ollyTap(t, view.correct);
  t.endQuestion();
  await praiseAndRead(dctx, item, null);
  await t.pause(900);
}
