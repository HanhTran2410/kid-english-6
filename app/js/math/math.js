// Khu 🔢 Math / Toán (SPEC-math.md). Hàm thuần, không DOM: thông tin bài, đọc số thành chữ, bộ sinh câu hỏi từng bài
// (mục 7 — `makeItems(level, rand, opts)` → 8 mục, `rand` cố định được trong test), luật cân bằng đáp án, mở mức (6.2),
// kiểu câu hay sai (6.4), chọn mục có phần bé đọc câu (3.3).

export const MATH_ITEMS = 8;
export const MAX_LEVEL = 3;

/** Bài có sẵn (mục 7). `batch`: đợt làm (mục 8) — chỉ bài đã làm mới hiện ở danh sách. */
export const BUILTIN_MATH = [
  { id: 'math-t1', key: 't1', emoji: '🔢', title: 'Bigger or smaller?', titleVi: 'Số nào lớn hơn', batch: 'a' },
  { id: 'math-t2', key: 't2', emoji: '🐘', title: 'Which group has more?', titleVi: 'Nhóm nào nhiều hơn', batch: 'a' },
  { id: 'math-t3', key: 't3', emoji: '🐊', title: 'Hungry crocodile', titleVi: 'Cá sấu > < =', batch: 'a' },
  { id: 'math-t6', key: 't6', emoji: '🧱', title: 'Tens and ones', titleVi: 'Chục và đơn vị', batch: 'a' },
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
const plural = (n, one, many) => `${numberWord(n)} ${n === 1 ? one : many}`;

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
const randInt = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
function shuffle(rand, arr) {
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

/** Bên của đáp án (T1, T2, T3) để cân bằng trái / phải; null = không có bên (the same, dấu =, T6 tạo số). */
export const sideOf = (item) => item.side ?? null;

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
  const pairs = new Map();
  items.forEach((it, i) => {
    pairs.set(it.pair, (pairs.get(it.pair) ?? 0) + 1);
    if (i > 0 && it.pair === items[i - 1].pair) errs.push('lặp ngay mục trước');
    // T6 mức 1 (tạo số) chỉ có một kiểu câu, không có bên đáp án: không xét.
    if (i > 0 && it.kind !== 't6:make' && it.kind === items[i - 1].kind && it.ask === items[i - 1].ask && sides[i] === sides[i - 1]) errs.push('hai mục liền giống kiểu câu + vị trí đáp án');
  });
  for (const [p, n] of pairs) if (n > 2) errs.push(`cặp ${p} lặp quá 2 lần`);
  return errs;
}

/** Dãy kiểu câu cho 8 mục: chia đều, kiểu hay sai thêm tối đa 1 mục. */
function kindPlan(rand, base, weak) {
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
function generate(rand, build, check, weak) {
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

// ---------- Chung ----------

const MAKERS = { t1: makeT1, t2: makeT2, t3: makeT3, t6: makeT6 };
const SENTENCES = { t1: sentenceT1, t2: sentenceT2, t3: sentenceT3, t6: sentenceT6 };

/**
 * 8 mục của một lượt.
 * @param {string} key 't1' | 't2' | 't3' | 't6'
 * @param {{ weak?: string|null, maxGroup?: number }} [opts] `weak`: kiểu hay sai (6.4); `maxGroup`: số đồ tối đa / nhóm (T2)
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
  const activity = { t1: 'compare', t2: item.ask, t3: 'sign', t6: item.make != null ? 'make' : 'compare' }[lesson.key];
  const itemId = item.make != null ? String(item.make) : lesson.key === 't2' ? `${item.left.n}-${item.right.n}` : `${item.a}-${item.b}`;
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
