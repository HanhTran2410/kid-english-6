// Khu Read 0.2: danh sách bài → học hết bài nhóm 1 (gặp âm, chọn chữ theo âm, ghép âm, chọn hình, tricky words)
// → sao → ⭐ Tiếp theo chuyển sang nhóm 2. Có: 🔊 phụ đề tiếng Việt, sai 2 lần → giải thích tiếng Việt + chỉ đáp án,
// không có nhận dạng → nút ✅. Âm rời phát từ file (không bao giờ bằng giọng máy).
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

/** Chơi bài cho tới màn kết thúc. Câu kiểm tra âm đầu tiên cố ý chọn sai 2 lần. */
async function playLesson(page, { onFirstCheck }) {
  const stage = page.locator('.stage');
  let firstCheckDone = false;
  for (let i = 0; i < 2000; i++) {
    if (await page.locator('.done-panel').isVisible()) return;
    const done = page.locator('.done-btn');
    const blend = page.locator('.blend-btn:not([disabled])');
    const tap = (loc) => loc.click({ timeout: 1000 }).catch(() => {}); // màn có thể vừa đổi câu
    if (await done.isVisible()) await tap(done);
    else if (await blend.isVisible()) await tap(blend);
    else if (await page.locator('.letter-choice').first().isVisible()) {
      if (!firstCheckDone) {
        firstCheckDone = true;
        await onFirstCheck();
        continue;
      }
      const labels = await page.locator('.letter-choice').allTextContents();
      if (new Set(labels).size !== labels.length) throw new Error(`Hai ô cùng chữ: ${labels.join(', ')}`);
      const target = await stage.getAttribute('data-last-sound');
      await tap(page.locator(`.letter-choice[data-choice="${target}"]`));
    } else if (await page.locator('.sentence.small').isVisible() && await page.locator('.pic-choice').first().isVisible()) {
      // Câu hỏi hiểu của Đọc câu: hình đúng mang aria-label = câu.
      const en = (await page.locator('.sentence.small .sword').allTextContents()).join(' ');
      await tap(page.locator(`.pic-choice[aria-label="${en}"]`));
    } else if (await page.locator('.pic-choice').first().isVisible()) {
      const word = await page.locator('.word-shown').textContent();
      await tap(page.locator(`.pic-choice[data-choice="${word}"]`));
    } else if (await page.locator('.word-choice').first().isVisible()) {
      const ask = (await spoken(page)).filter((s) => s.startsWith('Find the word:')).pop();
      const word = ask?.match(/^Find the word: (.+)!$/)?.[1];
      if (word) await tap(page.locator(`.word-choice[data-choice="${word}"]`));
    }
    await page.waitForTimeout(60);
  }
  throw new Error('Bài không kết thúc');
}

test('Read: học hết bài nhóm 1 → sao, ⭐ Tiếp theo sang nhóm 2; 🔊 phụ đề; sai 2 lần → giải thích tiếng Việt', async ({ page }) => {
  test.setTimeout(240_000);
  await fakeSpeech(page);
  await startApp(page);

  // 0.10.0: mọi khu đã mở (Quest mở), không còn thẻ "Sắp mở".
  await expect(page.locator('.zone-card.soon')).toHaveCount(0);
  await expect(page.locator('.zone-card')).toHaveCount(5);
  await expect(page.locator('.home-version')).toHaveText(/^v\d+\.\d+\.\d+$/);

  await page.getByRole('button', { name: 'Tập đọc' }).click();
  await expect(page.locator('.lesson-card')).toHaveCount(7);
  await expect(page.locator('.lesson-card.next')).toHaveAttribute('data-lesson', 'phonics-g1');
  await page.locator('.lesson-card[data-lesson="phonics-g1"]').click();

  // Gặp âm: chữ to + âm phát từ file.
  await expect(page.locator('.sound-card .sound-letters')).toHaveText('s');
  await expect.poll(() => page.locator('.stage').getAttribute('data-sound-count'), { timeout: 10_000 }).not.toBeNull();

  await playLesson(page, {
    onFirstCheck: async () => {
      const stage = page.locator('.stage');
      // Chờ câu hỏi (🔊 hiện) rồi bấm 🔊: phụ đề Anh + Việt.
      await expect(page.locator('.replay-btn')).toBeVisible();
      await page.locator('.replay-btn').click();
      await expect(page.locator('.caption-en')).toHaveText('Which letter says this sound?');
      await expect(page.locator('.caption-vi')).toContainText('Âm này là của chữ nào?');
      const target = await stage.getAttribute('data-last-sound');
      // Sai 2 lần (chờ Olly nói xong mới tính chạm).
      for (let n = 1; n <= 2; n++) {
        await expect(async () => {
          await page.locator(`.letter-choice:not([data-choice="${target}"]):not(.dim)`).first().click();
          await expect(page.locator('.letter-choice.dim')).toHaveCount(n, { timeout: 500 });
        }).toPass({ timeout: 15_000 });
      }
      await expect(page.locator('.vi-help')).toContainText(/Âm \/.+\//, { timeout: 10_000 });
      await expect(page.locator(`.letter-choice[data-choice="${target}"]`)).toHaveClass(/hint/);
      // Chạm đáp án (Olly đang nói thì chưa tính): xong khi ô gợi ý đã đổi màu đúng hoặc đã sang câu khác.
      await expect.poll(async () => {
        await page.locator('.letter-choice.hint').click({ timeout: 500 }).catch(() => {});
        await page.waitForTimeout(150);
        return (await page.locator('.letter-choice.hint:not(.right)').count()) === 0;
      }, { timeout: 15_000 }).toBe(true);
    },
  });

  await expect(page.locator('.done-stars')).toHaveText(/⭐/);
  const said = await spoken(page);
  expect(said).toContain('Tap the letters. Then tap Blend!');
  expect(said.some((s) => /^This word is the\./.test(s))).toBe(true);
  // Âm rời không bao giờ đọc bằng giọng máy.
  expect(said.filter((s) => /^[satipn]$/.test(s))).toEqual([]);

  const progress = await page.evaluate(() => window.kidEnglish6.db.get('progress', 'lesson:phonics-g1'));
  expect(progress.plays).toBe(1);
  expect(progress.bestStars).toBeGreaterThanOrEqual(1);
  const missed = await page.evaluate(() => window.kidEnglish6.db.getAll('progress').then((all) => all.filter((p) => p.lessonId === 'phonics-g1' && p.missed > 0).map((p) => p.key)));
  expect(missed).toHaveLength(1);

  await page.getByRole('button', { name: 'Bài khác' }).click();
  await expect(page.locator('.lesson-card.next')).toHaveAttribute('data-lesson', 'phonics-g2');
  await expect(page.locator('.lesson-card[data-lesson="phonics-g1"] .lesson-stars')).toContainText('⭐');
});

for (const group of [5, 6]) {
  test(`Read: học hết bài nhóm ${group} (oo / oo dài, th / th this không bao giờ cùng hiện làm lựa chọn)`, async ({ page }) => {
    test.setTimeout(300_000);
    await fakeSpeech(page);
    await startApp(page);
    await page.getByRole('button', { name: 'Tập đọc' }).click();
    await page.locator(`.lesson-card[data-lesson="phonics-g${group}"]`).click();
    // Đọc câu: theo dõi karaoke (từ sáng theo nhịp) và dòng tiếng Việt dưới câu.
    await page.evaluate(() => {
      window.__seen = { reading: 0, vi: 0 };
      new MutationObserver(() => {
        if (document.querySelector('.sentence .sword.reading')) window.__seen.reading++;
        if (document.querySelector('.sentence-vi')) window.__seen.vi++;
      }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    });
    await playLesson(page, { onFirstCheck: async () => {} });
    const seen = await page.evaluate(() => window.__seen);
    expect(seen.reading).toBeGreaterThan(3);
    expect(seen.vi).toBeGreaterThan(0);
    const said = await spoken(page);
    expect(said).toContain('Your turn! Read the sentence!');
    await expect(page.locator('.done-stars')).toHaveText(/⭐/);
    expect(said.filter((x) => /^(sh|ch|th|oo|ng|qu|ee|ai)$/.test(x))).toEqual([]); // âm rời không đọc bằng giọng máy
  });
}
