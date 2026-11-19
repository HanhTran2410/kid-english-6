// Góc bố mẹ → Bài học → 📚 Truyện ngắn (SPEC-story.md): tạo truyện bằng AI + xem lại trước khi lưu (8.5), danh sách
// truyện + tiến độ của bé (7.3), tải về / xóa; trang 🖼️ Ảnh của truyện (8.4): MỘT ảnh lưới cho cả truyện → cắt → xem
// trước (đổi ô, bỏ ô, gán lại ô chưa dùng) → lưu cùng ảnh lưới gốc; vẽ lại một trang (so sánh ảnh cũ / mới); ảnh lẻ.

import { h, toast, copyText, confirmDialog } from '../../ui.js';
import { parseLessonText } from '../../lesson.js';
import { resizeImage, sliceGrid, loadGridImage } from '../../image.js';
import { mediaBlob, lessonImages } from '../../db.js';
import { learnedGroupOf } from '../../lesson-prompts.js';
import { getLessonProgress } from '../../progress.js';
import { BUILTIN_LESSONS } from '../../data/builtin-lessons.js';
import { libraryImages, wordKey } from '../../picture-library.js';
import { learnedPhonics } from '../../quest/content.js';
import { parentLayout, goParent, section, notice, field } from './common.js';
import { imageErrorMessage } from './pictures.js';
import { allStories, getStory, STORY_BY_ID } from '../../story/story.js';
import { readability, learnedUpTo } from '../../story/words.js';
import { validateStory, storyIdFor, storyResets } from '../../story/validate.js';
import { storyWritingPrompt, storyGridPrompt, storyGridShape, storyRedrawPrompt, ratioLabel, STORY_ART_STYLE } from '../../story/prompts.js';
import { saveStory, replaceStory, deleteStory, setPageImage, removePageImage, saveGridImages, removeGridImage, STORY_GRID } from '../../story/store.js';
import { makeSharePackage, downloadPackage, builtinStoriesWithImages } from '../../share.js';
import { choose } from './lessons.js';

const MIN_CELL_PX = 300; // mỗi ô sau khi cắt ≥ 300 px (8.4)
const GRID_MAX_PX = 1536; // ảnh lưới gốc lưu cạnh dài ≤ 1536 px (8.1)
const LEVEL_VI = { word: 'nhận từ', chunk: 'đọc cụm', sentence: 'cả câu' };

/** Nhóm âm bé đã đọc xong bài Phonics có sẵn. */
async function completedGroups(db) {
  const done = [];
  for (const l of BUILTIN_LESSONS) if (l.track === 'phonics' && (await getLessonProgress(db, l.id)).completedAt) done.push(l.group);
  return done;
}

// ---------- Trang danh sách + tạo truyện ----------

export function storiesView(app) {
  const body = parentLayout(app, { title: '📚 Truyện ngắn', back: () => goParent(app, 'lessons') });
  const listBox = h('div.lesson-list.story-list');
  const refresh = () => renderStories(app, listBox).catch((err) => {
    console.error(err);
    toast('Không đọc được danh sách truyện.');
  });
  body.append(createStoryPanel(app, refresh), section('Các truyện', listBox));
  refresh();
}

async function renderStories(app, box) {
  const [stories, groups] = await Promise.all([allStories(app.db), completedGroups(app.db)]);
  const lp = learnedPhonics(groups.length ? groups : [1]);
  const items = await app.db.getAll('progress');
  box.replaceChildren(...await Promise.all(stories.map(async (s) => {
    const p = await getLessonProgress(app.db, s.id);
    const r = readability(s, lp);
    const mine = items.filter((x) => x.lessonId === s.id);
    const sentences = s.pages.flatMap((pg) => pg.sentences);
    const read = sentences.filter((x) => mine.find((m) => m.activity === 'read' && m.itemId === x.id && m.practiced > 0));
    const levels = read.map((x) => mine.find((m) => m.activity === 'read' && m.itemId === x.id)?.bestLevel).filter(Boolean);
    // Câu hỏi hay sai theo kiểu (pick / word / order).
    const wrong = {};
    for (const q of s.questions) {
      const m = mine.find((x) => x.activity === 'quiz' && x.itemId === q.id);
      if (m && (m.helped || m.missed)) wrong[q.type] = (wrong[q.type] ?? 0) + m.helped + m.missed;
    }
    const wrongText = Object.entries(wrong).map(([t, n]) => `${{ pick: 'chọn hình', word: 'chọn chữ', order: 'xếp thứ tự' }[t]} ${n}`).join(', ');
    return h('div.lesson-row', { dataset: { story: s.id } },
      h('div.lesson-info', {},
        h('strong', { text: `${s.cover ?? '📖'} ${s.title}` }), s.titleVi ? h('span', { text: ` — ${s.titleVi}` }) : null,
        h('div.field-hint', { text: [s.track === 'phonics' ? `Phonics nhóm ${s.group}` : 'Theo sách', `${s.pages.length} trang`, s.builtIn ? 'có sẵn' : `id: ${s.id}`].join(' · ') }),
        h('div.field-hint', { text: `Bé đọc được ${r.readable} / ${r.total} từ (${Math.round(r.ratio * 100)}%)${r.newWords.length ? `. Từ mới: ${r.newWords.map((w) => `${w.word} (${w.count})`).join(', ')}` : ''}` }),
        h('div.field-hint.story-progress', {
          text: [
            `👂 nghe hết ${p.listened ?? 0} lần`,
            `❓ làm câu hỏi ${p.plays} lần${p.completedAt ? ` · ${'⭐'.repeat(p.bestStars)}${'☆'.repeat(3 - p.bestStars)}` : ''}`,
            wrongText ? `hay sai: ${wrongText}` : null,
            `📖 đã đọc ${read.length} / ${sentences.length} câu${levels.length ? ` (${[...new Set(levels)].map((l) => LEVEL_VI[l] ?? l).join(', ')})` : ''}`,
          ].filter(Boolean).join(' · '),
        })),
      h('div.lesson-actions', {},
        h('button.btn', { type: 'button', text: '🖼️ Ảnh', 'aria-label': `Ảnh của truyện ${s.title}`, onclick: () => goParent(app, 'story-images', { storyId: s.id }) }),
        h('button.btn', {
          type: 'button', text: '⬇️ Tải về', 'aria-label': `Tải về truyện ${s.title}`,
          onclick: async () => {
            // Truyện có sẵn: máy kia đã có nội dung → gói chỉ mang ảnh trang bố mẹ đã thay.
            if (s.builtIn && !(await builtinStoriesWithImages(app.db)).includes(s.id)) {
              toast('Truyện có sẵn chưa có ảnh nào bố mẹ thay — máy kia đã có truyện này rồi.', 4000);
              return;
            }
            const made = await makeSharePackage(app.db, { storyIds: [s.id] });
            downloadPackage(made);
            toast(`Đã tải về ${made.filename} (${s.builtIn ? 'ảnh trang, ' : ''}${made.counts.images} ảnh).`, 3500);
          },
        }),
        s.builtIn ? null : h('button.btn.danger', {
          type: 'button', text: '🗑️ Xóa', 'aria-label': `Xóa truyện ${s.title}`,
          onclick: async () => {
            if (!await confirmDialog(`Xóa truyện "${s.title}"? Kết quả của bé và ảnh của truyện cũng bị xóa.`, { okText: 'Xóa', danger: true })) return;
            await deleteStory(app.db, s.id);
            toast('Đã xóa truyện.');
            renderStories(app, box);
          },
        })));
  })));
}

/** ✨ Tạo truyện bằng AI (8.5): nguồn → chép prompt → dán JSON → xem lại → lưu. */
function createStoryPanel(app, refresh) {
  const sourceSel = h('select', { 'aria-label': 'Nguồn của truyện' },
    ...[1, 2, 3, 4, 5, 6, 7].map((g) => h('option', { value: `g${g}`, text: `🔤 Phonics nhóm ${g}` })));
  const ideaIn = h('input', { type: 'text', placeholder: 'Ví dụ: Bé đi sở thú với bố (có thể bỏ trống)', 'aria-label': 'Ý tưởng truyện' });
  const pagesSel = h('select', { 'aria-label': 'Số trang' }, ...[4, 5, 6].map((n) => h('option', { value: String(n), text: `${n} trang`, selected: n === 5 })));
  let learned = 1;
  const lessons = new Map();
  (async () => {
    learned = learnedGroupOf(await completedGroups(app.db));
    sourceSel.value = `g${learned}`;
    for (const l of (await app.db.getAll('lessons')).filter((x) => x.track !== 'phonics')) {
      lessons.set(l.id, l);
      sourceSel.append(h('option', { value: `l:${l.id}`, text: `📘 ${l.title}${l.unit ? ` (${l.unit})` : ''}` }));
    }
  })().catch(() => {});
  const groupOf = () => (sourceSel.value.startsWith('g') ? Number(sourceSel.value.slice(1)) : learned);

  const copyBtn = h('button.btn.primary', {
    type: 'button', text: '📋 Chép prompt viết truyện',
    onclick: async () => {
      const group = groupOf();
      const lesson = sourceSel.value.startsWith('l:') ? lessons.get(sourceSel.value.slice(2)) : null;
      const lp = learnedUpTo(group);
      const text = storyWritingPrompt({ group, lesson, idea: ideaIn.value.trim(), pages: Number(pagesSel.value), tricky: [...lp.tricky].map((w) => (w === 'i' ? 'I' : w)) });
      toast(await copyText(text) ? 'Đã chép prompt — dán vào ChatGPT / Gemini, rồi dán kết quả vào ô dưới.' : 'Không chép được — hãy thử lại.', 3500);
    },
  });

  const area = h('textarea.lesson-json.story-json', { rows: 7, placeholder: 'Dán JSON truyện AI trả về vào đây.', spellcheck: false });
  const result = h('div.import-result');
  let checked = null;
  let warnings = [];

  const check = async () => {
    checked = null;
    result.replaceChildren();
    const parsed = parseLessonText(area.value);
    if (parsed.error) return result.append(notice('error', parsed.error));
    const lib = await libraryImages(app.db);
    const r = validateStory(parsed.data, { hasLibImage: (w) => lib.has(wordKey(w)), lp: parsed.data?.group ? learnedUpTo(Number(parsed.data.group)) : learnedUpTo(learned) });
    if (!r.ok) {
      result.append(notice('error', h('strong', { text: `Chưa lưu được — ${r.errors.length} lỗi:` }), h('ul', {}, ...r.errors.map((e) => h('li', { text: e })))));
      return;
    }
    checked = r.story;
    if (checked.group == null) checked.group = learned; // truyện Theo sách: bậc theo nhóm bé đã học lúc tạo
    warnings = r.warnings;
    renderReview();
  };

  /** Màn xem lại (8.5 bước 3): từng trang (sửa chữ tại chỗ), từ mới tô màu, cảnh báo, ✕ bỏ câu hỏi (còn ≥ 2). */
  function renderReview() {
    const s = checked;
    const r = readability(s, learnedUpTo(s.group));
    const pages = s.pages.map((p, i) => h('div.story-review-page', { dataset: { page: p.id } },
      h('strong', { text: `Trang ${i + 1} ${p.emoji ?? ''}` }),
      ...p.sentences.map((x) => {
        const en = h('input', { type: 'text', value: x.en, 'aria-label': `Câu ${x.id}` });
        const vi = h('input', { type: 'text', value: x.vi, 'aria-label': `Tiếng Việt câu ${x.id}` });
        en.addEventListener('change', () => { x.en = en.value.trim(); });
        vi.addEventListener('change', () => { x.vi = vi.value.trim(); });
        return h('div.story-review-sent', {}, en, vi);
      })));
    const questions = s.questions.map((q) => h('div.word-review-row', { dataset: { question: q.id } },
      h('span', { text: { pick: '🖼️', word: '🔤', order: '🔢' }[q.type] }),
      h('span', { text: `${q.en} → ${q.type === 'order' ? q.pages.join(' → ') : q.answer}` }),
      h('button.btn.small', {
        type: 'button', text: '✕', 'aria-label': `Bỏ câu hỏi ${q.id}`,
        onclick: () => {
          if (checked.questions.length <= 2) return toast('Truyện cần ít nhất 2 câu hỏi.');
          checked.questions = checked.questions.filter((x) => x !== q);
          renderReview();
        },
      })));
    result.replaceChildren(
      notice('info', h('strong', { text: `✅ ${s.title}` }), ` — ${s.pages.length} trang, ${s.questions.length} câu hỏi. Bé đọc được ${r.readable} / ${r.total} từ (${Math.round(r.ratio * 100)}%)${r.newWords.length ? `. Từ mới: ${r.newWords.map((w) => w.word).join(', ')}` : ''}.`),
      warnings.length ? notice('warn', h('strong', { text: 'Lưu ý (vẫn lưu được):' }), h('ul', {}, ...warnings.map((w) => h('li', { text: w })))) : null,
      h('div.story-review', {}, ...pages),
      h('div.word-review', {}, h('p.field-hint', { text: 'Câu hỏi (✕ để bỏ):' }), ...questions),
      h('button.btn.primary', { type: 'button', text: '💾 Lưu truyện', onclick: save }));
  }

  const save = async () => {
    if (!checked) return;
    const again = validateStory({ ...checked, id: checked.id });
    if (!again.ok) {
      result.append(notice('error', h('strong', { text: 'Chưa lưu được:' }), h('ul', {}, ...again.errors.map((e) => h('li', { text: e })))));
      return;
    }
    const story = { ...again.story, group: again.story.group ?? checked.group };
    const taken = new Set([...STORY_BY_ID.keys(), ...(await app.db.getAll('stories')).map((x) => x.id)]);
    if (story.id === 'auto') {
      story.id = storyIdFor(story, taken);
      await saveStory(app.db, story);
      toast(`Đã lưu truyện (id: ${story.id}).`);
    } else if (!taken.has(story.id)) {
      await saveStory(app.db, story);
      toast('Đã lưu truyện.');
    } else {
      const existing = STORY_BY_ID.get(story.id) ?? await app.db.get('stories', story.id);
      // Truyện có sẵn không bị thay bằng nhập → chỉ lưu thành truyện mới.
      const choice = existing.builtIn ? 'new' : await choose(`Đã có truyện mang id "${story.id}" ("${existing.title}").`, [
        ['cancel', 'Hủy'], ['new', 'Lưu thành truyện mới'], ['replace', 'Thay truyện cũ'],
      ]);
      if (choice === 'cancel') return;
      if (choice === 'replace') {
        const resets = storyResets(existing, story);
        const n = resets.readIds.length + resets.quizIds.length;
        if (n && !await confirmDialog(`Sửa sẽ xóa kết quả của ${resets.quizIds.length} câu hỏi và ${resets.readIds.length} câu đọc. Lưu?`, { okText: 'Lưu', danger: true })) return;
        await replaceStory(app.db, story, resets);
        toast('Đã thay truyện cũ. Kết quả của phần còn nguyên vẫn giữ.');
      } else {
        story.id = storyIdFor({ ...story, title: story.title }, taken);
        await saveStory(app.db, story);
        toast(`Đã lưu thành truyện mới (id: ${story.id}).`);
      }
    }
    area.value = '';
    result.replaceChildren();
    checked = null;
    refresh();
  };

  const file = h('input', { type: 'file', accept: '.json,application/json,text/plain' });
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    area.value = await f.text();
    check();
  });
  return section('✨ Tạo truyện bằng AI',
    h('p.field-hint', { text: 'Chọn nguồn (nhóm âm bé đã học, hoặc một bài Theo sách) → chép prompt → dán vào ChatGPT / Gemini → dán JSON AI trả về vào ô dưới → Kiểm tra → xem lại → Lưu. Rồi bấm 🖼️ Ảnh ở truyện để vẽ tranh.' }),
    field('Nguồn', sourceSel, 'Mặc định: nhóm âm bé đã học xong.'),
    field('Ý tưởng (tùy chọn)', ideaIn),
    field('Số trang', pagesSel),
    h('div.lesson-actions', {}, copyBtn),
    area,
    h('div.lesson-actions', {},
      h('button.btn.primary', { type: 'button', text: 'Kiểm tra', onclick: check }),
      h('label.btn', {}, '📄 Chọn file…', file)),
    result);
}

// ---------- 🖼️ Ảnh của truyện (8.4) ----------

export function storyImagesView(app, { storyId }) {
  const body = parentLayout(app, { title: '🖼️ Ảnh của truyện', back: () => goParent(app, 'stories') });
  const urls = [];
  const url = (blob) => {
    const u = URL.createObjectURL(blob);
    urls.push(u);
    return u;
  };
  (async () => {
    const story = await getStory(app.db, storyId);
    if (!story) return goParent(app, 'stories');
    const shape = storyGridShape(story.pages.length);
    const pagesBox = h('div.story-page-list');
    const previewBox = h('div.grid-preview.story-grid-preview');
    const gridTools = h('div.lesson-actions');
    let images = new Map();

    const refresh = async () => {
      images = await lessonImages(app.db, story.id);
      const grid = images.get(STORY_GRID);
      gridTools.replaceChildren(
        grid ? h('button.btn', { type: 'button', text: '⬇️ Tải ảnh lưới', onclick: () => download(mediaBlob(grid), `${story.id}-luoi.jpg`) }) : null,
        grid ? h('button.btn.danger', {
          type: 'button', text: '🗑️ Xóa ảnh lưới gốc',
          onclick: async () => {
            if (!await confirmDialog('Xóa ảnh lưới gốc? Ảnh các trang vẫn giữ.', { okText: 'Xóa', danger: true })) return;
            await removeGridImage(app.db, story.id);
            refresh();
          },
        }) : null);
      pagesBox.replaceChildren(...story.pages.map((p, i) => pageRow(p, i)));
    };

    /** Một trang: ảnh hiện tại + 📷 ảnh lẻ (so sánh cũ / mới) + 🔁 prompt vẽ lại + ✕. */
    function pageRow(p, i) {
      const rec = images.get(p.id);
      const blob = rec ? mediaBlob(rec) : null;
      const pic = blob ? h('img.picture-thumb', { src: url(blob), alt: `Trang ${i + 1}` }) : h('span.picture-thumb.emoji', { text: p.emoji ?? story.cover ?? '📖' });
      const compare = h('div.story-compare');
      const input = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-label': `Ảnh trang ${i + 1}` });
      input.addEventListener('change', async () => {
        const f = input.files?.[0];
        input.value = '';
        if (!f) return;
        let img;
        try {
          img = await resizeImage(f);
        } catch (err) {
          return toast(imageErrorMessage(err), 4000);
        }
        const use = async () => {
          await setPageImage(app.db, story.id, p.id, img);
          toast(`Đã thay ảnh trang ${i + 1}.`);
          refresh();
        };
        if (!blob) return use();
        // Trang đã có ảnh: hiện ảnh cũ và ảnh mới cạnh nhau, chỉ thay khi bố mẹ xác nhận (8.4).
        compare.replaceChildren(
          h('div.story-compare-pics', {},
            h('figure', {}, h('img', { src: url(blob), alt: 'Ảnh cũ' }), h('figcaption', { text: 'Ảnh cũ' })),
            h('figure', {}, h('img', { src: url(img.blob), alt: 'Ảnh mới' }), h('figcaption', { text: 'Ảnh mới' }))),
          h('div.lesson-actions', {},
            h('button.btn.primary', { type: 'button', text: '✓ Dùng ảnh mới', onclick: use }),
            h('button.btn', { type: 'button', text: 'Giữ ảnh cũ', onclick: () => compare.replaceChildren() })));
      });
      const redraw = h('button.btn.small', {
        type: 'button', text: '🔁 Prompt vẽ lại trang này', 'aria-label': `Prompt vẽ lại trang ${i + 1}`,
        onclick: async () => {
          const text = storyRedrawPrompt(story, p, { ratio: ratioLabel(rec?.width, rec?.height), hasGrid: images.has(STORY_GRID) });
          toast(await copyText(text)
            ? `Đã chép. Gửi prompt KÈM ${images.has(STORY_GRID) ? 'ảnh lưới (⬇️ Tải ảnh lưới)' : 'ảnh một trang khác đẹp nhất'} cho ChatGPT / Gemini, rồi bấm 📷 ở trang ${i + 1}.`
            : 'Không chép được — hãy thử lại.', 5000);
        },
      });
      return h('div.picture-row.story-page-row', { dataset: { page: p.id } }, pic,
        h('div.lesson-info', {}, h('strong', { text: `Trang ${i + 1}` }), h('div.field-hint', { text: p.sentences.map((s) => s.en).join(' ') }),
          rec ? h('div.field-hint', { text: rec.source === 'grid' ? `ô ${rec.gridCell + 1} của ảnh lưới` : 'ảnh lẻ' }) : null),
        h('div.lesson-actions', {},
          h('button.btn.small', { type: 'button', text: blob ? '📷 Đổi ảnh' : '📷 Chọn ảnh', onclick: () => input.click() }),
          redraw,
          blob ? h('button.btn.small.danger', {
            type: 'button', text: '✕', 'aria-label': `Xóa ảnh trang ${i + 1}`,
            onclick: async () => {
              await removePageImage(app.db, story.id, p.id);
              refresh();
            },
          }) : null),
        input, compare);
    }

    // Ảnh lưới: chọn ảnh → kiểm tra → cắt → màn xem trước.
    const gridInput = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-label': 'Ảnh lưới của truyện' });
    gridInput.addEventListener('change', async () => {
      const f = gridInput.files?.[0];
      gridInput.value = '';
      if (!f) return;
      previewBox.replaceChildren(h('p.muted', { text: 'Đang đọc ảnh…' }));
      try {
        await gridPreview(f);
      } catch (err) {
        console.error(err);
        previewBox.replaceChildren(notice('error', imageErrorMessage(err)));
      }
    });

    async function gridPreview(f) {
      const image = await loadGridImage(f, { cols: shape.cols, rows: shape.rows });
      const cellW = image.w0 / shape.cols;
      const cellH = image.h0 / shape.rows;
      if (cellW < MIN_CELL_PX || cellH < MIN_CELL_PX) {
        previewBox.replaceChildren(notice('error', 'Ảnh nhỏ quá, trang sẽ bị mờ — hãy tải ảnh gốc từ app AI.'));
        return;
      }
      const off = Math.abs(image.w0 / image.h0 - shape.ratio) / shape.ratio > 0.15;
      const tiles = await sliceGrid(image, { cols: shape.cols, rows: shape.rows });
      const grid = await resizeImage(f, GRID_MAX_PX);
      const tileUrls = tiles.map((t) => url(t.blob));
      // Bảng gán: trang → ô (mặc định ô k → trang k; ô thừa không dùng).
      const assign = new Map(story.pages.map((p, k) => [p.id, k < tiles.length ? k : null]));
      let selected = null; // { page } | { cell }
      const list = h('div.story-cells');
      const unused = h('div.story-unused');

      const render = () => {
        const usedCells = new Set([...assign.values()].filter((c) => c != null));
        list.replaceChildren(...story.pages.map((p, k) => {
          const cell = assign.get(p.id);
          const tile = cell != null
            ? h(`button.story-cell${selected?.page === p.id ? '.selected' : ''}`, { type: 'button', 'aria-label': `Ô của trang ${k + 1}`, dataset: { cell: String(cell) }, onclick: () => tapPage(p.id) },
              h('img', { src: tileUrls[cell], alt: '' }), h('span.story-cell-num', { text: String(cell + 1) }))
            : h(`button.story-cell.empty${selected?.page === p.id ? '.selected' : ''}`, { type: 'button', 'aria-label': `Ô của trang ${k + 1}`, onclick: () => tapPage(p.id) }, h('span.story-emoji', { text: p.emoji ?? '—' }));
          return h('div.story-cell-row', { dataset: { page: p.id } }, tile,
            h('div.lesson-info', {}, h('strong', { text: `Trang ${k + 1}` }), h('div.field-hint', { text: p.sentences.map((s) => s.en).join(' ') })),
            cell != null ? h('button.btn.small', {
              type: 'button', text: 'Không dùng ô này', 'aria-label': `Không dùng ô của trang ${k + 1}`,
              onclick: () => { assign.set(p.id, null); selected = null; render(); },
            }) : null);
        }));
        const free = tiles.map((_, c) => c).filter((c) => !usedCells.has(c));
        unused.replaceChildren(h('strong', { text: 'Ô chưa dùng' }), free.length ? null : h('span.field-hint', { text: ' (không có)' }),
          ...free.map((c) => h(`button.story-cell.unused${selected?.cell === c ? '.selected' : ''}`, { type: 'button', 'aria-label': `Ô chưa dùng ${c + 1}`, dataset: { cell: String(c) }, onclick: () => tapUnused(c) },
            h('img', { src: tileUrls[c], alt: '' }), h('span.story-cell-num', { text: String(c + 1) }))));
      };
      /** Chạm ô của một trang: chọn → chạm trang khác thì hoán đổi; chạm lại → bỏ chọn; đang chọn ô chưa dùng → gán. */
      const tapPage = (pageId) => {
        if (selected?.cell != null) {
          assign.set(pageId, selected.cell);
          selected = null;
        } else if (selected?.page === pageId) {
          selected = null;
        } else if (selected?.page) {
          const a = assign.get(selected.page);
          assign.set(selected.page, assign.get(pageId));
          assign.set(pageId, a);
          selected = null;
        } else {
          selected = { page: pageId };
        }
        render();
      };
      const tapUnused = (c) => {
        if (selected?.page) {
          assign.set(selected.page, c);
          selected = null;
        } else {
          selected = selected?.cell === c ? null : { cell: c };
        }
        render();
      };
      const save = async () => {
        const cells = tiles.map(() => null);
        for (const [pageId, c] of assign) if (c != null) cells[c] = pageId;
        await saveGridImages(app.db, story.id, { grid, cols: shape.cols, rows: shape.rows, cells, tiles });
        toast('Đã lưu ảnh của truyện.');
        previewBox.replaceChildren();
        refresh();
      };
      previewBox.replaceChildren(
        off ? notice('warn', 'Ảnh không đúng khổ, có thể bị cắt lệch — xem kỹ từng ô.') : null,
        notice('info', 'Kiểm tra từng trang: chạm ô của một trang rồi chạm ô của trang khác để đổi chỗ; "Không dùng ô này" khi ô vẽ sai — trang đó hiện emoji. Chạm một ô chưa dùng rồi chạm một trang để gán lại.'),
        h('img.story-grid-thumb', { src: url(grid.blob), alt: 'Ảnh lưới' }),
        list, unused,
        h('div.lesson-actions', {},
          h('button.btn.primary', { type: 'button', text: '💾 Lưu ảnh', onclick: save }),
          h('button.btn', { type: 'button', text: 'Hủy', onclick: () => previewBox.replaceChildren() })));
      render();
    }

    body.append(
      h('p.muted', { text: `${story.title}${story.titleVi ? ` — ${story.titleVi}` : ''}` }),
      section(`Ảnh lưới — 1 ảnh cho ${story.pages.length} trang (${shape.cols} × ${shape.rows} ô, khổ ${shape.aspect})`,
        h('p.field-hint', { text: 'AI vẽ cả truyện trong MỘT ảnh nên nhân vật giống nhau ở mọi trang. Bấm "Chép prompt", dán vào ChatGPT / Gemini (chọn khổ ảnh như trên), lưu ảnh về máy, rồi "Chọn ảnh lưới" — app cắt từng ô, bố mẹ kiểm tra rồi lưu.' }),
        h('p.field-hint', { text: `Nét vẽ chung: ${STORY_ART_STYLE}` }),
        h('div.lesson-actions', {},
          h('button.btn', {
            type: 'button', text: '📋 Chép prompt ảnh lưới',
            onclick: async () => toast(await copyText(storyGridPrompt(story)) ? 'Đã chép prompt ảnh lưới.' : 'Không chép được — hãy thử lại.'),
          }),
          h('button.btn.primary', { type: 'button', text: '🖼️ Chọn ảnh lưới', onclick: () => gridInput.click() })),
        gridInput, previewBox, gridTools),
      section('Ảnh từng trang', h('p.field-hint', { text: 'Trang chưa có ảnh thì bé thấy emoji. Chỉ một trang bị lệch → "🔁 Prompt vẽ lại trang này".' }), pagesBox));
    await refresh();
  })().catch((err) => {
    console.error(err);
    toast('Không mở được ảnh của truyện.');
  });
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}

function download(blob, filename) {
  const u = URL.createObjectURL(blob);
  const a = h('a', { href: u, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

