"""Logic tìm chênh lệch giá giữa các sàn, đã trừ phí. Hàm thuần — dễ test, không gọi mạng."""
from __future__ import annotations

from dataclasses import dataclass
from itertools import permutations

from .exchanges import Quote


@dataclass(frozen=True)
class Opportunity:
    symbol: str
    buy_on: str
    sell_on: str
    buy_price: float     # ask ở sàn mua
    sell_price: float    # bid ở sàn bán
    gross_pct: float     # chênh lệch thô, chưa trừ phí
    net_pct: float       # sau phí taker 2 đầu + chi phí chuyển coin (ước tính)
    max_qty: float       # khối lượng tối đa ở top-of-book cả hai phía
    est_profit_quote: float  # lợi nhuận ước tính (đơn vị quote, vd USDT) với max_qty


def find_opportunities(
    quotes: list[Quote],
    taker_fee: dict[str, float],
    transfer_cost_pct: float = 0.0,
    min_net_pct: float = 0.0,
) -> list[Opportunity]:
    """
    Với mỗi cặp sàn (A, B): MUA ở ask của A, BÁN ở bid của B.

    net = (bid_B * (1 - fee_B) - ask_A * (1 + fee_A)) / (ask_A * (1 + fee_A)) - transfer_cost

    transfer_cost_pct: chi phí rút/chuyển coin giữa sàn quy ra % (rất quan trọng —
    thường là thứ "ăn" hết lợi nhuận). Đặt 0 nếu bạn đã có sẵn số dư ở cả hai sàn.
    """
    by_symbol: dict[str, list[Quote]] = {}
    for q in quotes:
        if q.bid > 0 and q.ask > 0:
            by_symbol.setdefault(q.symbol, []).append(q)

    out: list[Opportunity] = []
    for symbol, qs in by_symbol.items():
        for a, b in permutations(qs, 2):
            if a.exchange == b.exchange:
                continue
            fa = taker_fee.get(a.exchange, 0.001)
            fb = taker_fee.get(b.exchange, 0.001)
            cost = a.ask * (1 + fa)
            proceeds = b.bid * (1 - fb)
            gross = (b.bid - a.ask) / a.ask * 100
            net = (proceeds - cost) / cost * 100 - transfer_cost_pct
            if net < min_net_pct:
                continue
            qty = min(a.ask_qty, b.bid_qty)
            out.append(Opportunity(
                symbol=symbol, buy_on=a.exchange, sell_on=b.exchange,
                buy_price=a.ask, sell_price=b.bid,
                gross_pct=gross, net_pct=net, max_qty=qty,
                est_profit_quote=qty * cost * net / 100,
            ))
    out.sort(key=lambda o: o.net_pct, reverse=True)
    return out
