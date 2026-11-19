// Góc bố mẹ → 💾 Sao lưu / Khôi phục (SPEC 6.2, chép cách làm của kid-english). Sao lưu làm 2 bước để iOS cho mở bảng
// Chia sẻ (lưu vào Tệp / iCloud). Khôi phục: kiểm tra toàn bộ file trước, gộp hoặc thay toàn bộ (hỏi lại 2 lần).
// Cùng trang: 🗑️ Xóa toàn bộ dữ liệu học (tiến độ + ghi âm, hỏi lại 2 bước).

import { h, toast, confirmDialog, formatBytes, formatDateTime } from '../../ui.js';
import { createBackup, readBackup, applyBackup, estimateBackupSize, clearLearningData, BackupError } from '../../backup.js';
import { loadSettings } from '../../settings.js';
import { APP_VERSION } from '../../app.js';
import { parentLayout, goParent, section, notice } from './common.js';

/** Lưu file: mở bảng Chia sẻ (iOS) nếu được, không thì tải về. @returns {Promise<boolean>} đã lưu (không bấm hủy) */
export async function saveFile(blob, filename) {
  const file = new File([blob], filename, { type: blob.type || 'application/zip' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false; // bố mẹ bấm hủy
    }
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

export function backupView(app) {
  const body = parentLayout(app, { title: '💾 Sao lưu / Khôi phục', back: () => goParent(app) });

  // ----- Sao lưu -----
  const withRec = h('input', { type: 'checkbox', checked: true, 'aria-label': 'Kèm ghi âm' });
  const estimate = h('span.muted');
  const updateEstimate = async () => {
    estimate.textContent = ' (đang tính…)';
    estimate.textContent = ` — khoảng ${formatBytes(await estimateBackupSize(app.db, { includeRecordings: withRec.checked }))}`;
  };
  withRec.addEventListener('change', () => updateEstimate().catch(() => {}));
  updateEstimate().catch(() => {});
  const status = h('p.muted.backup-status');
  const saveBtn = h('button.btn.primary', { type: 'button', text: '2. Lưu file', hidden: true });
  let made = null;
  const makeBtn = h('button.btn', {
    type: 'button', text: '1. Tạo bản sao lưu',
    onclick: async () => {
      makeBtn.disabled = true;
      status.textContent = 'Đang tạo file…';
      try {
        made = await createBackup(app.db, { includeRecordings: withRec.checked, appVersion: APP_VERSION });
        const c = made.counts;
        status.textContent = `Đã tạo ${made.filename} (${formatBytes(made.blob.size)}): ${c.lessons} bài, ${c.scenes} tranh, ${c.stories} truyện, ${c.images} ảnh, ${c.recordings} ghi âm. Bấm "Lưu file" để lưu vào Tệp / iCloud.`;
        saveBtn.hidden = false;
      } catch (err) {
        console.error(err);
        status.textContent = 'Không tạo được bản sao lưu. Hãy thử bỏ chọn "Kèm ghi âm".';
      } finally {
        makeBtn.disabled = false;
      }
    },
  });
  saveBtn.addEventListener('click', async () => {
    if (!made) return;
    if (await saveFile(made.blob, made.filename)) {
      await app.setSetting('lastBackupAt', Date.now());
      lastLine.textContent = `Lần sao lưu gần nhất: ${formatDateTime(app.settings.lastBackupAt)}`;
      toast('Đã sao lưu.');
    }
  });
  const lastLine = h('p', { text: app.settings.lastBackupAt ? `Lần sao lưu gần nhất: ${formatDateTime(app.settings.lastBackupAt)}` : 'Chưa sao lưu lần nào.' });

  // ----- Khôi phục -----
  const fileInput = h('input', { type: 'file', accept: '.zip,application/zip', 'aria-label': 'File sao lưu' });
  const restoreBox = h('div.restore-box');
  fileInput.addEventListener('change', async () => {
    restoreBox.replaceChildren();
    const file = fileInput.files?.[0];
    if (!file) return;
    let payload;
    try {
      payload = await readBackup(file);
    } catch (err) {
      restoreBox.append(notice('error', err instanceof BackupError ? err.message : 'Không đọc được file sao lưu.'));
      return;
    }
    const apply = async (mode) => {
      if (mode === 'replace') {
        if (!await confirmDialog('Thay thế TOÀN BỘ dữ liệu hiện có bằng file sao lưu?', { okText: 'Thay thế', danger: true })) return;
        if (!await confirmDialog('Chắc chắn chứ? Bài, tranh, truyện, ảnh, tiến độ, ghi âm và cài đặt hiện có sẽ mất.', { okText: 'Chắc chắn', danger: true })) return;
      }
      await applyBackup(app.db, payload, mode);
      app.settings = await loadSettings(app.db);
      app.speaker.configure({ voiceURI: app.settings.voiceURI, voiceURI2: app.settings.voiceURI2, rate: app.settings.rate });
      app.recognizer.setAllowed(app.settings.useRecognition);
      toast('Đã khôi phục.');
      goParent(app);
    };
    const m = payload.manifest;
    restoreBox.append(
      notice('info', `File ngày ${formatDateTime(m.exportedAt)}${m.appVersion ? ` (bản ${m.appVersion})` : ''}: ${payload.lessons.length} bài, ${payload.scenes.length} tranh, ${payload.stories.length} truyện, ${payload.images.length} ảnh, ${payload.recordings.length} ghi âm.`),
      h('div.lesson-actions', {},
        h('button.btn.primary', { type: 'button', text: 'Gộp với dữ liệu hiện có', onclick: () => apply('merge') }),
        h('button.btn.danger', { type: 'button', text: 'Thay thế toàn bộ', onclick: () => apply('replace') })));
  });

  // ----- Xóa toàn bộ dữ liệu học -----
  const clearBtn = h('button.btn.danger', {
    type: 'button', text: '🗑️ Xóa toàn bộ dữ liệu học',
    onclick: async () => {
      if (!await confirmDialog('Xóa toàn bộ tiến độ (sao, kết quả từng mục, ôn tricky words) và ghi âm của bé?', { okText: 'Xóa', danger: true })) return;
      if (!await confirmDialog('Chắc chắn chứ? Không lấy lại được (trừ khi có file sao lưu). Bài, tranh, truyện, ảnh và cài đặt vẫn giữ.', { okText: 'Chắc chắn xóa', danger: true })) return;
      await clearLearningData(app.db);
      toast('Đã xóa dữ liệu học.');
      updateEstimate().catch(() => {});
    },
  });

  body.append(
    section('Sao lưu',
      lastLine,
      h('p.field-hint', { text: 'Mọi dữ liệu chỉ nằm trên máy này. Xóa dữ liệu trình duyệt / gỡ app là mất hết — nên sao lưu mỗi tuần (app nhắc sau 7 ngày).' }),
      h('label.check', {}, withRec, h('span', { text: ' Kèm ghi âm' }), estimate),
      h('div.lesson-actions', {}, makeBtn, saveBtn),
      status),
    section('Khôi phục',
      h('p.field-hint', { text: 'Chọn file olly-sao-luu-….zip. App kiểm tra toàn bộ file trước rồi mới ghi — file hỏng thì dữ liệu hiện có không bị ảnh hưởng.' }),
      fileInput,
      restoreBox),
    section('Xóa dữ liệu học',
      h('p.field-hint', { text: 'Xóa tiến độ và ghi âm của bé (ví dụ khi đưa máy cho bé khác dùng). Bài, tranh, truyện, ảnh và cài đặt giữ nguyên.' }),
      clearBtn));
}
