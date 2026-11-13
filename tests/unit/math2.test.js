// 🔢 Toán phần 2 (SPEC-math2.md mục 11): khay đáp án, vị trí đáp án, câu đọc `mathSentence`, `problemKey`, bộ sinh
// T8 How many more / T9 Number bonds / T10 Add it up / T11 Take away (500 lượt × mức), phân bố 40–60 %, MATH-01 → 10, 15, 16, 19.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeItems, seeded, sentenceOf, explainVi, itemRef, MATH_BY_ID, MATH_ITEMS, T7_PEOPLE, T7_THINGS } from '../../app/js/math/math.js';
import {
  answerOptions, answerSlots, trayCount, mathSentence, opSentence, moreText, bondText, bondSides, t8Item, t9Item, thingOne, countLine,
  opItem, opText, opHintLine,
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

// ---------- Math-e: T10 Add it up, T11 Take away ----------

test('T10 bộ sinh (MATH-06 / 07 / 08): mức 1 tổng ≤ 5, mức 2–3 ≤ 10; chuyện ở mức 1–2; mức 3 cặp đổi chỗ không liền + ≥ 1 mục + 0, không 0 + 0; chiến lược đếm', () => {
  let ten = 0;
  const zeroForms = new Set();
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t10', level)) {
      checkSlots(items);
      assert.equal(new Set(items.map((x) => x.pair)).size, MATH_ITEMS);
      for (const x of items) {
        assert.equal(x.op, '+');
        assert.equal(x.answer, x.a + x.b);
        assert.ok(x.answer <= (level === 1 ? 5 : 10) && x.answer >= 1);
        assert.equal(x.story, level < 3);
        assert.equal(!!x.thing, level < 3);
        checkTray(x);
        const zero = x.a === 0 || x.b === 0;
        if (zero) {
          assert.equal(level, 3, '+ 0 chỉ ở mức 3');
          assert.equal(x.hint, 'no-more');
          zeroForms.add(x.a === 0 ? '0+n' : 'n+0');
        } else {
          assert.equal(x.hint, ['count-all', 'count-on-start', 'count-on-bigger'][level - 1]);
          if (level === 2) assert.equal(x.start, x.a, 'có chuyện: đếm tiếp từ số ban đầu');
          if (level === 3) assert.equal(x.start, Math.max(x.a, x.b), 'chỉ phép tính: từ số lớn hơn');
        }
        if (x.answer === 10) ten++;
        if (level > 1 && x.a - x.b >= 0 && x.a - x.b !== x.answer) assert.ok(x.options.includes(x.a - x.b), 'bẫy a − b');
      }
      if (level === 3) {
        const turns = items.map((x, i) => (x.kind === 't10:turnaround' ? i : -1)).filter((i) => i >= 0);
        assert.equal(turns.length, 2);
        assert.ok(turns[1] - turns[0] > 1, 'cặp đổi chỗ không liền nhau');
        const [p, q] = turns.map((i) => items[i]);
        assert.deepEqual([p.a, p.b], [q.b, q.a]);
        assert.notEqual(p.pair, q.pair);
        assert.ok(items.some((x) => x.kind === 't10:zero'));
      }
    }
  }
  assert.ok(ten > 0, 'có mục a + b = 10');
  assert.deepEqual([...zeroForms].sort(), ['0+n', 'n+0'], 'sinh được cả 5 + 0 và 0 + 5');
});

test('T11 bộ sinh (MATH-09 / 10): b ≤ a, kết quả không âm; mức 1–2 b ≥ 1 và còn lại ≥ 1; mức 3 mỗi lượt có − 0 và trừ hết', () => {
  for (const level of [1, 2, 3]) {
    for (const items of rounds('t11', level)) {
      checkSlots(items);
      assert.equal(new Set(items.map((x) => x.pair)).size, MATH_ITEMS);
      for (const x of items) {
        assert.equal(x.op, '−');
        assert.ok(x.b <= x.a && x.answer === x.a - x.b && x.a <= (level === 1 ? 5 : 10));
        assert.equal(x.hint, 'count-left');
        if (level < 3) assert.ok(x.b >= 1 && x.answer >= 1);
        checkTray(x);
        if (level > 1 && x.a + x.b <= 10 && x.a + x.b !== x.answer) assert.ok(x.options.includes(x.a + x.b), 'bẫy cộng nhầm');
      }
      if (level === 3) {
        assert.ok(items.some((x) => x.b === 0 && x.kind === 't11:zero'), 'có − 0');
        assert.ok(items.some((x) => x.b === x.a && x.answer === 0 && x.kind === 't11:all'), 'có trừ hết');
      }
    }
  }
});

test('T10 / T11 câu Olly: chuyện số ít / số nhiều, mức 3 chỉ phép tính; gợi ý; câu đọc; tiếng Việt', () => {
  const one = opItem({ op: '+', a: 1, b: 1, thing: 'ducks' }, 1, seeded(1), 0);
  assert.equal(opText(one).en, '1 duck is in the pond. 1 more duck comes. How many ducks are there altogether?');
  const add = opItem({ op: '+', a: 3, b: 2, thing: 'ducks' }, 1, seeded(1), 0);
  assert.deepEqual(opText(add), {
    en: '3 ducks are in the pond. 2 more ducks come. How many ducks are there altogether?',
    vi: 'Có 3 con vịt trong ao. Thêm 2 con vịt nữa đến. Hỏi có tất cả bao nhiêu con vịt?',
  });
  assert.equal(opHintLine(add), "Let's count them all!");
  assert.equal(explainVi('t10', add), 'Có 3 con vịt, thêm 2 con nữa. Gộp lại: 3 cộng 2 bằng 5.');
  assert.equal(sentenceOf('t10', add).en, 'Three plus two is five.');
  const sub = opItem({ op: '−', a: 5, b: 2, thing: 'birds' }, 2, seeded(1), 0);
  assert.equal(opText(sub).en, '5 birds are on the tree. 2 birds fly away. How many birds are left?');
  assert.equal(opText(opItem({ op: '−', a: 3, b: 1, thing: 'birds' }, 1, seeded(1), 0)).en, '3 birds are on the tree. 1 bird flies away. How many birds are left?');
  assert.equal(explainVi('t11', sub), 'Có 5 con chim, 2 con bay đi. Đếm phần còn lại: 5 trừ 2 bằng 3.');
  assert.equal(sentenceOf('t11', sub).en, 'Five take away two equals three.');
  const on = opItem({ op: '+', a: 2, b: 5, thing: 'ducks' }, 2, seeded(1), 0);
  assert.equal(opHintLine(on), 'Start at two. Count on!'); // MATH-19: có chuyện → số ban đầu
  const big = opItem({ op: '+', a: 2, b: 5 }, 3, seeded(1), 0);
  assert.deepEqual([opText(big).en, opHintLine(big)], ['What is 2 plus 5?', 'Start at five. Count on!']);
  assert.equal(explainVi('t10', big), 'Bắt đầu từ số lớn hơn là 5, đếm tiếp 6, 7: 2 cộng 5 bằng 7.');
  const z = opItem({ op: '+', a: 0, b: 5 }, 3, seeded(1), 0);
  assert.equal(opHintLine(z), 'Start at five. No more to add!');
  const all = opItem({ op: '−', a: 4, b: 4 }, 3, seeded(1), 0);
  assert.deepEqual([opText(all).en, opHintLine(all), sentenceOf('t11', all).en], ['What is 4 minus 4?', 'Look! None are left.', 'Four minus four equals zero.']);
  assert.equal(opHintLine(opItem({ op: '−', a: 4, b: 4, thing: 'birds' }, 2, seeded(1), 0)), 'Look! No birds are left.');
  assert.equal(opHintLine(opItem({ op: '−', a: 6, b: 0 }, 3, seeded(1), 0)), 'Nothing is taken away!');
  assert.deepEqual(answerOptions(0, [8, 4], 4), [8, 4, 1]); // 4 − 4: bẫy 8 (cộng nhầm), 4 (số trừ)
  assert.match(translateQuestion('What is 7 minus 3?'), /^7 trừ 3 bằng mấy\?/);
  assert.match(translateQuestion(opText(add).en, opText(add).vi), /^Có 3 con vịt trong ao\..*Bé chạm số đúng trong khay\.$/);
  assert.deepEqual(itemRef(MATH_BY_ID.get('math-t10'), add), { lessonId: 'math-t10', activity: 'add', itemId: '3-2' });
  assert.deepEqual(itemRef(MATH_BY_ID.get('math-t11'), sub), { lessonId: 'math-t11', activity: 'sub', itemId: '5-2' });
});

test('phân bố T10 mức 3 (ngưỡng 40–60 %): số lớn hơn ở vị trí a', () => {
  const all = rounds('t10', 3).flat().filter((x) => x.a !== x.b && x.a > 0 && x.b > 0);
  const s = share(all, (x) => x.a > x.b);
  assert.ok(s >= 0.4 && s <= 0.6, String(s));
});
