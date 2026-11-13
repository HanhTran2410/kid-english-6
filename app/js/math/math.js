// Khu 🔢 Math / Toán (SPEC-math.md). Hàm thuần, không DOM: thông tin bài, đọc số thành chữ, bộ sinh câu hỏi từng bài
// (mục 7 — `makeItems(level, rand, opts)` → 8 mục, `rand` cố định được trong test), luật cân bằng đáp án, mở mức (6.2),
// kiểu câu hay sai (6.4), chọn mục có phần bé đọc câu (3.3).

import { makeT8, makeT9, mathSentence, explainSums } from './sums.js';

export const MATH_ITEMS = 8;
export const MAX_LEVEL = 3;

/** Bài có sẵn (mục 7). `batch`: đợt làm (mục 8) — chỉ bài đã làm mới hiện ở danh sách. */
export const BUILTIN_MATH = [
  { id: 'math-t1', key: 't1', emoji: '🔢', title: 'Bigger or smaller?', titleVi: 'Số nào lớn hơn', batch: 'a' },
  { id: 'math-t2', key: 't2', emoji: '🐘', title: 'Which group has more?', titleVi: 'Nhóm nào nhiều hơn', batch: 'a' },
  { id: 'math-t3', key: 't3', emoji: '🐊', title: 'Hungry crocodile', titleVi: 'Cá sấu > < =', batch: 'a' },
  { id: 'math-t4', key: 't4', emoji: '📏', title: 'Line them up', titleVi: 'Xếp số', batch: 'b' },
  { id: 'math-t5', key: 't5', emoji: '🐸', title: 'Number line', titleVi: 'Tia số', batch: 'b' },
  { id: 'math-t6', key: 't6', emoji: '🧱', title: 'Tens and ones', titleVi: 'Chục và đơn vị', batch: 'a' },
  { id: 'math-t7', key: 't7', emoji: '📖', title: 'Read and compare', titleVi: 'Đọc và so sánh', batch: 'c' },
  // Toán phần 2 (SPEC-math2.md)
  { id: 'math-t8', key: 't8', emoji: '🍎', title: 'How many more?', titleVi: 'Hơn bao nhiêu', batch: 'd' },
  { id: 'math-t9', key: 't9', emoji: '🐞', title: 'Number bonds', titleVi: 'Tách – gộp số', batch: 'd' },
];
export const MATH_BY_ID = new Map(BUILTIN_MATH.map((l) => [l.id, l]));
export const isMathLesson = (lessonId) => String(lessonId ?? '').startsWith('math-');

// ---------- Số thành chữ (tới 100) ----------

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numberWord(n) {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new Error(`Số ngoài phạm vi: ${n}`);
  if (n === 100) return 'one hundred';
  if (n < 20) return ONES[n];
  return n % 10 ? `${TENS[Math.floor(n / 10)]}-${ONES[n % 10]}` : TENS[n / 10];
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const tensOf = (n) => Math.floor(n / 10);
export const onesOf = (n) => n % 10;
export const plural = (n, one, many) => `${numberWord(n)} ${n === 1 ? one : many}`;

// ---------- Đồ vật của T2 (mục 4.2): cặp to / nhỏ, mỗi đồ có hình ----------

export const THINGS = {
  elephant: { emoji: '🐘', one: 'elephant', many: 'elephants', vi: 'voi', big: true },
  mouse: { emoji: '🐭', one: 'mouse', many: 'mice', vi: 'chuột', big: false },
  bear: { emoji: '🐻', one: 'bear', many: 'bears', vi: 'gấu', big: true },
  ant: { emoji: '🐜', one: 'ant', many: 'ants', vi: 'kiến', big: false },
  whale: { emoji: '🐳', one: 'whale', many: 'whales', vi: 'cá voi', big: true },
  fish: { emoji: '🐟', one: 'fish', many: 'fish', vi: 'cá', big: false },
  cow: { emoji: '🐄', one: 'cow', many: 'cows', vi: 'bò', big: true },
  chick: { emoji: '🐤', one: 'chick', many: 'chicks', vi: 'gà con', big: false },
  horse: { emoji: '🐎', one: 'horse', many: 'horses', vi: 'ngựa', big: true },
  snail: { emoji: '🐌', one: 'snail', many: 'snails', vi: 'ốc sên', big: false },
  lion: { emoji: '🦁', one: 'lion', many: 'lions', vi: 'sư tử', big: true },
  bee: { emoji: '🐝', one: 'bee', many: 'bees', vi: 'ong', big: false },
};
export const THING_PAIRS = [['elephant', 'mouse'], ['bear', 'ant'], ['whale', 'fish'], ['cow', 'chick'], ['horse', 'snail'], ['lion', 'bee']];

// ---------- Ngẫu nhiên ----------

/** Bộ sinh số ngẫu nhiên cố định được (mulberry32) — test truyền `seeded(1)`. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randInt = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
export const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
export function shuffle(rand, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Phạm vi số theo mức (mục 4.8) ----------

/** Cặp số khác nhau cho T1 / T3 theo mức. `near`: cặp sát nhau qua mốc 10 (mức 3). */
function numberPair(rand, level, near = false) {
  for (;;) {
    let a;
    let b;
    if (near) {
      const lo = randInt(rand, 8, 10);
      const hi = randInt(rand, Math.max(lo + 1, 10), Math.min(lo + 3, 12));
      [a, b] = rand() < 0.5 ? [lo, hi] : [hi, lo];
    } else {
      const max = level === 1 ? 10 : 20;
      a = randInt(rand, 1, max);
      b = randInt(rand, 1, max);
    }
    const diff = Math.abs(a - b);
    if (diff === 0) continue;
    if (level === 1 && diff < 3) continue;
    return [a, b];
  }
}

/** Mức 3 (T1, T3): cặp có ít nhất một số ≤ 10 và một số ≥ 10, chênh ≤ 3. */
export const isNear10 = (a, b) => a !== b && Math.min(a, b) >= 8 && Math.min(a, b) <= 10 && Math.max(a, b) >= 10 && Math.abs(a - b) <= 3;

// ---------- Kiểu câu (mục 6.4) ----------

/** Các kiểu câu của từng bài theo mức (kiểu hay sai chỉ xét kiểu có ở mức đang chơi). */
export function kindsAt(key, level) {
  if (key === 't1') return ['t1:bigger', 't1:smaller'];
  if (key === 't2') return ['t2:more', 't2:fewer', 't2:same'];
  if (key === 't3') return level >= 2 ? ['t3:greater', 't3:less', 't3:equal'] : ['t3:greater', 't3:less'];
  if (key === 't6') return level === 1 ? ['t6:make'] : level === 2 ? ['t6:diff-tens'] : ['t6:diff-tens', 't6:same-tens', 't6:swap-digits'];
  if (key === 't4') return level === 3 ? ['t4:desc'] : ['t4:asc'];
  if (key === 't5') return level === 1 ? ['t5:after', 't5:before'] : level === 2 ? ['t5:after', 't5:before', 't5:between'] : ['t5:after', 't5:before', 't5:between', 't5:more', 't5:less'];
  if (key === 't7') return ['t7:more', 't7:fewer'];
  if (key === 't8') return level === 3 ? ['t8:scattered'] : ['t8:small-gap', 't8:big-gap'];
  if (key === 't9') return level === 1 ? ['t9:small'] : level === 2 ? ['t9:small', 't9:big', 't9:ten'] : ['t9:small', 't9:big', 't9:ten', 't9:zero'];
  return [];
}

/**
 * Kiểu hay sai (6.4) từ các bản ghi mục của bài: gộp theo `kind`, kiểu có tỉ lệ independent / seen thấp nhất,
 * chỉ xét kiểu gặp ≥ 3 lần và có ở `kinds`. Không có → null.
 */
export function weakKind(records, kinds) {
  const by = new Map();
  for (const r of records) {
    if (!r.kind || !kinds.includes(r.kind)) continue;
    const s = by.get(r.kind) ?? { seen: 0, independent: 0 };
    s.seen += r.seen ?? 0;
    s.independent += r.independent ?? 0;
    by.set(r.kind, s);
  }
  let best = null;
  for (const [kind, s] of by) {
    if (s.seen < 3) continue;
    const ratio = s.independent / s.seen;
    if (!best || ratio < best.ratio) best = { kind, ratio };
  }
  return best && best.ratio < 1 ? best.kind : null;
}

/** Tỉ lệ đúng ngay theo kiểu, cho Góc bố mẹ: [{ kind, seen, independent }]. */
export function kindStats(records) {
  const by = new Map();
  for (const r of records) {
    if (!r.kind) continue;
    const s = by.get(r.kind) ?? { kind: r.kind, seen: 0, independent: 0 };
    s.seen += r.seen ?? 0;
    s.independent += r.independent ?? 0;
    by.set(r.kind, s);
  }
  return [...by.values()];
}

// ---------- Luật cân bằng chung (mục 7) ----------

/** Bên của đáp án để cân bằng trái / phải (T1, T2, T3, T6 so sánh, T7 nhân vật; T5 sau / trước trên tia số);
 * null = không có bên (the same, dấu =, T6 tạo số, T4 xếp hàng, T5 between). */
export const sideOf = (item) => item.side ?? null;

const SINGLE_KINDS = new Set(['t6:make', 't4:asc', 't4:desc']);

/** Kiểm tra một lượt theo luật chung. Trả về danh sách lỗi (rỗng = hợp lệ). */
export function roundProblems(items) {
  const errs = [];
  if (items.length !== MATH_ITEMS) errs.push(`cần ${MATH_ITEMS} mục`);
  const sides = items.map(sideOf);
  for (const s of ['left', 'right']) {
    if (sides.filter((x) => x === s).length > 5) errs.push(`quá 5 mục bên ${s}`);
  }
  let run = 1;
  for (let i = 1; i < sides.length; i++) {
    run = sides[i] && sides[i] === sides[i - 1] ? run + 1 : 1;
    if (run > 3) errs.push('quá 3 mục liền cùng một bên');
  }
  const pos = (x) => x.at ?? sideOf(x);
  const pairs = new Map();
  items.forEach((it, i) => {
    pairs.set(it.pair, (pairs.get(it.pair) ?? 0) + 1);
    if (i > 0 && it.pair === items[i - 1].pair) errs.push('lặp ngay mục trước');
    // Bài chỉ có một kiểu câu và không có bên đáp án (T6 tạo số, T4 xếp hàng): không xét.
    if (i > 0 && !SINGLE_KINDS.has(it.kind) && it.kind === items[i - 1].kind && it.ask === items[i - 1].ask && pos(it) === pos(items[i - 1])) errs.push('hai mục liền giống kiểu câu + vị trí đáp án');
  });
  for (const [p, n] of pairs) if (n > 2) errs.push(`cặp ${p} lặp quá 2 lần`);
  return errs;
}

/** Dãy kiểu câu cho 8 mục: chia đều, kiểu hay sai thêm tối đa 1 mục. */
export function kindPlan(rand, base, weak) {
  const plan = [...base];
  if (weak && plan.includes(weak)) {
    // Đổi một mục của kiểu đang nhiều nhất (khác `weak`) sang `weak`.
    const counts = new Map();
    for (const k of plan) counts.set(k, (counts.get(k) ?? 0) + 1);
    const donor = [...counts].filter(([k]) => k !== weak).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (donor) plan[plan.indexOf(donor)] = weak;
  }
  return shuffle(rand, plan);
}

/** Sinh tới khi đúng luật; `weak` không đủ chỗ thì bỏ ưu tiên, không phá luật (mục 7). */
export function generate(rand, build, check, weak) {
  for (const w of weak ? [weak, null] : [null]) {
    for (let attempt = 0; attempt < 400; attempt++) {
      const items = build(w);
      if (items && !roundProblems(items).length && check(items)) return items;
    }
  }
  throw new Error('Không sinh được lượt hợp lệ');
}

// ---------- T1 — Bigger or smaller? ----------

export function sentenceT1(item) {
  const [big, small] = item.a > item.b ? [item.a, item.b] : [item.b, item.a];
  return item.ask === 'bigger'
    ? { en: `${cap(numberWord(big))} is bigger than ${numberWord(small)}.`, vi: `${big} lớn hơn ${small}.` }
    : { en: `${cap(numberWord(small))} is smaller than ${numberWord(big)}.`, vi: `${small} nhỏ hơn ${big}.` };
}

function makeT1(level, rand, { weak = null } = {}) {
  const build = (w) => {
    const kinds = kindPlan(rand, ['t1:bigger', 't1:bigger', 't1:bigger', 't1:bigger', 't1:smaller', 't1:smaller', 't1:smaller', 't1:smaller'], w);
    const nearAt = level === 3 ? new Set(shuffle(rand, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 3)) : new Set();
    return kinds.map((kind, i) => {
      const [a, b] = numberPair(rand, level, nearAt.has(i));
      const ask = kind === 't1:bigger' ? 'bigger' : 'smaller';
      const leftWins = ask === 'bigger' ? a > b : a < b;
      return { a, b, ask, kind, side: leftWins ? 'left' : 'right', pair: `${a}-${b}` };
    });
  };
  const check = (items) => {
    const asks = items.filter((x) => x.ask === 'bigger').length;
    if (asks < 3 || asks > 5) return false;
    const sides = items.filter((x) => x.side === 'left').length;
    if (sides < 3 || sides > 5) return false;
    return items.every((x) => (level === 1 ? Math.max(x.a, x.b) <= 10 && Math.abs(x.a - x.b) >= 3 : Math.max(x.a, x.b) <= 20));
  };
  return generate(rand, build, check, weak);
}

// ---------- T2 — Which group has more? ----------

export function sentenceT2(item) {
  if (item.answer === 'same') return { en: 'They are the same.', vi: 'Hai nhóm bằng nhau.' };
  const g = item[item.answer];
  const t = THINGS[g.thing];
  return item.ask === 'more'
    ? { en: `There are more ${t.many}.`, vi: `Có nhiều ${t.vi} hơn.` }
    : { en: `There are fewer ${t.many}.`, vi: `Có ít ${t.vi} hơn.` };
}

/** Câu kiểm chứng sau khi nối từng cặp (4.2): "Look! Two mice have no partner." — câu "There are more mice." đọc riêng. */
export function pairLineT2(item) {
  const { left, right } = item;
  if (left.n === right.n) return 'Look! Every one has a partner.';
  const more = left.n > right.n ? left : right;
  const t = THINGS[more.thing];
  const extra = Math.abs(left.n - right.n);
  return `Look! ${cap(plural(extra, t.one, t.many))} ${extra === 1 ? 'has' : 'have'} no partner.`;
}

/** Câu "Let's check! Seven blocks… four blocks." (T1, T3) */
export const blocksLine = (a, b) => `Let's check! ${cap(plural(a, 'block', 'blocks'))}… ${plural(b, 'block', 'blocks')}.`;

/** Câu chỉ chỗ sai của T6 so sánh (4.6): chục khác → so chục; chục bằng → so đơn vị. */
export function tensLine(a, b) {
  if (tensOf(a) !== tensOf(b)) return `Look at the tens first! ${cap(plural(tensOf(a), 'ten', 'tens'))}… ${plural(tensOf(b), 'ten', 'tens')}.`;
  return `The tens are the same. Look at the ones! ${cap(plural(onesOf(a), 'one', 'ones'))}… ${plural(onesOf(b), 'one', 'ones')}.`;
}

export { cap };

function makeT2(level, rand, { weak = null, maxGroup = 10 } = {}) {
  const max = level === 1 ? 6 : Math.max(6, Math.min(10, maxGroup));
  const build = (w) => {
    const sameCount = rand() < 0.5 ? 1 : 2;
    const base = ['t2:same', ...(sameCount === 2 ? ['t2:same'] : []), 't2:more', 't2:more', 't2:more', 't2:fewer', 't2:fewer', 't2:fewer'];
    while (base.length < MATH_ITEMS) base.push(rand() < 0.5 ? 't2:more' : 't2:fewer');
    const kinds = kindPlan(rand, base, w);
    // Same: tối đa 2 / lượt (mục 4.2) — kiểu hay sai không được đẩy lên 3.
    if (kinds.filter((k) => k === 't2:same').length > 2) return null;
    const unequal = kinds.map((k, i) => (k === 't2:same' ? -1 : i)).filter((i) => i >= 0);
    const decoyAt = new Set(shuffle(rand, unequal).slice(0, Math.ceil(unequal.length / 2)));
    return kinds.map((kind, i) => {
      const [bigThing, smallThing] = pick(rand, THING_PAIRS);
      if (kind === 't2:same') {
        const n = randInt(rand, 2, max);
        const bigLeft = rand() < 0.5;
        return {
          left: { thing: bigLeft ? bigThing : smallThing, n }, right: { thing: bigLeft ? smallThing : bigThing, n },
          ask: rand() < 0.5 ? 'more' : 'fewer', answer: 'same', kind, side: null, pair: `${n}-${n}`, decoy: false,
        };
      }
      let lo;
      let hi;
      do {
        lo = randInt(rand, 1, max - 1);
        hi = randInt(rand, lo + 1, max);
      } while (level === 1 && hi - lo < 2);
      const decoy = decoyAt.has(i);
      // Nhiễu kích thước: nhóm NHIỀU hơn là nhóm đồ NHỎ (chuột nhiều hơn voi).
      const many = { thing: decoy ? smallThing : bigThing, n: hi };
      const few = { thing: decoy ? bigThing : smallThing, n: lo };
      const manyLeft = rand() < 0.5;
      const left = manyLeft ? many : few;
      const right = manyLeft ? few : many;
      const ask = kind === 't2:more' ? 'more' : 'fewer';
      const answer = (ask === 'more') === manyLeft ? 'left' : 'right';
      return { left, right, ask, answer, kind, side: answer, pair: `${left.n}-${right.n}`, decoy };
    });
  };
  const check = (items) => {
    const same = items.filter((x) => x.answer === 'same').length;
    if (same < 1 || same > 2) return false;
    const unequal = items.filter((x) => x.answer !== 'same');
    if (unequal.filter((x) => x.decoy).length * 2 < unequal.length) return false;
    return items.every((x) => x.left.n <= max && x.right.n <= max && x.left.thing !== x.right.thing);
  };
  return generate(rand, build, check, weak);
}

// ---------- T3 — Hungry crocodile ----------

export const SIGN_WORDS = { '>': 'is greater than', '<': 'is less than', '=': 'is equal to' };
const SIGN_VI = { '>': 'lớn hơn', '<': 'bé hơn', '=': 'bằng' };

export function sentenceT3(item) {
  return { en: `${cap(numberWord(item.a))} ${SIGN_WORDS[item.sign]} ${numberWord(item.b)}.`, vi: `${item.a} ${SIGN_VI[item.sign]} ${item.b}.` };
}

/** Dấu trong khay theo mức: mức 1 chỉ > <; từ mức 2 thêm =. */
export const signsAt = (level) => (level === 1 ? ['>', '<'] : ['>', '<', '=']);

function makeT3(level, rand, { weak = null } = {}) {
  const build = (w) => {
    const eq = level === 1 ? 0 : rand() < 0.5 ? 1 : 2;
    const base = [...Array(eq).fill('t3:equal')];
    const rest = MATH_ITEMS - eq;
    for (let i = 0; i < rest; i++) base.push(i % 2 ? 't3:less' : 't3:greater');
    const kinds = kindPlan(rand, base, w);
    if (kinds.filter((k) => k === 't3:equal').length > 2) return null;
    const nearAt = level === 3 ? new Set(shuffle(rand, kinds.map((k, i) => (k === 't3:equal' ? -1 : i)).filter((i) => i >= 0)).slice(0, 3)) : new Set();
    return kinds.map((kind, i) => {
      if (kind === 't3:equal') {
        const n = randInt(rand, 1, level === 1 ? 10 : 20);
        return { a: n, b: n, sign: '=', kind, side: null, pair: `${n}-${n}`, croc: level < 3 };
      }
      const [x, y] = numberPair(rand, level, nearAt.has(i));
      const [big, small] = x > y ? [x, y] : [y, x];
      const [a, b] = kind === 't3:greater' ? [big, small] : [small, big];
      return { a, b, sign: kind === 't3:greater' ? '>' : '<', kind, side: kind === 't3:greater' ? 'left' : 'right', pair: `${a}-${b}`, croc: level < 3 };
    });
  };
  const check = (items) => {
    const left = items.filter((x) => x.side === 'left').length;
    const right = items.filter((x) => x.side === 'right').length;
    if (Math.abs(left - right) > 2) return false;
    const eq = items.filter((x) => x.sign === '=').length;
    return level === 1 ? eq === 0 : eq >= 1 && eq <= 2;
  };
  return generate(rand, build, check, weak);
}

// ---------- T6 — Tens and ones ----------

export function sentenceT6(item) {
  if (item.make != null) {
    const n = item.make;
    const t = tensOf(n);
    const o = onesOf(n);
    const parts = [plural(t, 'ten', 'tens'), ...(o ? [plural(o, 'one', 'ones')] : [])].join(' and ');
    return { en: `${cap(numberWord(n))} is ${parts}.`, vi: `${n} gồm ${t} chục${o ? ` và ${o} đơn vị` : ''}.` };
  }
  return sentenceT1(item);
}

const swapped = (n) => onesOf(n) * 10 + tensOf(n);

function makeT6(level, rand, { weak = null } = {}) {
  if (level === 1) {
    // Số tròn chục trước (20, 30, 40…) rồi số có đơn vị (mục 4.6).
    const build = () => {
      const rounds = shuffle(rand, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).map((t) => t * 10);
      const mixed = [];
      while (mixed.length < 5) {
        const n = randInt(rand, 21, 99);
        if (onesOf(n) && !mixed.includes(n)) mixed.push(n);
      }
      return [...rounds, ...mixed].map((n) => ({ make: n, kind: 't6:make', side: null, pair: String(n) }));
    };
    return generate(rand, build, () => true, null);
  }
  const diffTens = () => {
    for (;;) {
      const a = randInt(rand, 10, 99);
      const b = randInt(rand, 10, 99);
      if (tensOf(a) !== tensOf(b)) return [a, b];
    }
  };
  const sameTens = () => {
    for (;;) {
      const t = randInt(rand, 1, 9);
      const a = t * 10 + randInt(rand, 0, 9);
      const b = t * 10 + randInt(rand, 0, 9);
      if (a !== b) return [a, b];
    }
  };
  const swapDigits = () => {
    for (;;) {
      const a = randInt(rand, 12, 98);
      const b = swapped(a);
      if (onesOf(a) && tensOf(a) !== onesOf(a) && b >= 10) return [a, b];
    }
  };
  const build = (w) => {
    const base = level === 2
      ? Array(MATH_ITEMS).fill('t6:diff-tens')
      : ['t6:diff-tens', 't6:diff-tens', 't6:diff-tens', 't6:diff-tens', 't6:same-tens', 't6:same-tens', 't6:swap-digits', 't6:swap-digits'];
    const kinds = kindPlan(rand, base, w);
    const asks = shuffle(rand, ['bigger', 'bigger', 'bigger', 'bigger', 'smaller', 'smaller', 'smaller', 'smaller']);
    const sides = shuffle(rand, ['left', 'left', 'left', 'left', 'right', 'right', 'right', 'right']);
    return kinds.map((kind, i) => {
      const [x, y] = kind === 't6:same-tens' ? sameTens() : kind === 't6:swap-digits' ? swapDigits() : diffTens();
      const ask = asks[i];
      const side = sides[i];
      // Đặt số đáp án đúng bên đã chia (cân bằng trái / phải).
      const win = ask === 'bigger' ? Math.max(x, y) : Math.min(x, y);
      const [a, b] = side === 'left' ? [win, win === x ? y : x] : [win === x ? y : x, win];
      return { a, b, ask, kind, side, pair: `${a}-${b}` };
    });
  };
  const check = (items) => {
    if (level === 3) {
      if (items.filter((x) => x.kind === 't6:same-tens').length < 2) return false;
      if (items.filter((x) => x.kind === 't6:swap-digits').length < 2) return false;
    }
    return items.every((x) => x.a <= 100 && x.b <= 100);
  };
  return generate(rand, build, check, weak);
}

// ---------- T4 — Line them up (Math-b, mục 4.4) ----------

/** Thứ tự đúng của 4 số (asc: nhỏ → lớn; desc: lớn → nhỏ). */
export const orderedT4 = (item) => [...item.numbers].sort((a, b) => (item.order === 'desc' ? b - a : a - b));
/** Nhãn chỗ trống (4.4): first / next / next / last. */
export const SLOT_LABELS = ['first', 'next', 'next', 'last'];

export function sentenceT4(item) {
  const list = orderedT4(item);
  return { en: `The numbers are in order: ${list.map(numberWord).join(', ')}.`, vi: `Các số theo thứ tự: ${list.join(', ')}.` };
}

function makeT4(level, rand) {
  const max = level === 1 ? 10 : 20;
  const gap = level === 1 ? 2 : 1; // mức 1: khoảng cách ≥ 2
  const order = level === 3 ? 'desc' : 'asc'; // mức 3 xếp lớn → nhỏ
  const one = () => {
    for (;;) {
      const set = new Set();
      while (set.size < 4) set.add(randInt(rand, 1, max));
      const sorted = [...set].sort((a, b) => a - b);
      if (sorted.some((x, i) => i && x - sorted[i - 1] < gap)) continue;
      const numbers = shuffle(rand, sorted);
      // Không cho sẵn đúng thứ tự (cả xuôi lẫn ngược).
      if (numbers.join() === sorted.join() || numbers.join() === [...sorted].reverse().join()) continue;
      return { numbers, order, kind: `t4:${order}`, side: null, pair: sorted.join('-') };
    }
  };
  const check = (items) => items.every((x) => new Set(x.numbers).size === 4 && x.numbers.every((n) => n >= 1 && n <= max));
  return generate(rand, () => Array.from({ length: MATH_ITEMS }, one), check, null);
}

// ---------- T5 — Number line (Math-b, mục 4.5) ----------

const T5_ANSWER = { after: 1, more: 1, before: -1, less: -1, between: 1 };
const T5_SIDE = { after: 'right', more: 'right', before: 'left', less: 'left', between: null };
export const T5_LINE = 11; // tia số 11 số liên tiếp (iPhone dọc: 7, xem screens/math.js)

export function sentenceT5(item) {
  const { ask, n, m, answer: x } = item;
  const X = cap(numberWord(x));
  if (ask === 'after') return { en: `${X} comes after ${numberWord(n)}.`, vi: `${x} đứng ngay sau ${n}.` };
  if (ask === 'before') return { en: `${X} comes before ${numberWord(n)}.`, vi: `${x} đứng ngay trước ${n}.` };
  if (ask === 'between') return { en: `${X} is between ${numberWord(n)} and ${numberWord(m)}.`, vi: `${x} nằm giữa ${n} và ${m}.` };
  if (ask === 'more') return { en: `${X} is one more than ${numberWord(n)}.`, vi: `${x} là số hơn ${n} một.` };
  return { en: `${X} is one less than ${numberWord(n)}.`, vi: `${x} là số kém ${n} một.` };
}

/**
 * @param {{ weak?: string|null, lineLen?: number }} opts `lineLen`: số số trên tia (11; màn hẹp 7)
 */
function makeT5(level, rand, { weak = null, lineLen = T5_LINE } = {}) {
  const max = level === 1 ? 10 : 20;
  const base = level === 1
    ? ['t5:after', 't5:after', 't5:after', 't5:after', 't5:before', 't5:before', 't5:before', 't5:before']
    : level === 2
      ? ['t5:after', 't5:after', 't5:after', 't5:before', 't5:before', 't5:before', 't5:between', 't5:between']
      : ['t5:after', 't5:before', 't5:between', 't5:between', 't5:more', 't5:more', 't5:less', 't5:less'];
  const one = (kind) => {
    const ask = kind.slice(3);
    for (let tries = 0; tries < 200; tries++) {
      const n = randInt(rand, 0, max);
      const m = ask === 'between' ? n + 2 : null;
      const answer = n + T5_ANSWER[ask];
      if (answer < 0 || answer > max || (m != null && m > max)) continue;
      // Tia số: `lineLen` số liên tiếp trong [0, max], chứa n (và m), đáp án không nằm ở mép tia.
      const starts = [];
      for (let s = 0; s + lineLen - 1 <= max; s++) {
        const e = s + lineLen - 1;
        if (answer > s && answer < e && n >= s && n <= e && (m == null || m <= e)) starts.push(s);
      }
      if (!starts.length) continue;
      const s = pick(rand, starts);
      return { ask, n, m, answer, line: [s, s + lineLen - 1], kind, side: T5_SIDE[ask], pair: `${ask}-${n}` };
    }
    return null;
  };
  const build = (w) => {
    const kinds = kindPlan(rand, base, w);
    const items = kinds.map(one);
    return items.every(Boolean) ? items : null;
  };
  const check = (items) => items.every((x) => x.line[0] >= 0 && x.line[1] <= max && x.answer > x.line[0] && x.answer < x.line[1]);
  return generate(rand, build, check, weak);
}

// ---------- T7 — Read and compare (Math-c, mục 4.7): câu đố viết sẵn ----------

/** Nhân vật (có hình) và tên tiếng Việt khi dịch. */
export const T7_PEOPLE = {
  Tom: { emoji: '👦', vi: 'Tom' },
  Anna: { emoji: '👧', vi: 'Anna' },
  Dad: { emoji: '👨', vi: 'Bố' },
  Mum: { emoji: '👩', vi: 'Mẹ' },
  Grandpa: { emoji: '👴', vi: 'Ông' },
  Grandma: { emoji: '👵', vi: 'Bà' },
};
/** Đồ vật (số nhiều, có hình). */
export const T7_THINGS = {
  apples: { emoji: '🍎', vi: 'quả táo' },
  balls: { emoji: '⚽', vi: 'quả bóng' },
  cars: { emoji: '🚗', vi: 'chiếc ô tô' },
  books: { emoji: '📕', vi: 'quyển sách' },
  sweets: { emoji: '🍬', vi: 'cái kẹo' },
  flowers: { emoji: '🌸', vi: 'bông hoa' },
  stars: { emoji: '⭐', vi: 'ngôi sao' },
  cookies: { emoji: '🍪', vi: 'cái bánh quy' },
  ducks: { emoji: '🦆', vi: 'con vịt' },
  fish: { emoji: '🐟', vi: 'con cá' },
};
/**
 * Câu đố (4.7): hai người, một loại đồ, số ≥ 2 (không có "1 apples"), không bằng nhau. Câu hỏi more / fewer chọn khi
 * sinh lượt nên một câu đố dùng được cả hai chiều.
 */
export const T7_PUZZLES = [
  { id: 'p1', people: [['Tom', 5], ['Anna', 3]], thing: 'apples' },
  { id: 'p2', people: [['Anna', 4], ['Tom', 7]], thing: 'balls' },
  { id: 'p3', people: [['Dad', 6], ['Mum', 2]], thing: 'cars' },
  { id: 'p4', people: [['Mum', 8], ['Dad', 5]], thing: 'books' },
  { id: 'p5', people: [['Grandpa', 3], ['Grandma', 9]], thing: 'flowers' },
  { id: 'p6', people: [['Grandma', 7], ['Grandpa', 4]], thing: 'stars' },
  { id: 'p7', people: [['Tom', 2], ['Dad', 6]], thing: 'cookies' },
  { id: 'p8', people: [['Anna', 9], ['Mum', 6]], thing: 'ducks' },
  { id: 'p9', people: [['Tom', 10], ['Grandma', 8]], thing: 'sweets' },
  { id: 'p10', people: [['Mum', 3], ['Anna', 5]], thing: 'fish' },
  { id: 'p11', people: [['Dad', 4], ['Tom', 9]], thing: 'apples' },
  { id: 'p12', people: [['Grandpa', 8], ['Anna', 2]], thing: 'balls' },
  { id: 'p13', people: [['Grandma', 5], ['Tom', 6]], thing: 'cars' },
  { id: 'p14', people: [['Anna', 7], ['Dad', 10]], thing: 'stars' },
  { id: 'p15', people: [['Mum', 9], ['Grandpa', 7]], thing: 'cookies' },
  { id: 'p16', people: [['Tom', 3], ['Mum', 4]], thing: 'flowers' },
  // Số tới 20 (mức 3, sau khi bé có ⭐⭐ ở T5).
  { id: 'q1', people: [['Tom', 12], ['Anna', 15]], thing: 'stars' },
  { id: 'q2', people: [['Dad', 18], ['Mum', 11]], thing: 'apples' },
  { id: 'q3', people: [['Grandma', 14], ['Grandpa', 16]], thing: 'cookies' },
  { id: 'q4', people: [['Anna', 20], ['Tom', 13]], thing: 'balls' },
  { id: 'q5', people: [['Mum', 9], ['Dad', 17]], thing: 'sweets' },
  { id: 'q6', people: [['Grandpa', 19], ['Anna', 11]], thing: 'flowers' },
  { id: 'q7', people: [['Tom', 16], ['Grandma', 10]], thing: 'ducks' },
  { id: 'q8', people: [['Dad', 12], ['Tom', 14]], thing: 'fish' },
  { id: 'q9', people: [['Anna', 13], ['Mum', 18]], thing: 'books' },
  { id: 'q10', people: [['Grandma', 15], ['Dad', 11]], thing: 'cars' },
];
export const T7_BY_ID = new Map(T7_PUZZLES.map((p) => [p.id, p]));
const puzzleMax = (p) => Math.max(p.people[0][1], p.people[1][1]);

/** Câu đố (Olly đọc karaoke): "Tom has 5 apples. Anna has 3 apples. Who has more?" + dòng dịch. */
export function puzzleText(item) {
  const [[a, x], [b, y]] = item.people.map((p) => [p.name, p.n]);
  const t = T7_THINGS[item.thing];
  const vi = (name) => T7_PEOPLE[name].vi;
  return {
    en: `${a} has ${x} ${item.thing}. ${b} has ${y} ${item.thing}. Who has ${item.ask}?`,
    vi: `${vi(a)} có ${x} ${t.vi}. ${vi(b)} có ${y} ${t.vi}. Ai có ${item.ask === 'more' ? 'nhiều' : 'ít'} hơn?`,
  };
}

export function sentenceT7(item) {
  const t = T7_THINGS[item.thing];
  return item.ask === 'more'
    ? { en: `${item.answer} has more ${item.thing}.`, vi: `${T7_PEOPLE[item.answer].vi} có nhiều ${t.vi} hơn.` }
    : { en: `${item.answer} has fewer ${item.thing}.`, vi: `${T7_PEOPLE[item.answer].vi} có ít ${t.vi} hơn.` };
}

/** Một mục T7 từ câu đố + câu hỏi. */
export function t7Item(p, ask) {
  const people = p.people.map(([name, n]) => ({ name, emoji: T7_PEOPLE[name].emoji, n }));
  const win = ask === 'more' ? (people[0].n > people[1].n ? 0 : 1) : (people[0].n < people[1].n ? 0 : 1);
  return { id: p.id, people, thing: p.thing, ask, answer: people[win].name, kind: `t7:${ask}`, side: win === 0 ? 'left' : 'right', pair: p.id };
}

/**
 * Mức 1: số ≤ 10, chênh ≥ 2, đồ vật luôn hiện; mức 2: số ≤ 10, đồ vật hiện khi sai; mức 3: thêm câu đố số tới 20
 * khi `allow20` (bé đã có ⭐⭐ ở T5, 4.7), không thì vẫn ≤ 10.
 */
function makeT7(level, rand, { weak = null, allow20 = false } = {}) {
  const pool = T7_PUZZLES.filter((p) => {
    const [x, y] = p.people.map((q) => q[1]);
    if (level === 1) return puzzleMax(p) <= 10 && Math.abs(x - y) >= 2;
    if (level === 2 || !allow20) return puzzleMax(p) <= 10;
    return true;
  });
  const build = (w) => {
    const kinds = kindPlan(rand, ['t7:more', 't7:more', 't7:more', 't7:more', 't7:fewer', 't7:fewer', 't7:fewer', 't7:fewer'], w);
    let chosen = shuffle(rand, pool).slice(0, MATH_ITEMS);
    // Mức 3 có số tới 20: ít nhất 3 câu đố số lớn.
    if (level === 3 && allow20) {
      const big = shuffle(rand, pool.filter((p) => puzzleMax(p) > 10)).slice(0, 4);
      const small = shuffle(rand, pool.filter((p) => puzzleMax(p) <= 10)).slice(0, MATH_ITEMS - big.length);
      chosen = shuffle(rand, [...big, ...small]);
    }
    return chosen.map((p, i) => t7Item(p, kinds[i].slice(3)));
  };
  const check = (items) => {
    const more = items.filter((x) => x.ask === 'more').length;
    const left = items.filter((x) => x.side === 'left').length;
    return more >= 3 && more <= 5 && left >= 3 && left <= 5 && new Set(items.map((x) => x.id)).size === items.length;
  };
  return generate(rand, build, check, weak);
}

// ---------- Chung ----------

const MAKERS = { t1: makeT1, t2: makeT2, t3: makeT3, t4: makeT4, t5: makeT5, t6: makeT6, t7: makeT7, t8: makeT8, t9: makeT9 };
const SENTENCES = { t1: sentenceT1, t2: sentenceT2, t3: sentenceT3, t4: sentenceT4, t5: sentenceT5, t6: sentenceT6, t7: sentenceT7, t8: mathSentence, t9: mathSentence };

/**
 * 8 mục của một lượt.
 * @param {string} key 't1' … 't9'
 * @param {{ weak?: string|null, maxGroup?: number, lineLen?: number, allow20?: boolean, recent?: Iterable<string> }} [opts] `weak`: kiểu hay sai (6.4);
 *   `maxGroup`: số đồ tối đa / nhóm (T2); `lineLen`: số số trên tia (T5); `allow20`: câu đố số tới 20 (T7 mức 3);
 *   `recent`: `problemKey` bé gặp gần đây — T8, T9 ưu tiên key khác (SPEC-math2 2.4)
 */
export function makeItems(key, level, rand = Math.random, opts = {}) {
  const make = MAKERS[key];
  if (!make) throw new Error(`Bài chưa có bộ sinh: ${key}`);
  return make(level, rand, opts);
}

/** Câu so sánh của một mục: { en, vi }. */
export const sentenceOf = (key, item) => SENTENCES[key](item);

/** Khóa tiến độ của mục (mục 6.4): activity + itemId. */
export function itemRef(lesson, item) {
  const { key } = lesson;
  if (key === 't4') return { lessonId: lesson.id, activity: `order-${item.order}`, itemId: orderedT4(item).join('-') };
  if (key === 't5') return { lessonId: lesson.id, activity: item.ask, itemId: item.m != null ? `${item.n}-${item.m}` : String(item.n) };
  if (key === 't7') return { lessonId: lesson.id, activity: item.ask, itemId: item.id };
  // Toán phần 2: khóa = problemKey (`more:5-3` → math-t8/more/5-3).
  if (item.pair?.includes(':')) {
    const [activity, itemId] = item.pair.split(':');
    return { lessonId: lesson.id, activity, itemId };
  }
  const activity = { t1: 'compare', t2: item.ask, t3: 'sign', t6: item.make != null ? 'make' : 'compare' }[key];
  const itemId = item.make != null ? String(item.make) : key === 't2' ? `${item.left.n}-${item.right.n}` : `${item.a}-${item.b}`;
  return { lessonId: lesson.id, activity, itemId };
}

/**
 * Mục có phần bé đọc câu (3.3): 2 hoặc 3 trong 8, không hai mục liền nhau.
 * @returns {number[]} chỉ số mục (tăng dần)
 */
export function readPlan(rand = Math.random) {
  for (;;) {
    const n = rand() < 0.5 ? 2 : 3;
    const at = shuffle(rand, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, n).sort((a, b) => a - b);
    if (at.every((x, i) => i === 0 || x - at[i - 1] >= 2)) return at;
  }
}

/** Mức đã mở (6.2): 1 + số mức liền nhau từ mức 1 có bestStars ≥ 2; bố mẹ mở hết → 3. */
export function unlockedLevel(bestByLevel, all = false) {
  if (all) return MAX_LEVEL;
  let level = 1;
  while (level < MAX_LEVEL && (bestByLevel[level] ?? 0) >= 2) level++;
  return level;
}

/** Câu giải thích tiếng Việt khi sai 2 lần (4.1). */
export function explainVi(key, item) {
  if (key === 't8' || key === 't9') return explainSums(item);
  if (key === 't4') {
    const word = item.order === 'desc' ? 'lớn nhất' : 'nhỏ nhất';
    return `Bé tìm số ${word} trong các số còn lại rồi đặt vào chỗ tiếp theo. Thứ tự đúng: ${orderedT4(item).join(', ')}.`;
  }
  if (key === 't5') {
    const { ask, n, m, answer: x } = item;
    if (ask === 'after') return `Số đứng ngay sau ${n} là ${x}: từ ${n}, ếch nhảy đúng 1 bước sang phải.`;
    if (ask === 'before') return `Số đứng ngay trước ${n} là ${x}: từ ${n}, ếch nhảy đúng 1 bước sang trái.`;
    if (ask === 'between') return `Số nằm giữa ${n} và ${m} là ${x}: nó đứng ngay sau ${n} và ngay trước ${m}.`;
    if (ask === 'more') return `Hơn một nghĩa là nhảy 1 bước tới trước (sang phải): ${n} hơn một là ${x}.`;
    return `Kém một nghĩa là nhảy 1 bước lùi lại (sang trái): ${n} kém một là ${x}.`;
  }
  if (key === 't7') {
    const [p, q] = item.people;
    const t = T7_THINGS[item.thing].vi;
    const vi = (name) => T7_PEOPLE[name].vi;
    const [hi, lo] = p.n > q.n ? [p, q] : [q, p];
    return `${vi(p.name)} có ${p.n} ${t}, ${vi(q.name)} có ${q.n} ${t}. ${hi.n} nhiều hơn ${lo.n}, nên ${vi(hi.name)} có nhiều hơn, ${vi(lo.name)} có ít hơn. Câu hỏi là "ai có ${item.ask === 'more' ? 'nhiều' : 'ít'} hơn" → chọn ${vi(item.answer)}.`;
  }
  if (key === 't2') {
    if (item.answer === 'same') return `Bé đếm từng con: bên trái ${item.left.n}, bên phải ${item.right.n}. Hai bên bằng nhau nên chọn nút "= The same".`;
    const l = item.left;
    const r = item.right;
    const more = l.n > r.n ? 'trái' : 'phải';
    return `Bé đếm từng con, đừng nhìn con to hay nhỏ: bên trái có ${l.n} ${THINGS[l.thing].vi}, bên phải có ${r.n} ${THINGS[r.thing].vi}. Bên ${more} nhiều hơn.`;
  }
  if (key === 't3') {
    if (item.sign === '=') return `Hai số bằng nhau (${item.a} và ${item.b}) thì dùng dấu bằng. Đọc: ${item.a} bằng ${item.b}.`;
    const big = Math.max(item.a, item.b);
    return `Miệng cá sấu luôn há về phía số lớn hơn. ${big} lớn hơn nên miệng há về phía số ${big}. Đọc từ trái sang phải: ${sentenceT3(item).vi.replace(/\.$/, '')}.`;
  }
  if (key === 't6' && item.make != null) {
    return `Số ${item.make} gồm ${tensOf(item.make)} chục và ${onesOf(item.make)} đơn vị: bé lấy ${tensOf(item.make)} thanh chục và ${onesOf(item.make)} khối lẻ.`;
  }
  const [big, small] = item.a > item.b ? [item.a, item.b] : [item.b, item.a];
  if (key === 't6') {
    if (tensOf(item.a) === tensOf(item.b)) return `Hai số cùng ${tensOf(item.a)} chục, nên so hàng đơn vị: ${onesOf(big)} đơn vị nhiều hơn ${onesOf(small)} đơn vị. Vậy ${big} lớn hơn ${small}.`;
    return `So hàng chục trước: ${big} có ${tensOf(big)} chục, ${small} có ${tensOf(small)} chục. Vậy ${big} lớn hơn ${small}.`;
  }
  return item.ask === 'bigger'
    ? `Số lớn hơn là số có cột khối cao hơn. ${big} lớn hơn ${small}.`
    : `Số nhỏ hơn là số có cột khối thấp hơn. ${small} nhỏ hơn ${big}.`;
}
