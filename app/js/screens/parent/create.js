// Góc bố mẹ → Bài học → ✨ Tạo bài theo sách (SPEC 5.1, 5.7): 2 bước dùng AI bên ngoài (ChatGPT / Claude / Gemini…).
// Bước 1: prompt lấy danh sách từ + mẫu câu từ ảnh trang sách → bố mẹ dán vào ô, xem và sửa.
// Bước 2: prompt tạo gói bài JSON → bố mẹ dán kết quả vào ô "Nhập bài (JSON)" ngay bên dưới (kiểm tra + lưu như mọi bài).
// Nháp lưu vào cài đặt (`bookDraft`) sau mỗi lần gõ: chuyển sang app AI rồi quay lại (iOS có thể tải lại app) không mất chữ.
// SPEC 5.8: 🎯 Tạo bài theo chủ đề (`topicPanel`) — chọn chủ đề, AI tự chọn từ (không lặp từ đã học); nháp `topicDraft`.

import { h, toast, copyText } from '../../ui.js';
import {
  BOOKS, wordListPrompt, lessonPrompt, bookLessonId, LESSON_TOPICS, TOPIC_WORD_COUNTS, topicLessonId, topicAvoidWords, topicLessonPrompt,
} from '../../lesson-prompts.js';
import { section, field } from './common.js';

const OTHER = '__other__';

export function createPanel(app, { focusImport }) {
  const draft = { book: app.settings.bookName || BOOKS[0], unit: '', unitTitle: '', words: '', patterns: '', group: 3, ...(app.settings.bookDraft ?? {}) };
  let saveTimer = null;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => app.setSetting('bookDraft', { ...draft }).catch(() => {}), 300);
  };

  const known = BOOKS.includes(draft.book);
  const bookSel = h('select', { 'aria-label': 'Bộ sách' },
    ...BOOKS.map((b) => h('option', { value: b, text: b, selected: b === draft.book })),
    h('option', { value: OTHER, text: 'Sách khác…', selected: !known }));
  const bookOther = h('input', { type: 'text', value: known ? '' : draft.book, placeholder: 'Tên bộ sách', 'aria-label': 'Tên bộ sách khác', hidden: known });
  const syncBook = () => {
    bookOther.hidden = bookSel.value !== OTHER;
    draft.book = bookSel.value === OTHER ? bookOther.value.trim() : bookSel.value;
    idHint.textContent = `id bài: ${bookLessonId(draft.book, draft.unit)}`;
    save();
    if (draft.book) app.setSetting('bookName', draft.book).catch(() => {});
  };
  const input = (key, attrs) => {
    const el = h(attrs.rows ? 'textarea' : 'input', { ...attrs, value: draft[key] ?? '' });
    if (attrs.rows) el.value = draft[key] ?? '';
    el.addEventListener('input', () => {
      draft[key] = el.value;
      if (key === 'unit') idHint.textContent = `id bài: ${bookLessonId(draft.book, draft.unit)}`;
      save();
    });
    return el;
  };
  const unit = input('unit', { type: 'text', placeholder: 'Ví dụ: Unit 3', 'aria-label': 'Unit' });
  const unitTitle = input('unitTitle', { type: 'text', placeholder: 'Ví dụ: At the zoo (không bắt buộc)', 'aria-label': 'Tên Unit' });
  const words = input('words', { rows: 7, class: 'lesson-json', placeholder: 'Mỗi dòng một từ: từ tiếng Anh - nghĩa tiếng Việt\nVí dụ:\ncat - con mèo\ndog - con chó', 'aria-label': 'Danh sách từ' });
  const patterns = input('patterns', { rows: 3, class: 'lesson-json', placeholder: 'Mẫu câu (không bắt buộc), ví dụ:\nWhat is it? It is a cat.', 'aria-label': 'Mẫu câu' });
  const groupSel = h('select', { 'aria-label': 'Nhóm âm đã học' }, ...[1, 2, 3, 4, 5, 6, 7].map((g) => h('option', { value: String(g), text: `Nhóm ${g}`, selected: g === Number(draft.group) })));
  groupSel.addEventListener('change', () => {
    draft.group = Number(groupSel.value);
    save();
  });
  const idHint = h('span.field-hint', { text: `id bài: ${bookLessonId(draft.book, draft.unit)}` });
  bookSel.addEventListener('change', syncBook);
  bookOther.addEventListener('input', syncBook);

  // Copy phải gọi NGAY trong lúc chạm (trước mọi await) — Safari iOS chặn nếu đã qua một bước chờ.
  const copy1 = h('button.btn', {
    type: 'button',
    text: '📋 Chép prompt 1 (lấy từ từ ảnh)',
    onclick: () => {
      copyText(wordListPrompt(draft)).then((ok) => toast(ok ? 'Đã chép prompt 1. Dán vào AI kèm ảnh trang sách, rồi dán kết quả vào ô Danh sách từ.' : 'Không chép được — hãy thử lại.', 4500));
    },
  });
  const copy2 = h('button.btn.primary', {
    type: 'button',
    text: '📋 Chép prompt 2 (tạo bài)',
    onclick: () => {
      const missing = [!draft.book && 'tên sách', !draft.unit.trim() && 'Unit', !draft.words.trim() && 'danh sách từ'].filter(Boolean);
      if (missing.length) {
        toast(`Còn thiếu: ${missing.join(', ')}.`, 3500);
        return;
      }
      copyText(lessonPrompt({ ...draft, group: Number(draft.group) })).then((ok) => {
        toast(ok ? 'Đã chép prompt 2. Dán vào AI, rồi dán kết quả vào ô "Nhập bài (JSON)" bên dưới.' : 'Không chép được — hãy thử lại.', 5000);
        if (ok) focusImport();
      });
    },
  });

  return section('✨ Tạo bài theo sách (dùng AI)',
    h('p.field-hint', { text: 'App không chép nội dung sách: bố mẹ đưa danh sách từ của Unit, AI soạn bài từ đúng các từ đó. Dùng ChatGPT, Claude hay Gemini đều được.' }),
    field('Bộ sách', h('div.lesson-actions', {}, bookSel, bookOther)),
    field('Unit', unit, null),
    field('Tên Unit', unitTitle),
    idHint,
    h('h3.step', { text: 'Bước 1 — Danh sách từ' }),
    h('p.field-hint', { text: 'Gõ danh sách từ, hoặc chụp trang từ vựng của Unit: bấm "Chép prompt 1", dán vào AI kèm ảnh, rồi dán kết quả vào đây. Xem lại và sửa cho đúng sách.' }),
    copy1,
    field('Danh sách từ', words),
    field('Mẫu câu', patterns),
    field('Bé đã học Phonics tới', groupSel, 'Để AI biết bé đã học những âm nào.'),
    h('h3.step', { text: 'Bước 2 — Tạo bài' }),
    h('p.field-hint', { text: 'Bấm "Chép prompt 2", dán vào AI. AI trả về một khối JSON — dán vào ô "Nhập bài (JSON)" ngay bên dưới, bấm Kiểm tra rồi Lưu bài.' }),
    copy2);
}

// ---------- 🎯 Tạo bài theo chủ đề (SPEC 5.8 — cách tạo bài của app Bông): chọn chủ đề → chép prompt → AI tự chọn từ ----------
export function topicPanel(app, { focusImport }) {
  const draft = { topic: 'Animals', topicVi: 'Con vật', count: 8, group: app.settings.bookDraft?.group ?? 3, ...(app.settings.topicDraft ?? {}) };
  // Danh sách bài để tránh từ đã học + đặt mã bài không trùng; đọc lại mỗi khi có bài được lưu / xóa (`panel.reload`),
  // vì nút chép phải chạy ngay trong lúc chạm, không kịp đọc kho.
  let lessons = [];
  const reload = () => app.db.getAll('lessons').then((list) => { lessons = list; refreshAvoid(); }).catch(() => {});
  reload();
  const save = () => app.setSetting('topicDraft', { ...draft }).catch(() => {});

  const topicInput = h('input', { type: 'text', value: draft.topic, placeholder: 'Ví dụ: Animals, My house…', 'aria-label': 'Chủ đề bài' });
  const chips = h('div.chips', {}, ...LESSON_TOPICS.map(([en, vi]) => h('button.chip', {
    type: 'button', 'aria-label': en,
    onclick: () => {
      draft.topic = topicInput.value = en;
      draft.topicVi = vi;
      save();
      refreshAvoid();
    },
  }, en, h('span.chip-vi', { text: ` · ${vi}` }))));
  topicInput.addEventListener('input', () => {
    draft.topic = topicInput.value;
    draft.topicVi = LESSON_TOPICS.find(([en]) => en.toLowerCase() === draft.topic.trim().toLowerCase())?.[1] ?? '';
    save();
    refreshAvoid();
  });
  const countSel = h('select', { 'aria-label': 'Số từ mới' }, ...TOPIC_WORD_COUNTS.map((n) => h('option', { value: String(n), text: `${n} từ`, selected: n === Number(draft.count) })));
  countSel.addEventListener('change', () => { draft.count = Number(countSel.value); save(); });
  const groupSel = h('select', { 'aria-label': 'Nhóm âm đã học (chủ đề)' }, ...[1, 2, 3, 4, 5, 6, 7].map((g) => h('option', { value: String(g), text: `Nhóm ${g}`, selected: g === Number(draft.group) })));
  groupSel.addEventListener('change', () => { draft.group = Number(groupSel.value); save(); });

  const avoidInfo = h('div.avoid-info');
  const name = () => draft.topic.trim();
  function refreshAvoid() {
    for (const chip of chips.children) chip.classList.toggle('active', chip.getAttribute('aria-label').toLowerCase() === name().toLowerCase());
    if (!name()) return avoidInfo.replaceChildren();
    const { sameTopic, others } = topicAvoidWords(lessons, name());
    avoidInfo.replaceChildren(...[
      sameTopic.length ? h('details', {}, h('summary', { text: `🚫 Không lặp ${sameTopic.length} từ của các bài "${name()}" trước — bấm để xem` }), h('p.avoid-words', { text: sameTopic.join(', ') })) : null,
      others.length ? h('details', {}, h('summary', { text: `🚫 Không lặp ${others.length} từ ở các bài khác — bấm để xem` }), h('p.avoid-words', { text: others.join(', ') })) : null,
    ].filter(Boolean));
  }
  refreshAvoid();

  // Copy phải gọi NGAY trong lúc chạm (trước mọi await) — Safari iOS chặn nếu đã qua một bước chờ.
  const copyBtn = h('button.btn.primary', {
    type: 'button', text: '📋 Chép prompt tạo bài theo chủ đề',
    onclick: () => {
      if (!name()) return toast('Chọn hoặc gõ chủ đề trước nhé.');
      const id = topicLessonId(name(), lessons.map((l) => l.id));
      // Bài thứ hai cùng chủ đề trở đi: "Animals 2", "Animals 3"… (khớp hậu tố của id).
      const n = id === topicLessonId(name()) ? '' : ` ${id.split('-').pop()}`;
      const title = `${name().charAt(0).toUpperCase()}${name().slice(1)}${n}`;
      const prompt = topicLessonPrompt({ topic: name(), topicVi: draft.topicVi, count: draft.count, group: draft.group, id, title, avoid: topicAvoidWords(lessons, name()) });
      copyText(prompt).then((ok) => {
        toast(ok ? 'Đã chép prompt. Dán vào ChatGPT / Claude / Gemini, rồi dán kết quả vào ô "Nhập bài (JSON)" bên dưới.' : 'Không chép được — hãy thử lại.', 5000);
        if (ok) focusImport();
      });
    },
  });

  const panel = section('🎯 Tạo bài theo chủ đề (dùng AI)',
    h('p.field-hint', { text: 'Không cần danh sách từ: chọn chủ đề → bấm "Chép prompt", dán vào AI. AI tự chọn từ mới (không lặp từ bé đã học) và soạn cả bài: từ, ghép âm, câu, hội thoại. Dán kết quả vào ô "Nhập bài (JSON)" bên dưới, bấm Kiểm tra rồi Lưu bài. Bài nằm ở tab 🎯 Chủ đề.' }),
    chips, field('Chủ đề', topicInput), field('Số từ mới', countSel), field('Bé đã học Phonics tới', groupSel, 'Để AI chọn một nửa số từ bé tự ghép âm được.'),
    avoidInfo, copyBtn);
  return Object.assign(panel, { reload });
}
