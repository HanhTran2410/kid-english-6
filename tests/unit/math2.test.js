// 🔢 Toán phần 2 (SPEC-math2.md mục 11): khay đáp án, vị trí đáp án, câu đọc `mathSentence`, `problemKey`, bộ sinh
// T8 How many more / T9 Number bonds (500 lượt × mức), phân bố 40–60 %, MATH-01 / 02 / 04 / 05 / 15 / 16.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeItems, seeded, sentenceOf, explainVi, itemRef, MATH_BY_ID, MATH_ITEMS, T7_PEOPLE, T7_THINGS } from '../../app/js/math/math.js';
import {
  answerOptions, answerSlots, trayCount, mathSentence, opSentence, moreText, bondText, bondSides, t8Item, t9Item, thingOne, countLine,
} from '../../app/js/math/sums.js';
import { translateQuestion } from '../../app/js/captions.js';

const RUNS = 500;
const rounds = (key, level, opts = {}) => Array.from({ length: RUNS }, (_, i) => makeItems(key, level, seeded(i + 1), opts));
const share = (all, pred) => all.filter(pred).length / all.length;

/** Khay hợp lệ (2.2): đủ thẻ, khác nhau, trong 0–10, đúng một đáp án ở vị trí `at`. */
function checkTray(x) {
  assert.equal(x.options.length, trayCount(x.level));
  assert.equal(new Set(x.options).size, x.options.length);
  assert.ok(x.options.every((n) => Number.isInteger(n) && n >= 0 && n <= 10), x.options.join());
  assert.equal(x.options.filter((n) => n === x.answer).length, 1);
  assert.equal(x.options[x.at], x.answer);
}

/** Vị trí đáp án trong lượt (MATH-16): ≤ 3 / 8 mỗi vị trí, không hai mục liền cùng vị trí. */
function checkSlots(items) {
  const at = items.map((x) => x.at);
  for (const p of new Set(at)) assert.ok(at.filter((x) => x === p).length <= 3);
  assert.ok(at.every((p, i) => i === 0 || p !== at[i - 1]));
}

test('answerOptions (2.2): bẫy trước, rồi ± 1, ± 2; bỏ số ngoài 0–10 / trùng; biên 0 và 10 (MATH-15)', () => {
  assert.deepEqual(answerOptions(2, [5, 3], 4), [5, 3, 1]);
  assert.deepEqual(answerOptions(10, [], 3), [9, 8]); // 10 − 0: không có 11
  assert.deepEqual(answerOptions(0, [8, 4], 4), [8, 4, 1]); // 4 − 4: bẫy 8, 4 rồi 1
  assert.deepEqual(answerOptions(5, [5, 0], 4), [0, 6, 4]); // T9 known = 0: bẫy tổng trùng đáp án bị bỏ
  assert.deepEqual(answerOptions(3, [12, -1, 3], 4), [4, 2, 5]);
  for (let ans = 0; ans <= 10; ans++) {
    for (const count of [3, 4]) {
      const out = answerOptions(ans, [ans, 11, -2], count);
      assert.equal(out.length, count - 1);
      assert.ok(out.every((n) => n >= 0 && n <= 10 && n !== ans));
    }
  }
});

test('answerSlots (MATH-16): 500 lượt × 3 / 4 thẻ — mỗi vị trí ≤ 3, không liền; các vị trí xuất hiện xấp xỉ đều', () => {
  for (const count of [3, 4]) {
    const all = [];
    for (let i = 0; i < RUNS; i++) {
      const seq = answerSlots(seeded(i + 1), MATH_ITEMS, count);
      checkSlots(seq.map((at) => ({ at })));
      all.push(...seq);
    }
    for (let p = 0; p < count; p++) {
      const s = share(all, (x) => x === p);
      assert.ok(Math.abs(s - 1 / count) < 0.05, `vị trí ${p}: ${s}`);
    }
  }
});

test('mathSentence (2.3): bảng T8 → T12; số ít khi chênh 1; T9 luôn "N is a and b"', () => {
  const t8 = t8Item({ more: ['Tom', 5], less: ['Anna', 3], thing: 'apples', top: 'more' }, 1, seeded(1), 0);
  assert.deepEqual(mathSentence(t8), { en: 'Tom has two more apples.', vi: 'Tom có nhiều hơn Anna 2 quả táo.' });
  const one = t8Item({ more: ['Dad', 4], less: ['Grandma', 3], thing: 'fish', top: 'less' }, 2, seeded(1), 0);
  assert.equal(mathSentence(one).en, 'Dad has one more fish.');
  assert.equal(mathSentence({ ...one, thing: 'cookies' }).en, 'Dad has one more cookie.');
  assert.equal(mathSentence(one).vi, 'Bố có nhiều hơn bà 1 con cá.');
  assert.deepEqual(['apples', 'balls', 'cars', 'books', 'sweets', 'flowers', 'stars', 'cookies', 'ducks', 'fish'].map(thingOne),
    ['apple', 'ball', 'car', 'book', 'sweet', 'flower', 'star', 'cookie', 'duck', 'fish']);
  assert.deepEqual(Object.keys(T7_THINGS).map(thingOne).length, 10);
  const bond = t9Item({ total: 7, known: 4, hidden: 'right' }, 2, seeded(1), 0);
  assert.deepEqual(mathSentence(bond), { en: 'Seven is four and three.', vi: '7 gồm 4 và 3.' });
  assert.equal(mathSentence(t9Item({ total: 7, known: 4, hidden: 'left' }, 2, seeded(1), 0)).en, 'Seven is three and four.');
  assert.equal(mathSentence(t9Item({ total: 5, known: 0, hidden: 'left' }, 3, seeded(1), 0)).en, 'Five is zero and five.');
  assert.deepEqual(['+', '+', '+'].map((op, i) => opSentence(op, 3, 2, 5, i + 1).en),
    ['Three plus two is five.', 'Three plus two equals five.', 'Three plus two equals five.']);
  assert.deepEqual([1, 2, 3].map((L) => opSentence('−', 5, 2, 3, L).en),
    ['Five take away two is three.', 'Five take away two equals three.', 'Five minus two equals three.']);
  assert.equal(opSentence('−', 4, 4, 0, 1).en, 'Four take away four is zero.');
  assert.equal(countLine(3), 'One, two, three!');
});

test('T8 bộ sinh (MATH-01 / 02): không bằng nhau; mức 1 ≤ 6 chênh 1–3, mức 2–3 ≤ 10 chênh 1–5; người khác nhau; khay; không lặp problemKey', () => {
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t8', level)) {
      checkSlots(items);
      assert.equal(new Set(items.map((x) => x.pair)).size, MATH_ITEMS);
      const top = items.filter((x) => x.top === 'more').length;
      assert.ok(top >= 3 && top <= 5, 'người nhiều hơn ở hàng trên 4 / 4 ± 1');
      for (const x of items) {
        assert.notEqual(x.more.n, x.less.n);
        assert.equal(x.answer, x.more.n - x.less.n);
        assert.ok(x.less.n >= 1 && x.more.n <= (level === 1 ? 6 : 10));
        assert.ok(x.answer >= 1 && x.answer <= (level === 1 ? 3 : 5));
        assert.notEqual(x.more.name, x.less.name);
        assert.ok(T7_PEOPLE[x.more.name] && T7_PEOPLE[x.less.name] && T7_THINGS[x.thing]);
        assert.equal(x.layout, level === 3 ? 'scattered' : 'columns');
        assert.equal(x.pair, `more:${x.more.n}-${x.less.n}`);
        checkTray(x);
        // Bẫy (mức 2–3): số đồ của từng người, khi hợp lệ.
        if (level > 1) for (const trap of [x.more.n, x.less.n]) if (trap !== x.answer) assert.ok(x.options.includes(trap), `bẫy ${trap}`);
      }
    }
  }
});

test('T8 câu đố: hàng trên nói trước, hỏi người nhiều hơn, số ít "1 apple"; tiếng Việt khi sai 2 lần', () => {
  const x = t8Item({ more: ['Grandpa', 4], less: ['Mum', 1], thing: 'apples', top: 'less' }, 2, seeded(1), 0);
  assert.deepEqual(moreText(x), {
    en: 'Mum has 1 apple. Grandpa has 4 apples. How many more apples does Grandpa have?',
    vi: 'Mẹ có 1 quả táo. Ông có 4 quả táo. Ông có nhiều hơn mẹ mấy quả táo?',
  });
  assert.equal(explainVi('t8', x), 'Ghép mỗi quả táo của ông với một quả táo của mẹ. Ông còn 3 quả táo không có cặp. Vậy ông nhiều hơn mẹ 3 quả táo.');
  assert.match(translateQuestion(moreText(x).en, moreText(x).vi), /^Mẹ có 1 quả táo\..*Bé chạm số đúng trong khay\.$/);
});

test('T9 bộ sinh (MATH-04 / 05): known + answer = total, answer ≥ 1; mức 1 tổng 2–5; mức 3 ≥ 3 mục tổng 10, ≤ 1 mục known = 0; khay', () => {
  let zeros = 0;
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t9', level)) {
      checkSlots(items);
      assert.equal(new Set(items.map((x) => x.pair)).size, MATH_ITEMS);
      const left = items.filter((x) => x.hidden === 'left').length;
      assert.ok(left >= 3 && left <= 5, 'cánh úp trái / phải cân bằng');
      const zero = items.filter((x) => x.known === 0);
      assert.ok(zero.length <= (level === 3 ? 1 : 0));
      zeros += zero.length;
      if (level === 3) assert.ok(items.filter((x) => x.total === 10).length >= 3);
      for (const x of items) {
        assert.equal(x.known + x.answer, x.total);
        assert.ok(x.answer >= 1 && x.total >= 2 && x.total <= (level === 1 ? 5 : 10));
        assert.deepEqual([...bondSides(x)].sort(), [x.known, x.answer].sort());
        checkTray(x);
        if (x.known === 0) {
          // MATH-04: bẫy "tổng" trùng đáp án bị bỏ — khay vẫn đủ 4 thẻ, đáp án đúng một thẻ; cánh 0 là cánh trái.
          assert.equal(x.answer, x.total);
          assert.equal(x.hidden, 'right');
          assert.equal(x.kind, 't9:zero');
        }
      }
    }
  }
  assert.ok(zeros > 100, 'mức 3 có mục known = 0');
  const z = t9Item({ total: 5, known: 0, hidden: 'right' }, 3, seeded(1), 1);
  assert.equal(z.options.length, 4);
  assert.equal(explainVi('t9', z), '5 gồm 0 và 5. Cánh này không có chấm nào, nên cả 5 chấm đều ở cánh kia.');
  const b = t9Item({ total: 7, known: 4, hidden: 'right' }, 1, seeded(1), 0);
  assert.equal(explainVi('t9', b), '7 gồm 4 và 3. Có 4 chấm rồi, đếm tiếp 5, 6, 7: thêm 3 chấm.');
  assert.equal(bondText(b).en, 'The ladybug has 7 spots. How many spots are hidden?');
  assert.match(translateQuestion(bondText(b).en), /^Bọ rùa có 7 chấm\./);
});

test('phân bố 500 lượt (11, ngưỡng 40–60 %): T8 người nhiều hơn ở hàng trên; T9 cánh úp bên phải', () => {
  for (const level of [1, 2, 3]) {
    const t8 = rounds('t8', level).flat();
    const t9 = rounds('t9', level).flat();
    const a = share(t8, (x) => x.top === 'more');
    const b = share(t9, (x) => x.hidden === 'right');
    assert.ok(a >= 0.4 && a <= 0.6, `T8 L${level} ${a}`);
    assert.ok(b >= 0.4 && b <= 0.6, `T9 L${level} ${b}`);
  }
});

test('problemKey (2.4) → khóa tiến độ math-t8/more/5-3, math-t9/bond/7-4; ưu tiên key chưa gặp gần đây', () => {
  const t8 = t8Item({ more: ['Tom', 5], less: ['Anna', 3], thing: 'apples', top: 'more' }, 1, seeded(1), 0);
  assert.deepEqual(itemRef(MATH_BY_ID.get('math-t8'), t8), { lessonId: 'math-t8', activity: 'more', itemId: '5-3' });
  const t9 = t9Item({ total: 7, known: 4, hidden: 'left' }, 2, seeded(1), 0);
  assert.deepEqual(itemRef(MATH_BY_ID.get('math-t9'), t9), { lessonId: 'math-t9', activity: 'bond', itemId: '7-4' });
  // Mức 1 T9 chỉ có 10 key cho 8 mục: tránh 2 key vừa gặp vẫn sinh được, và hầu như không gặp lại.
  const recent = ['bond:5-2', 'bond:4-1'];
  let hits = 0;
  for (let i = 0; i < 200; i++) hits += makeItems('t9', 1, seeded(i + 1), { recent }).filter((x) => recent.includes(x.pair)).length;
  assert.ok(hits / 200 < 0.1, `gặp lại ${hits / 200} / lượt`);
  assert.equal(sentenceOf('t9', t9).en, 'Seven is three and four.');
});
