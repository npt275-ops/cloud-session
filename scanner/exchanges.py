"""Lấy giá bid/ask (top of book) từ API công khai của các sàn. Chỉ đọc, không cần API key."""
from __future__ import annotations

import json
import urllib.request
from dataclasses import dataclass


@dataclass(frozen=True)
class Quote:
    exchange: str
    symbol: str      # dạng chuẩn hoá: "BTC/USDT"
    bid: float       # giá cao nhất người mua sẵn sàng trả (bạn BÁN ở giá này)
    ask: float       # giá thấp nhất người bán chấp nhận (bạn MUA ở giá này)
    bid_qty: float
    ask_qty: float


def _get(url: str, timeout: float = 8.0) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "spread-scanner/0.1"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _split(symbol: str) -> tuple[str, str]:
    base, quote = symbol.upper().split("/")
    return base, quote


def binance(symbol: str) -> Quote:
    b, q = _split(symbol)
    d = _get(f"https://api.binance.com/api/v3/ticker/bookTicker?symbol={b}{q}")
    return Quote("binance", symbol, float(d["bidPrice"]), float(d["askPrice"]),
                 float(d["bidQty"]), float(d["askQty"]))


def okx(symbol: str) -> Quote:
    b, q = _split(symbol)
    d = _get(f"https://www.okx.com/api/v5/market/ticker?instId={b}-{q}")["data"][0]
    return Quote("okx", symbol, float(d["bidPx"]), float(d["askPx"]),
                 float(d["bidSz"]), float(d["askSz"]))


def bybit(symbol: str) -> Quote:
    b, q = _split(symbol)
    d = _get(f"https://api.bybit.com/v5/market/tickers?category=spot&symbol={b}{q}")
    d = d["result"]["list"][0]
    return Quote("bybit", symbol, float(d["bid1Price"]), float(d["ask1Price"]),
                 float(d["bid1Size"]), float(d["ask1Size"]))


def kraken(symbol: str) -> Quote:
    b, q = _split(symbol)
    b = {"BTC": "XBT"}.get(b, b)
    d = _get(f"https://api.kraken.com/0/public/Ticker?pair={b}{q}")
    if d.get("error"):
        raise RuntimeError(f"kraken: {d['error']}")
    t = next(iter(d["result"].values()))
    # Kraken: a = [ask, whole_lot_volume, lot_volume], b = [bid, ...]
    return Quote("kraken", symbol, float(t["b"][0]), float(t["a"][0]),
                 float(t["b"][2]), float(t["a"][2]))


FETCHERS = {"binance": binance, "okx": okx, "bybit": bybit, "kraken": kraken}
