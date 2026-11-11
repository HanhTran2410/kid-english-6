// ✍️ Tập viết (SPEC-write.md mục 12.1): rải điểm, dữ liệu chữ + quy tắc nối nét, chấm nét với nét giả lập cho mọi
// nét của mọi chữ, kết quả lượt, sao, streak, phụ đề.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, WRITE_GROUPS, LETTER_ORDER, WRITE_LINES } from '../../app/js/write/letters.js';
import {
  WRITE_LEVELS, sampleStroke, strokeEnds, segEnds, prepareInput, judgeStroke, turnResult, letterStars, applyLetterTurn,
  isDotStroke, dist,
} from '../../app/js/write/stroke.js';
import { emptyItem } from '../../app/js/progress.js';
import { translateQuestion } from '../../app/js/captions.js';
import { SOUND_INFO } from '../../app/js/phonics.js';
import { fakeStroke } from '../write-fake.js';

const { easy, hard } = WRITE_LEVELS;
const judge = (raw, stroke, cfg = easy, opts) => judgeStroke(prepareInput(raw), sampleStroke(stroke), cfg, opts);
const allStrokes = () => Object.entries(LETTERS).flatMap(([l, info]) => info.strokes.map((s, i) => ({ l, i, s })));

test('sampleStroke: line / arc / bez cách đều ~2 đơn vị, t tăng 0 → 1; chấm = một điểm', () => {
  for (const s of [[['line', 0, 0, 0, 100]], [['arc', 27, 75, 23, 25, -30, -330]], [['bez', 47, 130, 47, 152, 14, 152, 6, 136]]]) {
    const { points } = sampleStroke(s);
    assert.equal(points[0].t, 0);
    assert.equal(points.at(-1).t, 1);
    for (let i = 1; i < points.length - 1; i++) {
      assert.ok(Math.abs(dist(points[i - 1], points[i]) - 2) < 0.05, `bước ${i}`);
      assert.ok(points[i].t > points[i - 1].t);
    }
  }
  const dot = sampleStroke([['dot', 10, 30]]);
  assert.deepEqual([dot.dot, dot.points.length], [true, 1]);
});

test('cung to < from đi ngược chiều kim đồng hồ: c đi qua phía trên trước phía dưới', () => {
  const { points } = sampleStroke(LETTERS.c.strokes[0]);
  const top = points.findIndex((p) => p.y < 52);
  const bottom = points.findIndex((p) => p.y > 98);
  assert.ok(top >= 0 && bottom > top);
  const { start, end } = strokeEnds(LETTERS.c.strokes[0]);
  assert.ok(start.x > 40 && start.y < 70 && end.x > 40 && end.y > 80, 'từ 2 giờ tới 4 giờ');
});

test('dữ liệu chữ: đủ 26 chữ, mỗi chữ đúng một nhóm, có âm rời, đủ câu EN / VI, câu EN có phụ đề', () => {
  assert.deepEqual(Object.keys(LETTERS).sort(), [...'abcdefghijklmnopqrstuvwxyz']);
  for (const l of Object.keys(LETTERS)) {
    assert.equal(WRITE_GROUPS.filter((g) => g.letters.includes(l)).length, 1, l);
    assert.equal(WRITE_GROUPS.find((g) => g.letters.includes(l)).id, LETTERS[l].group, l);
    const info = LETTERS[l];
    assert.ok(info.say && info.vi, l);
    assert.equal(info.strokeVi.length, info.strokes.length, l);
    assert.equal(translateQuestion(info.say), info.vi, l);
    assert.ok(SOUND_INFO[info.sound], `${l}: âm ${info.sound}`);
  }
  assert.equal(new Set(Object.values(LETTERS).map((x) => x.say)).size, 26, 'câu say riêng từng chữ');
  assert.equal(new Set(WRITE_GROUPS.flatMap((g) => g.letters)).size, 26);
  assert.deepEqual(LETTER_ORDER, WRITE_GROUPS.flatMap((g) => g.letters));
  for (const line of Object.values(WRITE_LINES)) assert.ok(translateQuestion(line), line);
});

test('đoạn liền mạch (≤ 0,5), nét trong khung', () => {
  for (const { l, i, s } of allStrokes()) {
    for (let k = 1; k < s.length; k++) assert.ok(dist(segEnds(s[k - 1])[1], segEnds(s[k])[0]) <= 0.5, `${l} nét ${i + 1} đoạn ${k + 1}`);
    for (const p of sampleStroke(s).points) {
      assert.ok(p.x >= 0 && p.x <= LETTERS[l].width && p.y >= -5 && p.y <= 155, `${l} nét ${i + 1}: ${p.x},${p.y}`);
    }
  }
});

test('quy tắc nối nét (6.3): nét sau chạm chữ đã viết ≤ 6; chấm cách thân ≥ 12 và nằm trên; a d g q: nét thẳng tiếp xúc bụng (WR-13)', () => {
  for (const [l, info] of Object.entries(LETTERS)) {
    const pts = info.strokes.map((s) => sampleStroke(s, 1).points);
    for (let i = 1; i < pts.length; i++) {
      if (isDotStroke(info.strokes[i])) {
        const dot = pts[i][0];
        const body = pts.filter((_, k) => k !== i).flat();
        assert.ok(body.every((q) => dist(dot, q) >= 12), `${l}: chấm cách thân ≥ 12`);
        assert.ok(body.every((q) => dot.y < q.y), `${l}: chấm nằm trên thân`);
        assert.equal(i, info.strokes.length - 1, `${l}: chấm là nét cuối`);
        continue;
      }
      const before = pts.slice(0, i).flat();
      assert.ok(pts[i].some((p) => before.some((q) => dist(p, q) <= 6)), `${l} nét ${i + 1}`);
    }
  }
  for (const l of ['a', 'd', 'g', 'q']) {
    const [bowl, stem] = LETTERS[l].strokes;
    const [, cx, , rx] = bowl[0];
    const x = stem[0][1];
    assert.equal(cx + rx, x, `${l}: tiếp xúc ở mép phải bụng`);
    const { start, end } = strokeEnds(bowl);
    assert.ok(Math.abs(start.x - x) <= 4 && Math.abs(end.x - x) <= 4, l);
  }
});

test('r n m h b p: một nét, đoạn đi lên trùng đoạn đi xuống và ngắn hơn; chữ cao / thấp / có đuôi đúng dòng kẻ; tách nét đi từ trên xuống, ngang trái → phải', () => {
  for (const l of ['r', 'n', 'm', 'h', 'b', 'p']) {
    assert.equal(LETTERS[l].strokes.length, 1, `${l}: một nét liền`);
    const segs = LETTERS[l].strokes[0];
    let ups = 0;
    for (let k = 1; k < segs.length; k++) {
      const [kind, x1, y1, x2, y2] = segs[k];
      if (kind !== 'line' || y2 >= y1) continue;
      ups++;
      const [pk, dx1, dy1, dx2, dy2] = segs[k - 1];
      assert.equal(pk, 'line', l);
      assert.ok(x1 === dx1 && x2 === dx2 && x1 === x2, `${l}: lên trùng đường xuống`);
      assert.ok(y1 - y2 < dy2 - dy1, `${l}: lên ngắn hơn xuống`);
    }
    assert.ok(ups >= 1, `${l}: có đoạn đi ngược lên`);
  }
  const top = (l) => Math.min(...LETTERS[l].strokes.flatMap((s) => sampleStroke(s).points.map((p) => p.y)));
  const bottom = (l) => Math.max(...LETTERS[l].strokes.flatMap((s) => sampleStroke(s).points.map((p) => p.y)));
  for (const l of [...'bdfhkl']) assert.ok(top(l) <= 20, `${l}: chữ cao chạm dòng trên`);
  assert.equal(top('t'), 18);
  for (const l of [...'acemnorsuvwxz']) assert.ok(top(l) >= 49 && bottom(l) <= 101, `${l}: chữ thấp`);
  for (const l of [...'gjpqy']) assert.ok(bottom(l) >= 130, `${l}: có đuôi`);
  for (const l of [...'ij']) {
    const stem = sampleStroke(LETTERS[l].strokes[0]).points;
    assert.ok(Math.min(...stem.map((p) => p.y)) >= 49, `${l}: thân bắt đầu ở dòng giữa`);
  }
  for (const { l, s } of allStrokes()) {
    if (s.length > 1 || s[0][0] !== 'line') continue;
    const [, x1, y1, x2, y2] = s[0];
    if (y1 === y2) assert.ok(x1 < x2, `${l}: ngang trái → phải`);
    else assert.ok(y1 < y2, `${l}: từ trên xuống`);
  }
});

test('chấm nét — mọi nét của mọi chữ (bảng 12.1, mức Dễ)', () => {
  for (const { l, i, s } of allStrokes()) {
    if (isDotStroke(s)) continue; // nét chấm: test riêng
    const name = `${l} nét ${i + 1}`;
    assert.deepEqual(judge(fakeStroke(s), s), { ok: true }, `${name}: đúng nét mẫu`);
    assert.equal(judge(fakeStroke(s, { reverse: true }), s).reason, 'reverse', `${name}: đảo ngược`);
    // Spec ghi lệch 8; 8 < nearR mức Khó (10) nên dùng 12: đúng ở Dễ (15), sai ở Khó.
    assert.equal(judge(fakeStroke(s, { normal: 12 }), s).ok, true, `${name}: lệch đều 12 → đúng ở Dễ`);
    assert.equal(judge(fakeStroke(s, { normal: 12 }), s, hard).ok, false, `${name}: lệch đều 12 → sai ở Khó`);
    assert.equal(judge(fakeStroke(s, { normal: 8 }), s).ok, true, `${name}: lệch đều 8 → đúng ở Dễ`);
    assert.equal(judge(fakeStroke(s, { startShift: 30 }), s).reason, 'start', `${name}: bắt đầu lệch 30`);
    assert.equal(judge(fakeStroke(s, { pauseAt: 0.5 }), s).ok, true, `${name}: dừng giữa nét`);
    assert.equal(judge(fakeStroke(s, { jitter: 3 }), s).ok, true, `${name}: rê qua lại ±3`);
    const half = judge(fakeStroke(s, { cut: 0.5 }), s);
    assert.deepEqual([half.reason, half.lifted], ['stray', true], `${name}: nửa đầu nét (lỡ nhấc tay)`);
    assert.equal(judge([{ x: 30, y: 30 }, { x: 31, y: 31 }], s).ignored, true, `${name}: chạm khi cần nét kéo → bỏ qua`);
  }
});

test('nét gộp hai nét của t → stray; viết nét 2 trước nét 1 → start', () => {
  const [down, across] = LETTERS.t.strokes;
  const r = judge([...fakeStroke(down), ...fakeStroke(across)], down);
  assert.equal(r.reason, 'stray');
  assert.equal(r.lifted, false);
  assert.equal(judge(fakeStroke(across), down).reason, 'start');
  assert.equal(judge(fakeStroke(LETTERS.z.strokes[2]), LETTERS.z.strokes[1]).reason, 'start');
});

test('i, j (WR-05): chạm chấm trước nét thẳng → start; nét chấm của i: chạm đúng / chạm xa / kéo dài', () => {
  for (const l of ['i', 'j']) {
    const [stem, dot] = LETTERS[l].strokes;
    assert.equal(judge([{ x: dot[0][1], y: dot[0][2] }], stem).ignored, true, `${l}: chạm khi cần nét kéo → bỏ qua (không tính sai)`);
    assert.equal(judge(fakeStroke([['line', dot[0][1], 20, dot[0][1], 40]]), stem).reason, 'start', `${l}: kéo ở chỗ chấm trước → start`);
    assert.deepEqual(judge([{ x: dot[0][1] + 3, y: dot[0][2] - 2 }], dot), { ok: true }, l);
    assert.equal(judge(fakeStroke(stem), dot).reason, 'dot', `${l}: kéo nét thẳng khi cần chấm`);
  }
});

test('nét chấm: chạm cạnh chấm → đúng; chạm xa → start; kéo nét dài → dot', () => {
  const dot = [['dot', 10, 30]];
  assert.deepEqual(judge([{ x: 14, y: 33 }], dot), { ok: true });
  assert.equal(judge([{ x: 10, y: 70 }], dot).reason, 'start');
  assert.equal(judge(fakeStroke([['line', 10, 10, 10, 60]]), dot).reason, 'dot');
});

test('tô có dẫn: chỉ cần bắt đầu + hướng, startR × 1,5', () => {
  const s = LETTERS.l.strokes[0];
  assert.equal(judge(fakeStroke(s, { cut: 0.5 }), s, easy, { guided: true }).ok, true);
  assert.equal(judge(fakeStroke(s, { offset: [25, 0] }), s, easy, { guided: true }).ok, true);
  assert.equal(judge(fakeStroke(s, { reverse: true }), s, easy, { guided: true }).reason, 'reverse');
});

test('kết quả lượt, sao, streak (5.6, 5.7, 9.1)', () => {
  assert.equal(turnResult([{ wrong: 0 }, { wrong: 0 }]), 'independent');
  assert.equal(turnResult([{ wrong: 1 }, { wrong: 0 }]), 'helped');
  assert.equal(turnResult([{ wrong: 1 }, { wrong: 2 }]), 'missed');
  const [I, H, M] = ['independent', 'helped', 'missed'];
  assert.equal(letterStars([I, I, I]), 3);
  assert.equal(letterStars([I, H, I]), 2);
  assert.equal(letterStars([H, H, M]), 1);
  assert.equal(letterStars([M, M, I]), 1);
  assert.equal(letterStars([I, I]), null);
  let p = emptyItem({ lessonId: 'write', activity: 'letter', itemId: 'c' });
  for (const r of [I, I, H, I]) p = applyLetterTurn(p, r, r === H ? { start: 1 } : {}, 5);
  assert.deepEqual([p.seen, p.independent, p.helped, p.streak, p.reasons.start, p.lastAt], [4, 3, 1, 1, 1, 5]);
});
