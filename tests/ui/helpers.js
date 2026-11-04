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
    if (!recognition) {
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
