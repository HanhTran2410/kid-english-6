# Âm rời phonics — app/sounds/phonics/ (SPEC mục 3.1.1)

Mỗi file là **âm** của chữ (letter sound), không phải tên chữ. Giọng đọc của máy không đọc được âm rời, nên app luôn phát các file này.

Cách làm: cắt đoạn trong bản ghi gốc (ghép 2 đoạn nếu có ghi), lọc tiếng trầm dưới 120 Hz, nhỏ dần hai đầu, chỉnh độ to (âm kéo dài khoảng −19,5 dB, âm bật khoảng −22 dB, giới hạn đỉnh), xuất mp3 mono 64 kbps (ffmpeg). Âm bật (t, p, k, d, g, b) lặp 3 lần, cách nhau 0,25 giây. Đoạn cắt (giây) ghi trong bảng để làm lại được.

Bản đã cắt của file CC BY-SA 3.0 cũng theo giấy phép **CC BY-SA 3.0**. Bố mẹ đã nghe duyệt: nhóm 1 ngày 2026-10-26 (ở kid-english), nhóm 2–3 ngày 2026-11-06.

| File | Âm | Nguồn (đoạn cắt) | Tác giả | Giấy phép |
|---|---|---|---|---|
| s.mp3 | s | https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_sibilant.ogg (0,24–0,445 + 1,70–1,965, ghép) | Peter Isotalo | CC BY-SA 3.0 |
| a.mp3 | a | https://commons.wikimedia.org/wiki/File:Near-open_front_unrounded_vowel.ogg (0,03–0,54) | Denelson83 | CC BY-SA 3.0 |
| t.mp3 | t | https://commons.wikimedia.org/wiki/File:En-us-tap.ogg (0,068–0,138, lặp 3 lần) | Dvortygirl | Public domain (theo ghi chép của kid-english) |
| i.mp3 | i | https://commons.wikimedia.org/wiki/File:Near-close_near-front_unrounded_vowel.ogg (0,02–0,52) | Denelson83 | CC BY-SA 3.0 |
| p.mp3 | p | https://commons.wikimedia.org/wiki/File:En-us-pin.ogg (0,338–0,396, lặp 3 lần) | Dvortygirl | Public domain (theo ghi chép của kid-english) |
| n.mp3 | n | https://commons.wikimedia.org/wiki/File:Alveolar_nasal.ogg (0,25–0,495 + 1,47–1,715, ghép) | Wikimedia Commons (IPA) | CC BY-SA 3.0 |
| k.mp3 | c, k, ck | https://commons.wikimedia.org/wiki/File:En-us-kit.ogg (0,035–0,125: bật hơi đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| e.mp3 | e | https://commons.wikimedia.org/wiki/File:Open-mid_front_unrounded_vowel.ogg (0,03–0,50) | Denelson83 | CC BY-SA 3.0 |
| h.mp3 | h | https://commons.wikimedia.org/wiki/File:Voiceless_glottal_fricative.ogg (0,22–0,44 + 1,38–1,60, ghép) | Peter Isotalo | CC BY-SA 3.0 |
| r.mp3 | r | https://commons.wikimedia.org/wiki/File:Alveolar_approximant.ogg (0,29–0,46) | Erutuon | CC BY-SA 3.0 |
| m.mp3 | m | https://commons.wikimedia.org/wiki/File:Bilabial_nasal.ogg (0,20–0,37 + 1,26–1,47, ghép) | Peter Isotalo | CC BY-SA 3.0 |
| d.mp3 | d | https://commons.wikimedia.org/wiki/File:En-us-dot.ogg (0,025–0,085: bật đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| g.mp3 | g | https://commons.wikimedia.org/wiki/File:En-us-gap.ogg (0,325–0,385: bật đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| o.mp3 | o | https://commons.wikimedia.org/wiki/File:Open_back_rounded_vowel.ogg (0,02–0,50; [ɒ] kiểu Anh như Jolly) | Denelson83 | CC BY-SA 3.0 |
| u.mp3 | u | https://commons.wikimedia.org/wiki/File:Open-mid_back_unrounded_vowel.ogg (0,02–0,46) | Denelson83 | CC BY-SA 3.0 |
| l.mp3 | l | https://commons.wikimedia.org/wiki/File:En-us-bell.ogg (0,245–0,40: đuôi "l" của từ bell) | Dvortygirl | CC BY-SA 3.0 |
| f.mp3 | f | https://commons.wikimedia.org/wiki/File:En-us-cliff.ogg (0,545–0,70: đuôi "f" của từ cliff) | Dvortygirl | CC BY-SA 3.0 |
| b.mp3 | b | https://commons.wikimedia.org/wiki/File:En-us-bat.ogg (0,012–0,07: bật đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |

Đã thử và bỏ (bố mẹ nghe thấy lạ / rè): l và f từ bản ghi IPA của Peter Isotalo; l, f kéo giãn từ đầu từ *leg, lip, fish*, cuối từ *leaf*, từ *failure*.
