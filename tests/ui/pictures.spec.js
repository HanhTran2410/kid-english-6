// Ảnh dùng chung (SPEC 5.6): ảnh lưới ở trang Ảnh của bài → lưu vào Kho ảnh theo từ → khu Spell hiện ảnh thật; bài khác có
// cùng từ dùng lại ảnh đó; Kho ảnh: lọc / chọn mục / prompt ảnh lưới; thay tranh có sẵn của Tả tranh bằng bản sao + ảnh mới.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

test.use({ permissions: ['microphone', 'clipboard-read', 'clipboard-write'] });

/** Ảnh lưới cols × rows (đường kẻ xám, mỗi ô một hình tròn màu) hoặc ảnh tranh → PNG. */
async function png(page, cols, rows) {
  const b64 = await page.evaluate(([cols, rows]) => {
    const c = document.createElement('canvas');
    c.width = cols * 300;
    c.height = rows * 300;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < cols * rows; i++) {
      g.fillStyle = `hsl(${i * 25}, 70%, 50%)`;
      g.beginPath();
      g.arc((i % cols) * 300 + 150, Math.floor(i / cols) * 300 + 150, 100, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = '#bbb';
    g.lineWidth = 6;
    for (let x = 1; x < cols; x++) { g.beginPath(); g.moveTo(x * 300, 0); g.lineTo(x * 300, c.height); g.stroke(); }
    for (let y = 1; y < rows; y++) { g.beginPath(); g.moveTo(0, y * 300); g.lineTo(c.width, y * 300); g.stroke(); }
    return c.toDataURL('image/png').split(',')[1];
  }, [cols, rows]);
  return Buffer.from(b64, 'base64');
}

const toParent = async (page, view) => {
  await openParent(page);
  await page.getByRole('button', { name: view }).click();
};

test('Ảnh của bài → Kho ảnh dùng chung: cắt ảnh lưới, lưu → Spell hiện ảnh; bài theo sách có cùng từ dùng lại ảnh; xóa → emoji', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await toParent(page, 'Bài học');
  await page.getByRole('button', { name: 'Ảnh của bài Sounds s a t i p n' }).click();
  await expect(page.locator('.picture-row')).toHaveCount(13); // 10 từ + 3 câu (tricky words không cần hình)
  await expect(page.locator('.picture-row img')).toHaveCount(0);

  await page.getByRole('button', { name: /Chép prompt ảnh lưới/ }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain('4-column × 4-row grid of 16 equal');
  expect(prompt).toContain('Cell 4: one ant (meaning in Vietnamese: con kiến)');
  expect(prompt).toContain('Cell 11: a simple picture showing: "The ant sat."');

  await page.locator('input[aria-label="Ảnh lưới"]').setInputFiles({ name: 'grid.png', mimeType: 'image/png', buffer: await png(page, 4, 4) });
  await expect(page.locator('.grid-cell')).toHaveCount(16);
  await expect(page.getByRole('combobox', { name: 'Mục cho ô 5' })).toHaveValue('pin');
  await expect(page.getByRole('combobox', { name: 'Mục cho ô 14' })).toHaveValue('');
  await page.getByRole('button', { name: /Lưu các ảnh này/ }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu 13 ảnh.');
  await expect(page.locator('.picture-row img')).toHaveCount(13);

  // Bài theo sách có từ "pin" (trùng bài nhóm 1) → dùng lại ảnh của Kho ảnh.
  await page.getByRole('button', { name: '← Quay lại' }).click();
  const book = {
    version: 1, id: 'book-reuse', track: 'book', title: 'Reuse',
    words: [
      { id: 'w1', en: 'pin', graphemes: ['p', 'i', 'n'], sounds: ['p', 'i', 'n'], emoji: '📍' },
      { id: 'w2', en: 'tap', graphemes: ['t', 'a', 'p'], sounds: ['t', 'a', 'p'] },
    ],
    activities: [{ type: 'spell', items: ['w1', 'w2'] }],
  };
  await page.locator('.import-json').fill(JSON.stringify(book));
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: /Lưu bài/ }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: /Về màn hình của bé/ }).click();
  await page.getByRole('button', { name: 'Đánh vần và viết' }).click();
  await page.getByRole('button', { name: '📘 Theo sách' }).click();
  await page.locator('.lesson-card[data-lesson="book-reuse"]').click();
  await expect(page.locator('.spell-pic img')).toBeVisible();
  await expect.poll(() => page.locator('.spell-pic img').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);

  // Kho ảnh: xóa ảnh "pin" → mọi bài về emoji.
  await page.getByRole('button', { name: 'Về' }).click();
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await toParent(page, 'Kho ảnh');
  await page.getByRole('searchbox', { name: 'Tìm' }).fill('pin');
  await expect(page.locator('.picture-row[data-key="pin"]')).toContainText('Dùng ở 2 bài');
  await page.getByRole('button', { name: 'Xóa ảnh của pin' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.locator('.picture-row[data-key="pin"] .emoji')).toHaveText('📌');
});

test('Kho ảnh: chọn 12 mục chưa có ảnh → prompt 4×3 → cắt, lưu; lọc "Chưa có ảnh" bớt đi 12', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await toParent(page, 'Kho ảnh');
  await page.getByRole('combobox', { name: 'Loại' }).selectOption('word');
  await page.getByRole('combobox', { name: 'Lọc' }).selectOption('missing');
  const before = await page.locator('.picture-row').count();
  await page.getByRole('button', { name: /Chọn 12 mục chưa có ảnh/ }).click();
  await expect(page.locator('.picture-row input[type="checkbox"]:checked')).toHaveCount(12);
  await page.getByRole('button', { name: /Chép prompt ảnh lưới/ }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('4-column × 3-row grid of 12 equal cells');
  await page.locator('input[aria-label="Ảnh lưới"]').setInputFiles({ name: 'g.png', mimeType: 'image/png', buffer: await png(page, 4, 3) });
  await expect(page.locator('.grid-cell')).toHaveCount(12);
  await page.getByRole('button', { name: /Lưu các ảnh này/ }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu 12 ảnh.');
  await expect(page.locator('.picture-row')).toHaveCount(before - 12);
});

test('Thay tranh có sẵn: Kho ảnh → Thay tranh → bản sao giữ 7 câu, prompt vẽ theo câu, chọn ảnh, xác nhận mũi tên, lưu → bé thấy tranh mới; hiện lại tranh gốc', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await toParent(page, 'Kho ảnh');
  await page.getByRole('button', { name: 'Thay tranh In the park' }).click();
  await expect(page.locator('.scene-edit-row')).toHaveCount(7);
  await page.getByRole('button', { name: /Chép prompt vẽ tranh/ }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain('- A boy is flying a kite.');
  await page.locator('input[aria-label="Ảnh tranh"]').setInputFiles({ name: 'park.png', mimeType: 'image/png', buffer: await png(page, 4, 3) });
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('kiểm tra lại mũi tên');
  await page.getByRole('button', { name: '✓ Mũi tên đều đúng rồi' }).click();
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu tranh');
  await expect.poll(() => page.evaluate(() => window.kidEnglish6.settings.hiddenScenes)).toEqual(['scene-park']);

  await page.getByRole('button', { name: '← Quay lại' }).click(); // → Bài học
  await page.getByRole('button', { name: '← Quay lại' }).click(); // → menu
  await page.getByRole('button', { name: /Về màn hình của bé/ }).click();
  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await page.getByRole('button', { name: '🖼️ Tả tranh' }).click();
  await expect(page.locator('.scene-card')).toHaveCount(1);
  await expect(page.locator('.scene-card img')).toBeVisible();

  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await toParent(page, 'Kho ảnh');
  await page.getByRole('button', { name: /Hiện lại tranh gốc/ }).click();
  await expect(page.getByRole('button', { name: 'Thay tranh In the park' })).toBeVisible();
});
