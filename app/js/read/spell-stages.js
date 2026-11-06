// Khu ✏️ Spell (SPEC 3.2): nghe – xếp ô (bé CHẠM ô trong khay → ô vào chỗ trống kế tiếp; chạm ô đã đặt → về khay)
// và điền ô thiếu (c _ t + hình). Ô theo grapheme (sh, ck là một miếng). Chạm ô bất kỳ → nghe âm của ô (file).
// Sai: ô ở chỗ sai rung, Olly phát âm đúng của chỗ đó; sai 2 lượt → giải thích tiếng Việt + xếp sẵn đáp án.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { playPhoneme } from '../speech/phoneme.js';
import { QUESTIONS } from '../captions.js';
import { SOUND_INFO, RECORDED_SOUNDS, learnedGraphemes, soundOfGrapheme } from '../phonics.js';
import { needsVietnameseHelp } from '../settings.js';
import { RESULT, recordItem } from '../progress.js';
import { shuffle } from './stages.js';

const snd = (ctx, s) => playPhoneme(s, { stage: ctx.stage, signal: ctx.signal });
const record = (ctx, activity, itemId, result) => recordItem(ctx.app.db, { lessonId: ctx.lesson.id, activity, itemId }, result).catch(() => {});

/** Vị trí bé xếp sai (so đúng từng grapheme). */
export function wrongSlots(placed, graphemes) {
  return graphemes.map((g, i) => (placed[i] === g ? -1 : i)).filter((i) => i >= 0);
}

/**
 * Ô nhiễu: grapheme đã học tới nhóm của bài, KHÔNG cùng âm với ô nào của từ (c, k, ck cùng âm → không làm nhiễu nhau),
 * có file âm. `n` ô.
 */
export function spellDistractors(word, group, n = 2, rand = Math.random) {
  const sounds = new Set(word.sounds);
  const pool = [...learnedGraphemes(group ?? 3)].filter((g) => !g.includes('_') && !word.graphemes.includes(g)
    && !sounds.has(soundOfGrapheme(g)) && RECORDED_SOUNDS.has(soundOfGrapheme(g)));
  return shuffle(pool, rand).slice(0, n);
}

/** Chỗ bỏ trống của "điền ô thiếu": ưu tiên nguyên âm ở giữa (c _ t), không thì ô cuối. */
export function missingIndex(word) {
  const mid = word.graphemes.findIndex((g, i) => i > 0 && i < word.graphemes.length - 1 && /^[aeiou]/.test(g));
  return mid >= 0 ? mid : word.graphemes.length - 1;
}

const tileFor = (g, sound) => h('button.tile', { type: 'button', 'aria-label': g, dataset: { grapheme: g, sound }, text: g });
const picture = (w) => (w.emoji ? h('div.spell-pic', { 'aria-hidden': 'true', text: w.emoji }) : null);

// ---------- Nghe – xếp ô ----------

export async function spellWords(ctx, words) {
  const { t, stage, app } = ctx;
  for (const w of words) {
    const slots = w.graphemes.map(() => h('div.slot'));
    const extra = spellDistractors(w, ctx.lesson.group);
    const tiles = shuffle([...w.graphemes.map((g, i) => tileFor(g, w.sounds[i])), ...extra.map((g) => tileFor(g, soundOfGrapheme(g)))]);
    const tray = h('div.tray', {}, ...tiles);
    stage.replaceChildren(picture(w), h('div.slot-row', {}, ...slots), tray);
    const sayWord = () => t.say(w.en, { rate: app.settings.rate * 0.85 });
    await t.ask(QUESTIONS.spellIt(w.en), { meaning: w.vi, speak: async () => { await t.say(QUESTIONS.spellIt(w.en)); await sayWord(); } });

    let attempts = 0;
    let result = null;
    while (!result) {
      // Bé chạm ô cho tới khi đầy các chỗ trống.
      while (slots.some((s) => !s.firstChild)) {
        const tile = await t.waitTap(tiles);
        if (tile.parentElement === tray) {
          slots.find((s) => !s.firstChild).append(tile);
        } else {
          tray.append(tile);
        }
        play('tap');
        snd(ctx, tile.dataset.sound);
      }
      await t.pause(350);
      const placed = slots.map((s) => s.firstChild.dataset.grapheme);
      const wrong = wrongSlots(placed, w.graphemes);
      if (!wrong.length) {
        play('ding');
        slots.forEach((s) => s.classList.add('right'));
        t.celebrate(stage.querySelector('.slot-row'));
        await sayWord();
        await t.say(attempts === 0 ? 'Yes! Well done!' : 'Yes! Good job!');
        result = attempts === 0 ? RESULT.INDEPENDENT : RESULT.HELPED;
        break;
      }
      attempts++;
      play('boing');
      for (const i of wrong) {
        slots[i].classList.remove('shake');
        void slots[i].offsetWidth;
        slots[i].classList.add('shake');
      }
      if (attempts === 1) {
        // Olly phát âm đúng của chỗ sai đầu tiên, các ô sai về khay.
        await t.say('Oops! Listen.');
        await snd(ctx, w.sounds[wrong[0]]);
        for (const i of wrong) tray.append(slots[i].firstChild);
        await sayWord();
        continue;
      }
      // Lượt 2 sai: giải thích tiếng Việt (một lần) + xếp sẵn đáp án, bé nghe lại.
      if (needsVietnameseHelp(app.settings, 2)) {
        await t.explainVi(`"${w.en}"${w.vi ? ` (${w.vi})` : ''} có ${w.graphemes.length} ô: ${w.graphemes.join(' – ')}. Bé nghe từng âm rồi xếp theo thứ tự nhé.`);
      }
      for (const s of slots) if (s.firstChild) tray.append(s.firstChild);
      for (let i = 0; i < w.graphemes.length; i++) {
        const tile = tiles.find((x) => x.parentElement === tray && x.dataset.grapheme === w.graphemes[i]);
        slots[i].append(tile);
        slots[i].classList.add('hint');
        await snd(ctx, w.sounds[i]);
      }
      await sayWord();
      result = RESULT.MISSED;
    }
    t.endQuestion();
    record(ctx, 'spell', w.id, result);
    ctx.scored(result);
    await t.pause(400);
    ctx.tick();
  }
}

// ---------- Điền ô thiếu ----------

export async function fillWords(ctx, words) {
  const { t, stage } = ctx;
  for (const w of words) {
    const gap = missingIndex(w);
    const missing = w.graphemes[gap];
    const row = h('div.slot-row', {}, ...w.graphemes.map((g, i) => (i === gap ? h('div.slot.gap') : h('div.slot.fixed', { text: g }))));
    const choices = shuffle([missing, ...spellDistractors(w, ctx.lesson.group)]);
    const buttons = choices.map((g) => h('button.tile.fill-choice', { type: 'button', 'aria-label': g, dataset: { choice: g, sound: soundOfGrapheme(g) }, text: g }));
    const correct = buttons[choices.indexOf(missing)];
    stage.replaceChildren(picture(w), row, h('div.choices', {}, ...buttons));
    const sound = w.sounds[gap];
    const result = await t.choose({
      options: buttons, correct, question: QUESTIONS.whatsMissing(w.en), meaning: w.vi,
      speak: async () => {
        await t.say(QUESTIONS.whatsMissing(w.en));
        await t.say(w.en, { rate: ctx.app.settings.rate * 0.85 });
      },
      explainVi: SOUND_INFO[sound]?.vi ?? '',
      answer: async () => {
        await snd(ctx, sound);
        await t.say(w.en);
      },
    });
    row.querySelector('.gap').textContent = missing;
    row.querySelector('.gap').classList.add('right');
    await t.say(w.en);
    record(ctx, 'fill', w.id, result);
    ctx.scored(result);
    await t.pause(400);
    ctx.tick();
  }
}
