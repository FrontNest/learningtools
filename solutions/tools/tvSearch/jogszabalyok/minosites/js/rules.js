import { RULES, MEGBIZAS_30_PATTERNS, MIN_WAGE_INTERVALS } from "./data.js";
import { dayCountInclusive, normalizeText } from "./parser.js";

function parseISODate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function overlapDays(aStart, aEnd, bStart, bEnd) {
  const start = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const end = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
  if (start > end) return 0;
  return dayCountInclusive(start, end);
}

export function matchRuleByTitle(title) {
  const normalized = normalizeText(title);
  let best = RULES[RULES.length - 1];

  for (const rule of RULES) {
    const matched = rule.titlePatterns.some((pattern) => normalized.includes(normalizeText(pattern)));
    if (matched && rule.priority < best.priority) {
      best = rule;
    }
  }

  return best;
}

export function suggestedClassification(rule, gender) {
  return rule.classification[gender] || rule.classification.default || "N";
}

export function getMinWageForDate(date) {
  for (const interval of MIN_WAGE_INTERVALS) {
    const from = parseISODate(interval.from);
    const to = parseISODate(interval.to);
    if (date >= from && date <= to) return interval.value;
  }
  return null;
}

export function minberMultiplierForRow(row, rule) {
  if (!rule.minberCheck) return 0;

  if (rule.id === "ev_tarsas") return 1.0;

  const is1997Plus = row.startDate >= new Date(Date.UTC(1997, 0, 1));
  const normalized = normalizeText(row.title);
  const isMegbizasLike = MEGBIZAS_30_PATTERNS.some((pattern) => normalized.includes(normalizeText(pattern)));

  if (is1997Plus && isMegbizasLike) return 0.3;
  return 1.0;
}

export function proportionalMinberForPeriod(startDate, endDate, multiplier) {
  let threshold = 0;

  for (const interval of MIN_WAGE_INTERVALS) {
    const from = parseISODate(interval.from);
    const to = parseISODate(interval.to);
    const days = overlapDays(startDate, endDate, from, to);
    if (days > 0) {
      threshold += (interval.value / 30) * days * multiplier;
    }
  }

  return threshold;
}
