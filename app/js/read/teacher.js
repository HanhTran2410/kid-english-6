// Olly trong màn hoạt động (lấy cách làm từ kid-english/player/teacher.js + layout.js): khung màn hình, nói, hỏi,
// nút 🔊 nghe lại + phụ đề tiếng Việt (SPEC 4.5), giải thích tiếng Việt khi sai 2 lần (4.1), nghe bé đọc (4.2),
// chờ bé chạm, chọn đáp án có thử lại (4.3).

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { listen, OUTCOME } from '../speech/listen.js';
import { sleep, scaled, abortError } from '../timing.js';
import { mascotElement } from '../mascot.js';
import { translateQuestion, QUESTIONS } from '../captions.js';
import { needsVietnameseHelp } from '../settings.js';
import { RESULT } from '../progress.js';

const CAPTION_MS = 5000;
const IDLE_CALL_MS = 20_000;

/** Khung màn hoạt động: 🏠, thanh tiến độ, vùng nội dung, Olly, nút 🔊. */
export function activityLayout(app, { onHome }) {
  const fill = h('div.progress-fill');
  const stage = h('main.stage');
  const replayBtn = h('button.replay-btn', { type: 'button', 'aria-label': 'Nghe lại', title: 'Nghe lại câu hỏi', text: '🔊', hidden: true });
  app.root.className = 'child-screen activity';
  app.root.append(
    h('header.activity-top', {},
      h('button.home-btn-small', { type: 'button', 'aria-label': 'Về', text: '🏠', onclick: () => { play('tap'); onHome(); } }),
      h('div.progress', { 'aria-hidden': 'true' }, fill)),
    stage,
    mascotElement('activity-olly'),
    replayBtn,
  );
  return {
    stage,
    replayBtn,
    setProgress(fraction) {
      fill.style.width = `${Math.round(Math.min(1, fraction) * 100)}%`;
    },
  };
}

export class Teacher {
  constructor(app, { signal, stage, replayBtn }) {
    this.app = app;
    this.signal = signal;
    this.stage = stage;
    this.replayBtn = replayBtn;
    this.question = null;
    replayBtn.addEventListener('click', () => this.replay());
  }

  get name() {
    return this.app.settings.characterName || 'Olly';
  }

  say(text, options = {}) {
    return this.app.speaker.speak(text, { signal: this.signal, ...options });
  }

  sayVi(text) {
    return this.say(text, { lang: 'vi' });
  }

  pause(ms) {
    return sleep(ms, this.signal);
  }

  /**
   * Hỏi một câu đang chờ bé: hiện 🔊. `speak`: cách nói (câu có âm rời phát từ file — dùng cho cả lần hỏi lẫn lần 🔊).
   * @param {string} text câu tiếng Anh (một mẫu trong QUESTIONS)
   */
  ask(text, { meaning = '', speak = null } = {}) {
    this.question = text;
    this.questionMeaning = meaning;
    this.questionSpeak = speak;
    this.replayBtn.hidden = false;
    return speak ? speak() : this.say(text);
  }

  /** Bé chạm 🔊: phụ đề Anh + Việt ~5 giây, đọc lại câu hỏi (không chen khi Olly đang nói). */
  replay() {
    if (!this.question || this.signal.aborted) return;
    this.showCaption(this.question, translateQuestion(this.question, this.questionMeaning));
    if (this.app.speaker.speaking) return;
    play('tap');
    (this.questionSpeak ? this.questionSpeak() : this.say(this.question)).catch(() => {});
  }

  showCaption(en, vi) {
    this.hideCaption();
    const box = h('button.caption', { type: 'button', 'aria-label': 'Phụ đề' },
      h('span.caption-en', { text: en }),
      vi ? h('span.caption-vi', { text: vi }) : null);
    box.addEventListener('click', () => this.hideCaption());
    this.stage.parentElement.append(box);
    this.caption = box;
    this.captionTimer = setTimeout(() => this.hideCaption(), CAPTION_MS);
  }

  hideCaption() {
    clearTimeout(this.captionTimer);
    this.caption?.remove();
    this.caption = null;
  }

  endQuestion() {
    this.question = null;
    this.questionSpeak = null;
    this.questionMeaning = '';
    this.hideCaption();
    this.viBox?.remove();
    this.viBox = null;
    this.replayBtn.hidden = true;
  }

  /**
   * Olly giải thích bằng tiếng Việt (SPEC 4.1): hiện chữ + đọc nếu máy có giọng tiếng Việt. Chữ ở lại tới khi xong câu hỏi
   * (bé chọn đúng) để bố mẹ / bé kịp đọc.
   */
  async explainVi(text) {
    const line = text.replaceAll('{name}', this.name);
    this.viBox?.remove();
    this.viBox = h('div.vi-help', { role: 'status' }, h('span.vi-help-flag', { text: '🇻🇳' }), h('span', { text: line }));
    this.stage.parentElement.append(this.viBox);
    await this.sayVi(line);
    await this.pause(this.app.speaker.hasVietnamese ? 400 : 1500);
  }

  celebrate(target = null) {
    const burst = h('div.star-burst', { 'aria-hidden': 'true' },
      ...Array.from({ length: 8 }, (_, i) => h('span', { text: '⭐', style: { '--i': String(i) } })));
    if (target) {
      const t = target.getBoundingClientRect();
      const s = this.stage.getBoundingClientRect();
      Object.assign(burst.style, { left: `${t.left - s.left}px`, top: `${t.top - s.top}px`, width: `${t.width}px`, height: `${t.height}px` });
    }
    this.stage.append(burst);
    setTimeout(() => burst.remove(), 1400);
  }

  /** Chờ bé chạm một trong các phần tử (bỏ qua khi Olly đang nói). 20 giây không chạm → Olly gọi. */
  waitTap(targets) {
    const { app } = this;
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      let calledAt = startedAt;
      const cleanup = () => {
        clearInterval(idle);
        for (const t of targets) t.removeEventListener('click', onTap);
        this.signal.removeEventListener('abort', onAbort);
      };
      const onTap = (event) => {
        if (app.speaker.speaking) return;
        cleanup();
        resolve(event.currentTarget);
      };
      const onAbort = () => {
        cleanup();
        reject(abortError());
      };
      for (const t of targets) t.addEventListener('click', onTap);
      this.signal.addEventListener('abort', onAbort, { once: true });
      const idle = setInterval(() => {
        if (Date.now() - Math.max(app.lastTouchAt, calledAt) > scaled(IDLE_CALL_MS) && !app.speaker.speaking) {
          calledAt = Date.now();
          this.say('Hello? Tap me!').catch(() => {});
        }
      }, scaled(1000));
    });
  }

  /** Nghe bé đọc `target` một lượt → OUTCOME (SPEC 4.2). Không có mic / nhận dạng → NONE ngay, không chờ. */
  async hear(target, homophones = []) {
    const { app } = this;
    if (!app.mic.ready || !app.recognizer.enabled) return OUTCOME.NONE;
    app.listening = true;
    this.stage.classList.add('listening');
    try {
      const r = await listen({ mic: app.mic, recognizer: app.recognizer, target, homophones, signal: this.signal });
      return r.outcome;
    } finally {
      app.listening = false;
      this.stage.classList.remove('listening');
    }
  }

  /**
   * Bé đọc to `target` (luyện, không tính sao). Không đánh giá được → nút ✅ "Con đọc xong".
   * @returns {Promise<string>} OUTCOME cuối cùng
   */
  async readAloud(target, homophones = []) {
    await this.ask(QUESTIONS.readIt());
    let outcome = OUTCOME.NONE;
    for (let tries = 0; tries < 3; tries++) {
      outcome = await this.hear(target, homophones);
      if (outcome === OUTCOME.OK) {
        play('ding');
        await this.say('Great reading!');
        break;
      }
      if (outcome === OUTCOME.NONE) {
        const done = h('button.big-btn.done-btn', { type: 'button', 'aria-label': 'Con đọc xong', text: '✅' });
        this.stage.append(done);
        try {
          await this.waitTap([done]);
          play('pop');
        } finally {
          done.remove();
        }
        break;
      }
      if (tries === 2) {
        await this.say(`${target}! Good try!`);
        break;
      }
      if (outcome === OUTCOME.MISS) await this.say(`Listen: ${target}. Your turn!`);
      else await this.say('Read it again, a bit louder!');
    }
    this.endQuestion();
    return outcome;
  }

  /**
   * Bé chọn một trong `options` (SPEC 4.3): đúng lần đầu → INDEPENDENT; sai một lần rồi đúng → HELPED;
   * sai 2 lần → giải thích tiếng Việt (nếu bật, một lần) + chỉ đáp án, bé chạm đáp án → MISSED.
   * @param {{ options: HTMLElement[], correct: HTMLElement, question: string, meaning?: string, speak?: () => Promise,
   *           explainVi?: string, answer?: () => Promise }} q
   */
  async choose({ options, correct, question, meaning = '', speak = null, explainVi = '', answer = null }) {
    await this.ask(question, { meaning, speak });
    let wrong = 0;
    for (;;) {
      const picked = await this.waitTap(wrong >= 2 ? [correct] : options);
      if (picked === correct) {
        play('ding');
        correct.classList.add('right');
        this.celebrate(correct);
        if (wrong < 2) await this.say(wrong === 0 ? 'Yes! Well done!' : 'Yes! Good job!');
        this.endQuestion();
        return wrong === 0 ? RESULT.INDEPENDENT : wrong === 1 ? RESULT.HELPED : RESULT.MISSED;
      }
      wrong++;
      play('boing');
      picked.classList.remove('shake');
      void picked.offsetWidth;
      picked.classList.add('shake');
      picked.classList.add('dim');
      if (wrong === 1) {
        await this.say('Oops! Listen again.');
        await (speak ? speak() : this.say(question));
      } else {
        if (explainVi && needsVietnameseHelp(this.app.settings, wrong)) await this.explainVi(explainVi);
        correct.classList.add('hint');
        await (answer ? answer() : this.say('This one!'));
      }
    }
  }
}
