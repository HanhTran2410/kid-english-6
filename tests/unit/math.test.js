// Khu 🔢 Math (SPEC-math.md): bộ sinh câu hỏi (500 lượt ngẫu nhiên mỗi bài × mỗi mức), luật cân bằng, đọc số,
// câu so sánh, mở mức, kiểu hay sai, chọn mục đọc câu, sao.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_MATH, MATH_ITEMS, makeItems, seeded, roundProblems, sentenceOf, numberWord, readPlan, unlockedLevel, weakKind,
  kindsAt, THINGS, THING_PAIRS, isNear10, tensOf, onesOf, pairLineT2, blocksLine, tensLine, explainVi, itemRef, signsAt,
} from '../../app/js/math/math.js';
import { starsFor, RESULT } from '../../app/js/progress.js';
import { QUESTIONS, translateQuestion } from '../../app/js/captions.js';

const RUNS = 500;
const rounds = (key, level, opts = {}) => Array.from({ length: RUNS }, (_, i) => makeItems(key, level, seeded(i + 1), opts));
const sides = (items) => items.map((x) => x.side);
const maxRun = (arr) => {
  let best = 0;
  let run = 0;
  arr.forEach((x, i) => {
    run = x && x === arr[i - 1] ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
};

test('đọc số thành chữ tới 100', () => {
  assert.deepEqual([0, 7, 13, 20, 21, 34, 40, 99, 100].map(numberWord),
    ['zero', 'seven', 'thirteen', 'twenty', 'twenty-one', 'thirty-four', 'forty', 'ninety-nine', 'one hundred']);
  assert.throws(() => numberWord(101));
});

test('bài đợt Math-a: T1, T2, T3, T6 (khóa math-t*)', () => {
  assert.deepEqual(BUILTIN_MATH.map((l) => l.key), ['t1', 't2', 't3', 't6']);
  for (const l of BUILTIN_MATH) assert.equal(l.id, `math-${l.key}`);
});

test('mọi bộ sinh × mọi mức: 8 mục, đúng luật chung (≤ 5/8 một bên, ≤ 3 liền, không lặp cặp quá 2 lần / ngay mục trước); rand cố định → kết quả cố định', () => {
  for (const { key } of BUILTIN_MATH) {
    for (const level of [1, 2, 3]) {
      for (const items of rounds(key, level)) {
        assert.equal(items.length, MATH_ITEMS);
        assert.deepEqual(roundProblems(items), [], `${key} L${level}`);
        assert.ok(sides(items).filter((s) => s === 'left').length <= 5);
        assert.ok(maxRun(sides(items)) <= 3);
        for (const it of items) assert.ok(kindsAt(key, level).includes(it.kind), `${key} L${level} ${it.kind}`);
      }
      assert.deepEqual(makeItems(key, level, seeded(42)), makeItems(key, level, seeded(42)));
    }
  }
});

test('T1: không có hai số bằng nhau; mức 1 ≤ 10 và chênh ≥ 3; mức 2–3 ≤ 20; mức 3 có cặp sát mốc 10; bigger / smaller 3–5', () => {
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t1', level)) {
      for (const x of items) {
        assert.notEqual(x.a, x.b);
        assert.ok(Math.max(x.a, x.b) <= (level === 1 ? 10 : 20) && Math.min(x.a, x.b) >= 1);
        if (level === 1) assert.ok(Math.abs(x.a - x.b) >= 3);
        const win = x.ask === 'bigger' ? Math.max(x.a, x.b) : Math.min(x.a, x.b);
        assert.equal(x.side === 'left' ? x.a : x.b, win);
      }
      const big = items.filter((x) => x.ask === 'bigger').length;
      assert.ok(big >= 3 && big <= 5);
      if (level === 3) assert.ok(items.filter((x) => isNear10(x.a, x.b)).length >= 2);
    }
  }
  assert.equal(sentenceOf('t1', { a: 7, b: 4, ask: 'bigger' }).en, 'Seven is bigger than four.');
  assert.equal(sentenceOf('t1', { a: 7, b: 4, ask: 'smaller' }).en, 'Four is smaller than seven.');
  assert.equal(blocksLine(7, 1), "Let's check! Seven blocks… one block.");
});

test('T2: có trái / phải / the same (1–2 mục same); nhiễu kích thước ≥ ½ mục khác nhau; mỗi nhóm một loại đồ có hình; đáp án đúng', () => {
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t2', level, { maxGroup: level === 3 ? 8 : 10 })) {
      const same = items.filter((x) => x.answer === 'same');
      assert.ok(same.length >= 1 && same.length <= 2);
      const unequal = items.filter((x) => x.answer !== 'same');
      assert.ok(unequal.filter((x) => x.decoy).length * 2 >= unequal.length);
      for (const x of items) {
        assert.ok(THINGS[x.left.thing] && THINGS[x.right.thing]);
        assert.notEqual(x.left.thing, x.right.thing);
        const max = level === 1 ? 6 : level === 3 ? 8 : 10;
        assert.ok(x.left.n <= max && x.right.n <= max && x.left.n >= 1);
        if (x.answer === 'same') assert.equal(x.left.n, x.right.n);
        else {
          const more = x.left.n > x.right.n ? 'left' : 'right';
          assert.equal(x.answer, x.ask === 'more' ? more : more === 'left' ? 'right' : 'left');
          // Nhiễu: nhóm nhiều hơn là đồ nhỏ.
          if (x.decoy) assert.equal(THINGS[x[more].thing].big, false);
        }
      }
    }
  }
  for (const [big, small] of THING_PAIRS) assert.ok(THINGS[big].big && !THINGS[small].big);
  const item = { left: { thing: 'mouse', n: 5 }, right: { thing: 'elephant', n: 3 }, ask: 'more', answer: 'left' };
  assert.equal(pairLineT2(item), 'Look! Two mice have no partner.');
  assert.equal(sentenceOf('t2', item).en, 'There are more mice.');
  assert.equal(sentenceOf('t2', { ...item, ask: 'fewer', answer: 'right' }).en, 'There are fewer elephants.');
});

test('T3: mức 1 chỉ > <; mức 2–3 có 1–2 dấu =; số lớn nằm cả hai phía (chênh ≤ 2); câu đọc trái → phải', () => {
  assert.deepEqual(signsAt(1), ['>', '<']);
  assert.deepEqual(signsAt(2), ['>', '<', '=']);
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t3', level)) {
      const eq = items.filter((x) => x.sign === '=').length;
      assert.ok(level === 1 ? eq === 0 : eq >= 1 && eq <= 2);
      const left = items.filter((x) => x.sign === '>').length;
      const right = items.filter((x) => x.sign === '<').length;
      assert.ok(left > 0 && right > 0 && Math.abs(left - right) <= 2);
      for (const x of items) {
        assert.equal(x.sign, x.a > x.b ? '>' : x.a < x.b ? '<' : '=');
        assert.equal(x.croc, level < 3);
      }
    }
  }
  assert.equal(sentenceOf('t3', { a: 4, b: 7, sign: '<' }).en, 'Four is less than seven.');
  assert.equal(sentenceOf('t3', { a: 7, b: 7, sign: '=' }).en, 'Seven is equal to seven.');
  assert.match(explainVi('t3', { a: 7, b: 4, sign: '>' }), /há về phía số 7/);
});

test('T6: mức 1 tạo số (3 số tròn chục trước); mức 2 khác chục; mức 3 có ≥ 2 cặp cùng chục và ≥ 2 cặp đổi chỗ chữ số; ≤ 100', () => {
  for (const items of rounds('t6', 1)) {
    assert.ok(items.slice(0, 3).every((x) => x.make % 10 === 0));
    assert.ok(items.slice(3).every((x) => x.make % 10 !== 0 && x.make <= 99));
  }
  for (const items of rounds('t6', 2)) for (const x of items) assert.notEqual(tensOf(x.a), tensOf(x.b));
  for (const items of rounds('t6', 3)) {
    const same = items.filter((x) => x.kind === 't6:same-tens');
    const swap = items.filter((x) => x.kind === 't6:swap-digits');
    assert.ok(same.length >= 2 && swap.length >= 2);
    for (const x of same) assert.equal(tensOf(x.a), tensOf(x.b));
    for (const x of swap) assert.equal(x.b, onesOf(x.a) * 10 + tensOf(x.a));
    for (const x of items) assert.ok(x.a <= 100 && x.b <= 100 && x.a !== x.b);
  }
  assert.equal(sentenceOf('t6', { make: 34 }).en, 'Thirty-four is three tens and four ones.');
  assert.equal(sentenceOf('t6', { make: 40 }).en, 'Forty is four tens.');
  assert.equal(tensLine(52, 34), 'Look at the tens first! Five tens… three tens.');
  assert.equal(tensLine(34, 37), 'The tens are the same. Look at the ones! Four ones… seven ones.');
});

test('kiểu hay sai (6.4): tỉ lệ đúng ngay thấp nhất, chỉ kiểu gặp ≥ 3 lần và có ở mức đang chơi; thêm tối đa 1 mục', () => {
  const recs = [
    { kind: 't3:equal', seen: 5, independent: 2 },
    { kind: 't3:greater', seen: 6, independent: 5 },
    { kind: 't3:less', seen: 2, independent: 0 },
  ];
  assert.equal(weakKind(recs, kindsAt('t3', 2)), 't3:equal');
  assert.equal(weakKind(recs, kindsAt('t3', 1)), 't3:greater');
  assert.equal(weakKind([{ kind: 't1:bigger', seen: 4, independent: 4 }], kindsAt('t1', 1)), null);
  // Ưu tiên kiểu hay sai: smaller 5 mục thay vì 4 (thêm đúng 1).
  for (let i = 1; i <= 200; i++) {
    const items = makeItems('t1', 1, seeded(i), { weak: 't1:smaller' });
    assert.equal(items.filter((x) => x.kind === 't1:smaller').length, 5);
  }
});

test('mục đọc câu (3.3): 2–3 mục, không hai mục liền nhau', () => {
  for (let i = 1; i <= RUNS; i++) {
    const at = readPlan(seeded(i));
    assert.ok(at.length >= 2 && at.length <= 3);
    at.forEach((x, k) => k && assert.ok(x - at[k - 1] >= 2));
  }
});

test('mở mức (6.2): mức 1 mở sẵn; ≥ 2⭐ ở mức cao nhất → mở mức sau; bố mẹ mở hết', () => {
  assert.equal(unlockedLevel({}), 1);
  assert.equal(unlockedLevel({ 1: 1 }), 1);
  assert.equal(unlockedLevel({ 1: 2 }), 2);
  assert.equal(unlockedLevel({ 1: 3, 2: 2 }), 3);
  assert.equal(unlockedLevel({ 1: 1, 2: 3 }), 1);
  assert.equal(unlockedLevel({}, true), 3);
});

test('sao (6.3): 8/8 độc lập = 3⭐; 7/8 = 2⭐; sai 1 rồi đúng ≠ independent', () => {
  const I = RESULT.INDEPENDENT;
  assert.equal(starsFor(Array(8).fill(I)), 3);
  assert.equal(starsFor([...Array(7).fill(I), RESULT.HELPED]), 2);
  assert.equal(starsFor([...Array(5).fill(I), RESULT.MISSED, RESULT.MISSED, I]), 1);
});

test('khóa tiến độ mục (6.4) và câu hỏi Math có phụ đề tiếng Việt', () => {
  const [t1, t2, , t6] = BUILTIN_MATH;
  assert.deepEqual(itemRef(t1, { a: 7, b: 4 }), { lessonId: 'math-t1', activity: 'compare', itemId: '7-4' });
  assert.deepEqual(itemRef(t2, { ask: 'more', left: { n: 5 }, right: { n: 3 } }), { lessonId: 'math-t2', activity: 'more', itemId: '5-3' });
  assert.deepEqual(itemRef(t6, { make: 34 }), { lessonId: 'math-t6', activity: 'make', itemId: '34' });
  for (const q of ['whichBigger', 'whichSmaller', 'whichMore', 'whichFewer', 'whichSign']) assert.ok(translateQuestion(QUESTIONS[q]()), q);
  assert.match(translateQuestion(QUESTIONS.makeNumber(34)), /số 34/);
});
