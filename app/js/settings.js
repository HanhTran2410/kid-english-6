// Cài đặt và trạng thái nhỏ của app, lưu trong kho `settings` dạng { key, value }.

export const DEFAULT_SETTINGS = {
  characterName: 'Olly',
  childName: '', // tên bé (Olly gọi tên khi chào)
  voiceURI: null, // null = tự chọn giọng en-US
  voiceURI2: null, // giọng thứ hai (nhân vật phụ trong Nói chuyện); null = tự chọn
  rate: 0.9, // bé 6 tuổi nghe được nhanh hơn bé 3 tuổi (kid-english: 0.8)
  readVietnamese: false,
  recordVoice: true,
  useRecognition: true,
  micOnlyWhenListening: false,
  limitMinutes: 20, // null = tắt giới hạn
  firstUseAt: null,
  lastBackupAt: null,
  session: null,
};

export const BACKUP_REMIND_DAYS = 7;

export async function loadSettings(db) {
  const rows = await db.getAll('settings');
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSetting(db, key, value) {
  await db.put('settings', { key, value });
}

/** Đã quá 7 ngày kể từ lần sao lưu gần nhất (chưa sao lưu lần nào thì tính từ lần đầu dùng app). */
export function isBackupDue(settings, now = Date.now()) {
  const since = settings.lastBackupAt ?? settings.firstUseAt;
  if (since == null) return false;
  return now - since > BACKUP_REMIND_DAYS * 24 * 60 * 60 * 1000;
}
