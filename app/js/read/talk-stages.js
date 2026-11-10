// Khu 💬 Talk (SPEC 3.3): bạn hỏi (giọng thứ hai) → Olly làm mẫu theo mức hỗ trợ → bé nói (nghe + ghi âm) → khen / nhắc.
// Bé im lặng: bạn hỏi lại → từ khóa → Olly nói câu mẫu "Say it with me!" → sang lượt sau (OL-17).
// Máy không nghe ra ≠ bé sai (4.2): không có câu chê, không tính sai.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { listen, RESULT as HEARD } from '../speech/listen.js';
import { addRecording, hasRecordingToday, pruneRecordings, isQuotaError, RECORDING_MAX_MS } from '../db.js';
import { RESULT, recordItem } from '../progress.js';
import { isAbort, abortError } from '../timing.js';
import { TALK, talkOutcome, turnKeywords, starterOf, withName, playableTurns } from '../talk.js';

const LISTEN_MS = 8000; // tối đa 8 giây mỗi lần nghe (ghi âm ≤ 10 giây, SPEC 6.2)
const SILENCE_MS = 5000; // chưa nói gì sau 5 giây = im lặng (3.3.2)

const turnKey = (dialogue, turn) => `${dialogue.id}-${turn.id}`;

/**
 * Chơi một hội thoại ở mức `level` (1–3). ctx: { app, t, stage, signal, lesson, tick, scored } như các khu khác.
 * @returns {Promise<void>}
 */
export async function talkDialogue(ctx, dialogue, level) {
  const { app } = ctx;
  const name = app.settings.childName;
  for (const turn of playableTurns(dialogue, name)) {
    await playTurn(ctx, dialogue, turn, level);
    ctx.tick();
  }
}

/** Số lượt chơi được của hội thoại (thanh tiến độ). */
export const talkSteps = (dialogue, name) => playableTurns(dialogue, name).length;

function wordSpans(text) {
  return text.split(/\s+/).filter(Boolean).map((w) => h('span.talk-word', { text: w }));
}

async function playTurn(ctx, dialogue, turn, level) {
  const { app, t, stage, signal } = ctx;
  const name = app.settings.childName;
  const answer = withName(turn.answer, name);
  const answerVi = withName(turn.answerVi, name);
  const keys = turnKeywords(turn, name);
  const starter = starterOf(turn, name);
  const showVi = app.settings.showVi;

  // ---- Màn hình của lượt ----
  const askBubble = h('div.bubble.partner-bubble', {},
    turn.emoji ? h('span.talk-pic', { text: turn.emoji, 'aria-hidden': 'true' }) : null,
    h('div.bubble-text', {},
      h('p.bubble-en', { text: turn.ask }),
      showVi && turn.askVi ? h('p.bubble-vi', { text: turn.askVi }) : null));
  const answerLine = h('p.answer-line');
  const answerViLine = h('p.bubble-vi');
  const keyBox = h('div.talk-keys', { hidden: true });
  const childBubble = h('div.bubble.child-bubble', {}, h('span.talk-mic', { text: '🎤', 'aria-hidden': 'true' }), h('div.bubble-text', {}, answerLine, answerViLine, keyBox));
  let answerEls = [];
  const showAnswer = () => {
    answerEls = wordSpans(answer);
    answerLine.replaceChildren(...answerEls);
    answerViLine.textContent = showVi ? answerVi : '';
  };
  const showStarter = () => {
    answerLine.replaceChildren(...wordSpans(starter), h('span.talk-blank', { text: '___' }));
    answerViLine.textContent = '';
  };
  const showOpen = () => {
    answerLine.replaceChildren(h('span.talk-blank', { text: '💬 …' }));
    answerViLine.textContent = '';
  };
  const showKeys = () => {
    keyBox.replaceChildren(...keys.map((k) => h('span.talk-key', { text: k })));
    keyBox.hidden = false;
  };
  if (level === 1) showAnswer();
  else if (level === 2) showStarter();
  else showOpen();

  const againBtn = h('button.btn.talk-again', { type: 'button', text: '🎤 Nói lại', 'aria-label': 'Nói lại' });
  const skipBtn = h('button.btn.talk-skip', { type: 'button', text: '⏭ Bỏ qua', 'aria-label': 'Bỏ qua' });
  stage.replaceChildren(h('div.talk', { dataset: { turn: turnKey(dialogue, turn), level: String(level) } },
    h('div.talk-partner', {}, h('span.talk-avatar', { text: dialogue.partner.emoji, 'aria-hidden': 'true' }), h('span.talk-name', { text: dialogue.partner.name })),
    askBubble,
    childBubble,
    h('div.talk-controls', {}, againBtn, skipBtn)));

  // ---- Bỏ qua / Nói lại: hủy phần đang chạy của lượt (không hủy cả bài) ----
  let ctl = null;
  let pending = null; // 'skip' | 'again'
  const interrupt = (kind) => {
    play('tap');
    pending = kind;
    ctl?.abort();
  };
  skipBtn.addEventListener('click', () => interrupt('skip'));
  againBtn.addEventListener('click', () => interrupt('again'));

  const partnerSay = (text) => app.speaker.speak(text, { signal: t.signal, role: 'alt' });
  const meaning = `${turn.askVi}${level === 1 ? ` — Bé nói theo: "${answer}"` : level === 2 ? ` — Bé nói tiếp: "${starter} …"` : ' — Bé tự trả lời bằng tiếng Anh.'}`;

  const hearOnce = async () => {
    if (!app.mic.ready) return { out: TALK.NONE };
    app.listening = true;
    stage.classList.add('listening');
    childBubble.classList.add('listening');
    try {
      const r = await listen({
        mic: app.mic, recognizer: app.recognizer, keywords: keys, maxMs: Math.min(LISTEN_MS, RECORDING_MAX_MS - 1000),
        silenceMs: SILENCE_MS, record: Boolean(app.settings.recordVoice) && !app.recordingFull, signal: t.signal,
      });
      const out = talkOutcome({ micReady: true, recognizing: app.recognizer.enabled, voiced: r.result !== HEARD.SILENT, heard: r.heard }, keys);
      if (r.recording) saveRecording(ctx, dialogue, turn, answer, r.recording);
      return { out, heard: r.heard };
    } finally {
      app.listening = false;
      stage.classList.remove('listening');
      childBubble.classList.remove('listening');
    }
  };

  const doneBtn = async () => {
    const done = h('button.big-btn.done-btn', { type: 'button', 'aria-label': 'Con nói xong', text: '✅' });
    childBubble.after(done);
    try {
      await t.waitTap([done]);
      play('pop');
    } finally {
      done.remove();
    }
  };

  // Một lần chạy lượt (từ đầu hoặc sau "Nói lại"). Trả về RESULT để ghi tiến độ.
  const run = async (fromAgain) => {
    if (fromAgain) {
      // "Nói lại": giữ 🔊 nghe lại câu hỏi, không hỏi lại từ đầu.
      Object.assign(t, { question: turn.ask, questionMeaning: meaning, questionSpeak: () => partnerSay(turn.ask) });
      t.replayBtn.hidden = false;
    } else {
      await t.ask(turn.ask, { meaning, speak: () => partnerSay(turn.ask) });
      if (level === 1) await t.karaoke(answer, answerEls);
      else if (level === 2) await t.say(`${starter}…`);
    }
    await t.say('Your turn!');
    let helped = false;
    let silent = 0;
    let unheard = 0;
    for (;;) {
      const { out } = await hearOnce();
      if (out === TALK.MATCH || out === TALK.SAID || out === TALK.NONE) {
        if (out === TALK.NONE) await doneBtn();
        else play('ding');
        t.celebrate(childBubble);
        if (out === TALK.MATCH && level > 1) showAnswer();
        await t.say(out === TALK.MATCH ? 'Great talking!' : 'Good job!');
        if (turn.reply) await partnerSay(turn.reply);
        return out === TALK.MATCH && !helped ? RESULT.INDEPENDENT : helped ? RESULT.HELPED : RESULT.PRACTICED;
      }
      if (out === TALK.OTHER) {
        showAnswer();
        await t.say('Good try! Listen:');
        await t.karaoke(answer, answerEls);
        if (turn.reply) await partnerSay(turn.reply);
        return helped ? RESULT.HELPED : RESULT.PRACTICED;
      }
      if (out === TALK.UNHEARD) {
        unheard++;
        if (unheard === 1) {
          await t.say("I didn't catch that. Say it again!");
          continue;
        }
        await t.say('Good job!');
        if (turn.reply) await partnerSay(turn.reply);
        return helped ? RESULT.HELPED : RESULT.PRACTICED;
      }
      // Im lặng (OL-17): hỏi lại → từ khóa → câu mẫu "Say it with me!" → sang lượt sau.
      silent++;
      if (silent === 1) {
        await partnerSay(turn.ask);
      } else if (silent === 2) {
        helped = true;
        showKeys();
        await t.say(keys.join(', '));
      } else if (silent === 3) {
        showAnswer();
        await t.say('Say it with me!');
        await t.karaoke(answer, answerEls);
      } else {
        await t.say("That's OK! Let's go on.");
        return RESULT.HELPED;
      }
      await t.say('Your turn!');
    }
  };

  const outer = t.signal;
  let fromAgain = false;
  try {
    for (;;) {
      ctl = new AbortController();
      const onOuter = () => ctl.abort();
      outer.addEventListener('abort', onOuter, { once: true });
      t.signal = ctl.signal;
      pending = null;
      try {
        const result = await run(fromAgain);
        recordItem(app.db, { lessonId: ctx.lesson.id, activity: 'talk', itemId: turnKey(dialogue, turn) }, result).catch(() => {});
        await t.pause(400);
        return;
      } catch (err) {
        if (outer.aborted || !isAbort(err) || !pending) throw err;
        app.speaker.cancel();
        if (pending === 'skip') return;
        fromAgain = true; // "Nói lại": nghe lại lượt này
      } finally {
        outer.removeEventListener('abort', onOuter);
        t.signal = outer;
        t.endQuestion();
      }
    }
  } finally {
    if (outer.aborted) throw abortError();
  }
}

/** Lưu ghi âm (1 bản / lượt / ngày), dọn bớt khi vượt 150 MB; đầy bộ nhớ máy → ngừng ghi cho hết buổi (6.2). */
function saveRecording(ctx, dialogue, turn, text, rec) {
  const { app, lesson } = ctx;
  const word = `${lesson.id} ${turnKey(dialogue, turn)}`;
  (async () => {
    if (await hasRecordingToday(app.db, word)) return;
    await addRecording(app.db, { lessonId: lesson.id, word, text, kind: 'talk', ...rec });
    await pruneRecordings(app.db);
  })().catch((err) => {
    if (isQuotaError(err)) app.recordingFull = true;
    else console.warn(err);
  });
}
