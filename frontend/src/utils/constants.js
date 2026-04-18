/**
 * Application-wide constants
 */

// Time constants
export const DAYS_PER_YEAR = 365;
export const DAYS_PER_MONTH = 30;
export const HOURS_PER_DAY = 24;
export const TRADING_DAYS_PER_YEAR = 252;

// Options calculation defaults
export const DEFAULT_RISK_FREE_RATE = 0.05;
export const DEFAULT_IV = 0.3;
export const MIN_IV = 0.01;
export const MAX_IV = 5.0;

// UI/Display constants
export const MAX_STRIKES_DISPLAY = 50;
export const DEFAULT_PRICE_RANGE = 0.35;
export const CHART_POINTS = 100;

// Calculation thresholds
export const MIN_TIME_TO_EXPIRY = 0.0027; // ~1 day in years
export const MAX_TIME_TO_EXPIRY = 3; // 3 years

// Formatting
export const CURRENCY_DECIMALS = 2;
export const PERCENT_DECIMALS = 2;
export const GREEK_DECIMALS = 4;
