# SPEC — ✍️ Tập viết (khu Spell, bản 0.7) — Olly English

> Phiên bản spec: **draft2** · Ngày: 2026-11-11 · Dựa trên app 0.5.1 (làm sau Math-a — app 0.6.0 — nên đổi số bản thành 0.7.x) (SPEC.md draft2, mục 3.2)
> Trạng thái: **chờ bố mẹ duyệt lần 2**. Còn 1 câu hỏi ở mục 15.
>
> Viết chi tiết phần "Tập viết chữ" và "Viết từ" mà SPEC.md mục 3.2 mới chốt hướng. Các quyết định giữ từ trước:
> - chấm từng nét theo **điểm bắt đầu**, **hướng**, **độ phủ đường**, **thứ tự nét**, **đủ nét**;
> - nhấc tay = hết một nét; có nút xóa nét vừa vẽ;
> - viết sai → nét mờ đi, Olly vẽ mẫu, bé viết lại; không chê, không trừ sao lần đầu;
> - bản đầu **dễ dãi**, siết dần khi có dữ liệu thử thật;
> - "Viết từ" mở khi bé xếp ô đúng 2 lần liên tiếp; không chấm hình chữ, chỉ ghi "đã viết".

### Thay đổi so với draft1 (theo bản review)
- **Dữ liệu chữ:**
  - tọa độ đầy đủ cho 26 chữ (mục 6.4);
  - thêm đoạn cong `bez` cho s, f, g, j;
  - quy tắc nối nét có test (mục 6.3).
  - Các chữ r, n, m, h, b, p viết **một nét liền** "xuống – lên lại – vòng sang" (draft1 tách 2 nét, bắt bé nhấc tay ở chân chữ rồi đi ngược lên — sai cách dạy).
  - Chữ tách nét (v, w, x, y, z, k…) **nét nào cũng đi từ trên xuống, trái sang phải**.
- **Câu hướng dẫn tiếng Anh / Việt viết riêng cho từng chữ** (mục 7). Không dùng chung theo nhóm hay hình nét nữa. Nhóm chỉ để xếp lưới chữ.
- **Thuật toán chấm nét viết lại** (mục 5):
  - lấy mẫu lại theo quãng đường (bé dừng tay, đi chậm không ảnh hưởng);
  - so khớp theo thứ tự (DTW) với nét mẫu xuôi và ngược để biết hướng;
  - phân biệt **chạm** (nét chấm) với **nét kéo**.
- **Công thức sao** viết lại cho rõ (mục 5.7).
- **Không nhận thêm nét** sau khi chữ xong (mục 5.3).
- **Bước A:** tự chạy mẫu một lần; nút "Tiếp tục" hiện sau khi mẫu chạy xong.
- **Bước B:** lần 2 chữ mẫu mờ hơn lần 1.
- **Nút ❓** nghe giải thích tiếng Việt bất kỳ lúc nào.
- **Xử lý kỹ thuật** (mục 10):
  - `pointercancel`, xoay máy, đổi cỡ màn;
  - chỉ xóa nét của lượt đang làm;
  - lưu sau mỗi lượt;
  - cài đặt "Ưu tiên bút" thay cho "chỉ nhận Apple Pencil".
- **Viết từ:**
  - chữ lặp có ô riêng;
  - xóa từng ô;
  - viết ô nào trước cũng được;
  - nút "Viết lại";
  - đếm số lần viết.
- **Font chữ đọc:** dùng chung một hình chữ a / g ở Read, Spell, Write (mục 6.5).
- **Đợt làm:** thêm **prototype 8 chữ** (c a d l t m g z) cho bé thử thật trước khi làm đủ 26 chữ (mục 13).
- **Chốt 5 câu hỏi của draft1:**
  - tách nét như bảng;
  - học theo 4 nhóm hình nét;
  - chưa làm chữ hoa (để sau W-b);
  - mức chấm mặc định Dễ, đổi được;
  - "Ưu tiên bút" bật sẵn, chỉ có tác dụng khi app thấy bút.

## 1. Mục tiêu

- Bé 6 tuổi viết được **26 chữ thường a–z** kiểu chữ in (print), **đúng điểm bắt đầu, đúng hướng, đúng thứ tự nét**. Đây là thói quen khó sửa nếu học sai từ đầu.
- Mỗi chữ gắn với **tên chữ và âm** đã học ở Read (*"This is c. c says /k/."*), để viết và đọc đi cùng nhau.
- Bé **viết từ** đã đánh vần đúng ở Spell, chép từ chữ mẫu.
- Theo nguyên tắc chung của Olly:
  - phản hồi "chỉ chỗ sai + làm mẫu" (SPEC 4);
  - giải thích tiếng Việt sau 2 lần sai (4.1);
  - 🔊 nghe lại + phụ đề (4.5);
  - sao theo % đúng (4.4).
- **Không** là bài kiểm tra chữ đẹp. App chỉ chấm những gì máy đo chắc chắn được: chỗ bắt đầu, hướng, thứ tự, đủ nét, đi gần đường mẫu. Không chấm độ đẹp, độ đều, tốc độ viết.

### Ngoài phạm vi bản 0.7
- Chữ hoa A–Z, chữ số 0–9: để sau W-b, tùy bé.
- Chữ viết thường có nét nối (kiểu vở lớp 1 Việt Nam): không làm, app chỉ dạy chữ in tiếng Anh.
- Nhận dạng chữ viết tự do; viết câu.
- Chế độ "viết liền" cho v, w, z… (luyện nâng cao): có thể thêm sau. Dữ liệu chỉ cần gộp nét, cách chấm không đổi.

## 2. Vị trí trong app

### 2.1 Tab "✍️ Tập viết" trong khu Spell
- Khu ✏️ Spell có thêm tab thứ ba: **📘 Theo sách · 🔤 Phonics · ✍️ Tập viết**.
- Tab Tập viết là **lưới 26 chữ**, chia **4 nhóm** để bé học các chữ na ná nhau gần nhau. Nhóm **chỉ dùng để xếp lưới**; cách chấm và câu hướng dẫn theo từng chữ (mục 6, 7).

| Nhóm | Ý chung | Chữ (thứ tự học) |
|---|---|---|
| 🐛 **Chữ cong** (*curly*) | bắt đầu ở "2 giờ", vòng sang trái | c, a, d, o, g, q, e, s, f |
| 🪜 **Chữ có nét thẳng** (*ladder*) | đi thẳng xuống | l, i, t, j, u, y |
| 🤖 **Xuống rồi vòng lên** (*robot*) | xuống, lên lại đúng đường cũ, vòng sang phải | r, n, m, h, b, p, k |
| ⚡ **Ziczac** (*zig-zag*) | các nét xiên | v, w, x, z |

- Mỗi thẻ chữ hiện:
  - chữ to (vẽ từ dữ liệu nét, cùng hình với khung viết);
  - sao cao nhất (0–3);
  - dấu ⭐ "Tiếp theo" ở chữ đầu tiên chưa có sao, theo thứ tự trong bảng.
- **Không khóa chữ** (SPEC 3.1.2).

### 2.2 Hoạt động "Viết từ" trong bài của khu Spell
- Bài của khu Spell (Phonics, Theo sách) chạy như hiện nay: xếp ô → điền ô. Cuối bài có thêm bước **Viết từ** (mục 8) cho những từ **đã mở**.
- App tự thêm bước này, **không cần sửa dữ liệu bài**.

## 3. Màn tập viết một chữ

```
 ←  ✍️ c                                   ❓  🔊   1/3
 ┌──────────────────────────────────────────────────────┐
 │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ← dòng trên (đầu b, d, l…)     │
 │                                                      │
 │ ─────────── ●①  ↶   chữ c mẫu (mờ) ─────── ← dòng giữa (đầu a, c…) │
 │            (     )                                   │
 │ ═════════════════════════════════════  ← dòng chân (đậm)            │
 │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ← dòng dưới (đuôi g, p, y…)    │
 └──────────────────────────────────────────────────────┘
            ↩️ Xóa nét                 🧽 Viết lại
     "Start at the dot. Curve round and stop."
```

- **Khung 4 dòng kẻ** như vở tập viết tiếng Anh: dòng trên, dòng giữa, dòng chân (đậm), dòng dưới.
- **Chữ mẫu** vẽ mờ trong khung. **Chấm xanh** đánh số ở điểm bắt đầu của nét đang viết; **mũi tên nhỏ** chỉ hướng đi ngay cạnh chấm.
- Bé viết bằng **ngón tay hoặc bút**. Nét mực đậm, màu tím của app. Nét được chấm ngay khi nhấc tay (mục 5).
- **↩️ Xóa nét:** xóa nét vừa viết của lượt đang làm (kể cả nét đã chấm đúng); bé viết lại nét đó. Không còn nét nào thì nút mờ.
- **🧽 Viết lại:** xóa hết nét của lượt đang làm, viết lại từ nét 1.
- **❓:** Olly giải thích cách viết chữ bằng tiếng Việt (câu `vi` của chữ, mục 7). Bấm lúc nào cũng được, **không tính là trợ giúp**.
- **🔊:** Olly nói lại câu hướng dẫn tiếng Anh, có phụ đề tiếng Việt (SPEC 4.5).
- Số `1/3` là lượt đang làm (mục 4).

### 3.1 Cỡ khung
- Chiều cao khung (dòng trên → dòng dưới) **≥ 260 px** trên iPad, **≥ 200 px** trên iPhone dọc.
- Chiều rộng khung **≥ 0,9 × chiều cao chữ** kể cả chữ hẹp (i, l, j), để bé có chỗ đặt tay.
- Chữ mẫu căn giữa khung. Tọa độ chạm đổi về **đơn vị chữ** (mục 6.1), nên mọi cỡ màn chấm như nhau.

## 4. Các bước học một chữ

| Bước | Tên | Bé làm gì | Gợi ý trên khung | Chấm |
|---|---|---|---|---|
| A | 👀 **Xem** | xem Olly viết mẫu | chữ mẫu vẽ dần | không |
| B1 | ✏️ **Tô lần 1** | tô lên chữ mẫu | chữ mẫu **rõ** (độ đậm 35%) + chấm bắt đầu + mũi tên | có |
| B2 | ✏️ **Tô lần 2** | tô lên chữ mẫu | chữ mẫu **mờ** (15%) + chấm bắt đầu + mũi tên | có |
| C | ✍️ **Tự viết** | viết vào ô trống, nhìn chữ mẫu nhỏ ở ô bên | chỉ chấm bắt đầu của nét đang viết | có |

- **Bước A:**
  - Mở chữ → Olly tự nói *"This is c. c says /k/."* (âm là file âm rời đã có, SPEC 3.1.1).
  - Rồi Olly viết mẫu từng nét, nói câu hướng dẫn của chữ (mục 7). Mẫu chạy **một lần**, không chờ bé chạm.
  - Mẫu chạy xong → hiện hai nút: **▶ Xem lại** (chạy mẫu lại) và **Tiếp tục ➜** (sang B1).
  - Chạm vào khung ở bước A không làm gì.
- **Bước B1, B2:**
  - Bé tô đúng một nét → nét đổi màu xanh lá, *ding* nhỏ, chấm xanh nhảy sang đầu nét tiếp theo.
  - Đủ nét → chữ sáng lên, Olly: *"Good! Again!"* (sau B1) / *"Now you try!"* (sau B2) → sang lượt tiếp.
- **Bước C:**
  - Ô trái có chữ mẫu nhỏ để nhìn. Ô phải có 4 dòng kẻ, không có chữ mờ.
  - Đủ nét → Olly đọc lại tên chữ + âm, khen, hiện sao (mục 5.7).
- **Chữ có chấm (i, j):** nét chấm luôn là **nét cuối**, chỉ cần **chạm** (mục 5.2). Olly: *"Now the dot!"*.

### 4.1 Mức sau (chữ đã có ⭐⭐⭐) — đợt W-b
- Học lại chữ đã 3 sao: **B1 → C1 → C2**. Bỏ B2; C2 **không có chấm bắt đầu** (bé tự nhớ). Sai thì gợi ý như mục 5.5.
- Vẫn 3 lượt có chấm, sao tính như mục 5.7 (lượt C cuối là C2).

## 5. Chấm một nét

### 5.1 Chuẩn bị nét của bé
1. **Chỉ lấy điểm của một con trỏ** (mục 10.2), đổi tọa độ px → đơn vị chữ.
2. **Lấy mẫu lại theo quãng đường:** bỏ điểm trùng, rải lại điểm cách đều **2 đơn vị** dọc nét.
   - Bé dừng tay giữa nét, đi chậm hay nhanh đều ra cùng một dãy điểm. Tốc độ **không** dùng để chấm.
3. **Làm mượt nhẹ:** trung bình trượt 3 điểm, bớt run tay.
4. **Phân loại:** tổng quãng đường **< 6 đơn vị** → **chạm** (tap); còn lại → **nét kéo**.

Nét mẫu cũng được rải điểm cách đều 2 đơn vị (`sampleStroke`, mục 6.2). Mỗi điểm mẫu có **tiến độ `t`** từ 0 (đầu nét) đến 1 (cuối nét) theo quãng đường.

### 5.2 Nét mẫu là nét chấm (i, j)
- Đúng khi bé **chạm** (hoặc nét kéo rất ngắn mà mọi điểm đều nằm trong vòng tròn) trong bán kính `dotR` quanh điểm chấm.
- Bé kéo một nét dài khi đang cần chấm → sai, lý do `dot`: *"Just tap the dot!"*. Chấm xanh nhún.
- Bé chạm ngoài vòng tròn → sai, lý do `start`.

### 5.3 Nét mẫu là nét kéo
- **Chạm** khi đang cần nét kéo → **bỏ qua**: không tính sai, không xóa gì (thường là chạm nhầm, tì tay).
- **Nét kéo** được so với **nét mẫu tiếp theo** (nét thứ k của bé so với nét mẫu thứ k):

| # | Điều kiện | Cách đo |
|---|---|---|
| 1 | **Bắt đầu đúng chỗ** | khoảng cách từ điểm đầu nét bé tới điểm đầu nét mẫu ≤ `startR` |
| 2 | **Đi đúng hướng** | `dFwd` = độ lệch trung bình khi khớp nét bé với nét mẫu **xuôi** (DTW, xem dưới); `dRev` = độ lệch khi khớp với nét mẫu **đảo ngược**. Đúng hướng khi `dFwd ≤ dRev`, hoặc `dFwd` đủ nhỏ (≤ `nearR`) |
| 3 | **Đi hết đường** | ≥ `cover` điểm mẫu có điểm nét bé trong bán kính `nearR`, **và** đoạn cuối nét mẫu (t ≥ 0,85) có ít nhất một điểm được phủ |
| 4 | **Không đi lạc** | ≥ `stay` điểm nét bé nằm trong bán kính `farR` của nét mẫu |

- Đúng cả 4 → **nét đúng**.
- **DTW (so khớp theo thứ tự):** ghép từng điểm nét bé với một điểm mẫu sao cho cả hai dãy **chỉ đi tiến**, tổng khoảng cách nhỏ nhất. `dFwd` = tổng khoảng cách / số cặp.
  - Vì cả hai dãy chỉ đi tiến, nét bé đi ngược thì khớp với mẫu đảo ngược tốt hơn hẳn (`dRev` < `dFwd`).
  - Cách này đúng cả với nét **khép kín** (o: điểm đầu trùng điểm cuối, chỉ khác chiều quay) và nét **đi lại trên đường cũ** (r, n, m, h, b, p: xuống rồi lên lại).
  - Bé rê qua lại nhỏ, đi lệch một đoạn ngắn: vài cặp điểm lệch không làm đổi kết quả.
  - Không đo "tỉ lệ cặp điểm tăng dần" như draft1.
- **Lý do sai**, xét theo thứ tự, lấy lý do đầu tiên đúng:
  1. `reverse`: `dRev < dFwd` **và** điểm đầu nét bé gần **cuối** nét mẫu hơn đầu nét mẫu.
  2. `start`: điều kiện 1 sai.
  3. `reverse`: điều kiện 2 sai (đi ngược một phần lớn dù bắt đầu đúng chỗ).
  4. `stray`: điều kiện 3 hoặc 4 sai. Ví dụ kéo một mạch hai nét của *t*: nét bé lệch nhiều so với nét dọc.
- **Nét nào cũng phải viết đúng thứ tự.** Bé viết nét 2 trước nét 1 → nét bé được so với nét 1, thường sai `start`. Olly chỉ chấm xanh của nét 1.
- **Không gộp nét:** nhấc tay là hết một nét, kể cả khi bé lỡ nhấc tay giữa chừng (mỏi tay). Khi đó nửa nét đầu thường sai `stray` (chưa đi hết đường). Olly: *"Keep going without lifting!"*, thay cho câu `stray` thường, khi nửa nét đầu có điểm đầu đúng và đi đúng hướng.
- **Chữ đã đủ nét → khung khóa:** không nhận thêm nét nào cho tới khi sang lượt tiếp; chạm thêm bị bỏ qua (WR-17).

### 5.4 Ngưỡng — bảng `WRITE_LEVELS`
Đơn vị: **đơn vị chữ** (chiều cao chữ từ dòng trên tới dòng chân = 100).

| Mức | `startR` | `nearR` | `farR` | `cover` | `stay` | `dotR` |
|---|---|---|---|---|---|---|
| **Dễ** (mặc định) | 20 | 15 | 22 | 60% | 60% | 18 |
| Vừa | 15 | 12 | 16 | 70% | 70% | 14 |
| Khó | 12 | 10 | 12 | 80% | 80% | 11 |

- Số trong bảng là **điểm xuất phát** để hiệu chỉnh ở đợt prototype (mục 13): ghi lại nét bé viết thật (mục 12.3), chạy lại bộ chấm, chỉnh ngưỡng cho tới khi app chấm khớp với mắt bố mẹ.
- "Tô có dẫn" (mục 5.5) chỉ cần điều kiện 1 và 2, với `startR` × 1,5.

### 5.5 Nét sai → phản hồi

| Lý do | Olly nói | App làm |
|---|---|---|
| `start` | *"Start at the green dot!"* | nét bé mờ dần rồi biến mất; chấm xanh nhún 2 lần |
| `reverse` | *"Follow the arrow!"* | nét bé mờ dần; mũi tên mẫu chạy dọc nét mẫu một lần |
| `stray` | *"Try again. Follow the line."* (lỡ nhấc tay: *"Keep going without lifting!"*) | nét bé mờ dần; nét mẫu đó sáng lên một lần |
| `dot` | *"Just tap the dot!"* | nét bé mờ dần; chấm xanh nhún |

- Mỗi lần sai, **chỉ nét đó** phải viết lại; các nét đúng trước đó giữ nguyên.
- **Sai 2 lần cùng một nét:**
  - Olly đọc câu tiếng Việt của **nét đó** (mục 7, `strokeVi`) một lần (SPEC 4.1).
  - Rồi bật **"tô có dẫn"**: nét mẫu đậm lên, một chấm tròn chạy chậm dọc nét để bé đuổi theo; ngưỡng thấp hơn (mục 5.4).
- **Sai lần thứ 3** (tính cả lần tô có dẫn) cùng nét: Olly vẽ mẫu, nét đó **tự hoàn thành** (nét mẫu đổi xanh lá) để bé đi tiếp, không bị kẹt.
- **Không bao giờ** nói "wrong", không tiếng còi.
- Đếm số lần sai **theo nét trong một lượt**. Sang lượt mới đếm lại từ 0. ↩️ / 🧽 không xóa số lần sai đã đếm.

### 5.6 Kết quả một lượt
| Kết quả | Khi nào |
|---|---|
| `independent` | mọi nét đúng ngay lần đầu |
| `helped` | có nét phải viết lại, nhưng không nét nào cần tô có dẫn / tự hoàn thành |
| `missed` | có nét cần tô có dẫn hoặc tự hoàn thành |

- Xóa nét đúng bằng ↩️ rồi viết lại đúng: **không** làm lượt thành `helped`, vì bé tự sửa.

### 5.7 Sao của chữ
Tính khi xong **cả 3 lượt có chấm** (B1, B2, C — hoặc B1, C1, C2 ở mức sau). "Lượt C" = lượt cuối.

| Sao | Điều kiện |
|---|---|
| ⭐⭐⭐ | cả 3 lượt `independent` |
| ⭐⭐ | ít nhất 2/3 lượt `independent` hoặc `helped`, **và** lượt C không `missed` |
| ⭐ | xong đủ 3 lượt nhưng không đạt điều kiện trên (gồm mọi trường hợp lượt C `missed`) |

- Thoát giữa chừng thì không tính sao.

## 6. Dữ liệu chữ mẫu

### 6.1 Hệ tọa độ
- **Đơn vị chữ:** x từ 0 sang phải; y từ trên xuống.
- **Dòng kẻ:** dòng trên y = 0; dòng giữa y = 50; dòng chân y = 100; dòng dưới y = 150.
- Mỗi chữ có `width`; nét nằm trong `0 ≤ x ≤ width`, `−5 ≤ y ≤ 155`.
- **Góc** (cho `arc`): 0° = bên phải, 90° = **phía dưới** (vì y hướng xuống), −90° = phía trên. Đi từ `from` tới `to`:
  - `to < from`: **ngược chiều kim đồng hồ** trên màn (chữ c, o, a…);
  - `to > from`: **xuôi chiều kim đồng hồ** (bụng chữ b, p).

### 6.2 Nét và đoạn
- Mỗi chữ là danh sách **nét theo thứ tự viết**. Mỗi nét là danh sách **đoạn nối liền nhau theo chiều viết**:

| Đoạn | Dạng | Ghi chú |
|---|---|---|
| thẳng | `['line', x1, y1, x2, y2]` | |
| cung elip | `['arc', cx, cy, rx, ry, from, to]` | góc theo mục 6.1 |
| cong tự do | `['bez', x1, y1, c1x, c1y, c2x, c2y, x2, y2]` | Bézier bậc 3 (s, f, móc g / j, vòm r n m h) |
| chấm | `['dot', x, y]` | chỉ đứng một mình, một đoạn = một nét |

- **Liền mạch:** điểm cuối đoạn trước **trùng** điểm đầu đoạn sau (lệch ≤ 0,5). Có test.
- Hàm thuần `sampleStroke(stroke)` rải điểm cách đều 2 đơn vị kèm `t`. Dùng chung cho vẽ mẫu, chấm, test.
- Hàm thuần `strokeEnds(stroke)` trả điểm đầu / cuối, dùng cho chấm xanh, mũi tên, test.
- File `app/js/write/letters.js` → `LETTERS` (26 chữ), `WRITE_GROUPS` (4 nhóm).

### 6.3 Quy tắc nối nét (có test)
- Mỗi nét kéo **sau nét đầu tiên** phải **chạm** chữ đã viết: có ít nhất một điểm cách một điểm của nét trước ≤ **6 đơn vị**. Chữ in là một khối liền, trừ nét chấm.
- Nét chấm cách mọi nét khác **≥ 12 đơn vị** (chấm không dính thân chữ) và nằm **trên** điểm cao nhất của thân.
- Chữ có bụng tròn + nét thẳng (a, d, g, q): nét thẳng **tiếp xúc** bụng ở mép phải (x = cx + rx). Bụng hở bên phải từ 4 giờ đến 2 giờ; hai đầu bụng cách nét thẳng ≤ 4 đơn vị.
- Chữ "xuống – lên lại – vòng sang" (r, n, m, h, b, p): đoạn đi lên **trùng** đoạn đi xuống (cùng x), và đoạn đi lên phải ngắn hơn đoạn đi xuống.
- Chữ cao (b d f h k l t) chạm dòng trên (y ≤ 20; riêng t: y = 18). Chữ thấp nằm trong dòng giữa → dòng chân. Chữ có đuôi (g j p q y) xuống dưới dòng chân (y ≥ 130).

### 6.4 Bảng 26 chữ
Tọa độ là bản đầu, chỉnh được khi xem hình thật (WR-20). Cách viết, số nét, chỗ bắt đầu và hướng là phần **đã chốt**.

| Chữ | width | Nét (theo thứ tự) |
|---|---|---|
| **c** | 50 | ① `arc 27,75 23,25 −30→−330` — từ 2 giờ, ngược chiều kim đồng hồ, dừng ở 4 giờ |
| **a** | 52 | ① `arc 25,75 22,25 −30→−330` (bụng) · ② `line 47,50 → 47,100` |
| **d** | 52 | ① bụng như a · ② `line 47,0 → 47,100` |
| **o** | 50 | ① `arc 25,75 22,25 −30→−390` — khép kín, ngược chiều kim đồng hồ |
| **g** | 52 | ① bụng như a · ② `line 47,50 → 47,130` + `bez 47,130 47,152 14,152 6,136` (móc sang trái) |
| **q** | 52 | ① bụng như a · ② `line 47,50 → 47,150` |
| **e** | 54 | ① `line 4,75 → 50,75` + `arc 27,75 23,25 0→−315` — ngang sang phải rồi vòng lên, sang trái, xuống |
| **s** | 44 | ① `bez 40,56 32,46 6,50 8,62` + `bez 8,62 10,72 38,74 40,86` + `bez 40,86 42,100 12,104 4,94` |
| **f** | 40 | ① `bez 36,8 30,−2 14,−2 14,16` + `line 14,16 → 14,100` · ② `line 2,50 → 32,50` |
| **l** | 20 | ① `line 10,0 → 10,100` |
| **i** | 20 | ① `line 10,50 → 10,100` · ② `dot 10,30` |
| **t** | 32 | ① `line 14,18 → 14,100` · ② `line 2,50 → 30,50` |
| **j** | 34 | ① `line 26,50 → 26,130` + `bez 26,130 26,152 4,152 2,136` · ② `dot 26,30` |
| **u** | 52 | ① `line 6,50 → 6,78` + `arc 26,78 20,22 180→0` + `line 46,78 → 46,50` · ② `line 46,50 → 46,100` |
| **y** | 54 | ① `line 6,50 → 29,100` · ② `line 50,50 → 8,150` |
| **r** | 42 | ① `line 6,50 → 6,100` + `line 6,100 → 6,66` + `bez 6,66 10,50 30,46 38,56` |
| **n** | 48 | ① `line 6,50 → 6,100` + `line 6,100 → 6,66` + `bez 6,66 8,50 40,46 42,64` + `line 42,64 → 42,100` |
| **m** | 70 | ① `line 6,50 → 6,100` + `line 6,100 → 6,66` + `bez 6,66 8,50 32,46 35,64` + `line 35,64 → 35,100` + `line 35,100 → 35,66` + `bez 35,66 37,50 62,46 64,64` + `line 64,64 → 64,100` |
| **h** | 48 | ① `line 6,0 → 6,100` + `line 6,100 → 6,66` + `bez 6,66 8,50 40,46 42,64` + `line 42,64 → 42,100` |
| **b** | 50 | ① `line 6,0 → 6,100` + `line 6,100 → 6,75` + `arc 27,75 21,25 180→540` — bụng xuôi chiều kim đồng hồ, khép về thân |
| **p** | 50 | ① `line 6,50 → 6,150` + `line 6,150 → 6,75` + `arc 27,75 21,25 180→540` |
| **k** | 44 | ① `line 6,0 → 6,100` · ② `line 40,50 → 8,78` + `line 8,78 → 42,100` — "vào rồi ra" một nét |
| **v** | 48 | ① `line 4,50 → 24,100` · ② `line 44,50 → 24,100` |
| **w** | 64 | ① `line 2,50 → 17,100` · ② `line 32,50 → 17,100` · ③ `line 32,50 → 47,100` · ④ `line 62,50 → 47,100` |
| **x** | 46 | ① `line 4,50 → 42,100` · ② `line 42,50 → 4,100` |
| **z** | 46 | ① `line 4,50 → 42,50` · ② `line 42,50 → 4,100` · ③ `line 4,100 → 42,100` |

- **Quy tắc nét chung:**
  - Chữ tách nét: **mọi nét đi từ trên xuống**; nét ngang đi **trái → phải**.
  - Chữ nhóm robot (r n m h b p) là **một nét liền**: xuống hết thân, đi ngược lên đúng đường cũ, rồi vòng sang phải.
- **Chữ a, g một tầng** (như chữ viết tay của bé), không phải a hai tầng kiểu chữ in sách.

### 6.5 Thống nhất hình chữ ở Read / Spell / Write
- Font hiện tại của app là **Nunito**: chữ *a* **hai tầng**, *g* một tầng. Viết tay dạy *a* một tầng thì bé sẽ thấy hai kiểu *a*.
- Đề xuất: ô chữ, từ để đọc và đánh vần (Read, Spell, Viết từ) dùng **Andika**.
  - Andika là font SIL làm riêng cho người mới học đọc, a / g một tầng.
  - Phát hành dưới giấy phép OFL như Nunito; lưu file trong `app/fonts/` để chạy offline.
- Chữ giao diện (nút, tiêu đề, tiếng Việt) giữ Nunito.
- Trong Write, chữ mẫu luôn **vẽ từ dữ liệu nét** (mục 6.4), không dùng font.
- Xem câu hỏi 15.1.

## 7. Câu hướng dẫn — viết riêng từng chữ
- Mỗi chữ có:
  - `say`: câu tiếng Anh Olly nói ở bước A và khi bấm 🔊;
  - `vi`: câu tiếng Việt cho nút ❓;
  - `strokeVi`: một câu tiếng Việt **cho từng nét**, đọc khi sai 2 lần nét đó.
- Mọi câu tiếng Anh có dòng dịch trong `captions.js` (test 4.5).

| Chữ | `say` (EN) | `vi` (❓) |
|---|---|---|
| c | Start at the dot. Curve round and stop. | Bắt đầu ở chấm xanh bên phải, vòng sang trái, xuống dưới rồi dừng — như cái miệng mở. |
| a | Round like a c, then up and down. | Viết chữ c trước, rồi viết nét thẳng bên phải từ trên xuống. |
| d | Round like a c, then a tall line down. | Viết chữ c, rồi nét thẳng **cao** bên phải, bắt đầu từ dòng trên cùng. |
| o | Round like a c, and close it. | Như chữ c nhưng vòng tiếp cho khép kín, về đúng chỗ bắt đầu. |
| g | Round like a c, then down and hook. | Viết chữ c, rồi nét thẳng bên phải đi xuống dưới dòng kẻ, cuối nét móc sang trái. |
| q | Round like a c, then straight down. | Viết chữ c, rồi nét thẳng bên phải đi thẳng xuống dưới dòng kẻ. |
| e | Across, then round like a c. | Kẻ ngang ở giữa từ trái sang phải, rồi vòng lên trên, sang trái, xuống dưới. |
| s | Start at the dot. Curve back, then curve forward. | Bắt đầu ở chấm xanh, cong sang trái, rồi cong sang phải, như con rắn. |
| f | Hook over, go down. Then cross. | Bắt đầu hơi thấp hơn dòng trên, cong qua đỉnh rồi kéo thẳng xuống. Sau đó kẻ ngang. |
| l | Start at the top. Straight down. | Từ dòng trên cùng kéo thẳng xuống dòng chân. |
| i | Down, then the dot. | Kéo thẳng xuống từ dòng giữa, rồi chấm ở trên. |
| t | Down, then across. | Kéo thẳng xuống trước, rồi kẻ ngang ở dòng giữa. |
| j | Down and hook. Then the dot. | Kéo thẳng xuống dưới dòng kẻ, móc sang trái, rồi chấm ở trên. |
| u | Down, round, up. Then down. | Xuống, vòng sang phải, đi lên; rồi kéo nét thẳng bên phải xuống. |
| y | Slant down. Then a long slant down. | Nét xiên ngắn bên trái; rồi nét xiên dài bên phải đi xuống dưới dòng kẻ. |
| r | Down, back up, and over. | Kéo xuống, đi ngược lên đúng đường đó, rồi uốn sang phải như cánh tay. |
| n | Down, back up, over and down. | Kéo xuống, đi ngược lên, vòng sang phải rồi kéo xuống. |
| m | Down, up, over, down. Up, over, down. | Kéo xuống, đi ngược lên, vòng xuống; đi ngược lên lần nữa, vòng xuống — hai cái cầu. |
| h | Tall line down, back up, over and down. | Kéo xuống từ dòng trên cùng, đi ngược lên, vòng sang phải rồi kéo xuống. |
| b | Tall line down, back up, round the tummy. | Kéo xuống từ dòng trên cùng, đi ngược lên giữa, vòng cái bụng sang phải về thân. |
| p | Down below the line, back up, round the tummy. | Kéo xuống dưới dòng kẻ, đi ngược lên, vòng cái bụng sang phải. |
| k | Tall line down. Then in and out. | Kéo thẳng xuống từ dòng trên cùng. Rồi nét xiên vào giữa thân và xiên ra. |
| v | Slant down. Slant down. | Hai nét xiên từ trên xuống, gặp nhau ở dưới. |
| w | Slant down four times. | Bốn nét xiên từ trên xuống, nét nào cũng bắt đầu ở trên. |
| x | Slant down this way. Slant down that way. | Nét xiên từ trái xuống phải, rồi từ phải xuống trái. |
| z | Across, slant down, across. | Kẻ ngang, xiên xuống trái, rồi kẻ ngang dưới cùng. |

- `strokeVi` cho từng nét viết trong `letters.js`, cùng ý với bảng trên nhưng chỉ nói về nét đó. Ví dụ:
  - *a* nét 2: *"Nét thẳng bắt đầu ở dòng giữa, sát bên phải bụng chữ, kéo thẳng xuống."*

## 8. Viết từ (hoạt động `write`) — đợt W-b

### 8.1 Khi nào có
- Cuối mỗi lượt học bài ở khu Spell, cho từ thỏa **cả hai**:
  1. từ nằm trong hoạt động `spell` của bài, và bản ghi `<lessonId>/spell/<từ>` có `streak ≥ 2` (đúng ngay 2 lần liên tiếp);
  2. mọi ký tự là chữ thường a–z.
- Tối đa **2 từ** mỗi lượt, ưu tiên từ có `practiced` của `write` thấp nhất, rồi `lastAt` cũ nhất. Không có từ nào thì bỏ qua.
- Tắt được ở Góc bố mẹ → Cài đặt → "Viết từ cuối bài Spell" (mặc định bật).

### 8.2 Màn hình
```
            🐱   (hình của từ, nếu có)
   c   a   t      ← từ in rõ (Andika)
 ┌───┐┌───┐┌───┐
 │   ││   ││   │  ← mỗi chữ một ô 4 dòng kẻ, chữ mẫu MỜ trong ô
 └───┘└───┘└───┘
   🧽   🧽   🧽          ✅ Xong
```
- Olly đọc từ: *"Write cat. c – a – t."* (đọc tên từng chữ).
- **Mỗi chữ cái một ô riêng**, kể cả chữ lặp: *apple* có 5 ô, hai ô *p* độc lập.
- Ô đang chờ viết (ô trống đầu tiên từ trái sang) có viền sáng để gợi ý. Bé **viết ô nào trước cũng được**, không bắt buộc thứ tự.
- Mỗi ô có 🧽: chỉ xóa nét của ô đó.
- Nét viết trong ô **không chấm**. Nét bắt đầu trong ô nào thuộc ô đó (ra ngoài ô thì cắt ở mép).
- **✅ Xong** sáng khi **ô nào cũng có ít nhất một nét kéo**. Bấm thì:
  1. chữ mờ trong ô biến mất, còn nét của bé;
  2. bên dưới hiện **từ in đúng** để bé tự so;
  3. Olly đọc lại từ, khen;
  4. ghi tiến độ (mục 9.1);
  5. hiện nút **✍️ Viết lại** (xóa hết ô, viết lại; bấm Xong lần nữa ghi thêm một lần) và **Tiếp tục ➜**.
- Ô cỡ tối thiểu theo mục 3.1 (chiều cao 4 dòng ≥ 120 px). Từ dài thì xuống hàng, mỗi hàng tối đa **4 ô** trên iPhone dọc, **8 ô** trên iPad.

## 9. Lưu và tiến độ

### 9.1 Bản ghi
- **Mỗi chữ:** `write/letter/<chữ>`, kiểu mục chung của SPEC 4.3, với `lessonId: 'write'`, `activity: 'letter'`, `itemId: 'c'`:

| Trường | Ý nghĩa |
|---|---|
| `seen` | số lượt có chấm **đã xong** |
| `independent` / `helped` / `missed` | số lượt theo kết quả (mục 5.6) |
| `streak` | số lượt `independent` **liên tiếp gần nhất**; lượt không `independent` → về 0 |
| `reasons` | `{ start, reverse, stray, dot }`: số lần sai theo lý do (cho Góc bố mẹ) |
| `lastAt` | lúc xong lượt gần nhất |

  - Ghi **ngay khi xong mỗi lượt**, không đợi xong cả chữ. Tải lại / mất điện thì các lượt đã xong vẫn còn (WR-24).
- **Sao của chữ:** `lesson:write-<chữ>`, dạng bản ghi bài của SPEC 4.3: `bestStars`, `lastStars`, `plays`, `completedAt`, `lastAt`.
  - Chỉ ghi khi xong **cả 3 lượt**. `plays` không tăng khi thoát giữa chừng.
  - Thẻ chữ ở tab hiện `bestStars`.
- **Viết từ:** `<lessonId>/write/<từ>`. Mỗi lần bấm ✅ Xong: `seen` + 1, `practiced` + 1, `lastAt` = giờ. `practiced` là **số lần**, không phải đúng / sai.
- Sao của bài khu Spell **không đổi**: chỉ tính từ xếp ô / điền ô. Viết từ không ảnh hưởng sao.

### 9.2 Ra nền / thoát giữa chừng
- **Ra nền rồi quay lại** (khóa máy, chuyển app): về **đúng chữ, đúng lượt** đang làm.
  - Lưu trong `app.current.params`, giống Tả tranh.
  - Các nét đã viết của lượt đang dở **mất**; bé viết lại lượt đó từ nét 1, số lần sai của lượt đó về 0.
- **Thoát hẳn** (← hoặc tải lại trang): mở lại chữ thì bắt đầu từ bước A. Bản ghi các lượt đã xong vẫn giữ.

### 9.3 Cài đặt (Góc bố mẹ → Cài đặt → ✍️ Tập viết)
- **Độ dễ chấm nét:** Dễ (mặc định) / Vừa / Khó (mục 5.4).
- **Ưu tiên bút:** khi đang dùng bút thì bỏ qua ngón tay (mục 10.2). Bật sẵn; chỉ có tác dụng sau khi app thấy bút.
- **Viết từ cuối bài Spell:** bật (mặc định) / tắt.

### 9.4 Góc bố mẹ → Tiến độ — đợt W-b
- Lưới 26 chữ: sao, số lượt đã viết.
- Chữ hay sai: lý do nhiều nhất trong `reasons`, kèm câu gợi ý viết sẵn theo lý do. Ví dụ: *"Bé hay bắt đầu chữ a sai chỗ. Nhắc bé: viết chữ c trước, bắt đầu ở 2 giờ."* (= `vi` của chữ khi lý do là `start` / `reverse`).

## 10. Vẽ, chạm và các trường hợp đặc biệt

### 10.1 Vẽ
- **Một hệ tọa độ:** khung là một `<svg>` (viewBox theo đơn vị chữ) chứa dòng kẻ, chữ mẫu **và nét bé**.
  - Nét bé là `<path>` trong cùng SVG, lưu bằng **đơn vị chữ**. Không dùng canvas riêng, nên mẫu và nét bé không bao giờ lệch nhau khi đổi cỡ (T01).
  - Đổi px → đơn vị bằng `svg.getScreenCTM().inverse()`.
- Nét bé: đầu tròn, dày **9 đơn vị**.
- **Olly viết mẫu:**
  - `stroke-dashoffset` chạy dọc nét mẫu, ~0,8 giây mỗi nét;
  - mũi tên nhỏ chạy ở đầu nét;
  - số thứ tự nét ở điểm bắt đầu.
- **Đúng một nét:** nét bé đổi xanh lá. **Xong chữ:** cả chữ sáng lên, sao bay.
- **Sai:** nét bé mờ dần trong 0,4 giây rồi biến mất. Không rung khung.
- **Giảm chuyển động** (`prefers-reduced-motion`):
  - mẫu hiện ngay cả nét, kèm số thứ tự + mũi tên tĩnh;
  - "tô có dẫn" thay chấm chạy bằng nét mẫu đậm + mũi tên;
  - nét sai biến mất ngay.

### 10.2 Chạm và bút
- Pointer Events, `touch-action: none` trên khung (không cuộn, không phóng to khi viết).
- **Mỗi lúc chỉ một con trỏ:** con trỏ đầu tiên chạm vào khung tạo nét. Con trỏ khác chạm trong lúc đó bị bỏ qua (WR-07).
- **Ưu tiên bút** (khi bật):
  - Sau khi app thấy `pointerType: 'pen'` lần đầu (Apple Pencil, bút stylus Android…), mọi `pointerType: 'touch'` trên khung bị bỏ qua cho tới khi rời màn viết. Bé tì tay lên màn thoải mái.
  - Chưa thấy bút thì ngón tay viết bình thường.
  - App **không** đoán trước máy có bút hay không.
- `setPointerCapture` (bọc `try`) để nét không đứt khi tay ra khỏi khung. Điểm ra ngoài khung bị kẹp vào mép.
- **`pointercancel` / `lostpointercapture`** (hệ điều hành cướp cử chỉ, có cuộc gọi…): **hủy nét đang viết dở** (không chấm, không tính sai) (WR-18).

### 10.3 Bảng trường hợp đặc biệt
| ID | Trường hợp | Xử lý |
|---|---|---|
| T01 | đổi cỡ khung | vẽ lại từ đơn vị chữ; mẫu và nét bé dùng chung SVG nên không lệch |
| T02 | xoay máy / đổi cỡ **giữa lúc đang kéo** | hủy nét đang kéo; giữ các nét đã xong, lượt, số lần sai |
| T03 | ngón tay trượt khỏi màn, `pointercancel` | hủy nét đang kéo |
| T04 | chạm ngắn | phân loại chạm / nét kéo (mục 5.1); chạm chỉ có nghĩa khi đang cần nét chấm |
| T05 | ngưỡng chưa đúng với bé thật | ghi nét thử (mục 12.3), chỉnh `WRITE_LEVELS` |
| T06 | chữ hẹp (i, l) | khung rộng tối thiểu (mục 3.1) |
| T07 | từ dài | xuống hàng (mục 8.2) |
| T08 | bấm ↩️ / 🧽 liên tục | chỉ xóa nét của **lượt đang làm**; không đổi lượt, không đổi số lần sai; hết nét thì nút mờ |
| T09 | tải lại / mất điện | ghi sau mỗi lượt (mục 9.1) |
| T10 | bút không phải Apple Pencil | "Ưu tiên bút" theo `pointerType`, không theo hãng |
| T11 | chữ đã xong mà bé vẫn viết | khung khóa tới lượt sau (mục 5.3) |

## 11. Bố cục và thiết bị
- **iPad ngang (chính):**
  - B1, B2: một khung to giữa màn;
  - C: hai khung cạnh nhau (mẫu nhỏ | ô viết to);
  - nút ↩️ 🧽 ở dưới; ❓ 🔊 ở trên.
- **iPad dọc:** như ngang, khung rộng hơn.
- **iPhone dọc:** C xếp chữ mẫu nhỏ ở trên, ô viết ở dưới.
- Phụ đề 🔊 hiện **trên** khung, không đè lên khung; nút không nằm trong khung.
- Thuận tay trái: không đổi gì; khung để lề hai bên bằng nhau.

## 12. Kiểm thử

### 12.1 Unit
- **`sampleStroke` / `strokeEnds`:**
  - line / arc / bez / dot ra điểm cách đều ~2 đơn vị, `t` tăng từ 0 đến 1;
  - cung `to < from` đi ngược chiều kim đồng hồ: c đi qua phía trên (y nhỏ) trước phía dưới.
- **Dữ liệu 26 chữ:**
  - đủ 26 chữ; mỗi chữ đúng một nhóm;
  - mọi chữ có `say`, `vi`, `strokeVi` đủ số nét; câu tiếng Anh có trong `captions.js`;
  - đoạn liền mạch (≤ 0,5);
  - quy tắc nối nét mục 6.3 (nét chạm nét trước ≤ 6; chấm cách ≥ 12 và nằm trên thân);
  - a d g q: nét thẳng tiếp xúc bụng, hai đầu bụng cách nét thẳng ≤ 4 (WR-13);
  - r n m h b p: đoạn lên trùng đoạn xuống;
  - chữ cao / thấp / có đuôi đúng dòng kẻ;
  - nét trong khung; tách nét thì đi từ trên xuống, ngang thì trái → phải.
- **Chấm nét** — chạy với **mọi nét của 26 chữ**, nét giả lập sinh từ nét mẫu (mục 12.2):

| Nét giả lập | Kết quả (mức Dễ) |
|---|---|
| đúng nét mẫu | đúng |
| đảo ngược | `reverse` (WR-14), kể cả o (khép kín) |
| lệch đều 8 đơn vị | đúng ở Dễ, sai ở Khó |
| bắt đầu lệch 30, phần còn lại đúng | `start` |
| dừng giữa nét (lặp một điểm 50 lần) | đúng (WR-15) |
| rê qua lại ±3 đơn vị ở một đoạn ngắn | đúng (WR-16) |
| chỉ nửa đầu nét | `stray` (lỡ nhấc tay) |
| nét gộp hai nét của t | `stray` |
| chạm khi cần nét kéo | bỏ qua |
| chạm cạnh điểm chấm / nét dài khi cần chấm | đúng / `dot` |

- **Kết quả lượt và sao:**
  - I-I-I → 3⭐;
  - I-H-I → 2⭐;
  - H-H-M → 1⭐ (lượt C `missed`);
  - M-M-I → 1⭐ (chỉ 1/3 lượt I / H);
  - ↩️ nét đúng rồi viết lại không làm lượt thành `helped`.
- **`streak`:** I, I, H, I → 1.
- **Viết từ:**
  - chọn từ có `streak ≥ 2`, chỉ chữ thường;
  - tối đa 2 từ; ít viết trước;
  - *apple* → 5 ô.

### 12.2 Nét giả lập
- Hàm test `fakeStroke(stroke, { reverse, offset, startShift, jitter, pauseAt, cut })` sinh dãy điểm px từ nét mẫu.
- Dùng chung cho unit test và Playwright (`page.mouse` đi theo các điểm).

### 12.3 Ghi nét thử thật
- Góc bố mẹ → ✍️ Tập viết → **"Ghi nét thử"** (bật / tắt, mặc định tắt). Khi bật, mỗi nét bé viết được lưu kèm:
  - chữ, số nét;
  - kết quả máy chấm;
  - các điểm (đơn vị chữ).
- Bố mẹ xem lại từng nét và đánh dấu **"máy chấm sai"**. Xuất file JSON gửi để chỉnh ngưỡng.
- Có unit test chạy bộ chấm trên file mẫu đã đánh dấu: các nét bố mẹ bảo đúng phải được chấm đúng ở mức Dễ.

### 12.4 UI (Playwright)
| ID | Kiểm tra | Mong đợi |
|---|---|---|
| WR-01 | Tab Tập viết | 4 nhóm, 26 thẻ, ⭐ Tiếp theo ở c |
| WR-02 | c: xem → B1, B2, C đúng | 3⭐, `write/letter/c` có 3 `independent`, `streak` 3 |
| WR-03 | Tô ngược chiều | *"Follow the arrow!"*, nét mờ đi, nét đúng trước đó còn |
| WR-04 | Sai 2 lần cùng nét | `strokeVi` đọc **một lần** + tô có dẫn; lần 3 tự hoàn thành; lượt `missed` |
| WR-05 | i | chạm chấm là nét cuối; chạm chấm trước nét thẳng → `start` |
| WR-06 | ↩️ sau nét đúng | nét đó phải viết lại, chấm xanh quay về nét đó |
| WR-07 | Hai ngón chạm cùng lúc | chỉ ngón đầu tạo nét |
| WR-08 | Có bút | sau một nét bút, tay chạm bị bỏ qua |
| WR-09 | Ra nền giữa C rồi quay lại | đúng chữ, lượt C; B1, B2 đã ghi |
| WR-10 | Viết từ | từ có `streak 2` mới hiện; ✅ chỉ sáng khi mọi ô có nét; hiện từ in đúng; `practiced` + 1 |
| WR-11 | Giảm chuyển động | mẫu tĩnh có số + mũi tên; vẫn chấm, sửa được |
| WR-12 | iPhone dọc / iPad ngang | khung ≥ 200 / 260 px, không bị nút / phụ đề che |
| WR-13 | a, d | (unit) nét thẳng tiếp xúc bụng |
| WR-14 | Viết o ngược chiều | `reverse` |
| WR-15 | Dừng giữa nét 1 giây | vẫn đúng |
| WR-16 | Rê bút qua lại nhỏ | vẫn đúng |
| WR-17 | Viết thêm sau khi chữ xong | bỏ qua, không đổi kết quả |
| WR-18 | `pointercancel` giữa nét | nét dở bị hủy, không tính sai |
| WR-19 | Đổi cỡ khung giữa lượt (giả lập xoay máy) | nét đã xong vẽ đúng chỗ, chấm tiếp đúng |
| WR-20 | Hình 26 chữ | ảnh chụp lưới chữ để bố mẹ duyệt (e, s, f, g, j đúng hình) |
| WR-21 | Viết từ *apple* | 5 ô, hai ô p độc lập |
| WR-22 | 🧽 một ô | chỉ ô đó trống |
| WR-23 | ✍️ Viết lại sau ✅ | xóa hết ô; ✅ lần 2 → `practiced` + 1 nữa, không mất lần trước |
| WR-24 | Tải lại giữa chữ | lượt đã xong vẫn trong `write/letter/<chữ>`; không có sao, `plays` không đổi |

### 12.5 Thử tay (bố mẹ + bé)
- Đợt prototype: bé viết 8 chữ c a d l t m g z, mỗi chữ vài lần, bằng ngón tay và bằng bút nếu có.
- Bật "Ghi nét thử" (mục 12.3). Đánh dấu lần nào app chấm sai.

## 13. Đợt làm

| Đợt | Phạm vi | Bản |
|---|---|---|
| **W-a0 — prototype** | dữ liệu + bộ chấm + màn một chữ (A, B1, B2, C, phản hồi, tô có dẫn) cho **8 chữ c a d l t m g z** · tab Tập viết hiện 8 chữ này · ghi nét thử · cài đặt độ dễ + ưu tiên bút · sao, tiến độ chữ | 0.7.0 |
| — | bé thử thật, chỉnh ngưỡng `WRITE_LEVELS` từ nét đã ghi | — |
| **W-a — đủ 26 chữ** | thêm 18 chữ còn lại + câu EN / VI · WR-20 ảnh lưới chữ · đổi font chữ đọc (mục 6.5) | 0.7.1 |
| **W-b** | Viết từ cuối bài Spell · Góc bố mẹ → Tiến độ chữ · mức sau của chữ đã 3 sao | 0.7.2 |

- 8 chữ prototype phủ đủ kiểu nét: cong (c), bụng + thẳng (a, d), thẳng (l), hai nét chéo nhau (t), xuống – lên lại – vòng (m), đuôi móc (g), nét ngang + xiên (z).
- Chữ hoa (nếu cần) để sau W-b.

## 14. Ghi chú kỹ thuật
- Module mới:
  - `app/js/write/letters.js`: dữ liệu chữ, nhóm, câu EN / VI;
  - `app/js/write/stroke.js`: `sampleStroke`, `strokeEnds`, `prepareInput`, `dtw`, `judgeStroke(input, template, level)` → `{ ok, reason }`, `turnResult`, `letterStars` — hàm thuần, test trong Node;
  - `app/js/write/pad.js`: khung SVG, pointer, vẽ mẫu;
  - màn `screens/write.js`;
  - `read/write-stages.js`: Viết từ.
- DTW trên ~50–150 điểm mỗi bên: dưới 1 ms, chạy ngay khi nhấc tay.
- Không đổi file lõi (`CORE.md`). Thêm file mới vào `sw.js` (test service worker kiểm tra).

## 15. Câu hỏi còn lại cho bố mẹ
1. **Font chữ đọc:** đổi ô chữ / từ ở Read, Spell, Viết từ sang **Andika** (a, g một tầng, giống chữ bé tập viết), giữ Nunito cho nút và tiếng Việt? Hay giữ Nunito (*a* hai tầng) và chấp nhận chữ in khác chữ viết tay? (Đề xuất: đổi sang Andika ở 0.7.1.)
