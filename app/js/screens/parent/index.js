// Góc bố mẹ: menu, Bài học, Cài đặt. Các trang khác (tiến độ, ghi âm, tạo bài, sao lưu) thêm dần theo SPEC.md mục 6.

import { h, toast } from '../../ui.js';
import { APP_VERSION } from '../../app.js';
import { englishVoices } from '../../speech/tts.js';
import { LIMIT_OPTIONS } from '../../session.js';
import { VI_HELP_AFTER } from '../../settings.js';
import { parentLayout, goParent, section, field } from './common.js';
import { lessonsView } from './lessons.js';
import { picturesView } from './pictures.js';
import { sceneEditView } from './scene-edit.js';
import { libraryView } from './library.js';
import { recordingsView } from './recordings.js';
import { mathView } from './math.js';

const VIEWS = {
  menu: menuView,
  settings: settingsView,
  lessons: lessonsView,
  pictures: picturesView,
  'scene-edit': sceneEditView,
  library: libraryView,
  recordings: recordingsView,
  math: mathView,
};

export function parentScreen(app, params = {}) {
  const view = VIEWS[params.view] ?? menuView;
  return view(app, params);
}

function menuView(app) {
  const body = parentLayout(app, { title: 'Góc bố mẹ' });
  const item = (emoji, text, onclick) => h('button.menu-item', { type: 'button', onclick }, h('span.menu-emoji', { text: emoji }), h('span', { text }));
  body.append(
    h('button.exit-to-child', { type: 'button', onclick: () => app.go('home') }, h('span', { text: '▶ Về màn hình của bé' })),
    h('div.menu', {},
      item('📚', 'Bài học', () => goParent(app, 'lessons')),
      item('🖼️', 'Kho ảnh', () => goParent(app, 'library')),
      item('🎙️', 'Ghi âm', () => goParent(app, 'recordings')),
      item('🔢', 'Toán (tiến độ)', () => goParent(app, 'math')),
      item('⚙️', 'Cài đặt', () => goParent(app, 'settings'))),
    h('p.muted', { text: `Phiên bản ${APP_VERSION}` }),
  );
}

function settingsView(app) {
  const body = parentLayout(app, { title: 'Cài đặt', back: () => goParent(app) });
  const s = app.settings;

  const childName = h('input', { type: 'text', value: s.childName ?? '', placeholder: 'Ví dụ: Minh', autocomplete: 'off' });
  childName.addEventListener('change', () => app.setSetting('childName', childName.value.trim()));

  const voices = englishVoices(app.speaker.voices);
  const voiceSel = h('select', {},
    h('option', { value: '', text: 'Tự chọn' }),
    ...voices.map((v) => h('option', { value: v.voiceURI, text: `${v.name} (${v.lang})`, selected: v.voiceURI === s.voiceURI })));
  // Giọng thứ hai: bạn hỏi trong khu 💬 Talk (SPEC 3.3).
  const voiceSel2 = h('select', { 'aria-label': 'Giọng thứ hai' },
    h('option', { value: '', text: 'Tự chọn (khác giọng chính)' }),
    ...voices.map((v) => h('option', { value: v.voiceURI, text: `${v.name} (${v.lang})`, selected: v.voiceURI === s.voiceURI2 })));
  const rateSel = h('select', {}, ...[0.7, 0.8, 0.9, 1].map((r) => h('option', { value: String(r), text: `${r}×`, selected: r === s.rate })));
  const applyVoice = async () => {
    await app.setSetting('voiceURI', voiceSel.value || null);
    await app.setSetting('voiceURI2', voiceSel2.value || null);
    await app.setSetting('rate', Number(rateSel.value));
    app.speaker.configure({ voiceURI: s.voiceURI, voiceURI2: s.voiceURI2, rate: s.rate });
  };
  voiceSel.addEventListener('change', applyVoice);
  voiceSel2.addEventListener('change', applyVoice);
  rateSel.addEventListener('change', applyVoice);
  const test = h('button.btn', {
    type: 'button',
    text: '🔊 Nghe thử',
    onclick: () => app.speaker.speak(`Hi! I am ${s.characterName}. Let's read a story!`).catch(() => toast('Máy không đọc được.')),
  });
  const test2 = h('button.btn', {
    type: 'button',
    text: '🔊 Nghe thử giọng thứ hai',
    onclick: () => app.speaker.speak("Hi! I'm Mimi. What's your name?", { role: 'alt' }).catch(() => toast('Máy không đọc được.')),
  });

  const limitSel = h('select', {}, ...LIMIT_OPTIONS.map((m) => h('option', {
    value: m == null ? '' : String(m),
    text: m == null ? 'Không giới hạn' : `${m} phút`,
    selected: m === s.limitMinutes,
  })));
  limitSel.addEventListener('change', () => app.setSetting('limitMinutes', limitSel.value ? Number(limitSel.value) : null));

  const recog = h('input', { type: 'checkbox', checked: s.useRecognition });
  recog.addEventListener('change', async () => {
    await app.setSetting('useRecognition', recog.checked);
    app.recognizer.setAllowed(recog.checked);
  });

  const viHelp = h('input', { type: 'checkbox', checked: s.explainVietnamese });
  viHelp.addEventListener('change', () => app.setSetting('explainVietnamese', viHelp.checked));
  const check = (key, label) => {
    const box = h('input', { type: 'checkbox', checked: s[key] !== false && Boolean(s[key] ?? true) });
    box.addEventListener('change', () => app.setSetting(key, box.checked));
    return h('label.check', {}, box, h('span', { text: ` ${label}` }));
  };
  const showVi = check('showVi', 'Hiện dòng tiếng Việt dưới câu (đọc câu, truyện, tả tranh)');
  const readVi = h('input', { type: 'checkbox', checked: Boolean(s.readVietnamese) });
  readVi.addEventListener('change', () => app.setSetting('readVietnamese', readVi.checked));
  const viNote = app.speaker.hasVietnamese ? null : h('p.field-hint', { text: 'Máy chưa có giọng tiếng Việt: Olly sẽ hiện lời giải thích bằng chữ.' });

  body.append(
    section('👧 Bé', field('Tên bé (Olly gọi tên khi chào)', childName, 'Khu Nói chuyện cần tên bé cho câu "My name is …"; chưa có tên thì bỏ qua câu đó.')),
    section('🇻🇳 Giải thích tiếng Việt',
      h('label.check', {}, viHelp, h('span', { text: ` Bé sai ${VI_HELP_AFTER} lần liên tiếp thì Olly giải thích bằng tiếng Việt` })),
      showVi,
      h('label.check', {}, readVi, h('span', { text: ' Olly đọc thêm câu tiếng Việt thành tiếng' })),
      check('sceneAutoNext', 'Tả tranh: tự chạy sang câu sau (tắt = bé tự bấm ⏭)'),
      viNote),
    section('🔊 Giọng đọc', field('Giọng tiếng Anh', voiceSel), field('Tốc độ đọc', rateSel), test,
      field('Giọng thứ hai (bạn nói chuyện với bé ở khu Nói chuyện)', voiceSel2, 'Máy chỉ có một giọng tiếng Anh thì bạn ấy nói cao giọng hơn.'), test2),
    section('🔢 Toán', check('mathAllLevels', 'Mở mọi mức của khu Toán (bé chọn được cả mức chưa mở)')),
    section('⏱️ Thời gian', field('Mỗi buổi học', limitSel, 'Hết giờ Olly đi ngủ; bố mẹ nhấn giữ 🌙 3 giây để cho học thêm 15 phút.')),
    section('🎤 Nhận dạng giọng nói', h('label.check', {}, recog, h('span', { text: ' Dùng nhận dạng giọng nói khi bé đọc / nói' })),
      check('recordVoice', 'Ghi âm câu bé nói ở khu Nói chuyện (bố mẹ nghe lại ở 🎙️ Ghi âm; chỉ lưu trên máy này)')),
  );
}
