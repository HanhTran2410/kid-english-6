// Góc bố mẹ → 🧩 Quest (SPEC-quest 10.2): sao từng mức của mỗi trò, tỉ lệ đúng ngay theo kiểu câu, số lần bé bấm 🔊
// (nghe thay vì tự đọc), nhóm âm Quest đang dùng và từ chức năng đã giới thiệu riêng ở Quest.

import { h } from '../../ui.js';
import { parentLayout, goParent, section } from './common.js';
import { getLessonProgress } from '../../progress.js';
import { BUILTIN_LESSONS } from '../../data/builtin-lessons.js';
import { MAX_LEVEL, kindStats, unlockedLevel } from '../../math/math.js';
import { BUILTIN_QUESTS } from '../../quest/quest.js';
import { QUEST_WORDS } from '../../quest/content.js';

const KIND_VI = {
  'q1:in': 'câu "in" (vào trong)',
  'q1:on': 'câu "on" (lên trên)',
  'q1:under': 'câu "under" (xuống dưới)',
  'q1:two': 'câu hai việc',
  'q2:short': 'câu ngắn (≤ 4 từ)',
  'q2:long': 'câu dài',
  'q3:pic': 'đoán từ — chọn hình',
  'q3:word': 'đoán từ — đọc từ',
  'q3:look-alike': 'đoán từ — có từ giống chữ',
};
const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

export function questView(app) {
  const body = parentLayout(app, { title: '🧩 Quest', back: () => goParent(app) });
  body.append(h('p.muted', { text: 'Tiến độ khu Thử thách. Quest chỉ dùng từ / câu của các bài Tập đọc bé đã đọc xong. Mở mọi mức: Cài đặt → 🧩 Quest.' }));
  (async () => {
    const groups = [];
    for (const l of BUILTIN_LESSONS) {
      if (l.track === 'phonics' && (await getLessonProgress(app.db, l.id)).completedAt) groups.push(l.group);
    }
    const seen = [];
    for (const w of QUEST_WORDS) if (await app.db.get('progress', `quest/word/${w}`)) seen.push(w);
    body.append(section('Nội dung',
      h('p', { text: `Nhóm âm bé đã đọc xong: ${groups.length ? groups.join(', ') : 'chưa có (Quest dùng nhóm 1)'}.` }),
      h('p', { text: `Từ chức năng Quest giới thiệu riêng (không phải từ bé học ở Tập đọc): ${seen.length ? seen.join(', ') : 'chưa giới thiệu'}.` })));
    for (const quest of BUILTIN_QUESTS) {
      const levels = [];
      for (let L = 1; L <= MAX_LEVEL; L++) levels.push(await getLessonProgress(app.db, quest.id, `L${L}`));
      const best = Object.fromEntries(levels.map((p, i) => [i + 1, p.bestStars]));
      const unlocked = unlockedLevel(best, app.settings.questAllLevels);
      const records = await app.db.getAllByIndex('progress', 'lessonId', quest.id);
      const stats = kindStats(records).sort((a, b) => a.independent / a.seen - b.independent / b.seen);
      const listen = (await app.db.get('progress', `quest/listen/${quest.key}`))?.count ?? 0;
      body.append(section(`${quest.emoji} ${quest.title} — ${quest.titleVi}`,
        h('ul.mt-parent-levels', {}, ...levels.map((p, i) => h('li', {
          text: `Mức ${i + 1}: ${i + 1 <= unlocked ? `${starText(p.bestStars)} · ${p.plays} lượt` : 'chưa mở'}`,
        }))),
        stats.length
          ? h('ul.mt-parent-kinds', {}, ...stats.map((s) => h('li', { text: `${KIND_VI[s.kind] ?? s.kind}: ${s.independent}/${s.seen} đúng ngay` })))
          : h('p.muted', { text: 'Bé chưa chơi trò này.' }),
        h('p.muted', { text: `Bé bấm 🔊 nghe lại ${listen} lần (không tính là trợ giúp).` })));
    }
  })().catch((err) => console.error(err));
}
