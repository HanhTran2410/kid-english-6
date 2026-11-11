// ✍️ Tập viết (SPEC-write.md): lưới chữ trong tab "✍️ Tập viết" của khu Spell (2.1) và màn tập một chữ (3–5):
// A xem Olly viết mẫu → B1 tô (mẫu rõ) → B2 tô (mẫu mờ) → C tự viết; mỗi nét chấm ngay khi nhấc tay, sai → chỉ chỗ sai
// + làm mẫu, sai 2 lần → tiếng Việt + tô có dẫn, lần 3 Olly tự hoàn thành. Ghi tiến độ sau mỗi lượt (9.1); lượt đang
// làm nằm trong `app.current.params.ws` → ra nền rồi quay lại đúng chữ, đúng lượt (9.2).

import { h, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { playPhoneme } from '../speech/phoneme.js';
import { isAbort, abortError, scaled } from '../timing.js';
import { activityLayout, Teacher } from '../read/teacher.js';
import { needsVietnameseHelp } from '../settings.js';
import { getItem, getLessonProgress, recordLessonDone } from '../progress.js';
import { LETTERS, WRITE_GROUPS, LETTER_ORDER, WRITE_LINES } from '../write/letters.js';
import {
  WRITE_LEVELS, sampleStroke, prepareInput, judgeStroke, turnResult, letterStars, applyLetterTurn, isDotStroke,
} from '../write/stroke.js';
import { createPad, letterSvg } from '../write/pad.js';

const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

/** Lời giải thích tiếng Việt: ở màn viết hộp chữ đè lên nút ↩️ 🧽 → tự ẩn sau 5 giây (giọng đọc vẫn đọc hết). */
async function explainBriefly(t, text) {
  await t.explainVi(text);
  const box = t.viBox;
  setTimeout(() => {
    if (t.viBox !== box) return;
    box?.remove();
    t.viBox = null;
  }, scaled(5000));
}
export const letterRef = (l) => ({ lessonId: 'write', activity: 'letter', itemId: l });
/** Sao của chữ: "lesson:write-<chữ>" (9.1). */
export const letterLessonId = (l) => `write-${l}`;
const TURNS = [
  { name: 'B1', model: 0.35, arrow: true },
  { name: 'B2', model: 0.15, arrow: true },
  { name: 'C', model: 0, arrow: false },
];
export const MAX_TRIALS = 300;

// ---------- Lưới chữ (tab ✍️ Tập viết) ----------

export async function writeCards(app, list) {
  const best = Object.fromEntries(await Promise.all(LETTER_ORDER.map(async (l) => [l, (await getLessonProgress(app.db, letterLessonId(l))).bestStars])));
  const next = LETTER_ORDER.find((l) => !best[l]);
  list.classList.add('wr-groups');
  for (const g of WRITE_GROUPS) {
    const letters = g.letters.filter((l) => LETTERS[l]);
    if (!letters.length) continue;
    list.append(h('section.wr-group', { dataset: { group: g.id } },
      h('h2.wr-group-title', {}, h('span.emoji', { text: g.emoji }), ` ${g.en} `, h('span.wr-group-vi', { text: g.vi })),
      h('div.wr-cards', {}, ...letters.map((l) => h(`button.wr-card${l === next ? '.next' : ''}`, {
        type: 'button', 'aria-label': `Chữ ${l}`, dataset: { letter: l },
        onclick: () => {
          play('tap');
          app.go('write', { letter: l });
        },
      },
      letterSvg(l, { className: 'wr-card-letter' }),
      h('span.lesson-stars', { text: starText(best[l]) }),
      l === next ? h('span.next-badge', { text: '⭐ Tiếp theo' }) : null)))));
  }
}

// ---------- Màn tập một chữ ----------

export function writeScreen(app, params = {}) {
  const letter = LETTERS[params.letter] ? params.letter : null;
  if (!letter) {
    queueMicrotask(() => app.go('spell', { tab: 'write' }));
    return null;
  }
  const signal = app.startActivity();
  const leave = () => app.go(app.timeUp ? 'sleep' : 'spell', { tab: 'write' });
  const layout = activityLayout(app, { onHome: leave });
  const t = new Teacher(app, { signal, stage: layout.stage, replayBtn: layout.replayBtn });
  app.root.classList.add('write');
  app.root.dataset.letter = letter;
  const info = LETTERS[letter];
  const turnLabel = h('span.wr-turn', { 'aria-label': 'Lượt' });
  // ❓ (3): giải thích tiếng Việt lúc nào cũng được, không tính trợ giúp.
  const helpBtn = h('button.wr-help', {
    type: 'button', 'aria-label': 'Giải thích tiếng Việt', text: '❓',
    onclick: () => {
      play('tap');
      app.speaker.cancel();
      explainBriefly(t, info.vi).catch(() => {});
    },
  });
  app.root.querySelector('.activity-top').append(h('span.wr-title', { text: `✍️ ${letter}` }), helpBtn, turnLabel);
  const ctx = { app, t, layout, signal, letter, info, turnLabel, input: { sawPen: false }, leave };
  run(ctx, params).catch((err) => {
    if (isAbort(err)) return;
    console.error(err);
    toast('Có lỗi khi tập viết chữ này.');
  });
  return null;
}

async function run(ctx, params) {
  const { app, letter, layout } = ctx;
  const resume = params.continueDirectly && params.ws?.letter === letter ? params.ws : null;
  const ws = resume ?? { letter, turn: 0, results: [] };
  if (app.current?.name === 'write') app.current.params.ws = ws;
  ctx.ws = ws;
  if (!resume) {
    app.root.dataset.step = 'A';
    await stepA(ctx);
  }
  while (ws.turn < TURNS.length) {
    layout.setProgress(ws.turn / TURNS.length);
    const { result, reasons } = await runTurn(ctx, ws.turn);
    ws.results.push(result);
    await recordTurn(app.db, letter, result, reasons);
    ws.turn++;
    if (ws.turn < TURNS.length) await ctx.t.say(ws.turn === 1 ? WRITE_LINES.again : WRITE_LINES.yourTurn);
  }
  await finish(ctx);
}

async function recordTurn(db, letter, result, reasons) {
  await db.put('progress', applyLetterTurn(await getItem(db, letterRef(letter)), result, reasons));
}

/** "This is c. c says /k/." — âm rời phát từ file (SPEC 3.1.1). */
async function introduce(ctx) {
  const { t, letter, info, layout, signal } = ctx;
  await t.say(`This is ${letter}.`);
  await t.say(`${letter} says`);
  await playPhoneme(info.sound, { stage: layout.stage, signal }).catch(() => {});
}

/** Bước A (4): Olly nói tên + âm, viết mẫu từng nét một lần; rồi ▶ Xem lại / Tiếp tục ➜. */
async function stepA(ctx) {
  const { app, t, layout, letter, info, signal } = ctx;
  ctx.turnLabel.textContent = '👀';
  const pad = createPad({ letter, input: ctx.input, penFirst: false, signal });
  pad.lock(true);
  pad.setModel(0.12);
  const actions = h('div.wr-actions');
  layout.stage.replaceChildren(h('div.wr-board', {}, pad.el), actions);
  await introduce(ctx);
  for (;;) {
    pad.clearAll();
    const speaking = t.ask(info.say);
    for (let i = 0; i < info.strokes.length; i++) {
      pad.showStart(i);
      await pad.drawStroke(i);
      if (signal.aborted) throw abortError();
    }
    pad.showStart(null);
    await speaking;
    const again = h('button.big-btn', { type: 'button', 'aria-label': 'Xem lại', text: '▶ Xem lại' });
    const go = h('button.big-btn.primary', { type: 'button', 'aria-label': 'Tiếp tục', text: 'Tiếp tục ➜' });
    actions.replaceChildren(again, go);
    const picked = await t.waitTap([again, go]);
    play('tap');
    app.speaker.cancel();
    actions.replaceChildren();
    if (picked === go) break;
  }
  t.endQuestion();
}

/**
 * Một lượt có chấm (B1, B2 hoặc C). Trả về { result, reasons }.
 * Đếm sai theo nét trong lượt; ↩️ / 🧽 không xóa số lần sai (5.5, T08).
 */
function runTurn(ctx, turnIndex) {
  const { app, t, layout, letter, info, signal } = ctx;
  const turn = TURNS[turnIndex];
  app.root.dataset.step = turn.name;
  ctx.turnLabel.textContent = `${turnIndex + 1}/3`;
  const cfg = WRITE_LEVELS[app.settings.writeLevel] ?? WRITE_LEVELS.easy;
  const pad = createPad({ letter, input: ctx.input, penFirst: app.settings.penFirst !== false, signal });
  pad.setModel(turn.model);
  const undoBtn = h('button.big-btn.wr-undo', { type: 'button', 'aria-label': 'Xóa nét', text: '↩️ Xóa nét' });
  const clearBtn = h('button.big-btn.wr-clear', { type: 'button', 'aria-label': 'Viết lại', text: '🧽 Viết lại' });
  const board = turn.name === 'C'
    ? h('div.wr-board.wr-c', {}, h('div.wr-sample', {}, letterSvg(letter)), pad.el)
    : h('div.wr-board', {}, pad.el);
  layout.stage.replaceChildren(board, h('div.wr-actions', {}, undoBtn, clearBtn));
  t.ask(info.say).catch(() => {});

  const templates = info.strokes.map((st) => sampleStroke(st));
  const strokes = info.strokes.map(() => ({ wrong: 0, auto: false }));
  const reasons = {};
  const history = []; // nét đã xong của lượt này, theo thứ tự
  let current = 0;
  let finished = false;
  let queue = Promise.resolve();

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });

    const refresh = () => {
      undoBtn.disabled = finished || !history.length;
      clearBtn.disabled = finished || !history.length;
      app.root.dataset.stroke = String(current);
    };
    const showCurrent = () => {
      pad.showStart(current, { arrow: turn.arrow });
      if (strokes[current]?.wrong >= 2 && !strokes[current].auto) pad.guide(current);
      else pad.unguide();
      refresh();
    };
    const advance = () => {
      current++;
      if (current >= info.strokes.length) {
        finished = true;
        pad.unguide();
        pad.showStart(null);
        pad.lock(true);
        pad.glow();
        refresh();
        signal.removeEventListener('abort', onAbort);
        t.endQuestion();
        t.celebrate(pad.el);
        play('sparkle');
        resolve({ result: turnResult(strokes), reasons });
        return;
      }
      showCurrent();
      if (isDotStroke(info.strokes[current])) t.say(WRITE_LINES.theDot).catch(() => {});
    };

    const handle = async (raw, inkPath) => {
      if (finished) {
        inkPath.remove();
        return;
      }
      const i = current;
      const st = strokes[i];
      const input = prepareInput(raw);
      const verdict = judgeStroke(input, templates[i], cfg, { guided: st.wrong >= 2 });
      logTrial(app, { letter, stroke: i, turn: turn.name, verdict, raw: input.raw }).catch(() => {});
      if (verdict.ignored) {
        inkPath.remove();
        return;
      }
      if (verdict.ok) {
        play('ding');
        pad.markDone(i, inkPath);
        history.push(i);
        advance();
        return;
      }
      st.wrong++;
      reasons[verdict.reason] = (reasons[verdict.reason] ?? 0) + 1;
      app.root.dataset.lastReason = verdict.reason;
      pad.fadeInk(inkPath);
      if (st.wrong >= 3) {
        // Lần thứ 3: Olly vẽ mẫu, nét tự hoàn thành để bé đi tiếp (5.5).
        st.auto = true;
        pad.unguide();
        const el = await pad.drawStroke(i, 'wr-auto');
        el.remove();
        pad.markDone(i, null);
        history.push(i);
        advance();
        return;
      }
      play('boing');
      const line = verdict.reason === 'stray' && verdict.lifted ? WRITE_LINES.lifted : WRITE_LINES[verdict.reason];
      if (verdict.reason === 'start' || verdict.reason === 'dot') pad.bounceStart();
      else if (verdict.reason === 'reverse') pad.runDot(i, 900);
      else pad.flashStroke(i);
      if (st.wrong === 2) {
        await t.say(line).catch(() => {});
        if (needsVietnameseHelp(app.settings, st.wrong)) await explainBriefly(t, info.strokeVi[i]).catch(() => {});
        if (!finished && current === i) pad.guide(i);
      } else {
        t.say(line).catch(() => {});
      }
    };

    pad.onStroke = (raw, inkPath) => {
      queue = queue.then(() => handle(raw, inkPath)).catch((err) => {
        if (!isAbort(err)) console.error(err);
      });
    };
    undoBtn.addEventListener('click', () => {
      if (finished || !history.length) return;
      play('tap');
      const i = history.pop();
      pad.removeDone(i);
      current = i;
      showCurrent();
    });
    clearBtn.addEventListener('click', () => {
      if (finished || !history.length) return;
      play('tap');
      while (history.length) pad.removeDone(history.pop());
      current = 0;
      showCurrent();
    });
    showCurrent();
  });
}

/** Ghi nét thử (12.3): bật ở Góc bố mẹ → ✍️ Tập viết; giữ tối đa MAX_TRIALS nét gần nhất. */
async function logTrial(app, { letter, stroke, turn, verdict, raw }) {
  if (!app.settings.writeRecord) return;
  const rec = {
    at: Date.now(), letter, stroke, turn, level: app.settings.writeLevel ?? 'easy',
    ok: Boolean(verdict.ok), reason: verdict.reason ?? (verdict.ignored ? 'tap' : null), wrongMark: false,
    points: raw.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]),
  };
  await app.setSetting('writeTrials', [...(app.settings.writeTrials ?? []), rec].slice(-MAX_TRIALS));
}

async function finish(ctx) {
  const { app, t, layout, letter, ws } = ctx;
  const stars = letterStars(ws.results);
  await recordLessonDone(app.db, letterLessonId(letter), stars);
  if (app.current?.name === 'write') delete app.current.params.ws;
  layout.setProgress(1);
  app.root.dataset.step = 'done';
  ctx.turnLabel.textContent = '';
  play('tada');
  const idx = LETTER_ORDER.indexOf(letter);
  const nextLetter = LETTER_ORDER[idx + 1];
  layout.stage.replaceChildren(h('div.done-panel', {},
    h('div.wr-done-letter', {}, letterSvg(letter)),
    h('p.done-title', { text: 'Great writing!' }),
    h('p.done-stars', { 'aria-label': `${stars} sao`, text: starText(stars) }),
    h('div.done-actions', {},
      h('button.big-btn', { type: 'button', 'aria-label': 'Viết lại chữ này', text: '🔁', onclick: () => app.go('write', { letter }) }),
      nextLetter ? h('button.big-btn', { type: 'button', 'aria-label': `Chữ tiếp theo ${nextLetter}`, text: `➜ ${nextLetter}`, onclick: () => app.go('write', { letter: nextLetter }) }) : null,
      h('button.big-btn.primary', { type: 'button', 'aria-label': 'Chữ khác', text: '✍️', onclick: ctx.leave }))));
  t.celebrate();
  await introduce(ctx).catch(() => {});
  await t.say(stars === 3 ? 'Wow! Three stars! Great writing!' : 'Great writing! You did it!').catch(() => {});
}
