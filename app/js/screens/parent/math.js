// Góc bố mẹ → 🔢 Toán (SPEC-math 6.2, 6.4): sao từng mức của mỗi bài, mức đã mở, tỉ lệ đúng ngay theo kiểu câu
// (bé hay nhầm kiểu nào). Bài Math là bài có sẵn → không sửa / xuất / ảnh được, chỉ xem tiến độ.

import { h } from '../../ui.js';
import { parentLayout, goParent, section } from './common.js';
import { getLessonProgress } from '../../progress.js';
import { BUILTIN_MATH, MAX_LEVEL, kindStats, unlockedLevel } from '../../math/math.js';

const KIND_VI = {
  't1:bigger': 'hỏi số lớn hơn',
  't1:smaller': 'hỏi số nhỏ hơn',
  't2:more': 'nhóm nhiều hơn',
  't2:fewer': 'nhóm ít hơn',
  't2:same': 'hai nhóm bằng nhau',
  't3:greater': 'dấu >',
  't3:less': 'dấu <',
  't3:equal': 'dấu =',
  't6:make': 'xếp số (chục + đơn vị)',
  't6:diff-tens': 'so số khác chục',
  't6:same-tens': 'so số cùng chục',
  't6:swap-digits': 'so số đổi chỗ chữ số (23 / 32)',
};

const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

export function mathView(app) {
  const body = parentLayout(app, { title: '🔢 Toán', back: () => goParent(app) });
  body.append(h('p.muted', { text: 'Tiến độ khu Toán của bé. Mở mọi mức: Cài đặt → 🔢 Toán.' }));
  (async () => {
    for (const lesson of BUILTIN_MATH) {
      const levels = [];
      for (let L = 1; L <= MAX_LEVEL; L++) levels.push(await getLessonProgress(app.db, lesson.id, `L${L}`));
      const best = Object.fromEntries(levels.map((p, i) => [i + 1, p.bestStars]));
      const unlocked = unlockedLevel(best, app.settings.mathAllLevels);
      const records = await app.db.getAllByIndex('progress', 'lessonId', lesson.id);
      const stats = kindStats(records).sort((a, b) => a.independent / a.seen - b.independent / b.seen);
      body.append(section(`${lesson.emoji} ${lesson.title} — ${lesson.titleVi}`,
        h('ul.mt-parent-levels', {}, ...levels.map((p, i) => h('li', {
          text: `Mức ${i + 1}: ${i + 1 <= unlocked ? `${starText(p.bestStars)} · ${p.plays} lượt` : 'chưa mở'}`,
        }))),
        stats.length
          ? h('ul.mt-parent-kinds', {}, ...stats.map((s) => h('li', { text: `${KIND_VI[s.kind] ?? s.kind}: ${s.independent}/${s.seen} đúng ngay` })))
          : h('p.muted', { text: 'Bé chưa làm bài này.' })));
    }
  })().catch((err) => console.error(err));
}
