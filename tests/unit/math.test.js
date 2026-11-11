// Khu 🔢 Math (SPEC-math.md): bộ sinh câu hỏi (500 lượt ngẫu nhiên mỗi bài × mỗi mức), luật cân bằng, đọc số,
// câu so sánh, mở mức, kiểu hay sai, chọn mục đọc câu, sao.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_MATH, MATH_ITEMS, makeItems, seeded, roundProblems, sentenceOf, numberWord, readPlan, unlockedLevel, weakKind,
  kindsAt, THINGS, THING_PAIRS, isNear10, tensOf, onesOf, pairLineT2, blocksLine, tensLine, explainVi, itemRef, signsAt,
  MATH_BY_ID, orderedT4, T7_PUZZLES, T7_PEOPLE, T7_THINGS, puzzleText, t7Item, numberWord as word,
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

test('bài Math-a / b / c: T1 → T7 theo thứ tự (khóa math-t*)', () => {
  assert.deepEqual(BUILTIN_MATH.map((l) => l.key), ['t1', 't2', 't3', 't4', 't5', 't6', 't7']);
  assert.deepEqual(BUILTIN_MATH.map((l) => l.batch), ['a', 'a', 'a', 'b', 'b', 'a', 'c']);
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
  const [t1, t2, t6] = ['math-t1', 'math-t2', 'math-t6'].map((id) => MATH_BY_ID.get(id));
  assert.deepEqual(itemRef(t1, { a: 7, b: 4 }), { lessonId: 'math-t1', activity: 'compare', itemId: '7-4' });
  assert.deepEqual(itemRef(t2, { ask: 'more', left: { n: 5 }, right: { n: 3 } }), { lessonId: 'math-t2', activity: 'more', itemId: '5-3' });
  assert.deepEqual(itemRef(t6, { make: 34 }), { lessonId: 'math-t6', activity: 'make', itemId: '34' });
  for (const q of ['whichBigger', 'whichSmaller', 'whichMore', 'whichFewer', 'whichSign']) assert.ok(translateQuestion(QUESTIONS[q]()), q);
  assert.match(translateQuestion(QUESTIONS.makeNumber(34)), /số 34/);
});

test('T4 Line them up (4.4): 4 số khác nhau, không cho sẵn đúng thứ tự; mức 1 ≤ 10 cách ≥ 2; mức 3 xếp lớn → nhỏ', () => {
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t4', level)) {
      for (const x of items) {
        assert.equal(new Set(x.numbers).size, 4);
        const sorted = [...x.numbers].sort((a, b) => a - b);
        assert.notEqual(x.numbers.join(), sorted.join());
        assert.notEqual(x.numbers.join(), [...sorted].reverse().join());
        assert.equal(x.order, level === 3 ? 'desc' : 'asc');
        if (level === 1) assert.ok(sorted.every((n, i) => n <= 10 && (!i || n - sorted[i - 1] >= 2)));
        else assert.ok(sorted.every((n) => n >= 1 && n <= 20));
      }
    }
  }
  const it = { numbers: [7, 3, 9, 5], order: 'asc' };
  assert.deepEqual(orderedT4(it), [3, 5, 7, 9]);
  assert.equal(sentenceOf('t4', it).en, 'The numbers are in order: three, five, seven, nine.');
  assert.deepEqual(orderedT4({ ...it, order: 'desc' }), [9, 7, 5, 3]);
  assert.deepEqual(itemRef(MATH_BY_ID.get('math-t4'), it), { lessonId: 'math-t4', activity: 'order-asc', itemId: '3-5-7-9' });
  for (const q of ['smallestFirst', 'biggestFirst']) assert.ok(translateQuestion(QUESTIONS[q]()), q);
});

test('T5 Number line (4.5): đủ loại câu theo mức; đáp án đúng 1 bước; không ở mép tia, không vượt 0 / phạm vi; tia 11 (hoặc 7) số', () => {
  for (const level of [1, 2, 3]) {
    for (const lineLen of [11, 7]) {
      const seen = new Set();
      for (const items of rounds('t5', level, { lineLen })) {
        for (const x of items) {
          seen.add(x.ask);
          const max = level === 1 ? 10 : 20;
          const [s, e] = x.line;
          assert.equal(e - s + 1, lineLen);
          assert.ok(s >= 0 && e <= max, `tia ${s}–${e}`);
          assert.ok(x.answer > s && x.answer < e, 'đáp án không ở mép tia');
          assert.ok(x.n >= s && x.n <= e);
          const step = { after: 1, more: 1, before: -1, less: -1, between: 1 }[x.ask];
          assert.equal(x.answer, x.n + step);
          if (x.ask === 'between') assert.equal(x.m, x.n + 2);
        }
      }
      const want = level === 1 ? ['after', 'before'] : level === 2 ? ['after', 'before', 'between'] : ['after', 'before', 'between', 'more', 'less'];
      assert.deepEqual([...seen].sort(), want.sort(), `mức ${level}`);
    }
  }
  assert.equal(sentenceOf('t5', { ask: 'after', n: 7, answer: 8 }).en, 'Eight comes after seven.');
  assert.equal(sentenceOf('t5', { ask: 'between', n: 12, m: 14, answer: 13 }).en, 'Thirteen is between twelve and fourteen.');
  assert.equal(sentenceOf('t5', { ask: 'more', n: 9, answer: 10 }).en, 'Ten is one more than nine.');
  assert.deepEqual(itemRef(MATH_BY_ID.get('math-t5'), { ask: 'after', n: 7 }), { lessonId: 'math-t5', activity: 'after', itemId: '7' });
  for (const q of ['comesAfter', 'comesBefore', 'oneMore', 'oneLess']) assert.match(translateQuestion(QUESTIONS[q](7)), /7/, q);
  assert.match(translateQuestion(QUESTIONS.between(12, 14)), /12 và 14/);
});

test('T7 Read and compare (4.7, 7): câu đố viết sẵn — người / đồ có hình, số khớp câu, một đáp án; mức 1–2 ≤ 10, mức 3 tới 20 khi đã có ⭐⭐ T5', () => {
  assert.ok(T7_PUZZLES.length >= 20);
  for (const p of T7_PUZZLES) {
    const [[a, x], [b, y]] = p.people;
    assert.ok(T7_PEOPLE[a] && T7_PEOPLE[b] && a !== b, p.id);
    assert.ok(T7_THINGS[p.thing], p.id);
    assert.ok(x >= 2 && y >= 2 && x !== y && x <= 20 && y <= 20, p.id);
    for (const ask of ['more', 'fewer']) {
      const it = t7Item(p, ask);
      const { en, vi } = puzzleText(it);
      // Số trong câu khớp số người có; đúng một đáp án; answer khớp ask.
      assert.deepEqual((en.match(/\d+/g) ?? []).map(Number), [x, y], p.id);
      const win = ask === 'more' ? (x > y ? a : b) : (x < y ? a : b);
      assert.equal(it.answer, win, p.id);
      assert.equal(en.split('. ').length, 3, 'câu đố 3 câu');
      assert.ok(vi && translateQuestion(en).startsWith(vi.replace(/\?$/, '')), p.id);
      assert.ok(explainVi('t7', it).includes(T7_PEOPLE[win].vi), p.id);
    }
  }
  const max = (items) => Math.max(...items.flatMap((x) => x.people.map((p) => p.n)));
  for (const items of rounds('t7', 1)) assert.ok(max(items) <= 10 && items.every((x) => Math.abs(x.people[0].n - x.people[1].n) >= 2));
  for (const items of rounds('t7', 2)) assert.ok(max(items) <= 10);
  for (const items of rounds('t7', 3)) assert.ok(max(items) <= 10, 'chưa có ⭐⭐ T5 → vẫn ≤ 10');
  const big = rounds('t7', 3, { allow20: true });
  assert.ok(big.every((items) => items.filter((x) => Math.max(...x.people.map((p) => p.n)) > 10).length >= 3));
  for (const items of [...big, ...rounds('t7', 1)]) assert.equal(new Set(items.map((x) => x.id)).size, 8, 'không lặp câu đố');
  assert.equal(sentenceOf('t7', t7Item(T7_PUZZLES[0], 'more')).en, 'Tom has more apples.');
  assert.equal(sentenceOf('t7', t7Item(T7_PUZZLES[0], 'fewer')).en, 'Anna has fewer apples.');
  assert.equal(word(20), 'twenty');
});
