// Khu 📖 Read (SPEC 3.1) và ✏️ Spell (SPEC 3.2) dùng chung: danh sách bài (tab Phonics / Theo sách, mọi bài mở sẵn,
// ⭐ "Tiếp theo" = bài đầu tiên chưa xong trong khu đó) và màn học một bài (chỉ chạy các hoạt động của khu), cuối bài
// tính sao (SPEC 4.4) — sao lưu riêng theo khu.

import { h, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { isAbort } from '../timing.js';
import { mascotElement } from '../mascot.js';
import { ZONE_BY_ID } from '../zones.js';
import { homeButton } from './child.js';
import { BUILTIN_LESSONS, BUILTIN_BY_ID } from '../data/builtin-lessons.js';
import { getLessonProgress, recordLessonDone, starsFor } from '../progress.js';
import { activityLayout, Teacher } from '../read/teacher.js';
import { meetSounds, blendWords, trickyWords, countSteps, isPlayable, ZONE_TYPES } from '../read/stages.js';
import { spellWords, fillWords } from '../read/spell-stages.js';
import { readSentences } from '../read/sentence-stages.js';
import { adaptForPlay } from '../lesson-prompts.js';
import { BUILTIN_SCENES } from '../data/builtin-scenes.js';
import { lessonImages, mediaBlob } from '../db.js';

const say = (app, text) => app.speaker.speak(text).catch(() => {});
const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
/** Phần tiến độ của khu: Read dùng khóa gốc "lesson:<id>", khu khác thêm "/<khu>". */
const partOf = (zone) => (zone === 'read' ? '' : zone);

/** Mọi bài khu `zone` chơi được: bài có sẵn (theo nhóm) rồi bài bố mẹ nhập (cũ trước). */
export async function zoneLessons(db, zone = 'read') {
  const imported = (await db.getAll('lessons')).filter((l) => !BUILTIN_BY_ID.has(l.id)).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return [...BUILTIN_LESSONS, ...imported].map(adaptForPlay).filter((l) => isPlayable(l, zone));
}

/** Bài để học: từ có âm chưa có file → học như tricky word (adaptForPlay). */
async function getLesson(app, id) {
  const lesson = BUILTIN_BY_ID.get(id) ?? await app.db.get('lessons', id);
  return lesson ? adaptForPlay(lesson) : null;
}

const lessonEmoji = (l) => l.words.find((w) => w.emoji)?.emoji ?? (l.track === 'book' ? '📘' : '🔤');

// ---------- Danh sách bài ----------

export const readScreen = (app, params = {}) => zoneListScreen(app, { ...params, zone: 'read' });
export const spellScreen = (app, params = {}) => zoneListScreen(app, { ...params, zone: 'spell' });

function zoneListScreen(app, { zone, tab = 'phonics' }) {
  const info = ZONE_BY_ID.get(zone);
  app.root.className = `child-screen read-list zone-list-${zone}`;
  const list = h('div.lesson-cards');
  const tabList = [['phonics', '🔤 Phonics'], ['book', '📘 Theo sách'], ...(zone === 'read' ? [['scene', '🖼️ Tả tranh']] : [])];
  const tabs = tabList.map(([id, label]) => h(`button.tab${id === tab ? '.active' : ''}`, {
    type: 'button', text: label, 'aria-pressed': String(id === tab),
    onclick: () => {
      play('tap');
      app.go(zone, { tab: id });
    },
  }));
  app.root.append(
    h('header.child-top', {}, homeButton(app), h('h1.read-title', { text: `${info.emoji} ${info.en}` }), mascotElement('read-olly')),
    h('div.tabs', {}, ...tabs),
    list,
  );
  say(app, info.intro);
  if (tab === 'scene') {
    sceneCards(app, list).catch((err) => console.error(err));
    return;
  }
  (async () => {
    const lessons = (await zoneLessons(app.db, zone)).filter((l) => l.track === tab);
    if (!lessons.length) {
      list.append(h('p.empty-note', { text: tab === 'book' ? 'Chưa có bài theo sách. Bố mẹ tạo bài ở Góc bố mẹ → Bài học.' : 'Chưa có bài.' }));
      return;
    }
    const progress = await Promise.all(lessons.map((l) => getLessonProgress(app.db, l.id, partOf(zone))));
    const next = lessons.findIndex((_, i) => !progress[i].completedAt);
    lessons.forEach((l, i) => {
      list.append(h(`button.lesson-card${i === next ? '.next' : ''}`, {
        type: 'button', 'aria-label': l.title, dataset: { lesson: l.id },
        onclick: () => {
          play('tap');
          app.go('lesson', { lessonId: l.id, zone });
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

export function lessonScreen(app, { lessonId, zone = 'read' }) {
  const signal = app.startActivity();
  const layout = activityLayout(app, { onHome: () => app.go(zone) });
  const t = new Teacher(app, { signal, stage: layout.stage, replayBtn: layout.replayBtn });
  const urls = [];
  (async () => {
    const lesson = await getLesson(app, lessonId);
    if (!lesson) {
      app.go(zone);
      return;
    }
    // Ảnh bố mẹ thêm cho từ (SPEC 5.6) thay cho emoji.
    const pictures = new Map();
    for (const [wordId, rec] of await lessonImages(app.db, lesson.id)) {
      const url = URL.createObjectURL(mediaBlob(rec));
      urls.push(url);
      pictures.set(wordId, url);
    }
    app.root.dataset.lesson = lesson.id;
    app.root.dataset.zone = zone;
    const total = Math.max(1, countSteps(lesson, zone));
    let done = 0;
    const results = [];
    const ctx = {
      app, t, stage: layout.stage, signal, lesson,
      picture: (w) => pictures.get(w.id) ?? null,
      tick: () => layout.setProgress(++done / total),
      scored: (r) => results.push(r),
    };
    const byId = new Map([...lesson.words, ...lesson.sentences].map((w) => [w.id, w]));
    const items = (a) => a.items.map((id) => byId.get(id)).filter(Boolean);
    const withGraphemes = (a) => items(a).filter((w) => w.graphemes);
    for (const a of lesson.activities) {
      if (!ZONE_TYPES[zone].has(a.type)) continue;
      if (a.type === 'sounds') await meetSounds(ctx, a.sounds);
      else if (a.type === 'blend') await blendWords(ctx, withGraphemes(a));
      else if (a.type === 'tricky') await trickyWords(ctx, items(a));
      else if (a.type === 'spell') await spellWords(ctx, withGraphemes(a));
      else if (a.type === 'fill') await fillWords(ctx, withGraphemes(a));
      else if (a.type === 'sentence') await readSentences(ctx, items(a));
    }
    const stars = starsFor(results);
    await recordLessonDone(app.db, lesson.id, stars, Date.now(), partOf(zone));
    showDone(app, t, layout, lesson, stars, zone);
  })().catch((err) => {
    if (isAbort(err)) return;
    console.error(err);
    toast('Có lỗi khi học bài này.');
  });
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

function showDone(app, t, layout, lesson, stars, zone) {
  layout.setProgress(1);
  play('tada');
  const leave = () => app.go(app.timeUp ? 'sleep' : zone, { tab: lesson.track });
  layout.stage.replaceChildren(h('div.done-panel', {},
    h('p.done-title', { text: 'Great job!' }),
    stars != null ? h('p.done-stars', { 'aria-label': `${stars} sao`, text: starText(stars) }) : null,
    h('div.done-actions', {},
      h('button.big-btn', { type: 'button', 'aria-label': 'Học lại', text: '🔁', onclick: () => app.go('lesson', { lessonId: lesson.id, zone }) }),
      h('button.big-btn.primary', { type: 'button', 'aria-label': 'Bài khác', text: zone === 'spell' ? '✏️' : '📖', onclick: leave }))));
  t.celebrate();
  t.say(stars === 3 ? 'Wow! Three stars! Great job!' : 'Great job! You did it!').catch(() => {});
}

// ---------- Tả tranh: danh sách tranh (SPEC-ta-tranh mục 2.1) ----------

async function sceneCards(app, list) {
  const progress = await Promise.all(BUILTIN_SCENES.map((s) => getLessonProgress(app.db, s.id)));
  BUILTIN_SCENES.forEach((s, i) => {
    list.append(h('button.lesson-card.scene-card', {
      type: 'button', 'aria-label': s.title, dataset: { scene: s.id },
      onclick: () => {
        play('tap');
        app.go('scene', { sceneId: s.id });
      },
    },
    h('div.scene-thumb', { html: s.svg }),
    h('span.lesson-title', { text: s.title }),
    h('span.lesson-vi', { text: `${s.titleVi} · ${s.sentences.length} câu` }),
    progress[i].plays ? h('span.lesson-stars', { text: `👂 ${progress[i].plays}` }) : null));
  });
}
