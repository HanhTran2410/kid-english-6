# SPEC — Olly English (bé 6 tuổi) — draft1

App anh em của **kid-english** (Bông, bé 3 tuổi): cùng cách làm (PWA chạy offline trên iPad / điện thoại, dữ liệu chỉ lưu trên máy, giọng đọc + nhận dạng giọng nói của máy, Góc bố mẹ nhấn giữ 3 giây), nhưng nội dung và cách chơi cho **bé 6 tuổi** — tuổi bắt đầu đi học lớp 1, tập đọc, tập viết.

## 1. Bé 6 tuổi khác bé 3 tuổi thế nào

| | kid-english (3 tuổi) | Olly English (6 tuổi) |
|---|---|---|
| Mục tiêu | Nghe → nói lại từ / câu ngắn | **Đọc** được từ, câu, truyện ngắn; **đánh vần**, viết được từ; nói câu trọn vẹn |
| Chữ trên màn | Ít, chủ yếu hình | Chữ là trung tâm: chữ to, sáng theo nhịp đọc |
| Một lượt | 5–8 phút, nhiều hình động | 10–15 phút, có mục tiêu rõ (nhiệm vụ, sao, cấp độ) |
| Phản hồi | Luôn khen | Khen + chỉ chỗ sai cụ thể ("Listen: /sh/ — ship") |
| Tự chơi | Bố mẹ ngồi cùng | Bé tự chơi được; bố mẹ xem tiến độ |
| Nhân vật | Thỏ Bông | **Cú Olly** (đeo kính, "thích đọc sách") — tên đổi được trong Cài đặt |
| Giới hạn buổi | 15 phút | 20 phút (đổi được) |

## 2. Cấu trúc thư mục — dùng lại gì từ kid-english

Cách dùng lại: **chép phần lõi sang** (không chia sẻ code giữa hai repo) — mỗi app sửa tự do, không làm hỏng app kia. Sửa lỗi ở phần lõi của một app thì nhớ chép sang app kia nếu cần.

| File | Nguồn | Ghi chú |
|---|---|---|
| `js/speech/tts.js, microphone.js, recognition.js, recorder.js, listen.js, sfx.js` | chép nguyên | giọng đọc, giọng thứ hai, mic, nhận dạng, ghi âm, nghe bé nói, tiếng hiệu ứng |
| `js/timing.js, text.js, match.js, ui.js, session.js, image.js` | chép nguyên | chờ hủy được + `?fast`, chuẩn hóa chữ, so khớp lời bé nói, `h()` / toast / hộp thoại / nút nhấn giữ, thời gian buổi học, cắt ảnh lưới |
| `js/app.js` | chép, sửa nhỏ | điều hướng màn hình, mở khóa âm thanh iOS, giữ màn hình sáng, ra nền / quay lại; Bông → Olly |
| `js/db.js` | chép, bỏ bớt | kho: `lessons, images, recordings, progress, settings`; tiến độ theo khóa `"<loại>:<mục>"` (`read:ship`, `spell:cat`) thay vì theo từ |
| `js/settings.js` | viết lại | cài đặt riêng (tên bé, giọng, tốc độ 0.9, 20 phút) |
| `js/mascot.js, zones.js, screens/child.js, screens/parent/*` | mới | Olly, 4 khu học, màn chính, Góc bố mẹ |
| `sw.js, index.html, manifest, css/app.css` | mới (theo mẫu) | cache riêng `kid-english-6-*`, IndexedDB riêng `kid-english-6` — hai app cài cùng máy không đụng nhau |
| `scripts/serve.mjs, make-icons.mjs`, `playwright.config.js`, `tests/ui/helpers.js` | chép | chạy thử, tạo icon PNG, test giao diện |

Sẽ chép thêm khi làm tới: sao lưu / khôi phục (`backup.js` + JSZip), Nghe lại giọng bé (`parent/recordings.js`), tạo bài bằng prompt AI (`prompts.js`, `parent/create.js`), ảnh lưới (`image.js` đã có), Google Drive / GitHub (sau cùng).

## 3. Bốn khu học (màn hình chính)

Màn chính: Olly chào (gọi tên bé nếu bố mẹ đã nhập) + 4 thẻ to (2 × 2). Khu chưa làm vẫn hiện, chạm vào Olly nói *"Coming soon!"*.

### 3.1. 📖 Read / Tập đọc
- **Ghép âm (blending)**: chữ cái hiện từng âm *s – h – i – p* → bé chạm từng chữ nghe âm → kéo các chữ lại gần → đọc cả từ **ship**. Bé đọc to, app nhận dạng → đúng thì hình hiện ra.
- **Sight words** (the, is, was, said, you…): thẻ chớp; bé đọc to; ôn lại theo kiểu "từ hay sai gặp lại sớm".
- **Đọc câu**: câu 4–8 từ, từng từ sáng khi Olly đọc (karaoke, dùng lại cách tính nhịp của kid-english); rồi bé tự đọc, từ nào app nghe được thì sáng xanh.
- **Truyện ngắn** 4–6 trang (mỗi trang 1–2 câu + hình), câu hỏi hiểu bài cuối truyện (*"Where did the cat go?"* → chọn hình).
- Cấp độ theo âm: CVC (cat, dog) → âm ghép (sh, ch, th) → nguyên âm dài (cake, bike) → từ 2 âm tiết.

### 3.2. ✏️ Spell / Đánh vần và viết
- **Nghe – xếp chữ**: Olly đọc từ → bé kéo thẻ chữ vào ô (có chữ nhiễu); sai chữ nào thì ô đó rung, Olly đọc âm đúng.
- **Điền chữ thiếu**: *c _ t* + hình con mèo.
- **Tập viết chữ**: vẽ theo nét trên màn (chữ thường a–z), có mũi tên thứ tự nét, chấm điểm theo độ khớp nét.
- **Viết từ**: sau khi xếp đúng 2 lần, bé tự viết từ bằng tay (vẽ) — so khớp nét đơn giản, không cần nhận dạng chữ viết tay.

### 3.3. 💬 Talk / Nói chuyện
- Hội thoại ngắn theo chủ đề (giới thiệu bản thân, ở trường, mua đồ, hỏi đường…): Olly hỏi, bé trả lời **câu trọn vẹn** (*"I am six years old."*), có câu gợi ý mờ nếu bé im lặng.
- Nhân vật phụ dùng **giọng thứ hai** (đã có trong lõi).
- Ghi âm câu bé nói để bố mẹ nghe lại.

### 3.4. 🧩 Quest / Thử thách
- Nhiệm vụ nhiều bước dùng tiếng Anh: đọc chỉ dẫn *"Put the red ball in the box."* → làm theo trong tranh.
- Sắp xếp câu (kéo các từ thành câu đúng), đoán từ theo gợi ý, ô chữ nhỏ.
- Bản đồ phiêu lưu: mỗi nhiệm vụ xong mở một chặng; thưởng huy hiệu thay sticker.

## 4. Phản hồi và tiến độ
- Mỗi mục có tiến độ riêng (`progress`: seen / correct / streak / lastAt); ôn lại mục hay sai.
- Sao theo bài (1–3 sao), huy hiệu theo khu.
- Không có "Try again" kiểu chê: sai thì Olly chỉ chỗ sai và làm mẫu.

## 5. Bài học
- Bài có sẵn trong app (JSON) cho từng khu; bố mẹ tạo thêm bằng prompt AI như kid-english (sẽ chép `prompts.js` và sửa cho từng loại bài).
- Ảnh: dùng lại cách "ảnh lưới" của kid-english (một ảnh nhiều ô, app tự cắt).

## 6. Góc bố mẹ
- Đã có: Cài đặt (tên bé, giọng, tốc độ, thời gian buổi, nhận dạng giọng nói).
- Sẽ làm: Tiến độ (theo khu, mục hay sai), Nghe lại giọng bé, Quản lý / tạo bài, Sao lưu – khôi phục.

## 7. Thứ tự làm (đề xuất)
1. **0.1.0 — khung app** *(xong)*: Bắt đầu, màn chính 4 khu, khu "sắp có", Olly đi ngủ khi hết giờ, Góc bố mẹ → Cài đặt, service worker, test.
2. **0.2 — Read: ghép âm + sight words** (bài có sẵn CVC, sh/ch/th).
3. **0.3 — Spell: nghe – xếp chữ + điền chữ thiếu**.
4. **0.4 — Read: đọc câu + truyện ngắn**.
5. **0.5 — Talk** (chép phần nghe bé nói của kid-english).
6. **0.6 — Spell: tập viết chữ**.
7. **0.7 — Quest**.
8. Góc bố mẹ: tiến độ, ghi âm, sao lưu, tạo bài — làm xen kẽ khi các khu cần.

## 8. Kiểm tra
- `npm test`: unit (lõi, service worker đủ file, phiên bản trùng nhau, import đúng file).
- `npx playwright test`: giao diện trên Chromium cỡ iPad, `?fast` chạy nhanh, giọng đọc giả.

## 9. Câu hỏi còn mở
- Tên app / tên nhân vật cuối cùng (tạm: **Olly English**, cú Olly).
- Có cần tiếng Việt (Olly giải thích bằng tiếng Việt khi bé sai nhiều lần) không?
- Chương trình theo sách giáo khoa lớp 1 ở Việt Nam hay theo phonics quốc tế (Jolly Phonics / Oxford)?
- Deploy ở đâu (GitHub Pages như kid-english?).
