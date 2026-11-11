// ✍️ Viết từ (SPEC-write.md mục 8): cuối lượt học bài Spell, bé chép lại tối đa 2 từ đã xếp ô đúng 2 lần liên tiếp.
// Mỗi chữ cái một ô có chữ mẫu mờ (chữ lặp có ô riêng), viết ô nào trước cũng được, 🧽 xóa từng ô; không chấm hình
// chữ — ✅ Xong sáng khi ô nào cũng có nét kéo, bấm thì hiện từ in đúng để bé tự so và ghi "đã viết" (practiced).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { QUESTIONS } from '../captions.js';
import { RESULT, recordItem } from '../progress.js';
import { createPad } from '../write/pad.js';
import { prepareInput } from '../write/stroke.js';
import { wordCells } from '../write/words.js';
import { hasPicture, pictureEl } from './stages.js';

const MODEL_OPACITY = 0.18;

/**
 * ctx: { app, t: Teacher, stage, signal, lesson, picture(w) }
 * @param {Array<{ id: string, en: string, vi?: string }>} words
 */
export async function writeWords(ctx, words) {
  const input = { sawPen: false }; // ưu tiên bút dùng chung cả bước
  for (const w of words) await writeOne(ctx, w, input);
}

async function writeOne(ctx, w, input) {
  const { app, t, stage, signal, lesson } = ctx;
  const penFirst = app.settings.penFirst !== false;
  const doneBtn = h('button.big-btn.primary.wr-word-done', { type: 'button', 'aria-label': 'Xong', text: '✅ Xong', disabled: true });
  const cells = wordCells(w.en).map((letter, i) => {
    const pad = createPad({ letter, input, penFirst, signal, compact: true });
    pad.setModel(MODEL_OPACITY);
    const cell = { pad, drags: 0 };
    const clear = h('button.wr-cell-clear', { type: 'button', 'aria-label': `Xóa ô ${i + 1}`, text: '🧽' });
    clear.addEventListener('click', () => {
      if (pad.locked) return;
      play('tap');
      pad.clearAll();
      cell.drags = 0;
      refresh();
    });
    pad.onStroke = (raw, path) => {
      // Không chấm hình chữ; chạm (tap) không tính là đã viết.
      if (prepareInput(raw).tap) {
        path.remove();
        return;
      }
      cell.drags++;
      refresh();
    };
    cell.el = h('div.wr-cell', { dataset: { index: String(i), letter } }, pad.el, clear);
    return cell;
  });
  function refresh() {
    const next = cells.find((c) => !c.drags);
    for (const c of cells) c.el.classList.toggle('next', c === next && !c.pad.locked);
    doneBtn.disabled = Boolean(next);
  }
  const printed = h('p.word-card.wr-word-check', { text: w.en, hidden: true });
  const actions = h('div.wr-actions', {}, doneBtn);
  stage.replaceChildren(
    hasPicture(ctx, w) ? h('div.spell-pic', { 'aria-hidden': 'true' }, pictureEl(ctx, w)) : null,
    h('p.word-shown.wr-word-model', { text: w.en }),
    h('div.wr-cells', {}, ...cells.map((c) => c.el)),
    printed,
    actions,
  );
  refresh();
  app.root.dataset.writeWord = w.en;
  await t.ask(QUESTIONS.writeWord(w.en), { meaning: w.vi });

  for (;;) {
    await t.waitTap([doneBtn]);
    play('ding');
    for (const c of cells) {
      c.pad.setModel(0);
      c.pad.lock(true);
    }
    refresh();
    printed.hidden = false;
    t.celebrate(printed);
    await recordItem(app.db, { lessonId: lesson.id, activity: 'write', itemId: w.id }, RESULT.PRACTICED).catch(() => {});
    const again = h('button.big-btn', { type: 'button', 'aria-label': 'Viết lại', text: '✍️ Viết lại' });
    const next = h('button.big-btn.primary', { type: 'button', 'aria-label': 'Tiếp tục', text: 'Tiếp tục ➜' });
    actions.replaceChildren(again, next);
    await t.say(w.en);
    await t.say('Great writing!');
    const picked = await t.waitTap([again, next]);
    play('tap');
    app.speaker.cancel();
    if (picked === next) break;
    for (const c of cells) {
      c.pad.clearAll();
      c.pad.setModel(MODEL_OPACITY);
      c.pad.lock(false);
      c.drags = 0;
    }
    printed.hidden = true;
    actions.replaceChildren(doneBtn);
    refresh();
  }
  t.endQuestion();
  delete app.root.dataset.writeWord;
}
