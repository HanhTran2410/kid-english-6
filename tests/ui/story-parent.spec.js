// 📚 Truyện ngắn — Góc bố mẹ (SPEC-story.md 7.3, 8.4, 8.5): tạo truyện bằng AI (dán JSON → xem lại → bỏ câu hỏi → lưu,
// id auto), trùng id → thay truyện cũ; ảnh lưới (ảnh nhỏ quá bị từ chối, xem trước đổi / bỏ / gán lại ô, lưu kèm ảnh lưới
// gốc); ảnh lẻ một trang có so sánh cũ / mới.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

const db = (page, fn, arg) => page.evaluate(fn, arg);

async function openStories(page) {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: '📚 Mở Truyện ngắn' }).click();
  await expect(page.getByRole('heading', { name: '📚 Truyện ngắn' })).toBeVisible();
}

/** Truyện "AI trả về": bản sao truyện nhóm 3, id auto, tên khác. */
const aiStory = (page, patch = {}) => db(page, async (p) => {
  const { BUILTIN_STORIES } = await import('./js/story/builtin-stories.js');
  const s = structuredClone(BUILTIN_STORIES[2]);
  delete s.builtIn;
  delete s.createdAt;
  delete s.updatedAt;
  return { ...s, id: 'auto', title: 'The Big Red Hat', ...p };
}, patch);

/** Ảnh PNG w × h có 3 × 2 (hoặc 2 × 2) ô màu khác nhau, viền trắng giữa các ô. */
const gridPng = (page, w, hgt, cols = 3, rows = 2) => db(page, async ([w, hgt, cols, rows]) => {
  const c = new OffscreenCanvas(w, hgt);
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, hgt);
  const colors = ['#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#0c8599'];
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      g.fillStyle = colors[r * cols + k];
      g.fillRect(k * (w / cols) + 6, r * (hgt / rows) + 6, w / cols - 12, hgt / rows - 12);
    }
  }
  const blob = await c.convertToBlob({ type: 'image/png' });
  return [...new Uint8Array(await blob.arrayBuffer())];
}, [w, hgt, cols, rows]).then((bytes) => ({ name: 'grid.png', mimeType: 'image/png', buffer: Buffer.from(bytes) }));

test('8.5: dán JSON AI trả → Kiểm tra → xem lại (từ mới, cảnh báo) → bỏ 1 câu hỏi → Lưu (id auto); bé thấy truyện mới; trùng id → Thay truyện cũ', async ({ page }) => {
  await openStories(page);
  await expect(page.locator('.story-list .lesson-row')).toHaveCount(7);
  const story = await aiStory(page);
  await page.locator('.story-json').fill(`\`\`\`json\n${JSON.stringify(story)}\n\`\`\``);
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await expect(page.locator('.import-result .notice.info')).toContainText('The Big Red Hat');
  await expect(page.locator('.story-review-page')).toHaveCount(5);
  await page.getByRole('button', { name: 'Bỏ câu hỏi q2' }).click();
  await expect(page.locator('[data-question]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Bỏ câu hỏi q1' }).click(); // còn 2 → không bỏ được
  await expect(page.locator('[data-question]')).toHaveCount(2);
  // Sửa chữ tại chỗ trước khi lưu.
  const first = page.locator('.story-review-sent input').first();
  await first.fill('Sam has a big red hat.');
  await first.dispatchEvent('change');
  await page.getByRole('button', { name: '💾 Lưu truyện' }).click();
  await expect(page.locator('.story-list [data-story="story-g3-the-big-red-hat"]')).toBeVisible();
  const saved = await db(page, () => window.kidEnglish6.db.get('stories', 'story-g3-the-big-red-hat'));
  expect(saved.questions.map((q) => q.id)).toEqual(['q1', 'q3']);
  expect(saved.pages[0].sentences[0].en).toBe('Sam has a big red hat.');

  // Trùng id → hộp thoại 3 lựa chọn → Thay truyện cũ (đổi chữ → hỏi lại vì mất kết quả).
  const again = await aiStory(page, { id: 'story-g3-the-big-red-hat', title: 'The Big Red Hat 2' });
  await page.locator('.story-json').fill(JSON.stringify(again));
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.getByRole('button', { name: '💾 Lưu truyện' }).click();
  await page.getByRole('button', { name: 'Thay truyện cũ' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Lưu' }).click();
  await expect.poll(() => db(page, () => window.kidEnglish6.db.get('stories', 'story-g3-the-big-red-hat').then((s) => s.title))).toBe('The Big Red Hat 2');
  expect(await db(page, () => window.kidEnglish6.db.getAll('stories').then((a) => a.length))).toBe(1);

  // Bé thấy 8 truyện ở tab 📚 Truyện.
  await db(page, () => window.kidEnglish6.go('read', { tab: 'story' }));
  await expect(page.locator('.story-card')).toHaveCount(8);
});

test('8.4 / ST-36 / ST-37 / ST-34: ảnh nhỏ quá bị từ chối; xem trước đổi trang 2 ↔ 4, bỏ ô trang 3, gán ô 6 cho trang 3 → lưu đúng; ảnh lẻ trang 4 có so sánh cũ / mới', async ({ page }) => {
  await openStories(page);
  await page.getByRole('button', { name: 'Ảnh của truyện The Red Hat' }).click();
  await expect(page.getByRole('heading', { name: '🖼️ Ảnh của truyện' })).toBeVisible();
  await expect(page.getByText('3 × 2 ô, khổ 3:2 landscape')).toBeVisible();
  const input = page.getByLabel('Ảnh lưới của truyện');

  // ST-36: ảnh lưới quá nhỏ (ô < 300 px) → báo lỗi, không lưu gì.
  await input.setInputFiles(await gridPng(page, 600, 400));
  await expect(page.locator('.notice.error')).toContainText('Ảnh nhỏ quá');
  expect(await db(page, () => window.kidEnglish6.db.getAllByIndex('images', 'lessonId', 'story-g3-red-hat').then((a) => a.length))).toBe(0);

  // ST-37: ảnh đúng khổ → 5 trang mặc định ô 1–5, ô 6 chưa dùng.
  await input.setInputFiles(await gridPng(page, 1800, 1200));
  await expect(page.locator('.story-cell-row')).toHaveCount(5);
  await expect(page.locator('.story-unused [data-cell="5"]')).toBeVisible();
  const cellOf = (p) => page.locator(`.story-cell-row[data-page="${p}"] .story-cell`);
  await cellOf('p2').click();
  await cellOf('p4').click(); // hoán đổi
  await expect(cellOf('p2')).toHaveAttribute('data-cell', '3');
  await expect(cellOf('p4')).toHaveAttribute('data-cell', '1');
  await cellOf('p1').click();
  await cellOf('p1').click(); // chạm lại → bỏ chọn
  await expect(page.locator('.story-cell.selected')).toHaveCount(0);
  await page.getByRole('button', { name: 'Không dùng ô của trang 3' }).click();
  await expect(page.locator('.story-unused [data-cell="2"]')).toBeVisible();
  await page.locator('.story-unused [data-cell="5"]').click();
  await cellOf('p3').click(); // gán ô 6 cho trang 3
  await expect(cellOf('p3')).toHaveAttribute('data-cell', '5');
  // Chưa bấm Lưu → kho chưa đổi.
  expect(await db(page, () => window.kidEnglish6.db.getAllByIndex('images', 'lessonId', 'story-g3-red-hat').then((a) => a.length))).toBe(0);
  await page.getByRole('button', { name: '💾 Lưu ảnh' }).click();
  await expect(page.locator('.story-page-row img')).toHaveCount(5);
  const grid = await db(page, () => window.kidEnglish6.db.getAllByIndex('images', 'lessonId', 'story-g3-red-hat')
    .then((a) => Object.fromEntries(a.map((r) => [r.word, r.word === '_grid' ? r.cells : r.gridCell]))));
  expect(grid).toEqual({ _grid: ['p1', 'p4', null, 'p2', 'p5', 'p3'], p1: 0, p2: 3, p3: 5, p4: 1, p5: 4 });
  await expect(page.getByRole('button', { name: '⬇️ Tải ảnh lưới' })).toBeVisible();

  // ST-34: ảnh lẻ cho trang 4 đã có ảnh → hiện ảnh cũ / mới; Giữ ảnh cũ không đổi; Dùng ảnh mới chỉ đổi trang 4.
  const single = await gridPng(page, 600, 600, 1, 1);
  await page.getByLabel('Ảnh trang 4', { exact: true }).setInputFiles(single);
  await expect(page.locator('.story-compare figcaption')).toHaveText(['Ảnh cũ', 'Ảnh mới']);
  await page.getByRole('button', { name: 'Giữ ảnh cũ' }).click();
  expect(await db(page, () => window.kidEnglish6.db.getAllByIndex('images', 'lessonId', 'story-g3-red-hat').then((a) => a.find((r) => r.word === 'p4').source))).toBe('grid');
  await page.getByLabel('Ảnh trang 4', { exact: true }).setInputFiles(single);
  await page.getByRole('button', { name: '✓ Dùng ảnh mới' }).click();
  await expect.poll(() => db(page, () => window.kidEnglish6.db.getAllByIndex('images', 'lessonId', 'story-g3-red-hat').then((a) => a.find((r) => r.word === 'p4').source))).toBe('single');
  const after = await db(page, () => window.kidEnglish6.db.getAllByIndex('images', 'lessonId', 'story-g3-red-hat').then((a) => a.length));
  expect(after).toBe(6); // 5 trang + ảnh lưới gốc, không có ảnh thừa

  // Bé thấy ảnh trang thay cho emoji.
  await db(page, () => window.kidEnglish6.go('story', { storyId: 'story-g3-red-hat', continueDirectly: true }));
  await expect(page.locator('.story-frame img')).toBeVisible();
});

test('ST-32 / 7.2: cuối bài Unit có truyện → thẻ gợi ý (không tự mở, Để sau → ẩn); truyện bị sửa sau khi có sao → sao mờ "Truyện đã sửa"', async ({ page }) => {
  await fakeSpeech(page, { recognition: false });
  await startApp(page);
  await db(page, async () => {
    const { validateLesson } = await import('./js/lesson.js');
    const { BUILTIN_STORIES } = await import('./js/story/builtin-stories.js');
    const lesson = validateLesson({
      version: 1, kind: 'lesson', id: 'book-t-unit-1', track: 'book', book: 'T', unit: 'Unit 1', title: 'Unit 1: Hats',
      words: [{ id: 'hat', en: 'hat', vi: 'mũ', emoji: '👒', graphemes: ['h', 'a', 't'], sounds: ['h', 'a', 't'] }],
      sentences: [{ id: 's1', en: 'I see a hat.', vi: 'Tớ thấy cái mũ.' }],
      activities: [{ type: 'sentence', items: ['s1'] }],
    }).lesson;
    await window.kidEnglish6.db.put('lessons', lesson);
    const s = structuredClone(BUILTIN_STORIES[2]);
    delete s.builtIn;
    await window.kidEnglish6.db.put('stories', { ...s, id: 'story-t-unit-1-hat', track: 'book', lessonId: 'book-t-unit-1', title: 'Hat Story' });
    // Đã có sao với dấu nội dung cũ → truyện đã bị sửa sau đó.
    await window.kidEnglish6.db.put('progress', { key: 'lesson:story-t-unit-1-hat', lessonId: 'story-t-unit-1-hat', part: '', plays: 1, completedAt: 1, bestStars: 3, lastStars: 3, lastAt: 1, contentHash: 'old' });
    window.kidEnglish6.go('lesson', { lessonId: 'book-t-unit-1', zone: 'read' });
  });
  const ok = page.getByRole('button', { name: 'Con đọc xong' });
  await expect(async () => {
    await ok.click({ timeout: 1000 });
    await expect(page.locator('.done-panel')).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 15_000 });
  await expect(page.locator('.story-suggest')).toContainText('Có truyện của Unit này — nghe nhé? (Hat Story)');
  await expect(page.locator('.story-screen')).toHaveCount(0); // không tự mở
  await page.getByRole('button', { name: 'Để sau' }).click();
  await expect(page.locator('.story-suggest')).toHaveCount(0);

  await db(page, () => window.kidEnglish6.go('read', { tab: 'story' }));
  const card = page.locator('.story-card[data-story="story-t-unit-1-hat"]');
  await expect(card.locator('.story-card-note', { hasText: 'Truyện đã sửa' })).toBeVisible();
  await expect(card.locator('.lesson-stars')).toHaveClass(/stale/);
  await expect(page.locator('.story-card[data-story="story-g1-pip"] .story-card-note', { hasText: 'Truyện đã sửa' })).toHaveCount(0);
});
