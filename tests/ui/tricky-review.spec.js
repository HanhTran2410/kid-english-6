// Ôn thẻ tricky quá hạn (SPEC 3.1.4): đầu bài Read, thẻ đến hạn (tối đa 5, trừ từ bài này sẽ học) → "Let's review" →
// bé tìm đúng thẻ → hộp ôn tăng, hạn mới về sau; thẻ chưa đến hạn không ôn.
import { test, expect } from '@playwright/test';
import { fakeSpeech, startApp, spoken } from './helpers.js';

test('đầu bài nhóm 2: ôn thẻ "the", "I" đến hạn (không ôn "he" của bài này, không ôn "was" chưa đến hạn) → hộp ôn cập nhật', async ({ page }) => {
  await fakeSpeech(page, { recognition: false });
  await startApp(page);
  await page.evaluate(async () => {
    const db = window.kidEnglish6.db;
    const now = Date.now();
    const card = (w, nextAt, box) => ({ key: `tricky/card/${w}`, lessonId: 'tricky', activity: 'card', itemId: w, seen: 2, independent: 1, helped: 0, missed: 1, practiced: 0, streak: 0, lastAt: now - 1e6, box, nextAt });
    for (const c of [card('the', now - 5e5, 1), card('i', now - 1e5, 0), card('he', now - 9e5, 0), card('was', now + 9e7, 2)]) await db.put('progress', c);
    window.kidEnglish6.go('lesson', { lessonId: 'phonics-g2', zone: 'read' });
  });
  await expect(page.locator('.review-label')).toHaveText('🔁 Ôn lại');
  await expect.poll(() => spoken(page)).toContain("Let's review some tricky words!");
  for (const w of ['the', 'i']) {
    const btn = page.locator(`.word-choice[data-choice="${w}"]`);
    await expect(async () => {
      await btn.click({ timeout: 1000 });
      await expect(btn).toHaveClass(/right/, { timeout: 300 });
    }).toPass({ timeout: 15_000 });
  }
  await expect(page.locator('.review-label')).toHaveCount(0, { timeout: 15_000 }); // sang hoạt động của bài
  const cards = await page.evaluate(() => Promise.all(['the', 'i', 'he', 'was'].map((w) => window.kidEnglish6.db.get('progress', `tricky/card/${w}`))));
  const [the, i, he, was] = cards;
  expect(the.box).toBe(2);
  expect(i.box).toBe(1);
  expect(the.nextAt).toBeGreaterThan(Date.now());
  expect(he.seen).toBe(2); // từ của bài này: không ôn ở phần đầu
  expect(was.seen).toBe(2); // chưa đến hạn
  const asked = (await spoken(page)).filter((s) => s.startsWith('Find the word:'));
  expect(asked.slice(0, 2).sort()).toEqual(['Find the word: I!', 'Find the word: the!']);
});
