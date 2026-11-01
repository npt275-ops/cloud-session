"""CLI: python -m scanner --config config.json"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from .core import find_opportunities
from .exchanges import FETCHERS, Quote


def fetch_all(exchanges: list[str], symbols: list[str]) -> tuple[list[Quote], list[str]]:
    jobs = [(e, s) for e in exchanges for s in symbols]
    quotes, errors = [], []
    with ThreadPoolExecutor(max_workers=min(16, len(jobs) or 1)) as ex:
        futs = {ex.submit(FETCHERS[e], s): (e, s) for e, s in jobs}
        for f, (e, s) in futs.items():
            try:
                quotes.append(f.result())
            except Exception as err:  # một sàn lỗi không làm dừng cả vòng quét
                errors.append(f"{e} {s}: {type(err).__name__}: {err}")
    return quotes, errors


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Quét chênh lệch giá crypto giữa các sàn (chỉ đọc).")
    p.add_argument("--config", default="config.json")
    p.add_argument("--once", action="store_true", help="Quét một lần rồi thoát")
    args = p.parse_args(argv)

    cfg = json.loads(Path(args.config).read_text())
    exchanges = [e for e in cfg["exchanges"] if e in FETCHERS]
    log_path = cfg.get("log_csv")

    while True:
        quotes, errors = fetch_all(exchanges, cfg["symbols"])
        opps = find_opportunities(
            quotes,
            taker_fee=cfg.get("taker_fee", {}),
            transfer_cost_pct=cfg.get("transfer_cost_pct", 0.0),
            min_net_pct=cfg.get("alert_net_pct", 0.2),
        )
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now}] {len(quotes)} giá, {len(opps)} cơ hội ≥ {cfg.get('alert_net_pct', 0.2)}%")
        for e in errors:
            print(f"   ! {e}", file=sys.stderr)
        for o in opps:
            print(f"   >> {o.symbol}: mua {o.buy_on} @{o.buy_price:g} → bán {o.sell_on} "
                  f"@{o.sell_price:g} | thô {o.gross_pct:+.3f}% | ròng {o.net_pct:+.3f}% "
                  f"| qty {o.max_qty:g} | ~{o.est_profit_quote:.2f}")
        if log_path and opps:
            new = not Path(log_path).exists()
            with open(log_path, "a", newline="") as fh:
                w = csv.writer(fh)
                if new:
                    w.writerow(["ts", "symbol", "buy_on", "sell_on", "buy", "sell",
                                "gross_pct", "net_pct", "qty", "est_profit"])
                for o in opps:
                    w.writerow([now, o.symbol, o.buy_on, o.sell_on, o.buy_price, o.sell_price,
                                round(o.gross_pct, 4), round(o.net_pct, 4), o.max_qty,
                                round(o.est_profit_quote, 4)])
        if args.once:
            return 0
        time.sleep(cfg.get("interval_sec", 10))


if __name__ == "__main__":
    raise SystemExit(main())
