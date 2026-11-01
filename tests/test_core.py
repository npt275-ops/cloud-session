import unittest

from scanner.core import find_opportunities
from scanner.exchanges import Quote

FEES = {"a": 0.001, "b": 0.001}


def q(ex, bid, ask, qty=1.0, sym="BTC/USDT"):
    return Quote(ex, sym, bid, ask, qty, qty)


class FindOpportunities(unittest.TestCase):
    def test_no_spread_means_no_opportunity(self):
        quotes = [q("a", 100.0, 100.1), q("b", 100.0, 100.1)]
        self.assertEqual(find_opportunities(quotes, FEES), [])

    def test_real_spread_after_fees(self):
        # mua ở a @100, bán ở b @101 -> thô 1%, ròng ≈ 1% - 0.2% phí
        quotes = [q("a", 99.9, 100.0), q("b", 101.0, 101.1)]
        opps = find_opportunities(quotes, FEES)
        self.assertEqual(len(opps), 1)
        o = opps[0]
        self.assertEqual((o.buy_on, o.sell_on), ("a", "b"))
        self.assertAlmostEqual(o.gross_pct, 1.0, places=6)
        expected = (101.0 * 0.999 - 100.0 * 1.001) / (100.0 * 1.001) * 100
        self.assertAlmostEqual(o.net_pct, expected, places=9)

    def test_fees_can_kill_a_gross_spread(self):
        quotes = [q("a", 99.9, 100.0), q("b", 100.15, 100.3)]  # thô 0.15% < 0.2% phí
        self.assertEqual(find_opportunities(quotes, FEES), [])

    def test_transfer_cost_is_subtracted(self):
        quotes = [q("a", 99.9, 100.0), q("b", 101.0, 101.1)]
        base = find_opportunities(quotes, FEES)[0].net_pct
        with_t = find_opportunities(quotes, FEES, transfer_cost_pct=0.5)[0].net_pct
        self.assertAlmostEqual(base - with_t, 0.5, places=9)

    def test_qty_limited_by_thinner_side(self):
        quotes = [Quote("a", "X/USDT", 9.9, 10.0, 5, 3), Quote("b", "X/USDT", 11, 11.1, 2, 9)]
        self.assertEqual(find_opportunities(quotes, FEES)[0].max_qty, 2)

    def test_symbols_never_cross(self):
        quotes = [q("a", 1, 1.01, sym="ETH/USDT"), q("b", 100, 100.1, sym="BTC/USDT")]
        self.assertEqual(find_opportunities(quotes, FEES), [])

    def test_sorted_by_net_and_threshold(self):
        quotes = [q("a", 99.9, 100.0), q("b", 101.0, 101.1), q("c", 102.0, 102.1)]
        fees = {"a": 0.001, "b": 0.001, "c": 0.001}
        opps = find_opportunities(quotes, fees, min_net_pct=0.5)
        self.assertEqual((opps[0].buy_on, opps[0].sell_on), ("a", "c"))
        self.assertTrue(all(o.net_pct >= 0.5 for o in opps))
        self.assertEqual(opps, sorted(opps, key=lambda o: o.net_pct, reverse=True))


if __name__ == "__main__":
    unittest.main()
