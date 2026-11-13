// 🔢 Toán phần 2 (SPEC-math2.md): phần dùng chung — khay đáp án `answerOptions` + vị trí đáp án (2.2), câu đọc
// `mathSentence` (2.3), `problemKey` (2.4) — và bộ sinh T8 How many more (3.1), T9 Number bonds (3.2). Hàm thuần, không DOM.
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

// ---------- Tiếng Việt khi sai 2 lần ----------

export function explainSums(item) {
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

