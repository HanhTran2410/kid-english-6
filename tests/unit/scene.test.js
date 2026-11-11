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

test('kiểm tra tranh (bảng 7.4): lỗi chỉ rõ câu; thiếu thì điền mặc định; hit kẹp + cảnh báo; point null bỏ qua hit', async () => {
  const { validateScene, parseSceneText, scenePrompt } = await import('../../app/js/scene-data.js');
  const ok = validateScene({
    title: 'At the beach',
    sentences: [
      { en: 'It is a hot day.', vi: 'Hôm nay trời nóng.', point: null, hit: 0.5 },
      { en: 'A girl is on the sand.', vi: 'Một bạn gái ở trên cát.', point: { x: 0.3, y: 0.6 }, hit: 0.5 },
      { en: 'A crab is red.', point: { x: 0.7, y: 0.8 } },
    ],
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.scene.level, 2);
  assert.match(ok.scene.id, /^scene-/);
  assert.equal(ok.scene.sentences[1].hit, 0.2);
  assert.equal(ok.scene.sentences[1].from, 'auto');
  assert.equal(new Set(ok.scene.sentences.map((s) => s.sid)).size, 3);
  assert.ok(ok.warnings.some((w) => /Câu 2: vùng chạm/.test(w)));
  assert.ok(ok.warnings.some((w) => /Câu 3: chưa có tiếng Việt/.test(w)));
  assert.ok(!ok.warnings.some((w) => /Câu 1: vùng chạm/.test(w)));

  const errs = (d) => validateScene(d).errors.join('\n');
  assert.match(errs({ title: 'X', sentences: [{ en: 'A', point: { x: 1.3, y: 0.5 } }] }), /Câu 1: vị trí mũi tên phải từ 0 đến 1/);
  assert.match(errs({ title: 'X', sentences: [{ en: 'A' }, { vi: 'b' }] }), /Câu 2: thiếu câu tiếng Anh/);
  assert.match(errs({ title: 'X', sentences: [{ en: 'A', from: 'up' }] }), /hướng mũi tên "up"/);
  assert.match(errs({ sentences: [] }), /Thiếu tên tranh[\s\S]*1–12 câu/);
  assert.match(errs({ title: 'X', level: 5, sentences: [{ en: 'A' }] }), /"level"/);
  assert.match(errs({ title: 'X', sentences: [{ en: 'A', keywords: 'boy' }] }), /"keywords"/);

  const w = validateScene({ title: 'X', level: 1, sentences: [{ en: 'He is a very big and happy boy today.', point: null }] }).warnings.join('\n');
  assert.match(w, /dài hơn mức cấp 1/);
  assert.match(w, /đại từ/);
  assert.match(w, /Chưa câu nào có mũi tên/);

  assert.equal(parseSceneText('```json\n{"title":"A"}\n```').data.title, 'A');
  const p = scenePrompt({ level: 1 });
  assert.match(p, /Cấp độ 1: mỗi câu 3–6 từ/);
  assert.match(p, /"point": null/);
  const example = JSON.parse(p.slice(p.indexOf('{', p.indexOf('VÍ DỤ CẤU TRÚC'))));
  assert.equal(validateScene(example).ok, true);
});

test('tranh có sẵn: vùng chạm / vòng sáng bao quanh ĐỐI TƯỢNG (`at` = tâm emoji), không quanh đầu mũi tên đặt cạnh hình', async () => {
  const { hitCenter } = await import('../../app/js/scene.js');
  for (const scene of BUILTIN_SCENES) {
    // Tâm các emoji trong SVG (text-anchor middle + dominant-baseline central → x, y là tâm hình).
    const emojis = [...scene.svg.matchAll(/<text x="(\d+)" y="(\d+)"/g)].map(([, x, y]) => ({ x: Number(x) / 800, y: Number(y) / 600 }));
    const pointed = scene.sentences.filter((s) => s.point);
    for (const s of pointed) {
      assert.ok(s.at, `${s.en}: có tâm đối tượng`);
      assert.deepEqual(hitCenter(s), s.at);
      const near = Math.min(...emojis.map((e) => Math.hypot(e.x - s.at.x, e.y - s.at.y)));
      // Hai con vịt: tâm ở giữa hai con; mặt trời và cậu bé không phải emoji (vẽ SVG) — bỏ qua.
      if (!/ducks|sun|boy/.test(s.en)) assert.ok(near < 0.01, `${s.en}: at trùng tâm một emoji (lệch ${near.toFixed(3)})`);
      // Chạm vào giữa đối tượng → đúng câu đó (trước đây vùng chạm lệch sang phía đuôi mũi tên).
      assert.equal(pickSentence(scene.sentences, { x: s.at.x * box.w, y: s.at.y * box.h }, box), scene.sentences.indexOf(s), s.en);
    }
    const kite = scene.sentences.find((s) => /kite is in the sky/.test(s.en));
    if (kite) {
      // Mép trái con diều (cách tâm 35px) vẫn trúng; trước đây tâm vùng chạm nằm ở đầu mũi tên bên phải.
      assert.equal(pickSentence(scene.sentences, { x: kite.at.x * 800 - 35, y: kite.at.y * 600 }, box), scene.sentences.indexOf(kite));
    }
  }
  // Tranh bố mẹ soạn (không có `at`): vùng chạm ở chính chỗ bố mẹ chạm.
  assert.deepEqual(hitCenter({ point: { x: 0.3, y: 0.4 } }), { x: 0.3, y: 0.4 });
});

test('kiểm tra tranh giữ `at` (bản sao tranh có sẵn), `at` ngoài 0–1 báo lỗi', async () => {
  const { validateScene } = await import('../../app/js/scene-data.js');
  const ok = validateScene({ title: 'X', sentences: [{ en: 'A kite.', vi: 'Diều.', point: { x: 0.6, y: 0.2 }, at: { x: 0.55, y: 0.2 } }] });
  assert.ok(ok.ok);
  assert.deepEqual(ok.scene.sentences[0].at, { x: 0.55, y: 0.2 });
  const bad = validateScene({ title: 'X', sentences: [{ en: 'A kite.', point: { x: 0.6, y: 0.2 }, at: { x: 1.4, y: 0.2 } }] });
  assert.match(bad.errors.join('\n'), /vị trí đối tượng \("at"\) phải từ 0 đến 1/);
});
