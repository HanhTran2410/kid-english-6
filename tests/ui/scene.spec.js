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
  await openPark(page);
  await expect(counter(page)).toHaveText('1/7');
  await expect(page.locator('.scene-sentence')).toHaveText(/It\s*is\s*a\s*sunny\s*day/);
  await expect(page.locator('.scene-vi')).toHaveText('Hôm nay trời nắng đẹp ở công viên.');
  // Câu 1 (tả chung): không có mũi tên nào hiện.
  await expect(arrow(page)).toHaveAttribute('data-sentence', '');
  await expect(page.locator('.scene-done')).toBeVisible({ timeout: 60_000 });
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
