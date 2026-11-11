// Khu 📖 Read (SPEC 3.1) và ✏️ Spell (SPEC 3.2) dùng chung: danh sách bài (tab Phonics / Theo sách, mọi bài mở sẵn,
// ⭐ "Tiếp theo" = bài đầu tiên chưa xong trong khu đó) và màn học một bài (chỉ chạy các hoạt động của khu), cuối bài
// tính sao (SPEC 4.4) — sao lưu riêng theo khu.

import { h, toast } from '../ui.js';
import { play } from '../speech/sfx.js';
import { isAbort } from '../timing.js';
import { mascotElement } from '../mascot.js';
import { ZONE_BY_ID } from '../zones.js';
import { homeButton } from './child.js';
import { BUILTIN_LESSONS, BUILTIN_BY_ID, BUILTIN_TALKS } from '../data/builtin-lessons.js';
import { getLessonProgress, recordLessonDone, starsFor } from '../progress.js';
import { activityLayout, Teacher } from '../read/teacher.js';
import { meetSounds, blendWords, trickyWords, countSteps, isPlayable, ZONE_TYPES } from '../read/stages.js';
import { spellWords, fillWords } from '../read/spell-stages.js';
import { readSentences } from '../read/sentence-stages.js';
import { talkDialogue, talkSteps } from '../read/talk-stages.js';
import { TALK_LEVELS, suggestedLevel } from '../talk.js';
import { adaptForPlay } from '../lesson-prompts.js';
import { BUILTIN_SCENES } from '../data/builtin-scenes.js';
import { lessonImages, mediaBlob, SCENE_IMAGE } from '../db.js';
import { libraryImages, wordKey, sentenceKey } from '../picture-library.js';
import { writeCards } from './write.js';
import { writeWords } from '../read/write-stages.js';
import { pickWriteWords } from '../write/words.js';

const say = (app, text) => app.speaker.speak(text).catch(() => {});
const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
/** Phần tiến độ của khu: Read dùng khóa gốc "lesson:<id>", khu khác thêm "/<khu>". */
const partOf = (zone) => (zone === 'read' ? '' : zone);

/** Mọi bài khu `zone` chơi được: bài có sẵn (theo nhóm) rồi bài bố mẹ nhập (cũ trước). */
export async function zoneLessons(db, zone = 'read') {
  const imported = (await db.getAll('lessons')).filter((l) => !BUILTIN_BY_ID.has(l.id)).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return [...BUILTIN_LESSONS, ...BUILTIN_TALKS, ...imported].map(adaptForPlay).filter((l) => isPlayable(l, zone));
}

/** Bài để học: từ có âm chưa có file → học như tricky word (adaptForPlay). */
async function getLesson(app, id) {
  const lesson = BUILTIN_BY_ID.get(id) ?? await app.db.get('lessons', id);
  return lesson ? adaptForPlay(lesson) : null;
}

const lessonEmoji = (l, zone) => (zone === 'talk' ? l.emoji ?? l.dialogues?.[0]?.partner.emoji : null)
  ?? l.words.find((w) => w.emoji)?.emoji ?? (l.track === 'book' ? '📘' : '🔤');

// ---------- Danh sách bài ----------

export const readScreen = (app, params = {}) => zoneListScreen(app, { ...params, zone: 'read' });
export const spellScreen = (app, params = {}) => zoneListScreen(app, { ...params, zone: 'spell' });
export const talkScreen = (app, params = {}) => zoneListScreen(app, { ...params, zone: 'talk' });

function zoneListScreen(app, { zone, tab = 'phonics' }) {
  const info = ZONE_BY_ID.get(zone);
  app.root.className = `child-screen read-list zone-list-${zone}`;
  const list = h('div.lesson-cards');
  // Khu Talk: tab đầu là các bài hội thoại hằng ngày có sẵn (mạch "phonics" trong dữ liệu).
  const tabList = [['phonics', zone === 'talk' ? '💬 Hằng ngày' : '🔤 Phonics'], ['book', '📘 Theo sách'], ...(zone === 'read' ? [['scene', '🖼️ Tả tranh']] : []), ...(zone === 'spell' ? [['write', '✍️ Tập viết']] : [])];
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
  if (tab === 'write') {
    writeCards(app, list).catch((err) => console.error(err));
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
      h('span.lesson-emoji', { text: lessonEmoji(l, zone) }),
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
    // Ảnh trong 🖼️ Kho ảnh dùng chung (theo từ / câu, SPEC 5.6) thay cho emoji; nạp khi cần.
    const lib = await libraryImages(app.db);
    const cache = new Map();
    const urlFor = (key) => {
      const rec = lib.get(key);
      if (!rec) return null;
      if (!cache.has(key)) {
        const url = URL.createObjectURL(mediaBlob(rec));
        urls.push(url);
        cache.set(key, url);
      }
      return cache.get(key);
    };
    const sentenceSet = new Set(lesson.sentences);
    app.root.dataset.lesson = lesson.id;
    app.root.dataset.zone = zone;
    // Talk (SPEC 3.3.3): bé chọn mức hỗ trợ trước; sao = mức đã làm xong.
    const level = zone === 'talk' ? await chooseLevel(app, t, layout.stage, lesson) : null;
    const dialogues = new Map((lesson.dialogues ?? []).map((d) => [d.id, d]));
    const total = Math.max(1, zone === 'talk'
      ? lesson.activities.filter((a) => a.type === 'talk').flatMap((a) => a.items).reduce((n, id) => n + (dialogues.has(id) ? talkSteps(dialogues.get(id), app.settings.childName) : 0), 0)
      : countSteps(lesson, zone));
    let done = 0;
    const results = [];
    const ctx = {
      app, t, stage: layout.stage, signal, lesson,
      picture: (w) => urlFor(sentenceSet.has(w) ? sentenceKey(w.en) : wordKey(w.en)),
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
      else if (a.type === 'talk') for (const id of a.items) if (dialogues.has(id)) await talkDialogue(ctx, dialogues.get(id), level);
    }
    const stars = zone === 'talk' ? level : starsFor(results);
    await recordLessonDone(app.db, lesson.id, stars, Date.now(), partOf(zone));
    // ✍️ Viết từ cuối bài Spell (SPEC-write 8): từ đã xếp đúng 2 lần liên tiếp; không đổi sao của bài.
    if (zone === 'spell' && app.settings.writeWords !== false) {
      const words = pickWriteWords(lesson, await app.db.getAllByIndex('progress', 'lessonId', lesson.id));
      if (words.length) await writeWords(ctx, words);
    }
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
      h('button.big-btn.primary', { type: 'button', 'aria-label': 'Bài khác', text: ZONE_BY_ID.get(zone)?.emoji ?? '📖', onclick: leave }))));
  t.celebrate();
  t.say(stars === 3 ? 'Wow! Three stars! Great job!' : 'Great job! You did it!').catch(() => {});
}

// ---------- Talk: chọn mức hỗ trợ (SPEC 3.3.3) ----------

async function chooseLevel(app, t, stage, lesson) {
  const { bestStars } = await getLessonProgress(app.db, lesson.id, 'talk');
  const suggest = suggestedLevel(bestStars);
  const buttons = TALK_LEVELS.map((L) => h(`button.level-btn${L.level === suggest ? '.suggested' : ''}`, {
    type: 'button', 'aria-label': `Mức ${L.level}: ${L.vi}`, dataset: { level: String(L.level) },
  },
  h('span.level-emoji', { text: L.emoji }),
  h('span.level-en', { text: L.en }),
  h('span.level-vi', { text: L.vi }),
  h('span.level-stars', { text: '⭐'.repeat(L.level) })));
  const partner = lesson.dialogues?.[0]?.partner;
  stage.replaceChildren(h('div.level-panel', {},
    h('p.level-title', {}, partner ? h('span.talk-avatar', { text: partner.emoji, 'aria-hidden': 'true' }) : null, h('span', { text: lesson.title })),
    lesson.titleVi ? h('p.level-sub', { text: lesson.titleVi }) : null,
    h('div.level-list', {}, ...buttons)));
  t.say('How do you want to talk?').catch(() => {});
  const picked = await t.waitTap(buttons);
  play('pop');
  app.speaker.cancel();
  return Number(picked.dataset.level);
}

// ---------- Tả tranh: danh sách tranh (SPEC-ta-tranh mục 2.1) ----------

async function sceneCards(app, list) {
  const own = (await app.db.getAll('scenes')).filter((s) => s.sentences?.length).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  const hidden = new Set(app.settings.hiddenScenes ?? []);
  const scenes = [...BUILTIN_SCENES.filter((s) => !hidden.has(s.id)), ...own];
  const progress = await Promise.all(scenes.map((s) => getLessonProgress(app.db, s.id)));
  const found = await Promise.all(scenes.map((s) => getLessonProgress(app.db, s.id, 'find')));
  const thumbs = await Promise.all(scenes.map(async (s) => {
    if (s.svg) return h('div.scene-thumb', { html: s.svg });
    const img = (await lessonImages(app.db, s.id)).get(SCENE_IMAGE);
    return h('div.scene-thumb', {}, img ? h('img', { src: URL.createObjectURL(mediaBlob(img)), alt: '' }) : h('span.lesson-emoji', { text: '🖼️' }));
  }));
  scenes.forEach((s, i) => {
    list.append(h('button.lesson-card.scene-card', {
      type: 'button', 'aria-label': s.title, dataset: { scene: s.id },
      onclick: () => {
        play('tap');
        app.go('scene', { sceneId: s.id });
      },
    },
    thumbs[i],
    h('span.lesson-title', { text: s.title }),
    h('span.lesson-vi', { text: `${s.titleVi} · ${s.sentences.length} câu` }),
    progress[i].plays || found[i].plays ? h('span.lesson-stars', { text: [progress[i].plays ? `👂 ${progress[i].plays}` : '', found[i].plays ? `🔍 ${'⭐'.repeat(found[i].bestStars)}${'☆'.repeat(3 - found[i].bestStars)}` : ''].filter(Boolean).join('  ') }) : null));
  });
}
