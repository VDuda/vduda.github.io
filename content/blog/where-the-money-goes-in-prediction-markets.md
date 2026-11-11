---
title: "Where the Money Goes in Prediction Markets"
subtitle: "72 million Kalshi trades, 8 charts, 5 minutes."
description: "A data-first look at 72 million Kalshi trades: market accuracy, longshot returns, the maker–taker gap across categories, and how that gap shifted as the market grew."
date: 2026-02-02
tags: [prediction-markets, kalshi, data]
draft: false
---

*72 million Kalshi trades, 8 charts, 5 minutes.*

Las Vegas Strip slot machines return about 93¢ on the dollar; some Kalshi longshots have returned as little as 43¢. That comparison opens [Jon Becker's *The Microstructure of Wealth Transfer in Prediction Markets*](https://www.jbecker.dev/research/prediction-market-microstructure), a study of 72.1 million trades covering $18.26 billion in volume, from June 2021 through November 2025 (Q4 2025 is partial). I wanted the short version: who puts money in, and who gets it back? Eight charts do most of the work.

Prices are well calibrated except at the extremes: cheap longshots tend to win less often than their prices imply. The 45-degree dashed line is perfect calibration; actual win rates track it closely until the tails. Sports accounts for 72% of notional volume, so this is largely a sports market in the sample.

{{< becker-chart type="calibration" title="Actual Win Rate vs Contract Price" data="data/becker/actual_win_rate_vs_contract_price.json" >}}

{{< becker-chart type="category" title="Kalshi Volume Distribution by Category" data="data/becker/market_categories_treemap.json" >}}

{{< becker-chart type="sample" title="Sample: Trades by Price Bucket" data="data/becker/sample_size_by_price.json" >}}

## Who wins, who loses

{{< becker-chart type="maker-price" title="Maker and Taker Returns by Contract Price" data="data/becker/maker_vs_taker_returns.json" >}}

A maker leaves an order on the book; a taker accepts an order already sitting there, so the distinction is how the trade happens rather than which outcome someone predicts. Average excess returns per trade were −1.12% for takers and +1.12% for makers, before platform fees. Takers have negative excess returns at 80 of 99 price levels, with makers positive at those same levels. The losses appear across most of the price range, with the sharpest relative mispricing at the extremes.

## The optimism tax

{{< becker-chart type="yes-no" title="Historical YES and NO Returns at Equal Cost" data="data/becker/longshot_ev_asymmetry.json" >}}

At a purchase price of 1¢, YES contracts show a historical expected return of roughly −41%; NO contracts bought for the same 1¢ show roughly +23%. Equal cost matters here: the comparison uses the money risked on each position, with both maker and taker positions included. NO outperforms YES at 69 of 99 prices, including every price from 1¢ to 10¢ and from 91¢ to 99¢. That gap is the optimism tax: a costly preference for the affirmative outcome, especially among longshots.

## It depends on what you bet on

{{< becker-chart type="category-gap" title="Maker–Taker Gap by Category" data="data/becker/maker_taker_returns_by_group.json" >}}

Finance has a maker–taker gap of just 0.17 percentage points; Politics follows at 1.02, Sports at 2.23, and Crypto at 2.69. Media and World Events both exceed 7 percentage points, putting them at the other end of the category comparison. Sports sits between those extremes but carries most of the volume. Participant selection may help explain the gap: dry financial questions attract a different crowd from questions about teams, celebrities, or headlines.

## When it flipped

{{< becker-chart type="volume" title="Kalshi Quarterly Volume" data="data/becker/kalshi_quarterly_volume.json" >}}

{{< becker-chart type="gap-over-time" title="Maker-Taker Returns Over Time" data="data/becker/maker_taker_gap_over_time.json" >}}

Takers were initially ahead: from launch through 2023, their average excess return was about +2%, while makers averaged −2%. The reversal began in the second quarter of 2024 and widened after the October court victory over the CFTC and the election. Quarterly volume rose from $74 million in Q3 2024 to $1.73 billion in Q4, alongside growing participation by sophisticated market makers. The average gap swung about 5.3 percentage points toward makers between the pre-election and post-election periods; the advantage changed as the platform grew.

The market is accurate, but someone pays for it. The same maker–taker pattern appears on Polymarket in [Reichenbach and Walther (2025)](https://ssrn.com/abstract=5910522).

*Data and analysis: Jon Becker. Charts regenerated from his [open-source repo](https://github.com/Jon-Becker/prediction-market-analysis) (MIT).*

*[Paper](https://www.jbecker.dev/research/prediction-market-microstructure) · [Repo](https://github.com/Jon-Becker/prediction-market-analysis) · [Later SSRN version](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7217640) (August 2026)*
