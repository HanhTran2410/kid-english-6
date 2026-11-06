# Lõi chép từ kid-english (SPEC mục 2.2)

Các file dưới đây chép từ repo **kid-english** (app bé 3 tuổi) và **giữ gần giống bản bên đó**. Hai repo không dùng chung code, nên dễ bị lệch nhau mà không ai biết.

Test `tests/unit/core-sync.test.js` tính mã băm từng file (sha-256 của nội dung đã bỏ `\r`, lấy 12 ký tự đầu) và so với cột **Mã băm**. Sửa một file lõi thì test đỏ cho tới khi cập nhật dòng của file đó. Lúc cập nhật, ghi rõ ở cột **Ghi chú**:
- **Sửa lỗi chung** → cần chép sang kid-english: ghi "chép sang kid-english: chưa / đã (commit …)".
- **Sửa riêng cho Olly** → kid-english không cần.

Không có bản "gốc" cố định: bên nào sửa lỗi trước thì là nguồn. Đối chiếu lần cuối với kid-english ở commit `8833a4b` (2026-11-06): cả 12 file giống hệt nhau trước khi Olly bắt đầu sửa.

| File | Chép từ kid-english | Mã băm | Ghi chú |
|---|---|---|---|
| `app/js/speech/tts.js` | 8833a4b | 6af79c631062 | Giống kid-english |
| `app/js/speech/microphone.js` | 8833a4b | b07f2f34f0fa | Giống kid-english |
| `app/js/speech/recognition.js` | 8833a4b | a6c3a0918f5b | Giống kid-english |
| `app/js/speech/recorder.js` | 8833a4b | b1fbd1798e64 | Giống kid-english |
| `app/js/speech/listen.js` | 8833a4b | 6901cea11a92 | Sửa riêng cho Olly (0.1.2): thêm `OUTCOME`, `readingOutcome`, tham số `target` / `homophones` của `listen()` để chấm đọc (SPEC 4.2). Phần cũ không đổi |
| `app/js/speech/sfx.js` | 8833a4b | 44d9f9952f4d | Giống kid-english |
| `app/js/timing.js` | 8833a4b | 317aff19cb18 | Giống kid-english |
| `app/js/text.js` | 8833a4b | 453490a1a7ee | Giống kid-english |
| `app/js/match.js` | 8833a4b | 040a8ca6010d | Sửa riêng cho Olly (0.1.2): thêm `exactMatch` (so khớp chặt). Phần cũ không đổi |
| `app/js/ui.js` | 8833a4b | e52f8fb16e28 | Giống kid-english |
| `app/js/session.js` | 8833a4b | ff72c80d2166 | Sửa (0.1.2): bỏ hằng số `DEFAULT_LIMIT_MINUTES` không dùng, sửa chú thích. kid-english cũng không dùng hằng số này — có thể bỏ bên đó (chưa) |
| `app/js/image.js` | 8833a4b | 7191f7d6f28a | Giống kid-english |

Không nằm trong danh sách (đã viết lại riêng cho Olly, không cần giữ giống): `app.js`, `db.js`, `settings.js`, `mascot.js`, `zones.js`, `screens/*`, `sw.js`.
