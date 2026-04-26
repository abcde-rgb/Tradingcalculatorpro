import React from 'react';
import CandleSVG from './CandleSVG';

/**
 * OHLC blueprints (logical 0..100 price space) for every candlestick
 * pattern referenced in tradingEducationContent.js.
 *
 * Each pattern is an array of { o, h, l, c } candles. Order is left-to-right.
 * Values are designed to match the canonical visual shape of each pattern
 * (e.g. hammer = small body up high + long lower wick; engulfing = the 2nd
 * body fully wraps the 1st). The shapes are intentionally compact so the
 * illustrations stay small inside their cards.
 */
const PATTERN_BLUEPRINTS = {
  // ----- Bullish (single & multi) -----
  hammer: [{ o: 65, h: 72, l: 25, c: 70 }],
  'bullish-engulfing': [
    { o: 70, h: 75, l: 50, c: 55 }, // small bearish
    { o: 50, h: 85, l: 48, c: 80 }, // bigger bullish that engulfs body
  ],
  'morning-star': [
    { o: 80, h: 82, l: 45, c: 50 }, // big bearish
    { o: 42, h: 48, l: 38, c: 44 }, // small body (star)
    { o: 50, h: 90, l: 48, c: 85 }, // big bullish recovers
  ],
  'dragonfly-doji': [{ o: 75, h: 76, l: 30, c: 75 }],
  'three-white-soldiers': [
    { o: 30, h: 50, l: 28, c: 48 },
    { o: 47, h: 68, l: 45, c: 65 },
    { o: 64, h: 88, l: 62, c: 86 },
  ],

  // ----- Bearish (single & multi) -----
  'shooting-star': [{ o: 35, h: 80, l: 33, c: 38 }],
  'bearish-engulfing': [
    { o: 50, h: 70, l: 48, c: 65 }, // small bullish
    { o: 70, h: 72, l: 40, c: 45 }, // big bearish engulfs
  ],
  'evening-star': [
    { o: 20, h: 55, l: 18, c: 50 }, // big bullish
    { o: 56, h: 60, l: 52, c: 58 }, // star body small
    { o: 50, h: 52, l: 15, c: 18 }, // big bearish drop
  ],
  'gravestone-doji': [{ o: 25, h: 70, l: 24, c: 25 }],
  'three-black-crows': [
    { o: 70, h: 72, l: 50, c: 52 },
    { o: 53, h: 55, l: 32, c: 35 },
    { o: 36, h: 38, l: 12, c: 14 },
  ],

  // ----- Neutral / Indecision -----
  doji: [{ o: 50, h: 75, l: 25, c: 50 }],
  'spinning-top': [{ o: 48, h: 75, l: 25, c: 52 }],
};

/**
 * Render the candle illustration for a given pattern id.
 *
 * Sizing strategy:
 *   - Each candle is 24×80 px → very compact.
 *   - 1-candle patterns: 24×80
 *   - 2-candle patterns: 56×80
 *   - 3-candle patterns: 84×80
 */
const CandlePatternFigure = ({ patternId, className = '' }) => {
  const candles = PATTERN_BLUEPRINTS[patternId];
  if (!candles) return null;

  const candleWidth = 24;
  const gap = 4;
  const totalWidth = candles.length * candleWidth + (candles.length - 1) * gap;

  return (
    <div
      className={`flex items-end justify-center gap-1 ${className}`}
      style={{ width: totalWidth, height: 80 }}
      aria-label={`${patternId} candlestick illustration`}
    >
      {candles.map((c, i) => (
        <CandleSVG
          key={`${patternId}-${i}`}
          o={c.o} h={c.h} l={c.l} c={c.c}
          width={candleWidth} height={80}
        />
      ))}
    </div>
  );
};

export default CandlePatternFigure;
