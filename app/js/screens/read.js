// Khu 📖 Read (SPEC 3.1): danh sách bài (tab Phonics / Theo sách, ⭐ "Tiếp theo" = bài đầu tiên chưa xong; mọi bài mở sẵn)
// và màn học một bài (gặp âm → ghép âm → tricky words), cuối bài tính sao (SPEC 4.4).

import { h, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { isAbort } from '../timing.js';
import { mascotElement } from '../mascot.js';
import { homeButton } from './child.js';
import { BUILTIN_LESSONS, BUILTIN_BY_ID } from '../data/builtin-lessons.js';
import { getLessonProgress, recordLessonDone, starsFor } from '../progress.js';
import { activityLayout, Teacher } from '../read/teacher.js';
import { meetSounds, blendWords, trickyWords, countSteps, isReadable } from '../read/stages.js';

const say = (app, text) => app.speaker.speak(text).catch(() => {});
const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

/** Mọi bài khu Read chơi được: bài có sẵn (theo nhóm) rồi bài bố mẹ nhập (cũ trước). */
export async function readLessons(db) {
  const imported = (await db.getAll('lessons')).filter((l) => !BUILTIN_BY_ID.has(l.id)).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return [...BUILTIN_LESSONS, ...imported].filter(isReadable);
}

async function getLesson(app, id) {
  return BUILTIN_BY_ID.get(id) ?? app.db.get('lessons', id);
}

const lessonEmoji = (l) => l.words.find((w) => w.emoji)?.emoji ?? (l.track === 'book' ? '📘' : '🔤');

// ---------- Danh sách bài ----------

export function readScreen(app, { tab = 'phonics' } = {}) {
  app.root.className = 'child-screen read-list';
  const list = h('div.lesson-cards');
  const tabs = [['phonics', '🔤 Phonics'], ['book', '📘 Theo sách']].map(([id, label]) => h(`button.tab${id === tab ? '.active' : ''}`, {
    type: 'button', text: label, 'aria-pressed': String(id === tab),
    onclick: () => {
      play('tap');
      app.go('read', { tab: id });
    },
  }));
  app.root.append(
    h('header.child-top', {}, homeButton(app), h('h1.read-title', { text: '📖 Read' }), mascotElement('read-olly')),
    h('div.tabs', {}, ...tabs),
    list,
  );
  say(app, "Let's read together!");
  (async () => {
    const lessons = (await readLessons(app.db)).filter((l) => l.track === tab);
    if (!lessons.length) {
      list.append(h('p.empty-note', { text: tab === 'book' ? 'Chưa có bài theo sách. Bố mẹ tạo bài ở Góc bố mẹ → Bài học.' : 'Chưa có bài.' }));
      return;
    }
    const progress = await Promise.all(lessons.map((l) => getLessonProgress(app.db, l.id)));
    const next = lessons.findIndex((_, i) => !progress[i].completedAt);
    lessons.forEach((l, i) => {
      list.append(h(`button.lesson-card${i === next ? '.next' : ''}`, {
        type: 'button', 'aria-label': l.title, dataset: { lesson: l.id },
        onclick: () => {
          play('tap');
          app.go('lesson', { lessonId: l.id });
        },
      },
      h('span.lesson-emoji', { text: lessonEmoji(l) }),
      h('span.lesson-title', { text: l.title }),
      l.titleVi ? h('span.lesson-vi', { text: l.titleVi }) : null,
      h('span.lesson-stars', { text: starText(progress[i].bestStars) }),
      i === next ? h('span.next-badge', { text: '⭐ Tiếp theo' }) : null));
    });
  })().catch((err) => {
    console.error(err);
    toast('Không đọc được danh sách bài.');
  });
}

// ---------- Học một bài ----------

export function lessonScreen(app, { lessonId }) {
  const signal = app.startActivity();
  const layout = activityLayout(app, { onHome: () => app.go('read') });
  const t = new Teacher(app, { signal, stage: layout.stage, replayBtn: layout.replayBtn });
  (async () => {
    const lesson = await getLesson(app, lessonId);
    if (!lesson) {
      app.go('read');
      return;
    }
    app.root.dataset.lesson = lesson.id;
    const total = Math.max(1, countSteps(lesson));
    let done = 0;
    const results = [];
    const ctx = {
      app, t, stage: layout.stage, signal, lesson,
      tick: () => layout.setProgress(++done / total),
      scored: (r) => results.push(r),
    };
    const byId = new Map(lesson.words.map((w) => [w.id, w]));
    const items = (a) => a.items.map((id) => byId.get(id)).filter(Boolean);
    for (const a of lesson.activities) {
      if (a.type === 'sounds') await meetSounds(ctx, a.sounds);
      else if (a.type === 'blend') await blendWords(ctx, items(a).filter((w) => w.graphemes));
      else if (a.type === 'tricky') await trickyWords(ctx, items(a));
    }
    const stars = starsFor(results);
    await recordLessonDone(app.db, lesson.id, stars);
    showDone(app, t, layout, lesson, stars);
  })().catch((err) => {
    if (isAbort(err)) return;
    console.error(err);
    toast('Có lỗi khi học bài này.');
  });
}

function showDone(app, t, layout, lesson, stars) {
  layout.setProgress(1);
  play('tada');
  const leave = () => app.go(app.timeUp ? 'sleep' : 'read', { tab: lesson.track });
  layout.stage.replaceChildren(h('div.done-panel', {},
    h('p.done-title', { text: 'Great job!' }),
    stars != null ? h('p.done-stars', { 'aria-label': `${stars} sao`, text: starText(stars) }) : null,
    h('div.done-actions', {},
      h('button.big-btn', { type: 'button', 'aria-label': 'Học lại', text: '🔁', onclick: () => app.go('lesson', { lessonId: lesson.id }) }),
      h('button.big-btn.primary', { type: 'button', 'aria-label': 'Bài khác', text: '📖', onclick: leave }))));
  t.celebrate();
  t.say(stars === 3 ? 'Wow! Three stars! Great job!' : 'Great job! You did it!').catch(() => {});
}
