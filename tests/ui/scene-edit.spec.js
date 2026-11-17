// Góc bố mẹ → Bài học → 🖼️ Tả tranh → Soạn tranh (SPEC-ta-tranh mục 8): ảnh, câu, chạm đặt mũi tên, lưu; dán JSON từ AI
// → phải xác nhận mũi tên mới lưu được; bé thấy tranh mới ở tab Tả tranh; xóa tranh.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, openParent } from './helpers.js';

test.use({ permissions: ['microphone', 'clipboard-read', 'clipboard-write'] });

async function scenePng(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 900;
    const g = c.getContext('2d');
    g.fillStyle = '#bfe6ff';
    g.fillRect(0, 0, 1200, 450);
    g.fillStyle = '#8ce99a';
    g.fillRect(0, 450, 1200, 450);
    g.fillStyle = '#e03131';
    g.beginPath();
    g.arc(360, 630, 70, 0, Math.PI * 2);
    g.fill();
    return c.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(b64, 'base64');
}

const aiJson = {
  title: 'Ball game',
  titleVi: 'Chơi bóng',
  level: 2,
  sentences: [
    { en: 'It is a sunny day.', vi: 'Hôm nay trời nắng.', point: null },
    { en: 'A red ball is on the grass.', vi: 'Một quả bóng đỏ ở trên cỏ.', point: { x: 0.3, y: 0.7 }, from: 'right', keywords: ['ball'] },
    { en: 'The sky is blue.', vi: 'Bầu trời màu xanh.', point: { x: 0.8, y: 0.2 } },
  ],
};

test('Soạn tranh: ảnh + câu + chạm đặt mũi tên → lưu; dán JSON AI → xác nhận mũi tên → lưu; bé thấy tranh; xóa', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: '+ Tạo tranh mới' }).click();

  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('Chưa có ảnh tranh');

  await page.locator('input[aria-label="Ảnh tranh"]').setInputFiles({ name: 'scene.png', mimeType: 'image/png', buffer: await scenePng(page) });
  await expect(page.getByRole('button', { name: '🔄 Đổi ảnh' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Tên tranh' }).fill('My ball');
  await page.getByRole('textbox', { name: 'Câu 1 tiếng Anh' }).fill('It is a sunny day.');
  await page.getByRole('textbox', { name: 'Câu 1 tiếng Việt' }).fill('Hôm nay trời nắng.');
  await page.getByRole('button', { name: '+ Thêm câu' }).click();
  await page.getByRole('textbox', { name: 'Câu 2 tiếng Anh' }).fill('A red ball is on the grass.');
  await page.getByRole('textbox', { name: 'Câu 2 tiếng Việt' }).fill('Một quả bóng đỏ ở trên cỏ.');
  await page.getByRole('button', { name: 'Đặt mũi tên câu 2' }).click();
  const frame = page.locator('.edit-frame');
  await page.waitForTimeout(700); // nút 🎯 cuộn mượt tới khung tranh
  const box = await frame.boundingBox();
  await frame.click({ position: { x: 0.3 * box.width, y: 0.7 * box.height } });
  await expect(frame.locator('.scene-arrow')).toBeVisible();
  await expect(frame.locator('.hit-ring')).toBeVisible();
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu tranh');
  const saved = await page.evaluate(() => window.kidEnglish6.db.getAll('scenes'));
  expect(saved).toHaveLength(1);
  expect(saved[0].sentences[1].point.x).toBeCloseTo(0.3, 1);
  expect(saved[0].sentences[0].point).toBeNull();

  // Nhờ AI: dán JSON → câu thay bằng câu của AI, phải xác nhận mũi tên mới lưu được.
  await page.getByRole('textbox', { name: 'JSON từ AI' }).fill(`\`\`\`json\n${JSON.stringify(aiJson)}\n\`\`\``);
  await page.getByRole('button', { name: 'Dùng các câu này' }).click();
  await expect(page.locator('.scene-edit-row')).toHaveCount(3);
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  // Từng câu có mũi tên phải được kiểm tra riêng (không có nút "đúng hết" — mục 8.6).
  await expect(page.locator('.toast').last()).toContainText('Còn 2 câu chưa kiểm tra');
  await expect(page.locator('.scene-edit-row .unchecked')).toHaveCount(2);
  await page.getByRole('button', { name: '✓ Câu này đúng' }).click();
  await expect(page.locator('.scene-edit-row .unchecked')).toHaveCount(1);
  await page.getByRole('button', { name: '✓ Câu này đúng' }).click();
  await expect(page.locator('.scene-edit-row .unchecked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '✓ Câu này đúng' })).toBeHidden();
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu tranh');

  // Bé: Read → Tả tranh → tranh mới (ảnh thật), đọc câu của AI.
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await expect(page.locator('.scene-list .lesson-row')).toContainText('My ball');
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: /Về màn hình của bé/ }).click();
  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await page.getByRole('button', { name: '🖼️ Tả tranh' }).click();
  await expect(page.locator('.scene-card')).toHaveCount(2);
  await page.locator('.scene-card', { hasText: 'My ball' }).click();
  await expect(page.locator('.scene-art img')).toBeVisible();
  await expect(page.locator('.scene-counter')).toHaveText(/\/3$/);
  await page.getByRole('button', { name: 'Dừng' }).click();
  // Ở ?fast tranh có thể đã tự chạy tới câu cuối trước khi kịp dừng: lùi về câu 1 rồi mới sang câu 2.
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Câu trước' }).click({ timeout: 300 }).catch(() => {});
    return page.locator('.scene-counter').textContent();
  }, { timeout: 20_000 }).toMatch(/^1\//);
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await expect(page.locator('.scene-arrow')).toHaveAttribute('data-from', 'right');

  // Xóa tranh.
  await page.getByRole('button', { name: 'Về' }).first().click();
  await page.getByRole('button', { name: 'Về màn hình chính' }).click();
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: 'Sửa tranh My ball' }).click();
  await page.getByRole('button', { name: '🗑 Xóa tranh' }).click();
  await page.locator('.dialog').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã xóa tranh');
  expect(await page.evaluate(() => window.kidEnglish6.db.getAll('scenes'))).toHaveLength(0);
});

test('Tranh mới theo chủ đề (8.5): chọn chủ đề → tên tranh tự điền; chép prompt vẽ tranh (đúng số người / vật theo cấp độ); chép prompt viết câu có chủ đề', async ({ page }) => {
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: '+ Tạo tranh mới' }).click();
  await page.getByRole('button', { name: '📋 Chép prompt vẽ tranh theo chủ đề' }).click();
  await expect(page.locator('.toast').last()).toContainText('Chọn chủ đề trước');
  await page.getByRole('combobox', { name: 'Cấp độ' }).selectOption('1');
  await page.getByRole('combobox', { name: 'Chủ đề tranh' }).selectOption('beach');
  await expect(page.getByRole('textbox', { name: 'Tên tranh' })).toHaveValue('At the beach');
  await expect(page.getByRole('textbox', { name: 'Tên tiếng Việt' })).toHaveValue('Ở bãi biển');
  await page.getByRole('button', { name: '📋 Chép prompt vẽ tranh theo chủ đề' }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã chép prompt vẽ tranh');
  const draw = await page.evaluate(() => navigator.clipboard.readText());
  expect(draw).toContain('a sunny beach');
  expect(draw.split('\n').filter((l) => l.startsWith('- '))).toHaveLength(5);
  // Đổi chủ đề: tên vẫn là tên chủ đề cũ → đổi theo; bố mẹ đã sửa tên thì giữ.
  await page.getByRole('combobox', { name: 'Chủ đề tranh' }).selectOption('zoo');
  await expect(page.getByRole('textbox', { name: 'Tên tranh' })).toHaveValue('At the zoo');
  await page.getByRole('textbox', { name: 'Tên tranh' }).fill('Our zoo trip');
  await page.getByRole('combobox', { name: 'Chủ đề tranh' }).selectOption('farm');
  await expect(page.getByRole('textbox', { name: 'Tên tranh' })).toHaveValue('Our zoo trip');
  await page.getByRole('button', { name: '📋 Chép prompt', exact: true }).click();
  const write = await page.evaluate(() => navigator.clipboard.readText());
  expect(write).toContain('chủ đề "On the farm"');
  expect(write).toContain('- a cow eating grass');
});

test('Khung đối tượng (4.5, 8.6): kéo khoanh khung → vùng chạm là khung, mũi tên tự đặt cạnh khung; 👆 Thử chạm như bé; dán khung từ AI → kiểm tra từng câu; bé chạm thân đối tượng (xa đầu mũi tên) vẫn đúng', async ({ page }) => {
  test.setTimeout(180_000);
  await fakeSpeech(page);
  await startApp(page);
  await openParent(page);
  await page.getByRole('button', { name: 'Bài học' }).click();
  await page.getByRole('button', { name: '+ Tạo tranh mới' }).click();
  await page.locator('input[aria-label="Ảnh tranh"]').setInputFiles({ name: 'scene.png', mimeType: 'image/png', buffer: await scenePng(page) });
  await expect(page.getByRole('button', { name: '🔄 Đổi ảnh' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Tên tranh' }).fill('Box test');
  await page.getByRole('textbox', { name: 'Câu 1 tiếng Anh' }).fill('It is a sunny day.');
  await page.getByRole('button', { name: '+ Thêm câu' }).click();
  await page.getByRole('textbox', { name: 'Câu 2 tiếng Anh' }).fill('A red ball is on the grass.');
  await page.getByRole('button', { name: 'Đặt mũi tên câu 2' }).click();
  const frame = page.locator('.edit-frame');
  await page.waitForTimeout(700);
  const fb = await frame.boundingBox();
  const at = (x, y) => [fb.x + x * fb.width, fb.y + y * fb.height];
  // Kéo khoanh quả bóng (khung 0,2–0,4 × 0,55–0,85).
  await page.mouse.move(...at(0.2, 0.55));
  await page.mouse.down();
  await page.mouse.move(...at(0.3, 0.7), { steps: 4 });
  await page.mouse.move(...at(0.4, 0.85), { steps: 4 });
  await page.mouse.up();
  await expect(frame.locator('.edit-box:not(.drawing)')).toBeVisible();
  await expect(frame.locator('.hit-ring')).toBeHidden();
  await expect(page.locator('.scene-edit-row').nth(1)).toContainText('🔲');
  // Thử chạm như bé: trong khung → trúng câu 2; ngoài → không trúng.
  await page.getByRole('button', { name: '👆 Thử chạm như bé' }).click();
  await page.mouse.click(...at(0.38, 0.82));
  await expect(page.locator('.toast').last()).toContainText('Trúng câu 2');
  await page.mouse.click(...at(0.9, 0.1));
  await expect(page.locator('.toast').last()).toContainText('Không trúng câu nào');
  await page.getByRole('button', { name: '👆 Thử chạm như bé' }).click();
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu tranh');
  const saved = (await page.evaluate(() => window.kidEnglish6.db.getAll('scenes')))[0];
  const b = saved.sentences[1].box;
  expect(b.x).toBeCloseTo(0.2, 1);
  expect(b.y).toBeCloseTo(0.55, 1);
  expect(b.w).toBeCloseTo(0.2, 1);
  expect(b.h).toBeCloseTo(0.3, 1);
  expect(saved.sentences[1].point).toBeTruthy();

  // AI gửi khung (không gửi điểm) → câu chưa kiểm tra, không lưu được tới khi bấm ✓ từng câu.
  await page.getByRole('textbox', { name: 'JSON từ AI' }).fill(JSON.stringify({
    title: 'Box test', level: 1,
    sentences: [{ en: 'It is a sunny day.', vi: 'Trời nắng.', box: null }, { en: 'A red ball is on the grass.', vi: 'Quả bóng đỏ.', box: { x: 0.2, y: 0.55, w: 0.2, h: 0.3 } }],
  }));
  await page.getByRole('button', { name: 'Dùng các câu này' }).click();
  await expect(page.locator('.scene-edit-row .unchecked')).toHaveCount(1);
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('Còn 1 câu chưa kiểm tra');
  await page.getByRole('button', { name: '✓ Câu này đúng' }).click();
  await page.getByRole('button', { name: '💾 Lưu tranh' }).click();
  await expect(page.locator('.toast').last()).toContainText('Đã lưu tranh');

  // Bé: Tìm trong tranh — chạm góc dưới của khung (xa đầu mũi tên) vẫn đúng.
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: '← Quay lại' }).click();
  await page.getByRole('button', { name: /Về màn hình của bé/ }).click();
  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await page.getByRole('button', { name: '🖼️ Tả tranh' }).click();
  await page.locator('.scene-card', { hasText: 'Box test' }).click();
  await page.getByRole('button', { name: 'Tìm trong tranh' }).click();
  await expect.poll(() => page.evaluate(() => window.__spoken?.slice() ?? [])).toContain('Where is it? Tap the picture!');
  const kf = await page.locator('.scene-frame').boundingBox();
  await expect(async () => {
    await page.mouse.click(kf.x + 0.22 * kf.width, kf.y + 0.83 * kf.height);
    await expect(page.locator('.scene-done')).toBeVisible({ timeout: 800 });
  }).toPass({ timeout: 20_000 });
});
