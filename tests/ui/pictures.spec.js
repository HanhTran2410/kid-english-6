// Ảnh lưới (SPEC 5.6): Góc bố mẹ → Bài học → bài có sẵn nhóm 1 → 🖼️ Ảnh → chép prompt → chọn ảnh lưới 4×3 → app cắt 12 ô,
// gán từ theo thứ tự → lưu → khu Spell hiện ảnh thật thay emoji; xóa ảnh một từ thì về emoji.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

test.use({ permissions: ['microphone', 'clipboard-read', 'clipboard-write'] });

/** Vẽ ảnh lưới 4 cột × 3 hàng (đường kẻ xám, mỗi ô một hình tròn màu khác nhau) → PNG. */
async function gridPng(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 900;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 1200, 900);
    for (let i = 0; i < 12; i++) {
      const x = (i % 4) * 300;
      const y = Math.floor(i / 4) * 300;
      g.fillStyle = `hsl(${i * 30}, 70%, 50%)`;
      g.beginPath();
      g.arc(x + 150, y + 150, 100, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = '#bbb';
    g.lineWidth = 6;
    for (const x of [300, 600, 900]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 900); g.stroke(); }
    for (const y of [300, 600]) { g.beginPath(); g.moveTo(0, y); g.lineTo(1200, y); g.stroke(); }
    return c.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(b64, 'base64');
}

test('Ảnh lưới cho bài có sẵn → cắt 12 ô, lưu → khu Spell hiện ảnh thật; xóa ảnh thì về emoji', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Ảnh của bài Sounds s a t i p n' }).click();
  await expect(page.locator('.picture-row')).toHaveCount(10); // 10 từ (tricky words không cần hình)
  await expect(page.locator('.picture-row img')).toHaveCount(0);

  await page.getByRole('button', { name: /Chép prompt ảnh lưới/ }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain('4-column × 3-row grid of 12 equal cells');
  expect(prompt).toContain('Cell 4: one ant (meaning in Vietnamese: con kiến)');

  await page.locator('input[aria-label="Ảnh lưới"]').setInputFiles({ name: 'grid.png', mimeType: 'image/png', buffer: await gridPng(page) });
  await expect(page.locator('.grid-cell')).toHaveCount(12);
  await expect(page.getByRole('combobox', { name: 'Kiểu lưới' })).toHaveValue('4x3');
  await expect(page.getByRole('combobox', { name: 'Từ cho ô 4' })).toHaveValue('ant');
  await expect(page.getByRole('combobox', { name: 'Từ cho ô 11' })).toHaveValue('');
  await page.getByRole('button', { name: /Lưu các ảnh này/ }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu 10 ảnh.');
  await expect(page.locator('.picture-row img')).toHaveCount(10);

  // Khu Spell, bài nhóm 1: từ đầu tiên (ant) hiện ảnh thật.
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: /Về màn hình của bé/ }).click();
  await page.getByRole('button', { name: 'Đánh vần và viết' }).click();
  await page.locator('.lesson-card[data-lesson="phonics-g1"]').click();
  await expect(page.locator('.spell-pic img')).toBeVisible();
  await expect.poll(() => page.locator('.spell-pic img').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);

  // Xóa ảnh của "ant" → về emoji.
  await page.getByRole('button', { name: 'Về' }).click();
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Ảnh của bài Sounds s a t i p n' }).click();
  await page.getByRole('button', { name: 'Xóa ảnh của ant' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.locator('.picture-row[data-word="ant"] .emoji')).toHaveText('🐜');
  await expect(page.locator('.picture-row img')).toHaveCount(9);
});
