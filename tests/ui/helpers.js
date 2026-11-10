// Giả lập giọng đọc (máy test không có giọng) và tùy chọn tắt nhận dạng / mic. Lấy từ kid-english/tests/ui/helpers.js.

export async function fakeSpeech(page, { recognition = false, mic = true } = {}) {
  await page.addInitScript(({ recognition, mic }) => {
    window.__spoken = [];
    class FakeUtterance {
      constructor(text) {
        this.text = text;
      }
    }
    window.SpeechSynthesisUtterance = FakeUtterance;
    const voices = [
      { name: 'Test English', lang: 'en-US', voiceURI: 'test-en', localService: true },
      { name: 'Test Vietnamese', lang: 'vi-VN', voiceURI: 'test-vi', localService: true },
    ];
    const synth = {
      speaking: false,
      getVoices: () => voices,
      speak(u) {
        if (u.text.trim()) window.__spoken.push(u.text);
        setTimeout(() => u.onend?.(), 5);
      },
      cancel() {},
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    if (recognition === 'fake') {
      // Nhận dạng + mic giả theo kịch bản: mỗi lần app nghe lấy một mục trong window.__heardQueue
      // ({ text: 'chữ máy nghe ra' } | { voice: true } = có tiếng, không ra chữ); hết hàng đợi = bé im lặng.
      window.__heardQueue = [];
      window.__micLevel = 0;
      AnalyserNode.prototype.getFloatTimeDomainData = function fill(buf) {
        buf.fill(window.__micLevel);
      };
      // Ở ?fast mỗi lần nghe chỉ vài chục ms → MediaRecorder thật trả bản rỗng: dùng bản ghi giả 2 KB.
      window.MediaRecorder = class FakeMediaRecorder {
        static isTypeSupported(t) { return t === 'audio/mp4'; }
        constructor() { this.state = 'inactive'; this.mimeType = 'audio/mp4'; }
        start() { this.state = 'recording'; }
        stop() {
          this.state = 'inactive';
          this.ondataavailable?.({ data: new Blob([new Uint8Array(2048)], { type: 'audio/mp4' }) });
          setTimeout(() => this.onstop?.(), 1);
        }
      };
      class FakeRecognition {
        start() {
          setTimeout(() => this.onstart?.(), 5);
          if (!this.onresult) return; // tự kiểm tra đầu buổi
          // Mục có `turn`: chỉ dùng khi màn Talk đang ở đúng lượt đó (không thì coi như im lặng, giữ lại mục).
          const head = window.__heardQueue[0];
          const turn = document.querySelector('.talk')?.dataset.turn;
          const e = head && (!head.turn || head.turn === turn) ? window.__heardQueue.shift() : {};
          if (e.text || e.voice) {
            window.__micLevel = 0.3;
            setTimeout(() => { window.__micLevel = 0; }, 60);
          }
          if (e.text) setTimeout(() => this.onresult?.({ resultIndex: 0, results: [[{ transcript: e.text }]] }), 15);
        }
        stop() { setTimeout(() => this.onend?.(), 5); }
        abort() { this.stop(); }
      }
      window.SpeechRecognition = FakeRecognition;
      delete window.webkitSpeechRecognition;
    } else if (!recognition) {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    }
    if (!mic) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: () => Promise.reject(new DOMException('Không cho phép', 'NotAllowedError')) },
        configurable: true,
      });
    }
  }, { recognition, mic });
}

export const spoken = (page) => page.evaluate(() => window.__spoken.slice());

/** Mở app ở chế độ chạy nhanh, không service worker, bấm "Bắt đầu". */
export async function startApp(page) {
  await page.goto('/?fast&nosw');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Tập đọc' }).waitFor();
}

/** Nhấn giữ một nút (⚙️ 3 giây…). */
export async function hold(page, locator, ms = 3200) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

export async function openParent(page) {
  await hold(page, page.getByRole('button', { name: /Góc bố mẹ/ }));
  await page.getByRole('heading', { name: 'Góc bố mẹ' }).waitFor();
}
