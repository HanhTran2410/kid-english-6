// Tả tranh (SPEC-ta-tranh mục 4, 12.1): hình học mũi tên, vùng chạm, tranh có sẵn.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrowGeometry, arrowLength, pickSentence, hitRadius, DIRECTIONS, FROM_VALUES } from '../../app/js/scene.js';
import { BUILTIN_SCENES } from '../../app/js/data/builtin-scenes.js';

const box = { w: 800, h: 600 };
const inside = (p, b) => p.x >= 0 && p.x <= b.w && p.y >= 0 && p.y <= b.h;

test('mũi tên: đầu nhọn đúng điểm, thân trong ảnh, đúng hướng from khi đủ chỗ', () => {
  const g = arrowGeometry({ x: 0.5, y: 0.5 }, 'left', box);
  assert.deepEqual(g.tip, { x: 400, y: 300 });
  assert.equal(g.from, 'left');
  assert.equal(g.length, arrowLength(box));
  assert.ok(g.tail.x < g.tip.x && Math.abs(g.tail.y - g.tip.y) < 1e-9);
  assert.ok(Math.abs(g.angle) < 1e-9); // đuôi bên trái → mũi tên chỉ sang phải (0°)
  assert.equal(arrowGeometry({ x: 0.5, y: 0.5 }, 'top', box).angle, 90);
});

test('mũi tên: mọi hướng, mọi góc / mép tranh → thân luôn nằm trong ảnh; thiếu chỗ thì thu ngắn rồi đổi hướng', () => {
  const L = arrowLength(box);
  const pts = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5], [0.03, 0.97], [0.5, 0.5]];
  for (const [x, y] of pts) {
    for (const from of FROM_VALUES) {
      const g = arrowGeometry({ x, y }, from, box);
      assert.ok(inside(g.tail, box), `${from} @ ${x},${y}: đuôi ${JSON.stringify(g.tail)}`);
      assert.ok(g.length > 0 && g.length <= L);
      if (from !== 'auto' && g.from === from) assert.ok(g.length >= 0.5 * L);
      assert.ok(Object.keys(DIRECTIONS).includes(g.from));
    }
  }
  // Sát mép phải: "right" không đủ chỗ → auto chọn hướng khác (left là hướng thứ 2 trong thứ tự).
  assert.equal(arrowGeometry({ x: 0.99, y: 0.5 }, 'right', box).from, 'left');
  // auto ở giữa tranh → hướng đầu tiên trong thứ tự: right.
  assert.equal(arrowGeometry({ x: 0.5, y: 0.5 }, 'auto', box).from, 'right');
});

test('vùng chạm: bán kính theo cạnh ngắn, kẹp 0,04–0,2, tối thiểu 24px', () => {
  assert.equal(hitRadius({ hit: 0.08 }, box), 48);
  assert.equal(hitRadius({ hit: 0.5 }, box), 120);
  assert.equal(hitRadius({ hit: 0.01 }, { w: 200, h: 150 }), 24);
  assert.equal(hitRadius({}, box), 48);
});

test('chạm tranh: câu gần nhất (khoảng cách / bán kính); bằng nhau → câu đang hiện, rồi câu trước; ngoài vùng → −1', () => {
  const S = [
    { point: null },
    { point: { x: 0.5, y: 0.5 }, hit: 0.08 },
    { point: { x: 0.5, y: 0.5 }, hit: 0.08 }, // cùng điểm với câu 1
    { point: { x: 0.56, y: 0.5 }, hit: 0.08 },
  ];
  assert.equal(pickSentence(S, { x: 400, y: 300 }, box, -1), 1);
  assert.equal(pickSentence(S, { x: 400, y: 300 }, box, 2), 2);
  assert.equal(pickSentence(S, { x: 445, y: 300 }, box, 1), 3); // gần câu 3 hơn
  assert.equal(pickSentence(S, { x: 10, y: 10 }, box, 1), -1);
  for (let k = 0; k < 10; k++) assert.equal(pickSentence(S, { x: 424, y: 300 }, box, -1), 1); // không ngẫu nhiên
});

test('tranh có sẵn: câu đầu tả chung (không mũi tên), điểm trong 0–1, mũi tên đúng hướng đã đặt và nằm trong tranh', () => {
  for (const scene of BUILTIN_SCENES) {
    assert.equal(scene.sentences[0].point, null);
    assert.ok(scene.svg.startsWith('<svg') && scene.svg.includes('viewBox="0 0 800 600"'));
    for (const s of scene.sentences) {
      assert.ok(s.en && s.vi && s.sid);
      if (!s.point) continue;
      assert.ok(s.point.x >= 0 && s.point.x <= 1 && s.point.y >= 0 && s.point.y <= 1);
      for (const b of [box, { w: 360, h: 270 }]) {
        const g = arrowGeometry(s.point, s.from, b);
        assert.equal(g.from, s.from, `${s.en}: hướng ${s.from} phải đủ chỗ`);
        assert.ok(inside(g.tail, b));
      }
    }
  }
});
