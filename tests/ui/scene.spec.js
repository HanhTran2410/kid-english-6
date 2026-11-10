// 🖼️ Tả tranh — Nghe xem (SPEC-ta-tranh mục 8, 12.2): tab Tả tranh → tranh → tự đọc lần lượt, mũi tên đúng câu (câu đầu
// không có mũi tên), karaoke, VI bật / tắt không đổi chiều cao, ⏸ / ▶, ⏭ ⏮, chạm tranh nhảy câu, chạm từ, hết bài → nghe lại.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

async function openPark(page) {
  await fakeSpeech(page);
  await startApp(page);
  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await page.getByRole('button', { name: '🖼️ Tả tranh' }).click();
  await page.locator('.scene-card[data-scene="scene-park"]').click();
  await expect(page.locator('.scene-frame')).toBeVisible();
}

const counter = (page) => page.locator('.scene-counter');
const arrow = (page) => page.locator('.scene-arrow');

test('Tả tranh: tự đọc hết 7 câu theo thứ tự, mũi tên đúng câu, câu đầu không mũi tên; hết bài → ghi đã nghe, nghe lại', async ({ page }) => {
  // Ghi lại (câu đang hiện | mũi tên chỉ câu nào | hiện / ẩn) suốt bài — chế độ ?fast chạy rất nhanh, không đọc tức thời được.
  await page.addInitScript(() => {
    window.__log = new Set();
    new MutationObserver(() => {
      const c = document.querySelector('.scene-counter')?.textContent;
      const a = document.querySelector('.scene-arrow');
      const vi = document.querySelector('.scene-vi')?.textContent;
      if (c && a) window.__log.add(`${c}|${a.dataset.sentence ?? ''}|${a.classList.contains('gone') || a.hidden ? 'off' : 'on'}`);
      if (c === '1/7' && vi) window.__log.add(`vi:${vi}`);
    }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  });
  await openPark(page);
  await expect(page.locator('.scene-done')).toBeVisible({ timeout: 60_000 });
  const log = await page.evaluate(() => [...window.__log]);
  expect(log).toContain('vi:Hôm nay trời nắng đẹp ở công viên.');
  // Câu 1 (tả chung): không có mũi tên; các câu sau: mũi tên chỉ đúng câu đó.
  expect(log.filter((x) => x.startsWith('1/7|') && x.endsWith('|on'))).toEqual([]);
  for (const [n, sid] of [[2, 'p2'], [4, 'p4'], [7, 'p7']]) expect(log).toContain(`${n}/7|${sid}|on`);
  const said = await spoken(page);
  const order = ['It is a sunny day in the park.', 'A boy is flying a kite.', 'The kite is in the sky.', 'A girl is riding a bike.', 'A dog is on the grass.', 'Two ducks are in the pond.', 'The sun is hot.'];
  expect(said.filter((s) => order.includes(s))).toEqual(order);
  expect(said).toContain('Great listening!');
  await expect.poll(() => page.evaluate(() => window.kidEnglish6.db.get('progress', 'lesson:scene-park').then((p) => p?.plays))).toBe(1);

  await page.getByRole('button', { name: 'Nghe lại từ đầu' }).click();
  await expect(counter(page)).toHaveText('1/7');
});

test('Tả tranh: ⏸ dừng giữ câu, ▶ đọc lại; ⏭ ⏮; VI tắt không đổi chiều cao; chạm tranh nhảy câu; chạm ngoài vùng không đổi', async ({ page }) => {
  await openPark(page);
  await page.getByRole('button', { name: 'Dừng' }).click();
  await expect(page.getByRole('button', { name: 'Chạy' })).toBeVisible();
  const at = await counter(page).textContent();
  await page.waitForTimeout(1500);
  await expect(counter(page)).toHaveText(at); // đang dừng: không tự sang câu

  await page.getByRole('button', { name: 'Câu sau' }).click();
  await expect(counter(page)).toHaveText(`${Number(at.split('/')[0]) + 1}/7`);
  await page.getByRole('button', { name: 'Dừng' }).click();
  // Về câu 2 (bạn trai): mũi tên chỉ đúng câu p2, đi từ bên trái.
  while ((await counter(page).textContent()) !== '2/7') {
    const n = Number((await counter(page).textContent()).split('/')[0]);
    await page.getByRole('button', { name: n > 2 ? 'Câu trước' : 'Câu sau' }).click();
    await page.getByRole('button', { name: 'Dừng' }).click().catch(() => {});
  }
  await expect(arrow(page)).toHaveAttribute('data-sentence', 'p2');
  await expect(arrow(page)).toHaveAttribute('data-from', 'left');

  // VI: tắt → dòng tiếng Việt ẩn nhưng thanh chữ không đổi chiều cao; lưu vào cài đặt.
  const before = await page.locator('.scene-text').boundingBox();
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  await expect(page.locator('.scene-vi')).toHaveCSS('visibility', 'hidden');
  const after = await page.locator('.scene-text').boundingBox();
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
  await expect.poll(() => page.evaluate(() => window.kidEnglish6.settings.showVi)).toBe(false);
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  await expect(page.locator('.scene-vi')).toHaveCSS('visibility', 'visible');

  // Chạm vào chú chó (câu 5) → nhảy tới câu 5; chạm vào góc trời trống → không đổi.
  const box = await page.locator('.scene-frame').boundingBox();
  await page.mouse.click(box.x + 0.24 * box.width, box.y + 0.8 * box.height);
  await expect(counter(page)).toHaveText('5/7');
  await expect(arrow(page)).toHaveAttribute('data-sentence', 'p5');
  await page.getByRole('button', { name: 'Dừng' }).click();
  await page.mouse.click(box.x + 0.03 * box.width, box.y + 0.05 * box.height);
  await page.waitForTimeout(300);
  await expect(counter(page)).toHaveText('5/7');

  // Chạm một từ → Olly đọc riêng từ đó.
  await page.locator('.scene-sentence .sword', { hasText: 'grass' }).click();
  await expect.poll(() => spoken(page)).toContain('grass');
});

test('🔍 Tìm trong tranh: không có mũi tên; sai → rung + đọc lại; sai 2 lần → tiếng Việt + chỉ chỗ; đúng → mũi tên hiện; sao', async ({ page }) => {
  test.setTimeout(180_000);
  await openPark(page);
  await page.getByRole('button', { name: 'Tìm trong tranh' }).click();
  await expect(page.locator('.scene-title')).toHaveText('🔍 In the park');
  const scene = await page.evaluate(async () => (await import('./js/data/builtin-scenes.js')).SCENE_BY_ID.get('scene-park'));
  const items = scene.sentences.filter((s) => s.point);
  await expect(counter(page)).toHaveText(`1/${items.length}`);
  await expect(arrow(page)).toHaveClass(/gone/);
  const frame = page.locator('.scene-frame');
  const fb = await frame.boundingBox();
  const tapAt = (x, y) => page.mouse.click(fb.x + x * fb.width, fb.y + y * fb.height);
  const said = () => spoken(page);

  // Câu 1 (bạn trai): chạm sai 2 lần (góc trời), rồi chạm đúng.
  await expect.poll(said).toContain('Where is it? Tap the picture!');
  // Olly đang nói thì chạm không tính → chạm lại tới khi Olly phản hồi đúng câu của từng lượt sai.
  for (const reply of ['Oops! Listen again.', 'Look! It is here. Tap it!']) {
    await expect(async () => {
      await tapAt(0.03, 0.05);
      expect(await said()).toContain(reply);
    }).toPass({ timeout: 15_000 });
  }
  await expect(page.locator('.vi-help')).toContainText('Một bạn trai đang thả diều');
  await expect(page.locator('.find-ring')).toBeVisible();
  await expect(arrow(page)).toHaveAttribute('data-sentence', items[0].sid);

  // Chạm đúng từng câu (đầu mũi tên) cho tới hết.
  for (let k = 0; k < items.length; k++) {
    const s = items[k];
    await expect(async () => {
      await tapAt(s.point.x, s.point.y);
      await expect(page.locator('.scene-done').or(counter(page).filter({ hasText: `${k + 2}/` }))).toBeVisible({ timeout: 800 });
    }).toPass({ timeout: 20_000 });
  }
  await expect(page.locator('.scene-done .done-stars')).toHaveText(/⭐/);
  const p = await page.evaluate(() => window.kidEnglish6.db.get('progress', 'lesson:scene-park/find'));
  expect(p.plays).toBe(1);
  expect(p.bestStars).toBeGreaterThanOrEqual(2); // 1 câu phải chỉ đáp án / 6 câu
  const missed = await page.evaluate(() => window.kidEnglish6.db.getAll('progress').then((all) => all.filter((x) => x.activity === 'find' && x.missed).length));
  expect(missed).toBe(1);
});
