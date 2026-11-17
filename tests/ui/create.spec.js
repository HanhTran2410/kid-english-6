// Tạo bài theo sách (SPEC 5.7): nhập sách / Unit / từ → chép prompt 2 → nháp còn sau khi tải lại app → dán JSON (giả lập AI)
// → bài hiện ở tab "Theo sách" của Read và học được (từ có âm chưa có file → tricky).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

test.use({ permissions: ['microphone', 'clipboard-read', 'clipboard-write'] });

const aiResult = {
  version: 1, kind: 'lesson', id: 'book-tieng-anh-1-global-success-unit-3', track: 'book',
  book: 'Tiếng Anh 1 Global Success', unit: 'Unit 3', title: 'Unit 3: At the zoo', titleVi: 'Bài 3: Ở sở thú',
  words: [
    { id: 'cat', en: 'cat', vi: 'con mèo', emoji: '🐱', graphemes: ['c', 'a', 't'], sounds: ['k', 'a', 't'] },
    { id: 'dog', en: 'dog', vi: 'con chó', emoji: '🐶', graphemes: ['d', 'o', 'g'], sounds: ['d', 'o', 'g'] },
    { id: 'pig', en: 'pig', vi: 'con lợn', emoji: '🐷', graphemes: ['p', 'i', 'g'], sounds: ['p', 'i', 'g'] },
    { id: 'fish', en: 'fish', vi: 'con cá', emoji: '🐟', graphemes: ['f', 'i', 'sh'], sounds: ['f', 'i', 'sh'] },
    { id: 'zoo', en: 'zoo', vi: 'sở thú', emoji: '🦁', graphemes: ['z', 'oo'], sounds: ['z', 'oo-l'] },
  ],
  sentences: [{ id: 's1', en: 'I see a cat.', vi: 'Mình thấy một con mèo.' }],
  activities: [
    { type: 'blend', items: ['cat', 'dog', 'pig', 'fish', 'zoo'] },
    { type: 'spell', items: ['cat', 'dog', 'fish'] },
    { type: 'fill', items: ['pig'] },
  ],
};

test('Tạo bài theo sách: chép prompt, nháp không mất, dán kết quả AI → học ở tab Theo sách', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();

  await page.getByRole('combobox', { name: 'Bộ sách' }).selectOption('Tiếng Anh 1 Global Success');
  // Cách tự gõ (không có ảnh) gập lại từ 0.11.6.
  await page.locator('summary', { hasText: 'Tự gõ danh sách từ' }).click();
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Unit 3');
  await page.getByRole('textbox', { name: 'Tên Unit' }).fill('At the zoo');
  await expect(page.getByText('id bài: book-tieng-anh-1-global-success-unit-3')).toBeVisible();

  // Thiếu danh sách từ → nhắc.
  await page.getByRole('button', { name: /Chép prompt 2/ }).click();
  await expect(page.locator('.toast').last()).toContainText('Còn thiếu: danh sách từ');

  await page.getByRole('textbox', { name: 'Danh sách từ' }).fill('cat - con mèo\ndog - con chó\nfish - con cá');
  await page.getByRole('button', { name: /Chép prompt 2/ }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã chép prompt 2');
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain('"id": "book-tieng-anh-1-global-success-unit-3"');
  expect(prompt).toContain('fish - con cá');

  // Chuyển sang app AI rồi quay lại (app tải lại): nháp còn nguyên.
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await expect(page.getByRole('textbox', { name: 'Unit', exact: true })).toHaveValue('Unit 3');
  await expect(page.getByRole('textbox', { name: 'Danh sách từ' })).toHaveValue(/fish - con cá/);

  // Dán kết quả AI vào ô Nhập bài.
  await page.locator('textarea[placeholder^="Dán JSON"]').fill(`\`\`\`json\n${JSON.stringify(aiResult)}\n\`\`\``);
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: /Lưu bài/ }).click();
  await expect(page.locator('.my-lessons .lesson-row')).toContainText('📘 Theo sách');

  // Khu Read → Theo sách: bài hiện ra, học được; đủ 42 âm nên mọi từ có ô chữ đều ghép âm được (không chuyển sang tricky).
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: /Về màn hình của bé/ }).click();
  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await page.getByRole('button', { name: '📘 Theo sách' }).click();
  const card = page.locator('.lesson-card[data-lesson="book-tieng-anh-1-global-success-unit-3"]');
  await expect(card).toContainText('Unit 3: At the zoo');
  const play = await page.evaluate(async (data) => (await import('./js/lesson-prompts.js')).adaptForPlay(data).activities, aiResult);
  expect(play).toEqual(aiResult.activities);
  await card.click();
  await expect(page.locator('.tile-row .tile')).toHaveText(['c', 'a', 't']);
});

test('Tạo bài theo sách một bước (0.11.6): chỉ chọn sách → chép prompt gửi kèm ảnh → dán kết quả "id": "auto" → app đặt id theo Unit; xem lại danh sách từ: bỏ từ sai, sửa nghĩa → lưu; AI không đọc được ảnh → báo lỗi rõ', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await expect(page.getByRole('textbox', { name: 'Unit', exact: true })).toBeHidden(); // không phải gõ Unit
  await page.getByRole('combobox', { name: 'Bộ sách' }).selectOption('i-Learn Smart Start 1');
  await expect(page.getByText('Tự động theo các bài Phonics bé đã học xong.')).toBeVisible();
  await page.getByRole('button', { name: '📋 Chép prompt (gửi kèm ảnh các trang Unit)' }).click();
  await expect(page.locator('.toast').last()).toContainText('đính kèm ảnh các trang của Unit');
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain('"i-Learn Smart Start 1"');
  expect(prompt).toContain('"id": "auto"');
  expect(prompt).toContain('KHÔNG thêm từ không có trong ảnh');

  // AI không đọc được ảnh.
  await page.locator('textarea[placeholder^="Dán JSON"]').fill('{"error": "Ảnh bị mờ"}');
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await expect(page.locator('.import-result')).toContainText('AI chưa đọc được trang sách: Ảnh bị mờ');

  // Kết quả AI: id "auto", Unit đọc từ ảnh.
  const fromAi = { ...aiResult, id: 'auto', book: 'i-Learn Smart Start 1', unit: 'Unit 5', title: 'Unit 5: Animals', titleVi: 'Bài 5: Con vật' };
  await page.locator('textarea[placeholder^="Dán JSON"]').fill(JSON.stringify(fromAi));
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await expect(page.locator('.import-result')).toContainText('id: book-i-learn-smart-start-1-unit-5');
  await expect(page.locator('.word-review-row')).toHaveCount(5);
  await page.getByRole('button', { name: 'Bỏ từ zoo' }).click();
  await expect(page.locator('.word-review-row')).toHaveCount(4);
  await expect(page.locator('.import-result')).toContainText('4 từ');
  await page.getByRole('textbox', { name: 'Nghĩa của cat' }).fill('mèo con');
  await page.getByRole('button', { name: /Lưu bài/ }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu bài');
  const saved = await page.evaluate(() => window.kidEnglish6.db.get('lessons', 'book-i-learn-smart-start-1-unit-5'));
  expect(saved.words.map((w) => w.id)).toEqual(['cat', 'dog', 'pig', 'fish']);
  expect(saved.words[0].vi).toBe('mèo con');
  expect(saved.activities.flatMap((a) => a.items ?? [])).not.toContain('zoo');
});
