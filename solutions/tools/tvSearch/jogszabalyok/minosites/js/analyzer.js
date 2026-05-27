import { ANNUAL_CAPS, CERTIFICATE_HINTS } from "./data.js";
import { dayCountInclusive, formatDate } from "./parser.js";
import {
  matchRuleByTitle,
  suggestedClassification,
  minberMultiplierForRow,
  proportionalMinberForPeriod
} from "./rules.js";

function overlaps(a, b) {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

function rowWageTotal(row) {
  if (row.totalWage > 0) return row.totalWage;
  return row.regularWage + row.irregularWage;
}

function sameEmployer(a, b) {
  if (!a.employer || !b.employer) return true;
  return a.employer.trim().toLowerCase() === b.employer.trim().toLowerCase();
}

function sameTitleLike(a, b) {
  if (!a.title || !b.title) return true;
  const aa = a.title.trim().toLowerCase();
  const bb = b.title.trim().toLowerCase();
  return aa.includes(bb) || bb.includes(aa);
}

export function analyzeTables({ serviceRows, wageRows, gender }) {
  const rows = serviceRows
    .map((row) => ({ ...row, issues: [], badges: [], overlap: false }))
    .sort((a, b) => a.startDate - b.startDate);

  const allIssues = [];
  let overlapCount = 0;
  let gapCount = 0;
  let minberUnderCount = 0;
  let capOverCount = 0;
  let splitCount = 0;
  let certCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rule = matchRuleByTitle(row.title);
    row.rule = rule;
    row.suggested = suggestedClassification(rule, gender);
    row.dayCount = dayCountInclusive(row.startDate, row.endDate);

    if (i > 0) {
      const prev = rows[i - 1];
      if (row.startDate <= prev.endDate) {
        row.overlap = true;
        prev.overlap = true;
        overlapCount += 1;

        const message = `Átfedés: ${formatDate(prev.startDate)} - ${formatDate(prev.endDate)} és ${formatDate(row.startDate)} - ${formatDate(row.endDate)}. Javaslat: kézi feloldás A/B módszerrel a prioritás szerint.`;
        row.issues.push(message);
        allIssues.push({ severity: "high", row, message });
      }

      const dayAfterPrev = new Date(prev.endDate.getTime() + 86400000);
      if (row.startDate > dayAfterPrev) {
        gapCount += 1;
        const message = `Luk a jogviszonyok között: ${formatDate(dayAfterPrev)} - ${formatDate(new Date(row.startDate.getTime() - 86400000))}.`;
        row.issues.push(message);
        allIssues.push({ severity: "medium", row, message });
      }
    }

    const matchedWages = wageRows.filter((wage) => overlaps(row, wage) && sameEmployer(row, wage) && sameTitleLike(row, wage));
    row.matchedWage = matchedWages.reduce((sum, item) => sum + rowWageTotal(item), 0);

    if (rule.minberCheck) {
      const multiplier = minberMultiplierForRow(row, rule);
      const threshold = proportionalMinberForPeriod(row.startDate, row.endDate, multiplier);
      row.minberThreshold = threshold;
      row.multiplier = multiplier;

      if (threshold > 0 && row.matchedWage < threshold) {
        minberUnderCount += 1;
        const percent = multiplier === 0.3 ? "30%" : "100%";
        const message = `Minbér-küszöb alatt (${percent}): bér ${Math.round(row.matchedWage).toLocaleString("hu-HU")} Ft, küszöb ${Math.round(threshold).toLocaleString("hu-HU")} Ft.`;
        row.issues.push(message);
        row.badges.push({ type: "warn", text: "Kevés bér" });
        allIssues.push({ severity: "high", row, message });
      }
    }

    if (row.fnyszDays > 30 || (rule.id === "unpaid_leave" && row.dayCount > 30)) {
      splitCount += 1;
      const fnysz = row.fnyszDays > 0 ? row.fnyszDays : row.dayCount;
      const deducted = Math.max(fnysz - 30, 0);
      const suggestedDays = row.dayCount - deducted;
      const message = `FNYSZ bontás/javítás szükséges: FNYSZ nap ${fnysz}, levonandó ${deducted}, javasolt beszámítható nap ${suggestedDays}.`;
      row.issues.push(message);
      row.badges.push({ type: "warn", text: "FNYSZ bontás" });
      allIssues.push({ severity: "high", row, message });
    }

    if (CERTIFICATE_HINTS[rule.id]) {
      certCount += 1;
      const message = `Igazolás javasolt: ${CERTIFICATE_HINTS[rule.id]}.`;
      row.issues.push(message);
      allIssues.push({ severity: "low", row, message });
    }

    if (row.statusState === "pending") {
      row.issues.push(`Minősítés javaslat: ${row.suggested}.`);
    } else if (row.statusState === "accepted" && row.suggested === "--") {
      row.issues.push("Jelenleg elfogadott, de szabály szerint kieső (--) minősítés valószínű.");
    } else if (row.statusState === "rejected" && row.suggested !== "--") {
      row.issues.push(`Jelenleg elutasított, de szabály szerint ${row.suggested} minősítés lehet indokolt.`);
    }

    if (row.overlap) {
      row.badges.push({ type: "warn", text: "Átfedés" });
    }
  }

  const yearlyWageMap = {};
  rows.forEach((row) => {
    const year = row.startDate.getUTCFullYear();
    yearlyWageMap[year] = (yearlyWageMap[year] || 0) + row.matchedWage;
  });

  Object.entries(yearlyWageMap).forEach(([yearStr, total]) => {
    const year = Number(yearStr);
    const cap = ANNUAL_CAPS[year];
    if (!cap) return;

    if (total > cap) {
      capOverCount += 1;
      const overflow = total - cap;
      const message = `${year}: éves járulékplafon felett. Bér ${Math.round(total).toLocaleString("hu-HU")} Ft, plafon ${cap.toLocaleString("hu-HU")} Ft, túlcsordulás ${Math.round(overflow).toLocaleString("hu-HU")} Ft.`;
      allIssues.push({ severity: "medium", row: null, message });
    }
  });

  return {
    rows,
    issues: allIssues,
    summary: {
      rowCount: rows.length,
      overlapCount,
      gapCount,
      minberUnderCount,
      capOverCount,
      splitCount,
      certCount
    }
  };
}
