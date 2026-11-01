# Spread Scanner — bot tìm chênh lệch giá crypto giữa các sàn

Bot **chỉ đọc**: lấy giá bid/ask công khai từ Binance, OKX, Bybit, Kraken, tính chênh lệch
**sau khi trừ phí** và báo khi vượt ngưỡng. Không cần API key, không tự đặt lệnh,
không đụng tới tiền của bạn.

## Chạy

```bash
cp config.example.json config.json
python3 -m scanner --config config.json          # quét liên tục
python3 -m scanner --config config.json --once   # quét 1 lần
python3 -m unittest -v                           # chạy test
```

Chỉ cần Python 3.10+, không có thư viện ngoài.

## Cấu hình (`config.json`)

| Khoá | Ý nghĩa |
|---|---|
| `exchanges` / `symbols` | Các sàn và cặp cần quét, dạng `BASE/QUOTE` |
| `taker_fee` | Phí taker từng sàn (0.001 = 0.1%). **Điền theo hạng tài khoản thật của bạn.** |
| `transfer_cost_pct` | Chi phí rút/chuyển coin giữa sàn, quy ra %. Để 0 nếu đã có sẵn tiền ở cả hai sàn. |
| `alert_net_pct` | Chỉ báo khi lợi nhuận ròng ≥ ngưỡng này (%) |
| `log_csv` | File CSV ghi lại mọi cơ hội tìm được, để phân tích sau |

## Công thức

Mua ở giá **ask** của sàn A, bán ở giá **bid** của sàn B:

```
ròng% = (bid_B·(1−phí_B) − ask_A·(1+phí_A)) / (ask_A·(1+phí_A)) · 100 − transfer_cost_pct
```

## Thực tế cần biết trước khi kỳ vọng

- Với coin lớn (BTC, ETH), chênh lệch ròng giữa các sàn lớn **gần như luôn âm hoặc ~0**,
  vì có rất nhiều bot chuyên nghiệp đã san phẳng nó. Cơ hội thường chỉ xuất hiện ở coin
  thanh khoản thấp, lúc thị trường biến động mạnh, hoặc khi một sàn tạm khoá nạp/rút.
- Chênh lệch "đẹp" thường là **cái bẫy**: sàn đó đang khoá rút coin, mạng bị nghẽn,
  hoặc sổ lệnh quá mỏng (xem cột `qty`).
- Giá có thể đổi ngay trong lúc bạn chuyển coin → rủi ro trượt giá.
- Muốn tự động đặt lệnh thì cần có sẵn số dư ở cả hai sàn, quản lý rủi ro, và tuân thủ
  điều khoản sàn cũng như luật ở nơi bạn sống. Bản này chủ ý **không** làm phần đó.

**Cách dùng đúng:** cho bot chạy vài ngày, ghi `opportunities.csv`, rồi đọc dữ liệu xem
cơ hội có thật, xuất hiện thường xuyên và đủ lớn hay không — trước khi bỏ tiền vào.
