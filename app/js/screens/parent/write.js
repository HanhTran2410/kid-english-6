// Góc bố mẹ → ✍️ Tập viết (SPEC-write.md 9.3, 9.4, 12.3): lưới 26 chữ (sao, số lượt), chữ hay sai kèm câu gợi ý
// cách nhắc bé; "Ghi nét thử" — mỗi nét bé
// viết lưu kèm kết quả máy chấm, bố mẹ đánh dấu "máy chấm sai" rồi xuất JSON để chỉnh ngưỡng WRITE_LEVELS.

import { h, toast, confirmDialog, formatDateTime } from '../../ui.js';
import { parentLayout, goParent, section } from './common.js';
import { getItem, getLessonProgress } from '../../progress.js';
import { LETTER_ORDER } from '../../write/letters.js';
import { pathD } from '../../write/stroke.js';
import { letterBox } from '../../write/pad.js';
import { letterRef, letterLessonId } from '../write.js';
import { letterTip } from '../../write/words.js';

const TIPS_MAX = 6;
const TIP_MIN = 2; // sai ít nhất 2 lần mới gợi ý

const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);
const REASON_VI = { start: 'bắt đầu sai chỗ', reverse: 'đi ngược chiều', stray: 'đi lệch / chưa hết nét', dot: 'kéo nét thay vì chấm', tap: 'chạm (bỏ qua)' };
const NS = 'http://www.w3.org/2000/svg';

/** Hình nhỏ một nét thử: chữ mẫu mờ + nét bé. */
function trialSvg(trial) {
  const box = letterBox(trial.letter);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
  svg.classList.add('wr-trial-svg');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', pathD(trial.points.map(([x, y]) => ({ x, y }))));
  path.classList.add(trial.ok ? 'ok' : 'bad');
  for (const y of [0, 50, 100, 150]) {
    const line = document.createElementNS(NS, 'line');
    Object.entries({ x1: box.x, x2: box.x + box.w, y1: y, y2: y }).forEach(([k, v]) => line.setAttribute(k, String(v)));
    svg.append(line);
  }
  svg.append(path);
  return svg;
}

export function writeView(app) {
  const body = parentLayout(app, { title: '✍️ Tập viết', back: () => goParent(app) });
  body.append(h('p.muted', { text: 'Bé tập viết ở khu ✏️ Spell → tab ✍️ Tập viết. Độ dễ chấm nét và Ưu tiên bút: Cài đặt → ✍️ Tập viết.' }));
  const grid = h('div.wr-parent-grid');
  const tips = h('ul.wr-parent-tips');
  body.append(section('Tiến độ chữ', grid), section('Chữ hay sai', tips));
  (async () => {
    const found = [];
    for (const l of LETTER_ORDER) {
      const [rec, lesson] = await Promise.all([getItem(app.db, letterRef(l)), getLessonProgress(app.db, letterLessonId(l))]);
      grid.append(h(`div.wr-parent-cell${rec.seen ? '' : '.unseen'}`, { dataset: { letter: l }, title: `${rec.independent}/${rec.seen} lượt tự viết đúng` },
        h('b.wr-parent-letter', { text: l }),
        h('span', { text: starText(lesson.bestStars) }),
        h('span.muted', { text: `${rec.seen} lượt` })));
      const tip = letterTip(l, rec.reasons);
      if (tip && tip.count >= TIP_MIN) found.push({ l, ...tip });
    }
    found.sort((a, b) => b.count - a.count);
    tips.replaceChildren(...(found.length
      ? found.slice(0, TIPS_MAX).map((x) => h('li', { dataset: { letter: x.l } }, h('b', { text: `${x.l} ` }), x.text, h('span.muted', { text: ` (${REASON_VI[x.reason]} ${x.count} lần)` })))
      : [h('p.muted', { text: 'Chưa có chữ nào bé hay sai.' })]));
  })().catch((err) => console.error(err));

  const rec = h('input', { type: 'checkbox', checked: Boolean(app.settings.writeRecord) });
  rec.addEventListener('change', () => app.setSetting('writeRecord', rec.checked));
  const list = h('div.wr-trials');
  const renderTrials = () => {
    const trials = app.settings.writeTrials ?? [];
    list.replaceChildren(...(trials.length ? [...trials].reverse().map((tr) => {
      const box = h('input', { type: 'checkbox', checked: Boolean(tr.wrongMark) });
      box.addEventListener('change', () => {
        tr.wrongMark = box.checked;
        app.setSetting('writeTrials', trials);
      });
      return h('div.wr-trial', {},
        trialSvg(tr),
        h('div.wr-trial-info', {},
          h('span', { text: `${tr.letter} · nét ${tr.stroke + 1} · lượt ${tr.turn} · ${formatDateTime(tr.at)}` }),
          h('span', { text: tr.ok ? '✅ máy chấm đúng' : `❌ ${REASON_VI[tr.reason] ?? tr.reason}` }),
          h('label.check', {}, box, h('span', { text: ' Máy chấm sai' }))));
    }) : [h('p.muted', { text: 'Chưa có nét thử nào.' })]));
  };
  renderTrials();
  const exportBtn = h('button.btn', {
    type: 'button', text: '⬇️ Xuất JSON',
    onclick: () => {
      const blob = new Blob([JSON.stringify({ app: 'olly-write-trials', exportedAt: Date.now(), trials: app.settings.writeTrials ?? [] }, null, 1)], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `olly-net-thu-${new Date().toISOString().slice(0, 10)}.json` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
  });
  const clearBtn = h('button.btn', {
    type: 'button', text: '🗑️ Xóa nét thử',
    onclick: async () => {
      if (!(await confirmDialog('Xóa hết nét thử đã ghi?', { okText: 'Xóa', danger: true }))) return;
      await app.setSetting('writeTrials', []);
      renderTrials();
      toast('Đã xóa nét thử.');
    },
  });
  body.append(section('Ghi nét thử',
    h('label.check', {}, rec, h('span', { text: ' Ghi lại mỗi nét bé viết (chữ, số nét, kết quả máy chấm, các điểm)' })),
    h('p.field-hint', { text: 'Đánh dấu "Máy chấm sai" ở nét mà mắt bố mẹ thấy máy chấm chưa đúng, rồi Xuất JSON gửi để chỉnh ngưỡng chấm.' }),
    h('div.lesson-actions', {}, exportBtn, clearBtn),
    list));
}
