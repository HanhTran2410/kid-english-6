// Các hoạt động của khu Read (SPEC 3.1.3–3.1.4): gặp âm + chọn chữ theo âm, ghép âm (ô chữ → Ghép → đọc → chọn hình),
// tricky words (đọc thẻ → tìm thẻ). Âm rời luôn phát từ file (speech/phoneme.js). Kết quả chấm chỉ từ phần CHẠM.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { OUTCOME } from '../speech/listen.js';
import { playPhoneme } from '../speech/phoneme.js';
import { QUESTIONS } from '../captions.js';
import { SOUND_INFO, RECORDED_SOUNDS, GROUPS, TRICKY_BY_GROUP } from '../phonics.js';
import { RESULT, recordItem, recordTricky } from '../progress.js';

/**
 * ctx: { app, t: Teacher, stage, signal, lesson, tick(): void, scored(result): void }
 */
const snd = (ctx, s) => playPhoneme(s, { stage: ctx.stage, signal: ctx.signal });

/** Trộn ngẫu nhiên (Fisher–Yates). `rand` để test cố định. */
export function shuffle(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 2 đáp án nhiễu khác `target`: ưu tiên trong `near`, thiếu thì lấy thêm từ `pool`. */
export function distractors(target, near, pool, n = 2, rand = Math.random) {
  const out = [];
  for (const list of [shuffle(near, rand), shuffle(pool, rand)]) {
    for (const x of list) if (x !== target && !out.includes(x) && out.length < n) out.push(x);
  }
  return out;
}

const record = (ctx, activity, itemId, result) => recordItem(ctx.app.db, { lessonId: ctx.lesson.id, activity, itemId }, result).catch(() => {});

const outcomeResult = (o) => (o === OUTCOME.OK ? RESULT.INDEPENDENT : o === OUTCOME.MISS ? RESULT.MISSED : RESULT.PRACTICED);

// ---------- Gặp âm ----------

export async function meetSounds(ctx, sounds) {
  const { t, stage } = ctx;
  const list = sounds.filter((s) => RECORDED_SOUNDS.has(s) && SOUND_INFO[s]);
  for (const s of list) {
    const info = SOUND_INFO[s];
    stage.replaceChildren(h('div.sound-card', { dataset: { sound: s } },
      h('span.sound-letters', { text: info.letters }),
      h('span.sound-example', {}, h('span.emoji', { text: info.emoji }), ` ${info.word}`)));
    await t.say('Listen!');
    await snd(ctx, s);
    await t.pause(350);
    await snd(ctx, s);
    await t.pause(250);
    await t.say(`${info.word}!`);
    await t.ask(QUESTIONS.sayTheSound(), { speak: () => snd(ctx, s) });
    await t.pause(ctx.app.mic.ready ? 2200 : 1200); // bé nói theo (âm rời: không chấm bằng nhận dạng)
    t.endQuestion();
    play('pop');
    record(ctx, 'sounds', s, RESULT.PRACTICED);
    ctx.tick();
  }
  // Kiểm tra: nghe âm → chọn chữ.
  const pool = GROUPS.filter((g) => g.group <= (ctx.lesson.group ?? 3)).flatMap((g) => g.sounds).filter((s) => SOUND_INFO[s] && RECORDED_SOUNDS.has(s));
  for (const s of shuffle(list)) {
    const choices = shuffle([s, ...distractors(s, list, pool)]);
    const buttons = choices.map((c) => h('button.letter-choice', { type: 'button', 'aria-label': SOUND_INFO[c].letters, dataset: { choice: c }, text: SOUND_INFO[c].letters }));
    const correct = buttons[choices.indexOf(s)];
    stage.replaceChildren(h('div.choices', {}, ...buttons));
    const speak = async () => {
      await t.say(QUESTIONS.whichLetter());
      await snd(ctx, s);
    };
    const result = await t.choose({ options: buttons, correct, question: QUESTIONS.whichLetter(), speak, explainVi: SOUND_INFO[s].vi, answer: () => snd(ctx, s) });
    record(ctx, 'sound-check', s, result);
    ctx.scored(result);
    await t.pause(400);
    ctx.tick();
  }
}

// ---------- Ghép âm ----------

export async function blendWords(ctx, words) {
  const { t, stage, app } = ctx;
  const pictured = ctx.lesson.words.filter((w) => w.emoji && w.graphemes);
  for (const w of words) {
    const tiles = w.graphemes.map((g, i) => h('button.tile', { type: 'button', 'aria-label': g, dataset: { sound: w.sounds[i] }, text: g }));
    for (const tile of tiles) tile.addEventListener('click', () => snd(ctx, tile.dataset.sound));
    const row = h('div.tile-row', {}, ...tiles);
    const blendBtn = h('button.big-btn.blend-btn', { type: 'button', 'aria-label': 'Ghép', text: '🔗 Blend' });
    stage.replaceChildren(row, blendBtn);
    await t.ask(QUESTIONS.tapBlend());
    await t.waitTap([blendBtn]);
    blendBtn.disabled = true;
    for (const tile of tiles) {
      await snd(ctx, tile.dataset.sound);
      await t.pause(120);
    }
    row.classList.add('blended');
    await t.pause(300);
    await t.say(w.en, { rate: app.settings.rate * 0.85 });
    t.endQuestion();
    blendBtn.remove();
    const outcome = await t.readAloud(w.en, w.homophones);
    record(ctx, 'read-aloud', w.id, outcomeResult(outcome));

    if (w.emoji && pictured.length >= 3) {
      const others = distractors(w, pictured.filter((x) => x.emoji !== w.emoji), []);
      const choices = shuffle([w, ...others]);
      const buttons = choices.map((c) => h('button.pic-choice', { type: 'button', 'aria-label': c.en, dataset: { choice: c.id }, text: c.emoji }));
      const correct = buttons[choices.indexOf(w)];
      stage.replaceChildren(h('div.word-shown', { text: w.en }), h('div.choices', {}, ...buttons));
      const result = await t.choose({
        options: buttons, correct, question: QUESTIONS.whichOne(w.en), meaning: w.vi,
        explainVi: w.explainVi || (w.vi ? `"${w.en}" nghĩa là ${w.vi}. Bé tìm hình ${w.vi} nhé.` : ''),
        answer: () => t.say(w.en),
      });
      record(ctx, 'blend', w.id, result);
      ctx.scored(result);
      await t.pause(400);
    } else {
      record(ctx, 'blend', w.id, RESULT.PRACTICED);
    }
    ctx.tick();
  }
}

// ---------- Tricky words ----------

export async function trickyWords(ctx, words) {
  const { t, stage, app } = ctx;
  for (const w of words) {
    stage.replaceChildren(h('div.word-card.tricky', { text: w.en }));
    await t.say(`This word is ${w.en}. ${w.en}!`);
    const outcome = await t.readAloud(w.en, w.homophones);
    record(ctx, 'tricky-read', w.id, outcomeResult(outcome));
    ctx.tick();
  }
  const pool = Object.entries(TRICKY_BY_GROUP).filter(([g]) => Number(g) <= (ctx.lesson.group ?? 3)).flatMap(([, list]) => list);
  const names = words.map((w) => w.en);
  for (const w of shuffle(words)) {
    const choices = shuffle([w.en, ...distractors(w.en, names, pool)]);
    const buttons = choices.map((c) => h('button.word-choice', { type: 'button', 'aria-label': c, dataset: { choice: c }, text: c }));
    const correct = buttons[choices.indexOf(w.en)];
    stage.replaceChildren(h('div.choices', {}, ...buttons));
    const result = await t.choose({
      options: buttons, correct, question: QUESTIONS.findWord(w.en), meaning: w.vi,
      explainVi: w.explainVi, answer: () => t.say(w.en),
    });
    recordTricky(app.db, w.en, result).catch(() => {});
    ctx.scored(result);
    await t.pause(400);
    ctx.tick();
  }
}

/** Số bước của bài (để vẽ thanh tiến độ). */
export function countSteps(lesson) {
  const byId = new Map(lesson.words.map((w) => [w.id, w]));
  let n = 0;
  for (const a of lesson.activities) {
    if (a.type === 'sounds') n += 2 * a.sounds.filter((s) => RECORDED_SOUNDS.has(s) && SOUND_INFO[s]).length;
    if (a.type === 'blend') n += a.items.filter((id) => byId.get(id)?.graphemes).length;
    if (a.type === 'tricky') n += 2 * a.items.length;
  }
  return n;
}

/** Bài có hoạt động nào khu Read chơi được không. */
export const READ_TYPES = new Set(['sounds', 'blend', 'tricky']);
export const isReadable = (lesson) => lesson.activities.some((a) => READ_TYPES.has(a.type));
