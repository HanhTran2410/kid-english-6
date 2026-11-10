# SPEC — Khu mới "🔢 Math / Toán" cho Olly English (bé 6 tuổi)

> Phiên bản spec: **draft3** · Ngày: 2026-11-10 · Dựa trên app 0.5.0 (SPEC.md draft2)
> Trạng thái: **đã chốt 2026-11-10** (mục 11). Làm **sau khu Quest**; phần tới 100 (T6) làm ngay ở đợt đầu.
>
> Spec riêng cho bé **6 tuổi** (lớp 1). Phần so sánh bằng hình cho bé 3–5 tuổi nằm ở app kid-english (`C:\kid-english\SPEC-math.md`). Hai app **không dùng chung** bài toán.

**Draft2 sửa theo review draft1 (2026-11-10):**
- Tách rõ mục tiêu T1 (*bigger / smaller*) và T3 (ký hiệu *> < =*, *greater than…*), có bước chuyển *bigger → >* (4.1, 4.3).
- T2 đổi tên, thêm trường hợp *the same* và quy tắc hình đếm (4.2).
- Làm rõ T4 (*first / next / last*), T5 (định nghĩa từng loại câu hỏi) và T6 (mức 1 dạy khái niệm chục, chuyển sang Math-c).
- Thêm điều kiện độ khó cho câu đố T7.
- Chốt cách tính sao, thoát giữa chừng, chơi lại, mức độ (6).
- Theo quyết định đã chốt của app: **không khóa bài** (SPEC 3.1.2) và **chạm thay cho kéo** (SPEC 3.2) — draft1 có khóa bài và kéo thả, hai chỗ này sửa lại.
- Thêm cấu hình sinh câu hỏi riêng cho từng bài (7), danh sách chỗ trong code phải đổi khi thêm khu thứ 5 (2.1) và test bổ sung (10).

**Draft3 (2026-11-10)** bổ sung những điểm chung mà spec Toán của kid-english (draft3) đã có nhưng spec này còn thiếu. Sao, mức và bộ sinh riêng từng bài giữ nguyên theo draft2. Phần thêm:
- các nút ▶ / ⏭ và lúc chuyển mục, không phát chồng tiếng, khóa chạm trong lúc Olly phản hồi (3.4);
- khi bé không chạm (3.5);
- ra nền rồi quay lại thì về đúng mục (3.6), theo cách bài Tả tranh đang làm;
- cách tính kiểu câu "hay sai" từ bản ghi sẵn có (6.4);
- luật cân bằng đáp án chung cho mọi bộ sinh, test 500 lượt ngẫu nhiên (7);
- giảm chuyển động không nhấp nháy liên tục (5);
- lọc tiến độ Math ở chỗ tổng hợp tiến độ (9);
- test bổ sung (10).

## 1. Mục tiêu

- Bé học **toán lớp 1 bằng tiếng Anh**, bắt đầu từ **so sánh số**:
  - *bigger / smaller* rồi *greater than / less than / equal to*;
  - *more / fewer / the same*;
  - *first / next / last*, *before / after / between*;
  - *one more / one less*.
- Dùng đúng thế mạnh của Olly: **chữ là trung tâm**. Bé **đọc** câu so sánh (*7 > 4* → *"Seven is greater than four."*) và đọc câu đố ngắn (*"Tom has 5 apples. Anna has 3 apples. Who has more?"*).
- **Mọi so sánh số đều có hình để kiểm chứng** (cột khối, que chục, dây nối từng cặp). Bé hiểu vì sao số này lớn hơn, không học thuộc.
- Theo lộ trình **toán lớp 1 Việt Nam**: so sánh trong phạm vi 10 → 20 → 100. Dữ liệu và bộ sinh câu hỏi hỗ trợ tới 100 ngay từ đầu, T1–T5 dùng phạm vi tới 20; số tới 100 có ở T6, **làm ngay trong đợt đầu Math-a** (đã chốt 2026-11-10).
- Theo nguyên tắc chung của Olly:
  - phản hồi "chỉ chỗ sai + làm mẫu" (SPEC 4);
  - giải thích tiếng Việt sau 2 lần sai (4.1);
  - nghe bé nói không phải phán quyết (4.2);
  - 🔊 nghe lại + phụ đề (4.5);
  - sao theo % đúng (4.4).

### Ngoài phạm vi bản đầu
- *How many more?*, cộng / trừ trong phạm vi 10: giai đoạn sau Math-c (spec riêng, 11.3). *One more / one less* ở T5 chỉ là bước làm quen (nhảy 1 bước trên tia số), chưa phải phép tính.
- Đo độ dài, xem giờ, tiền.
- Bài toán theo Unit sách / tạo bằng prompt AI: bài toán là bài có sẵn trong app.

## 2. Vị trí trong app

- Màn chính thêm thẻ khu thứ 5: `{ id: 'math', emoji: '🔢', en: 'Math', vi: 'Toán', color: 'sun', intro: "Let's play with numbers!", ready: true }`.
- Lưới thẻ khu:

  | Màn hình | Hiện nay (4 khu) | Sau khi thêm (5 khu) |
  |---|---|---|
  | Màn rộng | 2 × 2 | **3 + 2** (hàng dưới căn giữa) |
  | iPhone dọc | 2 × 2 | 2 + 2 + 1 (thẻ cuối rộng cả hàng) |

  Vẫn **không phải cuộn**, cả trong trình duyệt lẫn khi mở từ màn hình chính (PWA). Thẻ không nhỏ hơn mức hiện nay ở iPhone dọc (chiều cao tối thiểu 120 px).
- Bấm **Math** → danh sách bài của khu, giống khu Read: thẻ bài, sao, dấu ⭐ "Tiếp theo" (mục 6.1).

### 2.1. Chỗ phải đổi khi thêm khu thứ 5 (kiểm tra cả luồng cũ)
| Chỗ | Việc |
|---|---|
| `zones.js` (`ZONES`) | thêm khu `math`; test màn chính đếm 5 thẻ |
| CSS `.zone-grid` | lưới 3 + 2 / 2 + 2 + 1; thêm màu `--sun` |
| `main.js` | đăng ký màn `math`, `math-lesson` |
| `screens/read.js` (`zoneListScreen`, `showDone`) | không dùng cho Math (bài Math không phải gói bài); màn danh sách bài Math viết riêng nhưng cùng kiểu thẻ |
| Góc bố mẹ → Bài học, Kho ảnh | bài Math **không** hiện ở đây (không sửa / xuất / ảnh được) |
| `progress.js` | dùng lại `recordItem`, `recordLessonDone`, `starsFor` — không đổi |
| Sao lưu / khôi phục (chưa làm) | bài Math chỉ có bản ghi tiến độ thường trong kho `progress` → sao lưu kho `progress` là đủ |
| Hết giờ buổi học (`app.timeUp`) | xong bài thì về màn ngủ như các khu khác |

## 3. Một bài diễn ra thế nào

Mỗi bài gồm 2 phần (3–5 phút, đúng SPEC 1.1).

### 3.1. A. Olly làm mẫu (2–3 lượt, cùng cấu trúc với phần bé làm)
1. Olly đọc câu hỏi (có 🔊 và phụ đề như phần bé làm).
2. Hiện số / hình của câu đó.
3. Olly làm thao tác (chạm số đúng, cá sấu ngoạm, ếch nhảy…), có hiệu ứng.
4. Olly đọc câu tiếng Anh trọn vẹn (karaoke), dòng tiếng Việt dưới nếu bật `showVi`.
5. Bé chạm số / đồ vật / câu → Olly đọc lại. Nút **▶ Đến lượt con** để sang phần B.

Làm mẫu riêng của từng bài: xem mục 4. Chơi lại bài đã có sao → phần làm mẫu rút còn 1 lượt, có nút **⏭** bỏ qua.

### 3.2. B. Bé làm (8 mục có chấm)

| Kết quả | Olly làm gì | Ghi tiến độ |
|---|---|---|
| Đúng ngay | Khen + **đọc cả câu so sánh** | `independent` |
| Sai lần 1 | **Chỉ chỗ sai:** hiện hình kiểm chứng (*"Let's check! Seven blocks… four blocks."*), mời làm lại | — |
| Đúng sau gợi ý | Khen + đọc câu | `helped` |
| Sai lần 2 | Giải thích **tiếng Việt** một lần (4.1), đáp án sáng, bé chạm đáp án, Olly đọc câu đúng | `missed` |

- Mục có chấm **không có nút bỏ qua** (như khu Read). Bé không biết thì sai 2 lần là được chỉ đáp án.
- Đáp án bé đã chọn đúng **ở lại trên màn** suốt phần đọc câu bên dưới.

### 3.3. Bé đọc câu (luyện, không tính sao)
- Sau khi chọn đúng ở **khoảng 1 trên 3 mục**, không bao giờ hai mục liền nhau. Trong 8 mục có 2 hoặc 3 mục đọc.
- Câu so sánh hiện thành chữ, **karaoke** như Đọc câu (0.4.0). Ví dụ: `7 > 4` → *Seven is greater than four.* Olly: *"Read it with me!"* rồi đọc mẫu, sau đó tới lượt bé.
- Kết quả nghe theo 4.2 (`ok / unclear / miss / unheard`), chỉ để khen / mời đọc lại.
- Không có mic hoặc không có nhận dạng → nút **✅ Con đọc xong**, ghi `practiced` (đã luyện, **không** có nghĩa là đọc đúng).
- Có nút **⏭** bỏ qua phần đọc. Phần đọc **không ảnh hưởng sao** (4.2).
- Tiến độ đọc ghi riêng: `math-t3/read/<câu>`.

### 3.4. Nút và lúc chuyển mục

| Đang ở | Nút | Làm gì |
|---|---|---|
| Làm mẫu | **▶ Đến lượt con** | Sang phần B (mục 1) |
| Làm mẫu (bài đã có sao) | **⏭** | Bỏ hết phần làm mẫu |
| Mục có chấm, chưa chốt | — | **Không có nút bỏ qua** (3.2) |
| Đã chọn đúng / đã chạm đáp án sau sai lần 2 | — | Tự sang phần đọc câu (nếu mục này có) hoặc mục sau, **1,2 giây sau khi Olly nói xong** (không hẹn giờ cố định, vì câu nói có thể dài) |
| Phần đọc câu | **⏭** | Bỏ phần đọc, sang mục sau |
| Mục 8 xong | — | Sang màn kết quả (sao) |

- Bấm nút khi Olly đang nói: **dừng câu đang nói** rồi mới làm, không phát chồng hai câu.
- **Khóa chạm trong lúc Olly phản hồi.** Từ lúc bé chọn cho tới khi Olly nói xong câu khen / câu chỉ chỗ sai, chạm vào thẻ không có tác dụng. Hai lần chạm nhanh liên tiếp chỉ tính lần đầu.
- 🔊 (nghe lại + phụ đề, SPEC 4.5) bấm được lúc nào cũng được. Nó **không** tính là gợi ý: mục vẫn có thể là `independent`.

### 3.5. Bé không chạm
- Đếm **20 giây từ khi Olly đọc xong câu hỏi**.
- Hết 20 giây: Olly nhắc lại câu hỏi **một lần**, nút 🔊 sáng viền một lần.
- Sau đó **không tự hiện đáp án và không nhắc thêm**. Bé 6 tuổi tự quyết khi nào làm; bé có thể bấm 🔊 hoặc 🏠.
- Thời gian chờ không tính sai, không đổi kết quả mục.

### 3.6. Ra nền rồi quay lại, thoát giữa chừng
- **Ra nền rồi quay lại**, khi app không bị tải lại: khóa máy, chuyển app, rồi bấm ▶ ở lớp "Bắt đầu" (`continueDirectly`). Bé về **đúng mục đang làm**.
  - Lượt chơi đang dở (8 mục đã sinh, mục đang ở, kết quả các mục đã chốt, mức đang chơi) ghi vào `app.current.params` **sau mỗi lần đổi trạng thái**. Cách này giống `scene.js` ghi `params.index`.
  - **Mục đã chốt** (đúng, hoặc đã chạm đáp án): quay lại ở **mục sau**.
  - **Mục chưa chốt:** quay lại ở **đúng mục đó**, Olly đọc lại câu hỏi. Lần sai trước khi ra nền vẫn tính, để kết quả `independent / helped` không bị "làm lại cho đẹp".
  - Đang ở phần đọc câu: quay lại đầu phần đọc của mục đó.
- **Thoát hẳn** (🏠, tải lại trang, đóng app): theo 6.3, **lượt mới từ đầu**; kết quả từng mục đã chốt vẫn ghi.

## 4. Các bài

| # | Bài | Mục tiêu (một kỹ năng chính) | Bé làm gì |
|---|---|---|---|
| T1 | **🔢 Bigger or smaller?** / Số nào lớn hơn | Nhận ra số lớn hơn / nhỏ hơn; nói *bigger / smaller* | Hai thẻ số → chạm số lớn hơn hoặc nhỏ hơn (Olly hỏi cả hai chiều). Hình kiểm chứng: hai **cột khối** |
| T2 | **🐘 Which group has more?** / Nhóm nào nhiều hơn | So sánh **số lượng** bằng cách đếm; *more / fewer / the same* | Hai nhóm đồ vật → chạm nhóm nhiều hơn / ít hơn, hoặc nút **= The same**. Bé chạm từng đồ để đếm. Kiểm chứng: **nối từng cặp bằng dây**, phần thừa sáng lên |
| T3 | **🐊 Hungry crocodile** / Cá sấu > < = | Hiểu và dùng **ký hiệu** *> < =*; đọc *greater than / less than / equal to* | Hai số + ô trống ở giữa. Bé **chạm** dấu trong khay, dấu bay vào ô (chạm dấu đã đặt thì về khay — như xếp ô ở Spell) |
| T4 | **📏 Line them up** / Xếp số | Thứ tự số; *smallest, biggest, first, next, last* | Chạm lần lượt 4 thẻ số, mỗi thẻ bay vào chỗ trống kế tiếp của hàng (mức 1–2: nhỏ → lớn; mức 3: lớn → nhỏ) |
| T5 | **🐸 Number line** / Tia số | Vị trí trên tia số; *before, after, between, one more, one less* | Tia số có chú ếch. Bé chạm số trên tia; ếch nhảy từng bước, Olly đếm bước |
| T6 | **🧱 Tens and ones** / Chục và đơn vị | Cấu tạo số hai chữ số rồi so sánh (≤ 100) | Mức 1 xếp que chục để tạo số; mức 2–3 so sánh. Hình: **que chục** (thanh 10 khối) và khối lẻ |
| T7 | **📖 Read and compare** / Đọc và so sánh | Đọc hiểu câu đố so sánh ngắn | Câu đố 2–3 câu, chữ karaoke, có hình nhân vật. Bé chạm nhân vật đúng |

### 4.1. T1 — Bigger or smaller?
- **Làm mẫu:**
  - *"Which number is bigger? Seven or four?"* → hai cột khối mọc → Olly chạm 7: *"Seven is bigger than four."*
  - Lượt 2 hỏi *smaller*, số nhỏ nằm bên **phải**.
- Cột khối: **cả hai cột cùng một quy tắc màu**. Khối 1–5 màu xanh, khối 6–10 màu cam, khối 11–20 lặp lại xanh / cam theo nhóm 5 (như khung 10 ô). Không dùng màu để đánh dấu cột lớn hơn.
- Câu đọc: *"Seven is bigger than four."* / *"Four is smaller than seven."*

### 4.2. T2 — Which group has more?
- **Mỗi nhóm một loại đồ** (5 con chuột / 3 con voi), không trộn loại trong một nhóm. Đồ vật tách rời, không chồng nhau, mỗi đồ có vùng chạm ≥ 64 px.
- **Chạm đếm:** chạm đồ nào thì đồ đó sáng + Olly đếm *"one, two, three…"*. Chạm lại đồ đã đếm thì không đếm lại.
- **Ba kiểu đáp án**, phân bố trong 8 mục: nhóm trái nhiều hơn, nhóm phải nhiều hơn, **bằng nhau** (ít nhất 1, nhiều nhất 2 mục *the same* mỗi lượt).
- Câu hỏi luân phiên: *"Which group has more?"* / *"Which group has fewer?"*. Hai nhóm bằng nhau → đáp án là nút **= The same**.
- **Kích thước gây nhiễu:** ở ít nhất một nửa số mục khác nhau, nhóm có **nhiều** đồ hơn là nhóm có đồ **nhỏ** hơn (chuột / voi, kiến / gấu…).
- **Kiểm chứng (khi sai lần 1, và luôn có sau khi chọn đúng):** dây nối **từng cặp một** (mỗi đồ bên trái với đúng một đồ bên phải, lần lượt, ~200 ms / dây). Đồ thừa sáng lên: *"Look! Two mice have no partner. There are more mice."*
- Câu đọc: *"There are more mice."* / *"There are fewer elephants."* / *"They are the same."*

### 4.3. T3 — Hungry crocodile
- **Làm mẫu, đúng thứ tự:**
  1. Nối với T1: *"Seven is bigger than four. In math, we say: seven is **greater than** four — and we write it like this!"* Hiện `7 is bigger than 4` → `7 > 4`.
  2. Kể chuyện: *"The crocodile is hungry. It always eats the bigger number!"* Cá sấu ở giữa `7 _ 4`, há mồm **về phía 7**, ngoạm, rồi mờ dần thành dấu **>**. Olly đọc **trái → phải**: *"Seven is greater than four."*
  3. Ví dụ số lớn bên **phải**: `4 _ 7` → cá sấu quay sang phải → dấu **<** → *"Four is less than seven."*
  4. Lần đầu chơi mức 2: thêm `7 _ 7` → *"They are the same. Seven is equal to seven."* → dấu **=**.
- Olly luôn nhấn mạnh **cách đọc dấu** (*greater than / less than*), không chỉ "miệng cá sấu".
- **Sai lần 1:** dấu bật về khay, Olly: *"The crocodile eats the bigger number. Which is bigger?"*, cột khối hiện ra.
- **Giải thích tiếng Việt:** *"Miệng cá sấu luôn há về phía số lớn hơn. 7 lớn hơn 4 nên miệng há về phía số 7. Đọc từ trái sang phải: 7 lớn hơn 4."*
- Trong 8 mục: số lớn bên trái và bên phải xấp xỉ bằng nhau (chênh nhiều nhất 2).

### 4.4. T4 — Line them up
- **Làm mẫu:** *"Put the smallest number first."* → Olly chạm 3 (**first**), 5 (**next**), 7 (**next**), 9 (**last**) → *"The numbers are in order: three, five, seven, nine."*
- Khi bé chạm, mỗi chỗ trống có nhãn nhỏ *first / next / next / last*. Chạm sai số → thẻ rung, về khay, Olly: *"Find the smallest number left."*. Sai lần 2 ở cùng chỗ → số đúng sáng.
- 4 số **khác nhau**, không trùng.
- Mức 3 xếp **lớn → nhỏ**: lượt đầu của mức có một lượt làm mẫu riêng: *"Now put the biggest number first."*
- Câu đọc: *"The numbers are in order: …"*. Chấm 1 mục = cả hàng: đúng hết không sai lần nào → `independent`; có sai nhưng tự sửa → `helped`; có chỗ phải xem đáp án → `missed`.

### 4.5. T5 — Number line
| Loại câu hỏi | Nghĩa | Ví dụ | Mức |
|---|---|---|---|
| *after* | số đứng **ngay sau** | *"What number comes after 7?"* → 8 | 1 |
| *before* | số đứng **ngay trước** | *"What number comes before 7?"* → 6 | 1 |
| *between* | số **nằm giữa** hai số cách nhau 2 | *"What number is between 12 and 14?"* → 13 | 2 |
| *one more / one less* | hơn / kém **một** | *"What is one more than 9?"* → 10 | 3 |

- Ếch đứng ở số được hỏi.
  - Bé chạm số trên tia → ếch nhảy **từng bước** tới đó, Olly đếm bước (*"one jump, two jumps"*).
  - Đúng thì đúng **một** bước (hoặc nằm giữa hai mốc).
  - Sai → ếch nhảy về, Olly: *"One jump only!"*
- Tia số hiện 11 số liên tiếp quanh số được hỏi, không vượt 0 và phạm vi của mức; đáp án không nằm ở đầu / cuối tia.
- *One more / one less*: Olly nói rõ *"One more means one jump forward."* — làm quen với cộng / trừ, chưa có phép tính.

### 4.6. T6 — Tens and ones (Math-a)
| Mức | Nội dung |
|---|---|
| 1 | **Dạy khái niệm**: một thanh = 10 khối (Olly đếm 10 khối rồi "gộp" thành thanh). Bé tạo số: *"Make 34!"* → chạm thêm thanh chục / khối lẻ. Số tròn chục trước (20, 30, 40) rồi số có đơn vị |
| 2 | So sánh hai số **khác chục** (34 / 52): *"Look at the tens first!"* |
| 3 | So sánh **cùng chục** (34 / 37: chục bằng nhau → so đơn vị) và cặp **đổi chỗ chữ số** (23 / 32, 45 / 54) |

- **Làm mẫu mức 2–3:** luôn có một ví dụ cùng chục để bé thấy vì sao phải so đơn vị.
- Mức 2 chỉ mở sau khi bé xong mức 1 (bài T6 có thứ tự riêng).
- T6 nằm trong đợt đầu nên bài đầu tiên đã có số tới 100. Các bài khác vẫn dừng ở 20; T6 không bắt bé học xong T1–T3 trước (không khóa bài, 6.1), nhưng nằm sau T3 trong danh sách.

### 4.7. T7 — Read and compare (Math-c)
- Mỗi câu đố chỉ có **một** câu hỏi so sánh, không lồng hai phép so sánh.
- Số trong câu đố ≤ 10 (≤ 20 sau khi bé có ⭐⭐ ở T5).
- Tên nhân vật và danh từ phải có hình (emoji / SVG) hoặc là từ đã có ở bài Read. Danh sách viết sẵn, test kiểm tra.
- Hình minh họa vẽ **đúng số lượng** trong câu. Đồ của hai nhân vật **cùng cỡ**, không để cỡ hình gợi ý đáp án.
- Olly đọc câu đố (karaoke) trước, bé chưa cần tự đọc. Sau khi chọn đúng mới tới phần bé đọc (3.3).
- Có cả *Who has more?* và *Who has fewer?*. Không có câu đố hai bên bằng nhau (bản đầu).

### 4.8. Độ khó (mức trong bài)

| Mức | T1–T4 | T5 | T3 riêng |
|---|---|---|---|
| 1 | 1–10, chênh ≥ 3, hình kiểm chứng luôn hiện | 0–10, *after / before* | Khay: 🐊 > và 🐊 < |
| 2 | 1–20, chênh ≥ 1, hình hiện sau khi chọn | 0–20, thêm *between* | Thêm **=** (1–2 mục / lượt) |
| 3 | 1–20, có cặp sát nhau qua mốc 10 (9 / 11), hình chỉ hiện khi sai hoặc bấm 🔍 | 0–20, thêm *one more / one less* | Chỉ còn dấu **> < =**, không vẽ cá sấu |

T2 theo cùng phạm vi số lượng: mức 1 tối đa 6 đồ / nhóm, mức 2–3 tối đa 10 (màn rộng) hoặc 8 (iPhone dọc).

## 5. Hình vẽ và hiệu ứng

| Thứ | Cách làm |
|---|---|
| Cột khối | SVG, khối mọc từng cái (~80 ms), quy tắc màu ở 4.1 |
| Que chục + khối lẻ (T6) | SVG: thanh 10 khối dựng đứng + khối lẻ; so chục trước (que sáng), bằng nhau thì mới so đơn vị |
| Dây nối từng cặp (T2) | Đường SVG nối lần lượt từng cặp; đồ thừa sáng lên |
| Cá sấu | SVG hàm trên / dưới tách riêng để há – ngậm; lật ngang cho dấu < |
| Tia số + ếch | SVG; ếch nhảy theo cung từng bước, Olly đếm bước |
| Chữ câu so sánh | Dùng lại karaoke của Đọc câu (`karaoke.js`) |

- **Giảm chuyển động** — vẫn phải có tín hiệu rõ:
  - ếch đổi chỗ từng bước (mỗi bước **sáng viền một lần**);
  - cột hiện một lần;
  - cá sấu không ngoạm, hiện thẳng dấu kèm viền sáng;
  - dây nối hiện cả loạt.
- **Mọi lúc:**
  - không có hiệu ứng nhấp nháy liên tục;
  - đúng / sai **không chỉ báo bằng chuyển động**: luôn có câu của Olly + đổi viền / màu;
  - sai không có tiếng báo sai, không tô đỏ cả màn.
- **Bố cục:**
  - Olly không đè lên số / đồ so sánh, kiểm tra iPad ngang / dọc và iPhone dọc.
  - Thẻ số, thẻ dấu, ô trống, đồ vật và số trên tia: vùng chạm tối thiểu **64 px**.
  - Chữ dài (*greater than*, *less than*) không tràn khung ở 375 px.
- Chỉ dùng **chạm**, không kéo thả (SPEC 3.2): xoay máy giữa chừng chỉ cần vẽ lại, không có tọa độ kéo bị lệch.

## 6. Bài, mức, sao và tiến độ

### 6.1. Mở bài
- **Không khóa bài** (theo SPEC 3.1.2 đã chốt): mọi bài Math mở sẵn, bé chọn bài nào cũng được.
- Danh sách xếp theo T1 → T7; bài nên học tiếp có dấu ⭐ "Tiếp theo" (bài đầu tiên chưa hoàn thành).
- Bài còn ở đợt chưa làm thì không hiện (không có thẻ "Sắp mở" trong khu).

### 6.2. Mức
- Ba khái niệm tách riêng:
  - **sao của lượt** = kết quả một lần làm 8 mục;
  - **mức đã mở** = mức cao nhất bé được chơi ở bài đó;
  - **mức đang chơi** = mức bé chọn ở lượt này.
- Quy tắc:
  1. Mỗi bài bắt đầu với mức 1 đã mở.
  2. Một lượt ở mức N (N = mức cao nhất đã mở) đạt **≥ 2⭐** → mở mức N + 1.
  3. Mức đã mở **không bao giờ khóa lại**, kể cả khi bé làm sai.
  4. Vào bài: hiện các mức đã mở, nút sáng = mức cao nhất đã mở. Bé (hoặc bố mẹ) chọn mức thấp hơn để ôn được; chơi mức thấp không đổi mức đã mở.
  5. Góc bố mẹ → Cài đặt có nút **"Mở mọi mức của khu Toán"**.
- Lưu: `lesson:math-t3/L1`, `/L2`, `/L3` (sao cao nhất, lần chơi của từng mức). Mức đã mở = 1 + số mức liền nhau có `bestStars ≥ 2`.

### 6.3. Sao (theo SPEC 4.4)
| Sao | Điều kiện (trên 8 mục có chấm của lượt) |
|---|---|
| 3 | ≥ 90% mục `independent` (8 mục: 8/8 — 7/8 = 87,5% là 2⭐) |
| 2 | ≥ 60% mục `independent` hoặc `helped`, và tối đa 1 mục `missed` |
| 1 | làm xong lượt |

- `independent` = đúng ngay lần đầu; sai lần 1 rồi đúng = `helped`; sai 2 lần = `missed`.
- Phần làm mẫu và phần đọc câu **không** tính.
- **Thoát giữa chừng:** không có sao, không tính lượt chơi, không mở mức. Kết quả từng mục đã làm vẫn ghi. Mở lại bài = **lượt mới từ đầu** (giống các khu khác, không lưu trạng thái dở).
- **Chơi lại:** mỗi lượt cập nhật `lastStars`; `bestStars` giữ cao nhất (không giảm). Thẻ bài hiện `bestStars` của mức cao nhất đã chơi, kèm nhãn "Mức 2".
- **Hoàn thành bài** (cho ⭐ "Tiếp theo"): có ít nhất một lượt xong ở bất kỳ mức nào — ghi `lesson:math-t3` (`completedAt`, sao cao nhất mọi mức).

### 6.4. Tiến độ từng mục
- Mục: `math-<bài>/<hoạt động>/<khóa>`. Ví dụ `math-t3/compare/7-4`, `math-t2/more/5-3`, `math-t5/after/7`.
- Mỗi mục có thêm **kiểu câu** (`kind`): `t1:smaller`, `t3:equal`, `t3:big-right`, `t5:between`, `t6:swap-digits`…
  - bố mẹ thấy bé hay nhầm kiểu nào;
  - lượt sau hỏi kiểu bé sai nhiều hơn **tối đa thêm 1 mục** / lượt.
- **"Kiểu hay sai" tính từ bản ghi mục đã có, không cần kho mới.** Gộp các bản ghi của bài theo `kind`, cộng `seen` và `independent`. Kiểu hay sai là kiểu có tỉ lệ `independent / seen` **thấp nhất**, chỉ xét kiểu đã gặp **≥ 3 lần** và có ở mức đang chơi. Góc bố mẹ hiện tỉ lệ này (ví dụ *"t3: dấu = — 2/5 đúng ngay"*).
- Bản ghi nằm trong kho `progress` như mọi khu → sao lưu / khôi phục (khi làm) giữ được tiến độ Math.

## 7. Dữ liệu và bộ sinh câu hỏi

- Bài có sẵn trong code: `js/math/` → `BUILTIN_MATH`. Không qua gói bài / prompt AI.
- Thông tin bài:
  ```json
  { "id": "math-t3", "title": "Hungry crocodile", "titleVi": "Cá sấu > < =", "emoji": "🐊", "batch": "a", "items": 8,
    "explainVi": "Miệng cá sấu luôn há về phía số lớn hơn. {a} lớn hơn {b} nên miệng há về phía số {a}." }
  ```
- **Mỗi bài một bộ sinh câu hỏi riêng** (`makeItems(level, rand, history)` → 8 mục):
  - hàm thuần, test được;
  - `rand` cố định được trong test;
  - `history` = kết quả gần đây để ưu tiên kiểu bé hay sai.

| Bài | Một mục gồm | Quy tắc sinh |
|---|---|---|
| T1 | `{ a, b, ask: 'bigger'\|'smaller', answer }` | không bằng nhau; chênh theo mức; *bigger* / *smaller* 4–4 (±1); đáp án trái / phải 4–4 (±1) |
| T2 | `{ left: { thing, n }, right: { thing, n }, ask: 'more'\|'fewer', answer: 'left'\|'right'\|'same' }` | `thing` chỉ lấy trong danh sách đồ có hình (cặp to / nhỏ: voi–chuột, gấu–kiến, cá voi–cá…); 1–2 mục *same*; nhiễu kích thước ≥ ½ số mục khác nhau |
| T3 | `{ a, b, sign: '>'\|'<'\|'=', croc: bool, text }` | `=` chỉ từ mức 2, 1–2 mục; số lớn trái / phải cân bằng; `text` = câu đọc trái → phải |
| T4 | `{ numbers: [4 số khác nhau], order: 'asc'\|'desc' }` | khoảng cách tối thiểu theo mức (mức 1 ≥ 2); `desc` chỉ ở mức 3 |
| T5 | `{ kind, n, m?, answer, line: [từ, đến] }` | `between`: `m = n + 2`; đáp án không nằm ở mép tia; không vượt 0 / phạm vi mức |
| T6 | `{ a, b }` hoặc `{ make: n }`; tách `tens`, `ones` | mức 3 có ≥ 2 cặp đổi chỗ chữ số và ≥ 2 cặp cùng chục |
| T7 | câu đố viết sẵn (dưới đây) | chọn theo phạm vi số đã mở; *more* / *fewer* cân bằng |

- **Quy tắc chung cho mọi bộ sinh:**
  - không vượt phạm vi số của mức;
  - không lặp một cặp quá **2 lần** / lượt, không lặp ngay mục trước;
  - mọi đồ vật / nhân vật dùng phải có hình (test kiểm tra danh sách);
  - không có hai mục liền nhau giống hệt nhau về kiểu câu + vị trí đáp án;
  - với bài có đáp án trái / phải (T1, T2, T3): **không quá 5 / 8** mục cùng một bên, **không quá 3 mục liền** cùng một bên;
  - mục thêm cho kiểu hay sai (6.4) vẫn phải theo các luật trên; không đủ chỗ thì bỏ ưu tiên, không phá luật.
- T7 có danh sách câu đố viết sẵn:
  ```json
  { "id": "p1", "text": "Tom has 5 apples. Anna has 3 apples. Who has more?",
    "vi": "Tom có 5 quả táo. Anna có 3 quả táo. Ai nhiều hơn?",
    "people": [{ "name": "Tom", "emoji": "👦", "n": 5 }, { "name": "Anna", "emoji": "👧", "n": 3 }],
    "thing": { "en": "apples", "emoji": "🍎" }, "ask": "more", "answer": "Tom" }
  ```
  Test kiểm tra: số trong `text` khớp `n`; đúng một đáp án; `answer` khớp `ask`.
- Câu hỏi Olly dùng đều có dòng dịch trong `captions.js` (test 4.5).

## 8. Chia đợt làm

| Đợt | Phạm vi | Mục tiêu |
|---|---|---|
| **Math-a** | Khu 🔢 (5 thẻ ở màn chính, 2.1) · danh sách bài · khung bài chung (làm mẫu → 8 mục → đọc câu → sao, mức) · **T1 · T2 · T3 · T6** | Trọn một vòng học so sánh: số, số lượng, ký hiệu, và số tới 100 (chục – đơn vị) |
| **Math-b** | **T4 · T5** | Thứ tự số và tia số (có *one more / one less*) |
| **Math-c** | **T7** | Đọc hiểu câu đố |
| Sau | *How many more?*, cộng / trừ trong phạm vi 10 | 11.3 |

- Math-a phải xong **cả khung**: làm mẫu, 8 mục, đọc câu, sao, mức, chơi lại, thoát giữa chừng, hết giờ buổi học. Không chỉ giao diện.
- Thứ tự trong lộ trình SPEC.md mục 7: **sau khu Quest** (đã chốt 2026-11-10).

## 9. Ghi chú tương thích
- Khu Math không ảnh hưởng 4 khu cũ: bài Math không nằm trong kho `lessons`, không hiện ở Bài học / Kho ảnh / Thư viện bài.
- `captions.js`: thêm mẫu câu Math; test hiện có (mọi câu hỏi phải có dòng dịch) quét cả file của khu Math.
- Không đổi file lõi (`CORE.md`).
- **Chỗ tổng hợp tiến độ** (Góc bố mẹ → tiến độ tổng, tiến độ Unit, bộ thẻ tricky words) đọc theo `lessonId` / tiền tố. Kiểm tra để bản ghi `math-*` và `lesson:math-*` **không** bị cộng vào tiến độ Read / Spell / Talk. Tiến độ Math chỉ hiện ở phần Toán.

## 10. Test

| Nhóm | Test case |
|---|---|
| Màn chính | 5 thẻ khu, không cuộn ở 375 × 667, 390 × 844, 820 × 1180, 1180 × 820; thẻ cuối rộng cả hàng ở iPhone dọc |
| T1 | không có hai số bằng nhau; mức 1 chênh ≥ 3; hỏi cả *bigger* và *smaller*; đáp án trái / phải cân bằng; hai cột cùng quy tắc màu, cột khối đúng số khối |
| T2 | có đủ trái nhiều hơn / phải nhiều hơn / *same*; nhiễu kích thước ≥ ½ mục khác nhau; mỗi nhóm một loại đồ; đồ không chồng nhau; chạm lại đồ đã đếm không đếm lại; dây nối đúng số cặp |
| T3 | có cả > < (và = từ mức 2); số lớn nằm cả hai phía; dấu sai bật về khay; đúng → câu đọc trái → phải; lần đầu có bước *bigger → greater than* |
| T4 | 4 số khác nhau; xếp đúng tăng / giảm; chạm sai thì thử lại; nhãn *first / next / last* |
| T5 | có *before / after / between* (và *one more / one less* ở mức 3); ếch nhảy đúng số bước; đáp án không ở mép tia, không vượt phạm vi |
| T6 | mức 1 tạo số đúng số thanh / khối; mức 3 có cặp đổi chỗ chữ số; thanh = 10 khối |
| T7 | số trong câu khớp hình; một đáp án; câu dịch có đủ; đồ hai bên cùng cỡ |
| Sao / mức | sai 1 rồi đúng ≠ `independent`; 7/8 độc lập = 2⭐; thoát giữa chừng không sao, không mở mức; chơi mức thấp không đổi mức đã mở; ≥ 2⭐ ở mức cao nhất → mở mức sau |
| Nút / chuyển mục | bấm ▶ / ⏭ khi Olly đang nói → câu đang nói dừng, không chồng tiếng; chạm nhanh hai thẻ → chỉ tính lần đầu; chạm trong lúc Olly phản hồi không có tác dụng; sang mục sau 1,2 giây sau khi Olly nói xong; 🔊 không làm mất `independent` |
| Không chạm | 20 giây sau khi đọc xong → nhắc **đúng một lần**; sau đó không tự hiện đáp án; kết quả mục không đổi |
| Ra nền | ra nền ở mục chưa chốt → quay lại đúng mục, lần sai trước vẫn tính; mục đã chốt → mục sau; 🏠 / tải lại → lượt mới |
| Đọc câu | không có hai mục đọc liền nhau; không mic → ✅ ghi `practiced`; bé bỏ qua phần đọc; phần đọc không đổi sao |
| Hỗ trợ | 2 lần sai → giải thích tiếng Việt đúng một lần; mọi câu hỏi có phụ đề tiếng Việt |
| Bộ sinh (unit, **500 lượt ngẫu nhiên mỗi bài × mỗi mức**) | đúng phạm vi / chênh lệch theo mức; không lặp cặp quá 2 lần / lượt; trái / phải ≤ 5/8 và ≤ 3 liền; mục ưu tiên kiểu hay sai ≤ 1 / lượt; mọi đồ vật có hình; `rand` cố định → kết quả cố định |
| Thiết bị | iPad ngang / dọc, xoay máy giữa chừng; iPhone dọc; giảm chuyển động vẫn thấy thao tác, không nhấp nháy liên tục; PWA standalone |
| Luồng cũ | 4 khu cũ vẫn chạy; tiến độ tổng / Unit / tricky không cộng bản ghi Math; Bài học / Kho ảnh không có bài Math; hết giờ trong bài Math → làm xong mục rồi đi ngủ |

## 11. Câu hỏi cho bố mẹ

1. ~~Tên khu~~ — **đã chốt 2026-11-10: 🔢 Math / Toán** (màu vàng).
2. ~~Thứ tự~~ — **đã chốt 2026-11-10: làm sau khu Quest.**
3. ~~Phạm vi~~ — **đã chốt 2026-11-10: làm phần tới 100 (T6) ngay ở Math-a.** *How many more?* và cộng / trừ trong 10 để sau Math-c (spec riêng).
4. ~~Mở mức~~ — **đã chốt 2026-11-10:** mỗi bài mở mức sau khi đạt ≥ 2⭐ ở mức đang cao nhất (6.2), bố mẹ mở hết được.
