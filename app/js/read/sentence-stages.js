// Đọc câu (SPEC 3.1.5): câu + hình → Olly đọc mẫu, từ sáng theo nhịp (karaoke) → bé chạm từ để nghe riêng →
// bé đọc cả câu: từ máy nghe được sáng xanh, từ chưa nghe được để XÁM (không tô đỏ), Olly đọc riêng các từ xám rồi đọc lại
// cả câu → câu hỏi hiểu: chọn hình đúng với câu (kết quả chấm). Không mic / nhận dạng → nút ✅.
// Dòng tiếng Việt dưới câu theo cài đặt `showVi`; `readVietnamese` → Olly đọc thêm câu tiếng Việt.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { tokenize } from '../text.js';
import { displayWords } from '../karaoke.js';
import { QUESTIONS } from '../captions.js';
import { RESULT, recordItem } from '../progress.js';
import { shuffle, distractors, hasPicture, pictureEl } from './stages.js';

const record = (ctx, activity, itemId, result) => recordItem(ctx.app.db, { lessonId: ctx.lesson.id, activity, itemId }, result).catch(() => {});

/** Kết quả đọc câu từ tập từ máy nghe được: đủ → INDEPENDENT, được một phần → HELPED, không từ nào → PRACTICED. */
export function sentenceResult(words, heard) {
  if (!heard) return RESULT.PRACTICED;
  const got = words.filter((w) => heard.has(w)).length;
  if (got === words.length) return RESULT.INDEPENDENT;
  return got > 0 ? RESULT.HELPED : RESULT.PRACTICED;
}

export async function readSentences(ctx, sentences) {
  const { t, stage, app } = ctx;
  const pictured = ctx.lesson.sentences.filter((s) => hasPicture(ctx, s));
  for (const s of sentences) {
    const shown = displayWords(s.en);
    const wordEls = shown.map((w) => {
      const word = tokenize(w)[0] ?? w;
      const el = h('button.sword', { type: 'button', dataset: { word }, text: w });
      el.addEventListener('click', () => {
        if (app.speaker.speaking) return;
        el.classList.add('reading');
        t.say(word, { rate: app.settings.rate * 0.8 }).catch(() => {}).finally(() => el.classList.remove('reading'));
      });
      return el;
    });
    const viLine = s.vi && app.settings.showVi !== false ? h('p.sentence-vi', { text: s.vi }) : null;
    // Có câu hỏi chọn hình sau đó thì lúc đọc KHÔNG hiện hình (không lộ đáp án).
    const quiz = hasPicture(ctx, s) && pictured.length >= 3;
    stage.replaceChildren(
      hasPicture(ctx, s) && !quiz ? h('div.spell-pic', { 'aria-hidden': 'true' }, pictureEl(ctx, s)) : null,
      h('div.sentence', {}, ...wordEls),
      viLine);

    // 1. Olly đọc mẫu (karaoke).
    await t.say('Listen!');
    await t.karaoke(s.en, wordEls);
    if (app.settings.readVietnamese && s.vi) await t.sayVi(s.vi);

    // 2. Bé đọc cả câu.
    await t.ask(QUESTIONS.readSentence(), { meaning: s.vi });
    const words = shown.map((w) => tokenize(w)[0]).filter(Boolean);
    const heard = await t.hearSentence(s.en);
    let result;
    if (!heard) {
      const done = h('button.big-btn.done-btn', { type: 'button', 'aria-label': 'Con đọc xong', text: '✅' });
      stage.append(done);
      try {
        await t.waitTap([done]);
        play('pop');
      } finally {
        done.remove();
      }
      result = RESULT.PRACTICED;
    } else {
      wordEls.forEach((el) => el.classList.add(heard.has(el.dataset.word) ? 'heard' : 'missed'));
      result = sentenceResult(words, heard);
      if (result === RESULT.INDEPENDENT) {
        play('ding');
        await t.say('Great reading!');
      } else {
        // Đọc riêng các từ chưa nghe được, rồi cả câu.
        for (const el of wordEls.filter((x) => x.classList.contains('missed'))) {
          el.classList.add('reading');
          await t.say(el.dataset.word, { rate: app.settings.rate * 0.8 });
          el.classList.remove('reading');
          await t.pause(150);
        }
        await t.karaoke(s.en, wordEls);
      }
    }
    t.endQuestion();
    record(ctx, 'sentence-read', s.id, result);

    // 3. Câu hỏi hiểu: chọn hình đúng với câu (chấm).
    if (quiz) {
      const others = distractors(s, pictured.filter((x) => x.id !== s.id), []);
      const choices = shuffle([s, ...others]);
      const buttons = choices.map((c) => h('button.pic-choice', { type: 'button', 'aria-label': c.en, dataset: { choice: c.id } }, pictureEl(ctx, c)));
      const correct = buttons[choices.indexOf(s)];
      const again = h('div.sentence.small', {}, ...shown.map((w) => h('span.sword', { text: w })));
      stage.replaceChildren(again, h('div.choices', {}, ...buttons));
      const res = await t.choose({
        options: buttons, correct, question: QUESTIONS.whichPicture(), meaning: s.vi,
        speak: async () => {
          await t.say(QUESTIONS.whichPicture());
          await t.say(s.en);
        },
        explainVi: s.vi ? `Câu "${s.en}" nghĩa là: ${s.vi}` : '',
        answer: () => t.say(s.en),
      });
      record(ctx, 'sentence', s.id, res);
      ctx.scored(res);
      await t.pause(400);
    }
    ctx.tick();
  }
}
