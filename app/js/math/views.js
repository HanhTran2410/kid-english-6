// Hình của khu 🔢 Math (SPEC-math mục 5): thẻ số, cột khối, thanh chục + khối lẻ, cá sấu, nhóm đồ vật + dây nối từng cặp,
// câu so sánh (karaoke). Chỉ dựng DOM; luồng bài nằm ở screens/math.js.

import { h } from '../ui.js';
import { displayWords } from '../karaoke.js';
import { tokenize } from '../text.js';
import { THINGS, tensOf, onesOf } from './math.js';
import { sleep } from '../timing.js';

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Cột khối (4.1): khối 1–5 xanh, 6–10 cam, 11–20 lặp lại theo nhóm 5 — hai cột cùng một quy tắc màu. */
export function blockColumn(n, { small = false } = {}) {
  return h(`div.mt-col${small ? '.small' : ''}`, { 'aria-label': `${n} khối`, dataset: { blocks: String(n) } },
    ...Array.from({ length: n }, (_, i) => h(`span.mt-block.${Math.floor(i / 5) % 2 ? 'orange' : 'blue'}`, { style: { '--i': String(i) } })));
}

/** Que chục + khối lẻ (4.6): thanh = 10 khối dựng đứng. */
export function tensView(n) {
  const rods = Array.from({ length: tensOf(n) }, () => rodEl());
  const ones = Array.from({ length: onesOf(n) }, () => h('span.mt-one'));
  return h('div.mt-tens', { dataset: { tens: String(tensOf(n)), ones: String(onesOf(n)) } },
    h('div.mt-rods', {}, ...rods), h('div.mt-ones', {}, ...ones));
}

export const rodEl = () => h('span.mt-rod', {}, ...Array.from({ length: 10 }, () => h('span.mt-rod-cell')));

/**
 * Thẻ số chạm được, kèm chỗ để hình kiểm chứng (cột khối / que chục). `show(kind)` hiện hình.
 */
export function numberCard(n, side, { tappable = true } = {}) {
  const pic = h('div.mt-pic');
  const card = tappable
    ? h('button.mt-card', { type: 'button', 'aria-label': String(n), dataset: { side, n: String(n) } }, pic, h('span.mt-num', { text: String(n) }))
    : h('div.mt-card.still', { dataset: { side, n: String(n) } }, pic, h('span.mt-num', { text: String(n) }));
  card.showPic = (kind, { smallBlocks = false } = {}) => {
    if (pic.childElementCount) return;
    pic.append(kind === 'tens' ? tensView(n) : blockColumn(n, { small: smallBlocks }));
  };
  return card;
}

// ---------- Cá sấu (4.3): hàm trên / dưới tách riêng để há – ngậm; mặc định miệng quay sang TRÁI (dấu >) ----------

const CROC_SVG = `<svg viewBox="0 0 120 70" aria-hidden="true">
  <path d="M108 42 L120 30 L116 54 Z" fill="#37b24d"/>
  <path d="M78 60 l-4 8 h8 Z M98 60 l-4 8 h8 Z" fill="#37b24d"/>
  <ellipse cx="88" cy="46" rx="28" ry="17" fill="#51cf66"/>
  <g class="croc-lower"><path d="M14 48 l3 -5 l3 5 l3 -5 l3 5 l3 -5 l3 5 l3 -5 l3 5" fill="#fff"/><path d="M68 60 Q40 62 10 55 Q3 51 10 48 L68 44 Z" fill="#40c057"/></g>
  <g class="croc-upper"><path d="M14 40 l3 5 l3 -5 l3 5 l3 -5 l3 5 l3 -5 l3 5 l3 -5" fill="#fff"/><path d="M70 28 Q40 26 10 33 Q3 37 10 40 L68 44 Z" fill="#40c057"/>
    <circle cx="60" cy="27" r="8" fill="#40c057"/><circle cx="60" cy="26" r="5" fill="#fff"/><circle cx="58" cy="26" r="2.6" fill="#26215c"/></g>
</svg>`;

/** Cá sấu; `sign` '>' miệng về trái, '<' lật sang phải. */
export function crocEl(sign) {
  const el = h(`span.croc${sign === '<' ? '.flip' : ''}`, { html: CROC_SVG });
  return el;
}

/** Thẻ dấu trong khay (T3): mức 1–2 có cá sấu nhỏ cạnh dấu > <; mức 3 chỉ có dấu. */
export function signCard(sign, withCroc) {
  const label = { '>': 'lớn hơn', '<': 'bé hơn', '=': 'bằng' }[sign];
  return h('button.mt-sign', { type: 'button', 'aria-label': `Dấu ${label}`, dataset: { sign } },
    withCroc && sign !== '=' ? crocEl(sign) : null, h('span.mt-sign-char', { text: sign }));
}

// ---------- T2: nhóm đồ vật ----------

/** Một nhóm: đồ tách rời (lưới ô ≥ 64 px), chạm để đếm; nút chọn nhóm bên dưới. */
export function groupEl(g, side, onCount) {
  const t = THINGS[g.thing];
  let count = 0;
  const things = Array.from({ length: g.n }, () => {
    const el = h(`button.mt-thing${t.big ? '.big' : ''}`, { type: 'button', 'aria-label': t.one, text: t.emoji });
    el.addEventListener('click', () => {
      if (el.classList.contains('counted')) return; // chạm lại đồ đã đếm: không đếm lại (4.2)
      el.classList.add('counted');
      count++;
      onCount(count, el);
    });
    return el;
  });
  const pickBtn = h('button.mt-pick', { type: 'button', 'aria-label': side === 'left' ? 'Chọn nhóm bên trái' : 'Chọn nhóm bên phải', dataset: { side }, text: '👆' });
  const box = h('div.mt-group', { dataset: { side } }, h('div.mt-things', {}, ...things), pickBtn);
  return { box, things, pickBtn };
}

/**
 * Nối từng cặp bằng dây (4.2): mỗi đồ bên trái với đúng một đồ bên phải, lần lượt ~200 ms / dây; đồ thừa sáng lên.
 * Giảm chuyển động: hiện cả loạt.
 */
export async function drawPairs(board, leftThings, rightThings, signal) {
  board.querySelector('.mt-lines')?.remove();
  for (const el of [...leftThings, ...rightThings]) el.classList.remove('extra', 'paired');
  const box = board.getBoundingClientRect();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('mt-lines');
  svg.setAttribute('aria-hidden', 'true');
  board.append(svg);
  const center = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
  };
  const n = Math.min(leftThings.length, rightThings.length);
  const quick = reducedMotion();
  for (let i = 0; i < n; i++) {
    const [x1, y1] = center(leftThings[i]);
    const [x2, y2] = center(rightThings[i]);
    // Dây cong, mỗi dây cong một mức: các cặp cùng hàng không chồng lên nhau thành một đường.
    const bow = 24 + 16 * i;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const r = (v) => Math.round(v);
    line.setAttribute('d', `M${r(x1)} ${r(y1)} Q${r((x1 + x2) / 2)} ${r(Math.min(y1, y2) - bow)} ${r(x2)} ${r(y2)}`);
    svg.append(line);
    leftThings[i].classList.add('paired');
    rightThings[i].classList.add('paired');
    if (!quick) await sleep(200, signal);
  }
  for (const el of [...leftThings.slice(n), ...rightThings.slice(n)]) el.classList.add('extra');
  return svg.childElementCount;
}

// ---------- T6: bàn xếp số ----------

/** Bàn xếp số (mức 1): nút thêm thanh chục / khối lẻ; chạm vào thanh / khối đã đặt để bỏ. */
export function makeBoard() {
  const rods = h('div.mt-rods');
  const ones = h('div.mt-ones');
  const mat = h('div.mt-mat', {}, rods, ones);
  const addTen = h('button.mt-add', { type: 'button', 'aria-label': 'Thêm một thanh chục' }, rodEl(), h('span', { text: '+10' }));
  const addOne = h('button.mt-add', { type: 'button', 'aria-label': 'Thêm một khối lẻ' }, h('span.mt-one'), h('span', { text: '+1' }));
  let locked = false;
  const done = h('button.big-btn.primary.mt-done', { type: 'button', 'aria-label': 'Xong', text: '✅' });
  const board = {
    el: h('div.mt-make', {}, mat, h('div.mt-adds', {}, addTen, addOne, done)),
    done,
    get tens() { return rods.childElementCount; },
    get ones() { return ones.childElementCount; },
    addTen() {
      if (rods.childElementCount >= 9) return;
      const r = rodEl();
      r.addEventListener('click', () => !locked && r.remove());
      rods.append(r);
    },
    addOne() {
      if (ones.childElementCount >= 9) return;
      const o = h('button.mt-one', { type: 'button', 'aria-label': 'Bỏ khối lẻ' });
      o.addEventListener('click', () => !locked && o.remove());
      ones.append(o);
    },
    set(n) {
      rods.replaceChildren();
      ones.replaceChildren();
      for (let i = 0; i < tensOf(n); i++) board.addTen();
      for (let i = 0; i < onesOf(n); i++) board.addOne();
    },
    lock(on) {
      locked = on;
      for (const b of [addTen, addOne]) b.disabled = on;
    },
  };
  addTen.addEventListener('click', () => board.addTen());
  addOne.addEventListener('click', () => board.addOne());
  return board;
}

// ---------- Câu so sánh (karaoke) ----------

/** Dòng câu so sánh: các từ (cho karaoke) + dòng tiếng Việt nếu bật `showVi`. */
export function sentenceLine(sentence, showVi) {
  const words = displayWords(sentence.en).map((w) => h('span.sword', { dataset: { word: tokenize(w)[0] ?? w }, text: w }));
  const el = h('div.mt-sentence', {}, h('div.sentence.small', {}, ...words), showVi && sentence.vi ? h('p.sentence-vi', { text: sentence.vi }) : null);
  return { el, words };
}

// ---------- T4: xếp số (4.4) ----------

/** Hàng 4 chỗ trống có nhãn first / next / next / last + khay 4 thẻ số. `place(card, i)`: thẻ bay vào chỗ i. */
export function orderBoard(numbers, labels) {
  const cards = numbers.map((n) => h('button.mt-card.mt-ord', { type: 'button', 'aria-label': String(n), dataset: { n: String(n) } }, h('span.mt-num', { text: String(n) })));
  const slots = labels.map((label, i) => h('div.mt-oslot', { dataset: { index: String(i) } }, h('span.mt-olabel', { text: label })));
  return {
    el: h('div.mt-order', {}, h('div.mt-oslots', {}, ...slots), h('div.mt-tray.mt-otray', {}, ...cards)),
    cards,
    slots,
    place(card, i) {
      slots[i].append(card);
      card.classList.add('placed');
      card.disabled = true;
    },
  };
}

// ---------- T5: tia số + ếch (4.5) ----------

/**
 * Tia số [from, to], ếch đứng ở `start`. `jump(to, onStep)`: ếch nhảy từng bước (mỗi bước sáng viền số đó một lần),
 * gọi `onStep(k)` sau bước thứ k (Olly đếm bước). Giảm chuyển động: ếch đổi chỗ không trượt (CSS).
 */
export function numberLine([from, to], start) {
  const ticks = [];
  for (let n = from; n <= to; n++) ticks.push(h('button.mt-tick', { type: 'button', 'aria-label': String(n), dataset: { n: String(n) } }, h('span.mt-tick-num', { text: String(n) })));
  const frog = h('span.mt-frog', { text: '🐸', 'aria-hidden': 'true' });
  const track = h('div.mt-track', {}, ...ticks, frog);
  const el = h('div.mt-numline', {}, track);
  let at = start;
  const place = () => {
    const tick = ticks[at - from];
    if (!tick) return;
    frog.style.left = `${tick.offsetLeft + tick.offsetWidth / 2}px`;
    frog.dataset.at = String(at);
  };
  const onResize = () => {
    if (!el.isConnected) {
      window.removeEventListener('resize', onResize);
      return;
    }
    place();
  };
  window.addEventListener('resize', onResize);
  const line = {
    el,
    ticks,
    frog,
    get at() { return at; },
    /** Đặt ếch ngay (không nhảy). */
    set(n) {
      at = n;
      place();
    },
    async jump(target, onStep) {
      const dir = Math.sign(target - at);
      let k = 0;
      while (at !== target) {
        at += dir;
        k++;
        place();
        const tick = ticks[at - from];
        tick.classList.remove('step');
        void tick.offsetWidth;
        tick.classList.add('step');
        await onStep(k);
      }
      return k;
    },
  };
  requestAnimationFrame(place);
  return line;
}

// ---------- T7: nhân vật + đồ vật (4.7) ----------

/** Thẻ nhân vật chạm được; đồ vật đúng số lượng, cùng cỡ ở hai bên, nhóm 5 cách nhau; `showThings()` hiện đồ. */
export function personCard(p, thingEmoji, side) {
  const things = h('div.mt-pthings', { hidden: true, 'aria-label': `${p.n}` },
    ...Array.from({ length: p.n }, () => h('span.mt-pthing', { text: thingEmoji })));
  const card = h('button.mt-person', { type: 'button', 'aria-label': p.name, dataset: { side, name: p.name } },
    h('span.mt-pface', { text: p.emoji }), h('span.mt-pname', { text: p.name }), things);
  card.showThings = () => {
    things.hidden = false;
  };
  return card;
}
