// Phát âm rời từ file (SPEC 3.1.1) qua WebAudio — KHÔNG BAO GIỜ đọc âm rời bằng giọng máy. Lấy cách làm từ
// kid-english/player/jolly-stages.js. Âm thanh bị khóa / lỗi: các phần tử [data-sound] rung thay cho âm, trả về false.
// `stage.dataset.lastSound` / `soundCount` để kiểm thử.

import { audioContext, isAudioLocked } from './sfx.js';
import { soundUrl } from '../phonics.js';

const buffers = new Map();
const PLAY_MAX_MS = 3000;

/**
 * @param {string} soundId
 * @param {{ stage: HTMLElement, signal: AbortSignal }} ctx
 * @returns {Promise<boolean>} đã phát được hay chưa
 */
export async function playPhoneme(soundId, { stage, signal }) {
  stage.dataset.lastSound = soundId;
  stage.dataset.soundCount = String(Number(stage.dataset.soundCount ?? 0) + 1);
  const lit = stage.querySelectorAll(`[data-sound="${soundId}"]`);
  lit.forEach((el) => el.classList.add('sounding'));
  try {
    const c = audioContext();
    if (!c || isAudioLocked()) throw new Error('locked');
    let buffer = buffers.get(soundId);
    if (!buffer) {
      const res = await fetch(soundUrl(soundId));
      if (!res.ok) throw new Error(String(res.status));
      buffer = await c.decodeAudioData(await res.arrayBuffer());
      buffers.set(soundId, buffer);
    }
    if (signal.aborted) return false;
    await new Promise((resolve) => {
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.connect(c.destination);
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', stop);
        resolve();
      };
      const stop = () => {
        try {
          src.stop();
        } catch {
          // đã dừng
        }
        done();
      };
      const timer = setTimeout(stop, Math.min(buffer.duration * 1000 + 80, PLAY_MAX_MS));
      signal.addEventListener('abort', stop, { once: true });
      src.onended = done;
      src.start();
    });
    return true;
  } catch {
    lit.forEach((el) => {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    });
    await new Promise((r) => setTimeout(r, 400));
    return false;
  } finally {
    lit.forEach((el) => el.classList.remove('sounding'));
  }
}
