// 🔢 Toán phần 2 (SPEC-math2.md): phần dùng chung — khay đáp án `answerOptions` + vị trí đáp án (2.2), câu đọc
// `mathSentence` (2.3), `problemKey` (2.4) — và bộ sinh T8 How many more (3.1), T9 Number bonds (3.2), T10 Add it up (3.3),
// T11 Take away (3.4). Hàm thuần, không DOM.
// Chỉ khai báo hàm ở mức module (math.js import lại file này: vòng import chỉ an toàn với function declaration).

import {
  MATH_ITEMS, numberWord, cap, randInt, pick, shuffle, kindPlan, generate, T7_PEOPLE, T7_THINGS,
} from './math.js';

// ---------- Khay đáp án (2.2) ----------

/**
 * Thẻ nhiễu cho khay: bẫy có nghĩa (theo thứ tự) → answer ± 1 → ± 2 → … ; bỏ số ngoài 0–10, trùng đáp án, trùng thẻ.
 * @param {number} answer
 * @param {number[]} traps bẫy của bài (chỉ truyền ở mức 2–3)
 * @param {number} count số thẻ cả khay (mức 1: 3, mức 2–3: 4)
 * @returns {number[]} `count − 1` thẻ nhiễu
 */
export function answerOptions(answer, traps, count) {
  const cands = [...traps];
  for (let d = 1; d <= 10; d++) cands.push(answer + d, answer - d);
  const out = [];
  for (const x of cands) {
    if (out.length === count - 1) break;
    if (Number.isInteger(x) && x >= 0 && x <= 10 && x !== answer && !out.includes(x)) out.push(x);
  }
  return out;
}

/** Số thẻ trong khay theo mức. */
export function trayCount(level) {
  return level === 1 ? 3 : 4;
}

/** Vị trí đáp án cho `n` mục: mỗi vị trí ≤ 3 lần, không hai mục liền cùng vị trí (2.2). */
export function answerSlots(rand, n, count) {
  for (;;) {
    const used = Array(count).fill(0);
    const seq = [];
    for (let i = 0; i < n; i++) {
      const free = [...Array(count).keys()].filter((p) => used[p] < 3 && p !== seq[i - 1]);
      if (!free.length) break;
      const p = pick(rand, free);
      used[p]++;
      seq.push(p);
    }
    if (seq.length === n) return seq;
  }
}

/** Khay của một mục: thẻ nhiễu xáo, đáp án ở vị trí `at`. */
export function placeOptions(rand, answer, distractors, at) {
  const out = shuffle(rand, distractors);
  out.splice(at, 0, answer);
  return out;
}

// ---------- Câu đọc (2.3) ----------

/** Số ít của đồ vật T7 (câu T8 chênh 1: "one more apple"). */
export function thingOne(thing) {
  return { fish: 'fish', sweets: 'sweet', cookies: 'cookie' }[thing] ?? thing.replace(/s$/, '');
}

/** Tên đồ không kèm từ chỉ loại ("quả táo" → "táo"). */
function thingNounVi(thing) {
  return T7_THINGS[thing].vi.split(' ').slice(1).join(' ');
}

/** Từ chỉ loại ("quả táo" → "quả"). */
function classifierVi(thing) {
  return T7_THINGS[thing].vi.split(' ')[0];
}

/** Tên tiếng Việt giữa câu: "bố", "ông" viết thường; tên riêng giữ nguyên. Đầu câu dùng `capVi`. */
const personVi = (name) => (name === 'Tom' || name === 'Anna' ? name : T7_PEOPLE[name].vi.toLowerCase());
const capVi = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Câu phép tính cộng / trừ theo mức (2.3): mức 1 *is*; mức 2–3 *equals*; trừ mức 1–2 *take away*, mức 3 *minus*. */
export function opSentence(op, a, b, answer, level) {
  const W = (n) => numberWord(n);
  const verb = level === 1 ? 'is' : 'equals';
  const sign = op === '+' ? 'plus' : level === 3 ? 'minus' : 'take away';
  return {
    en: `${cap(W(a))} ${sign} ${W(b)} ${verb} ${W(answer)}.`,
    vi: `${a} ${op === '+' ? 'cộng' : 'trừ'} ${b} bằng ${answer}.`,
  };
}

/** Câu Olly đọc mẫu và bé đọc của một mục phần 2 (bảng 2.3): { en, vi }. */
export function mathSentence(item) {
  if (item.key === 't8') {
    const { more, less, thing, answer } = item;
    return {
      en: `${more.name} has ${numberWord(answer)} more ${answer === 1 ? thingOne(thing) : thing}.`,
      vi: capVi(`${personVi(more.name)} có nhiều hơn ${personVi(less.name)} ${answer} ${T7_THINGS[thing].vi}.`),
    };
  }
  if (item.key === 't9') {
    // Đọc theo hai cánh từ trái sang phải (khớp hình).
    const [l, r] = bondSides(item);
    return { en: `${cap(numberWord(item.total))} is ${numberWord(l)} and ${numberWord(r)}.`, vi: `${item.total} gồm ${l} và ${r}.` };
  }
  return opSentence(item.op, item.a, item.b, item.answer, item.level);
}

// ---------- T8 — How many more? (3.1) ----------

/** Câu đố T8 (Olly đọc karaoke): hàng trên nói trước, hỏi theo người có nhiều hơn. */
export function moreText(item) {
  const rows = item.top === 'more' ? [item.more, item.less] : [item.less, item.more];
  const t = item.thing;
  const has = (p) => `${p.name} has ${p.n} ${p.n === 1 ? thingOne(t) : t}.`;
  const hasVi = (p) => capVi(`${personVi(p.name)} có ${p.n} ${T7_THINGS[t].vi}.`);
  return {
    en: `${rows.map(has).join(' ')} How many more ${t} does ${item.more.name} have?`,
    vi: `${rows.map(hasVi).join(' ')} ${capVi(personVi(item.more.name))} có nhiều hơn ${personVi(item.less.name)} mấy ${classifierVi(t)} ${thingNounVi(t)}?`,
  };
}

/**
 * Một mục T8. `top`: người nhiều hơn ở hàng trên ('more') hay dưới ('less').
 * @param {{ more: [string, number], less: [string, number], thing: string, top: 'more'|'less' }} spec
 */
export function t8Item({ more, less, thing, top }, level, rand, at) {
  const [mn, ln] = [more[1], less[1]];
  const answer = mn - ln;
  const count = trayCount(level);
  const options = placeOptions(rand, answer, answerOptions(answer, level === 1 ? [] : [mn, ln], count), at);
  const kind = level === 3 ? 't8:scattered' : answer <= 2 ? 't8:small-gap' : 't8:big-gap';
  return {
    key: 't8', level, more: { name: more[0], n: mn }, less: { name: less[0], n: ln }, thing, top, answer, options, at,
    layout: level === 3 ? 'scattered' : 'columns', kind, side: null, pair: `more:${mn}-${ln}`,
  };
}

export function makeT8(level, rand, { weak = null, recent = [] } = {}) {
  const avoid = new Set(recent);
  const max = level === 1 ? 6 : 10;
  const base = level === 3
    ? Array(MATH_ITEMS).fill('t8:scattered')
    : level === 1
      ? ['t8:small-gap', 't8:small-gap', 't8:small-gap', 't8:small-gap', 't8:small-gap', 't8:big-gap', 't8:big-gap', 't8:big-gap']
      : ['t8:small-gap', 't8:small-gap', 't8:small-gap', 't8:small-gap', 't8:big-gap', 't8:big-gap', 't8:big-gap', 't8:big-gap'];
  const gapOf = (kind) => (kind === 't8:small-gap' ? randInt(rand, 1, 2) : kind === 't8:big-gap' ? randInt(rand, 3, level === 1 ? 3 : 5) : randInt(rand, 1, 5));
  const people = Object.keys(T7_PEOPLE);
  const build = (w) => {
    const kinds = kindPlan(rand, base, w);
    const tops = shuffle(rand, ['more', 'more', 'more', 'more', 'less', 'less', 'less', 'less']);
    const slots = answerSlots(rand, MATH_ITEMS, trayCount(level));
    const used = new Set();
    const items = kinds.map((kind, i) => {
      for (let tries = 0; tries < 60; tries++) {
        const gap = gapOf(kind);
        const ln = randInt(rand, 1, max - gap);
        const key = `more:${ln + gap}-${ln}`;
        if (used.has(key) || (tries < 40 && avoid.has(key))) continue;
        used.add(key);
        const [a, b] = shuffle(rand, people).slice(0, 2);
        return t8Item({ more: [a, ln + gap], less: [b, ln], thing: pick(rand, Object.keys(T7_THINGS)), top: tops[i] }, level, rand, slots[i]);
      }
      return null;
    });
    return items.every(Boolean) ? items : null;
  };
  const check = (items) => {
    const top = items.filter((x) => x.top === 'more').length;
    return top >= 3 && top <= 5 && new Set(items.map((x) => x.pair)).size === items.length
      && items.every((x) => x.more.n <= max && x.less.n >= 1 && x.answer >= 1 && x.answer <= (level === 1 ? 3 : 5));
  };
  return generate(rand, build, check, weak);
}

// ---------- T9 — Number bonds (3.2) ----------

/** Số chấm hai cánh [trái, phải]. */
export function bondSides(item) {
  return item.hidden === 'right' ? [item.known, item.answer] : [item.answer, item.known];
}

/** Câu hỏi T9. */
export function bondText(item) {
  return {
    en: `The ladybug has ${item.total} spots. How many spots are hidden?`,
    vi: `Bọ rùa có ${item.total} chấm. Cánh úp đang che mấy chấm?`,
  };
}

/** Một mục T9: `known` chấm ở cánh mở, `hidden` là bên cánh úp; `known = 0` thì cánh úp luôn bên phải. */
export function t9Item({ total, known, hidden }, level, rand, at) {
  const answer = total - known;
  const options = placeOptions(rand, answer, answerOptions(answer, level === 1 ? [] : [total, known], trayCount(level)), at);
  const kind = known === 0 ? 't9:zero' : total === 10 ? 't9:ten' : total <= 5 ? 't9:small' : 't9:big';
  return {
    key: 't9', level, total, known, answer, hidden: known === 0 ? 'right' : hidden, options, at, kind, side: null,
    pair: `bond:${total}-${known}`,
  };
}

export function makeT9(level, rand, { weak = null, recent = [] } = {}) {
  const avoid = new Set(recent);
  const build = (w) => {
    const base = level === 1
      ? Array(MATH_ITEMS).fill('t9:small')
      : level === 2
        ? ['t9:small', 't9:small', 't9:big', 't9:big', 't9:big', 't9:big', 't9:ten', 't9:ten']
        : ['t9:small', 't9:big', 't9:big', 't9:big', 't9:ten', 't9:ten', 't9:ten', rand() < 0.5 ? 't9:zero' : 't9:big'];
    const kinds = kindPlan(rand, base, w);
    if (kinds.filter((k) => k === 't9:zero').length > 1) return null;
    const sides = shuffle(rand, ['left', 'left', 'left', 'left', 'right', 'right', 'right', 'right']);
    const slots = answerSlots(rand, MATH_ITEMS, trayCount(level));
    const used = new Set();
    const items = kinds.map((kind, i) => {
      for (let tries = 0; tries < 60; tries++) {
        const total = kind === 't9:small' ? randInt(rand, 2, 5) : kind === 't9:big' ? randInt(rand, 6, 9) : kind === 't9:ten' ? 10 : randInt(rand, 3, 10);
        const known = kind === 't9:zero' ? 0 : randInt(rand, 1, total - 1);
        const key = `bond:${total}-${known}`;
        if (used.has(key) || (tries < 40 && avoid.has(key))) continue;
        used.add(key);
        return t9Item({ total, known, hidden: sides[i] }, level, rand, slots[i]);
      }
      return null;
    });
    return items.every(Boolean) ? items : null;
  };
  const check = (items) => {
    const left = items.filter((x) => x.hidden === 'left').length;
    if (left < 3 || left > 5) return false;
    if (new Set(items.map((x) => x.pair)).size !== items.length) return false;
    if (level === 3 && items.filter((x) => x.total === 10).length < 3) return false;
    return items.every((x) => x.answer >= 1 && x.total >= 2 && x.total <= (level === 1 ? 5 : 10) && (x.known > 0 || level === 3));
  };
  return generate(rand, build, check, weak);
}

// ---------- T10 Add it up / T11 Take away (3.3, 3.4) ----------

/**
 * Đồ của câu chuyện T10 / T11 (mức 1–2): chỗ ở, việc "thêm" và "bớt" (số nhiều / số ít), tiếng Việt.
 * `vi` là từ chỉ loại + tên ("con vịt"); câu tiếng Việt bỏ từ chỉ loại khi đã nhắc ("bay đi 2 con").
 */
export const SUM_THINGS = {
  ducks: { emoji: '🦆', one: 'duck', vi: 'con vịt', place: ['in the pond', 'trong ao'], add: ['come', 'comes', 'đến'], take: ['swim away', 'swims away', 'bơi đi'] },
  birds: { emoji: '🐦', one: 'bird', vi: 'con chim', place: ['on the tree', 'trên cây'], add: ['fly in', 'flies in', 'bay đến'], take: ['fly away', 'flies away', 'bay đi'] },
  fish: { emoji: '🐟', one: 'fish', vi: 'con cá', place: ['in the tank', 'trong bể'], add: ['swim in', 'swims in', 'bơi vào'], take: ['swim away', 'swims away', 'bơi đi'] },
  apples: { emoji: '🍎', one: 'apple', vi: 'quả táo', place: ['in the basket', 'trong giỏ'], add: ['are put in', 'is put in', 'được bỏ thêm vào'], take: ['are eaten', 'is eaten', 'bị ăn mất'] },
  cookies: { emoji: '🍪', one: 'cookie', vi: 'cái bánh quy', place: ['on the plate', 'trên đĩa'], add: ['are put on', 'is put on', 'được bày thêm'], take: ['are eaten', 'is eaten', 'bị ăn mất'] },
};

const OP_WORD = (op, level) => (op === '+' ? 'plus' : level === 3 ? 'minus' : 'take away');

/** Câu Olly hỏi: mức 1–2 câu chuyện (karaoke), mức 3 chỉ phép tính. */
export function opText(item) {
  const { op, a, b, level } = item;
  if (!item.story) {
    return { en: `What is ${a} ${OP_WORD(op, level)} ${b}?`, vi: `${a} ${op === '+' ? 'cộng' : 'trừ'} ${b} bằng mấy?` };
  }
  const t = SUM_THINGS[item.thing];
  const n = (k) => `${k} ${k === 1 ? t.one : item.thing}`;
  const is = (k) => (k === 1 ? 'is' : 'are');
  const [place, placeVi] = t.place;
  if (op === '+') {
    return {
      en: `${n(a)} ${is(a)} ${place}. ${b} more ${b === 1 ? t.one : item.thing} ${t.add[b === 1 ? 1 : 0]}. How many ${item.thing} are there altogether?`,
      vi: `Có ${a} ${t.vi} ${placeVi}. Thêm ${b} ${t.vi} nữa ${t.add[2]}. Hỏi có tất cả bao nhiêu ${t.vi}?`,
    };
  }
  return {
    en: `${n(a)} ${is(a)} ${place}. ${n(b)} ${t.take[b === 1 ? 1 : 0]}. How many ${item.thing} are left?`,
    vi: `Có ${a} ${t.vi} ${placeVi}. ${b} ${t.vi} ${t.take[2]}. Còn lại bao nhiêu ${t.vi}?`,
  };
}

/** Một mục T10 / T11. Mức 1–2 có câu chuyện (`thing`), mức 3 chỉ phép tính. */
export function opItem({ op, a, b, thing = null }, level, rand, at) {
  const answer = op === '+' ? a + b : a - b;
  const key = op === '+' ? 't10' : 't11';
  const story = level < 3;
  // Bẫy (mức 2–3): cộng — a − b (nếu ≥ 0), số hạng lớn hơn; trừ — a + b (cộng nhầm), số trừ.
  const traps = level === 1 ? [] : op === '+' ? [a - b, Math.max(a, b)] : [a + b, b];
  const options = placeOptions(rand, answer, answerOptions(answer, traps, trayCount(level)), at);
  const zero = a === 0 || b === 0;
  // Chiến lược khi sai (3.3): mức 1 đếm hết; mức 2 đếm tiếp từ số ban đầu; mức 3 từ số lớn hơn; có 0 → không đếm tiếp.
  const hint = op === '−' ? 'count-left' : zero ? 'no-more' : level === 1 ? 'count-all' : level === 2 ? 'count-on-start' : 'count-on-bigger';
  const start = op === '−' ? null : hint === 'count-on-bigger' || zero ? Math.max(a, b) : a;
  const size = op === '+' ? answer : a;
  const kind = op === '+'
    ? (zero ? 't10:zero' : size <= 5 ? 't10:to5' : 't10:to10')
    : (b === 0 ? 't11:zero' : b === a ? 't11:all' : size <= 5 ? 't11:to5' : 't11:to10');
  return {
    key, level, op, a, b, answer, thing: story ? thing : null, story, hint, start, options, at, kind, side: null,
    pair: `${op === '+' ? 'add' : 'sub'}:${a}-${b}`,
  };
}

export function makeT10(level, rand, { weak = null, recent = [] } = {}) {
  const avoid = new Set(recent);
  const max = level === 1 ? 5 : 10;
  const base = level === 1
    ? Array(MATH_ITEMS).fill('t10:to5')
    : level === 2
      ? ['t10:to5', 't10:to5', 't10:to10', 't10:to10', 't10:to10', 't10:to10', 't10:to10', 't10:to10']
      : ['t10:turnaround', 't10:turnaround', 't10:zero', 't10:to5', 't10:to10', 't10:to10', 't10:to10', 't10:to10'];
  const things = Object.keys(SUM_THINGS);
  const build = (w) => {
    const kinds = kindPlan(rand, base, w);
    if (kinds.filter((k) => k === 't10:turnaround').length !== (level === 3 ? 2 : 0)) return null;
    const slots = answerSlots(rand, MATH_ITEMS, trayCount(level));
    const used = new Set();
    let turn = null; // cặp đổi chỗ: mục đầu chọn số, mục sau lấy ngược lại
    const items = kinds.map((kind, i) => {
      for (let tries = 0; tries < 60; tries++) {
        let a;
        let b;
        if (kind === 't10:turnaround') {
          if (turn) [b, a] = turn;
          else {
            a = randInt(rand, 1, 8);
            b = randInt(rand, 1, 10 - a);
            if (a === b) continue;
          }
        } else if (kind === 't10:zero') {
          const n = randInt(rand, 1, 10);
          [a, b] = rand() < 0.5 ? [n, 0] : [0, n];
        } else {
          const sum = kind === 't10:to5' ? randInt(rand, 2, 5) : randInt(rand, 6, max);
          a = randInt(rand, 1, sum - 1);
          b = sum - a;
        }
        const key = `add:${a}-${b}`;
        if (used.has(key) || (tries < 40 && !(kind === 't10:turnaround' && turn) && avoid.has(key))) continue;
        used.add(key);
        if (kind === 't10:turnaround') turn = turn ? null : [a, b];
        const it = opItem({ op: '+', a, b, thing: pick(rand, things) }, level, rand, slots[i]);
        if (kind === 't10:turnaround') it.kind = kind;
        return it;
      }
      return null;
    });
    return items.every(Boolean) ? items : null;
  };
  const check = (items) => {
    if (new Set(items.map((x) => x.pair)).size !== items.length) return false;
    if (!items.every((x) => x.answer <= max && (x.a > 0 || x.b > 0) && (level === 3 || (x.a > 0 && x.b > 0)))) return false;
    if (level < 3) return true;
    const turns = items.map((x, i) => (x.kind === 't10:turnaround' ? i : -1)).filter((i) => i >= 0);
    return turns.length === 2 && turns[1] - turns[0] > 1 && items.some((x) => x.kind === 't10:zero');
  };
  return generate(rand, build, check, weak);
}

export function makeT11(level, rand, { weak = null, recent = [] } = {}) {
  const avoid = new Set(recent);
  const max = level === 1 ? 5 : 10;
  const base = level === 1
    ? Array(MATH_ITEMS).fill('t11:to5')
    : level === 2
      ? ['t11:to5', 't11:to5', 't11:to10', 't11:to10', 't11:to10', 't11:to10', 't11:to10', 't11:to10']
      : ['t11:zero', 't11:all', 't11:to5', 't11:to5', 't11:to10', 't11:to10', 't11:to10', 't11:to10'];
  const things = Object.keys(SUM_THINGS);
  const build = (w) => {
    const kinds = kindPlan(rand, base, w);
    const slots = answerSlots(rand, MATH_ITEMS, trayCount(level));
    const used = new Set();
    const items = kinds.map((kind, i) => {
      for (let tries = 0; tries < 60; tries++) {
        const a = kind === 't11:to5' ? randInt(rand, 2, 5) : kind === 't11:to10' ? randInt(rand, 6, max) : randInt(rand, kind === 't11:zero' ? 1 : 2, 10);
        const b = kind === 't11:zero' ? 0 : kind === 't11:all' ? a : randInt(rand, 1, a - 1);
        const key = `sub:${a}-${b}`;
        if (used.has(key) || (tries < 40 && avoid.has(key))) continue;
        used.add(key);
        return opItem({ op: '−', a, b, thing: pick(rand, things) }, level, rand, slots[i]);
      }
      return null;
    });
    return items.every(Boolean) ? items : null;
  };
  const check = (items) => {
    if (new Set(items.map((x) => x.pair)).size !== items.length) return false;
    if (!items.every((x) => x.a <= max && x.b <= x.a && (level === 3 || (x.b >= 1 && x.answer >= 1)))) return false;
    return level < 3 || (items.some((x) => x.b === 0) && items.some((x) => x.b === x.a));
  };
  return generate(rand, build, check, weak);
}

/** Câu Olly gợi ý khi sai lần 1 (T10 / T11, 3.3, 3.4). */
export function opHintLine(item) {
  if (item.op === '+') {
    if (item.hint === 'count-all') return "Let's count them all!";
    if (item.hint === 'no-more') return `Start at ${numberWord(item.start)}. No more to add!`;
    return `Start at ${numberWord(item.start)}. Count on!`;
  }
  const things = item.story ? item.thing : null;
  if (item.answer === 0) return things ? `Look! No ${things} are left.` : 'Look! None are left.';
  if (item.b === 0) return 'Nothing is taken away!';
  return 'Count the ones that are left!';
}

// ---------- Tiếng Việt khi sai 2 lần ----------

export function explainSums(item) {
  if (item.op) {
    const { op, a, b, answer } = item;
    const calc = `${a} ${op === '+' ? 'cộng' : 'trừ'} ${b} bằng ${answer}.`;
    if (op === '+') {
      if (a === 0 || b === 0) return `Cộng với 0 thì không thêm gì: ${calc}`;
      if (item.story) {
        const t = SUM_THINGS[item.thing].vi;
        return `Có ${a} ${t}, thêm ${b} ${t.split(' ')[0]} nữa. Gộp lại: ${calc}`;
      }
      const small = Math.min(a, b);
      const on = Array.from({ length: small }, (_, i) => item.start + 1 + i).join(', ');
      return `Bắt đầu từ số lớn hơn là ${item.start}, đếm tiếp ${on}: ${calc}`;
    }
    if (b === 0) return `Trừ 0 thì không bớt gì: ${calc}`;
    if (b === a) return `Bớt đi hết ${a} thì không còn gì: ${calc}`;
    if (item.story) {
      const t = SUM_THINGS[item.thing];
      return `Có ${a} ${t.vi}, ${b} ${t.vi.split(' ')[0]} ${t.take[2]}. Đếm phần còn lại: ${calc}`;
    }
    return `Có ${a}, gạch đi ${b} ô, đếm các ô còn lại: ${calc}`;
  }
  if (item.key === 't8') {
    const { more, less, thing, answer } = item;
    const t = T7_THINGS[thing].vi;
    return `Ghép mỗi ${t} của ${personVi(more.name)} với một ${t} của ${personVi(less.name)}. ${capVi(personVi(more.name))} còn ${answer} ${t} không có cặp. Vậy ${personVi(more.name)} nhiều hơn ${personVi(less.name)} ${answer} ${t}.`;
  }
  const { total, known, answer } = item;
  const [l, r] = bondSides(item);
  if (known === 0) return `${total} gồm 0 và ${total}. Cánh này không có chấm nào, nên cả ${total} chấm đều ở cánh kia.`;
  const on = Array.from({ length: answer }, (_, i) => known + 1 + i).join(', ');
  return `${total} gồm ${l} và ${r}. Có ${known} chấm rồi, đếm tiếp ${on}: thêm ${answer} chấm.`;
}

/** Câu Olly đếm phần hơn của T8 sau khi đúng: "One, two!" */
export function countLine(n) {
  return `${cap(Array.from({ length: n }, (_, i) => numberWord(i + 1)).join(", "))}!`;
}

