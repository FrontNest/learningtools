(() => {
  const MIN_WAGE_INTERVALS = [
    { from: "1988-01-01", to: "1989-02-28", value: 3000 },
    { from: "1989-03-01", to: "1989-09-30", value: 3700 },
    { from: "1989-10-01", to: "1990-01-31", value: 4000 },
    { from: "1990-02-01", to: "1990-08-31", value: 4800 },
    { from: "1990-09-01", to: "1990-11-30", value: 5600 },
    { from: "1990-12-01", to: "1991-03-31", value: 5800 },
    { from: "1991-04-01", to: "1991-12-31", value: 7000 },
    { from: "1992-01-01", to: "1993-01-31", value: 8000 },
    { from: "1993-02-01", to: "1994-01-31", value: 9000 },
    { from: "1994-02-01", to: "1995-01-31", value: 10500 },
    { from: "1995-02-01", to: "1996-01-31", value: 12200 },
    { from: "1996-02-01", to: "1996-12-31", value: 14500 },
    { from: "1997-01-01", to: "1997-12-31", value: 17000 },
    { from: "1998-01-01", to: "1998-12-31", value: 19500 },
    { from: "1999-01-01", to: "1999-12-31", value: 22500 },
    { from: "2000-01-01", to: "2000-12-31", value: 25500 },
    { from: "2001-01-01", to: "2001-12-31", value: 40000 },
    { from: "2002-01-01", to: "2003-12-31", value: 50000 },
    { from: "2004-01-01", to: "2004-12-31", value: 53000 },
    { from: "2005-01-01", to: "2005-12-31", value: 57000 },
    { from: "2006-01-01", to: "2006-12-31", value: 62500 },
    { from: "2007-01-01", to: "2007-12-31", value: 65500 },
    { from: "2008-01-01", to: "2008-12-31", value: 69000 },
    { from: "2009-01-01", to: "2009-12-31", value: 71500 },
    { from: "2010-01-01", to: "2010-12-31", value: 73500 },
    { from: "2011-01-01", to: "2011-12-31", value: 78000 },
    { from: "2012-01-01", to: "2012-12-31", value: 93000 },
    { from: "2013-01-01", to: "2013-12-31", value: 98000 },
    { from: "2014-01-01", to: "2014-12-31", value: 101500 },
    { from: "2015-01-01", to: "2015-12-31", value: 105000 },
    { from: "2016-01-01", to: "2016-12-31", value: 111000 },
    { from: "2017-01-01", to: "2017-12-31", value: 127500 },
    { from: "2018-01-01", to: "2018-12-31", value: 138000 },
    { from: "2019-01-01", to: "2019-12-31", value: 149000 },
    { from: "2020-01-01", to: "2021-01-31", value: 161000 },
    { from: "2021-02-01", to: "2021-12-31", value: 167400 },
    { from: "2022-01-01", to: "2022-12-31", value: 200000 },
    { from: "2023-01-01", to: "2023-11-30", value: 232000 },
    { from: "2023-12-01", to: "2024-12-31", value: 266800 },
    { from: "2025-01-01", to: "2026-03-04", value: 290800 }
  ];

  const ANNUAL_CAPS = {
    1993: 915000,
    1994: 912500,
    1995: 912500,
    1996: 915000,
    1997: 1024500,
    1998: 1565850,
    1999: 1854200,
    2000: 2020320,
    2001: 2197300,
    2002: 2368850,
    2003: 3905500,
    2004: 5307000,
    2005: 6000600,
    2006: 6325450,
    2007: 6748850,
    2008: 7137000,
    2009: 7446000,
    2010: 7453300,
    2011: 7665000,
    2012: 7942200
  };

  const RULES = [
    { id: "childcare", priority: 1, minberCheck: false, titlePatterns: ["gyes", "gyed", "tgyas", "csed", "gyap", "gyermek"], classification: { female: "G", male: "G", default: "G" } },
    { id: "sick_pay", priority: 2, minberCheck: false, titlePatterns: ["tappenz", "betegszabadsag", "baleseti tappenz"], classification: { female: "J", male: "N", default: "N" } },
    { id: "unpaid_leave", priority: 3, minberCheck: false, titlePatterns: ["fizetes nelkuli", "fnysz", "igazolt tavollet"], classification: { female: "N", male: "N", default: "N" } },
    { id: "employment_main", priority: 4, minberCheck: false, titlePatterns: ["munkaviszony", "foallas", "40 oras"], classification: { female: "J", male: "N", default: "N" } },
    { id: "ev_tarsas", priority: 4, minberCheck: true, titlePatterns: ["egyeni vallalkozo", "tarsas vallalkozo", "ev foallas", "ev mellekallas"], classification: { female: "J", male: "N", default: "N" } },
    {
      id: "secondary_or_casual",
      priority: 5,
      minberCheck: true,
      titlePatterns: ["mellekallas", "egyszerusitett", "megbizas", "megbizasi jogviszony", "munkavegzesre iranyulo egyeb jogviszony", "felhasznalasi szerzodes", "valasztott tisztsegviselo", "allami projektertekelo", "alkalmi", "efo"],
      classification: { female: "N", male: "N", default: "N" }
    },
    { id: "not_countable", priority: 6, minberCheck: false, titlePatterns: ["nem szamithato", "kizart", "letartoztatas", "igazolatlan tavollet"], classification: { female: "--", male: "--", default: "--" } }
  ];

  const MEGBIZAS_30_PATTERNS = ["munkavegzesre iranyulo egyeb jogviszony", "megbizasi jogviszony", "megbizas", "felhasznalasi szerzodes", "valasztott tisztsegviselo", "allami projektertekelo"];

  const CERTIFICATE_HINTS = {
    ev_tarsas: "NAV + Egészségbiztosítási igazolás + szünetelés/megszűnés igazolása",
    unpaid_leave: "Munkáltatói igazolás az FNYSZ napjairól (30 nap korlát figyelem)",
    secondary_or_casual: "Kifizetői igazolás és járulékalap igazolás",
    not_countable: "Jogcím alapján nem számolható, szükség esetén jogorvoslati irat"
  };

  const HEADER_ALIASES = {
    startDate: ["tol", "tól", "from", "kezdet", "kezdodatum", "kezdo_datum"],
    endDate: ["ig", "to", "veg", "vege", "vegdatum", "vege_datum"],
    employer: ["munkaltato", "munkaltató", "ceg", "cég", "foglalkoztato", "foglalkoztató"],
    title: ["jogcim", "jogcím", "jogviszony", "megnevezes", "megnevezés"],
    status: ["allapot", "állapot", "minosites", "minősítés", "status"],
    days: ["napok", "nap"],
    regularWage: ["rendszeres", "rendszeres_ber", "regular"],
    irregularWage: ["nem_rendszeres", "nemrendszeres", "irregular"],
    totalWage: ["ber", "bér", "osszeg", "összeg", "jovedelem", "jövedelem"],
    fnyszDays: ["fnysz_napok", "fizetes_nelkuli_napok", "fizetés_nélküli_napok"]
  };

  function stripAccents(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function normalizeText(value) {
    return stripAccents(String(value || "")).replace(/_/g, " ");
  }

  function resolveDelimiter(delimiterMode, text) {
    if (delimiterMode === "tab") return "\t";
    if (delimiterMode === "comma") return ",";
    if (delimiterMode === "semicolon") return ";";
    const sampleLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (!sampleLine) return "\t";
    const candidates = ["\t", ";", ","];
    let winner = "\t";
    let bestCount = -1;
    for (const item of candidates) {
      const count = sampleLine.split(item).length;
      if (count > bestCount) {
        bestCount = count;
        winner = item;
      }
    }
    return winner;
  }

  function splitCsvLine(line, delimiter) {
    const out = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (char === delimiter && !inQuotes) {
        out.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    out.push(current.trim());
    return out;
  }

  function parseDate(raw) {
    if (!raw) return null;
    const value = String(raw).trim();
    const ymdDot = value.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.?$/);
    if (ymdDot) return new Date(Date.UTC(Number(ymdDot[1]), Number(ymdDot[2]) - 1, Number(ymdDot[3])));
    const ymdDash = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymdDash) return new Date(Date.UTC(Number(ymdDash[1]), Number(ymdDash[2]) - 1, Number(ymdDash[3])));
    const dmyDot = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
    if (dmyDot) return new Date(Date.UTC(Number(dmyDot[3]), Number(dmyDot[2]) - 1, Number(dmyDot[1])));
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()));
  }

  function parseAmount(raw) {
    if (raw == null || raw === "") return 0;
    const normalized = String(raw).replace(/\s+/g, "").replace(/Ft/gi, "").replace(/\./g, "").replace(/,/g, ".");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : 0;
  }

  function parseStatus(raw) {
    const value = String(raw || "").toLowerCase();
    if (!value || value.includes("?")) return "pending";
    if (value.includes("✓") || value.includes("✔") || value.includes("pipa") || value.includes("zold") || value.includes("zöld")) return "accepted";
    if (value.includes("x") || value.includes("✗") || value.includes("elutasit") || value.includes("elutasít")) return "rejected";
    return "pending";
  }

  function mapHeaderIndex(headers) {
    const normalizedHeaders = headers.map(stripAccents);
    const indexMap = {};
    Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
      const foundIndex = normalizedHeaders.findIndex((header) => aliases.includes(header));
      if (foundIndex >= 0) indexMap[field] = foundIndex;
    });
    return indexMap;
  }

  function parseDelimitedTable(text, delimiterMode) {
    const clean = (text || "").trim();
    if (!clean) return { rows: [], delimiter: "\t", errors: [] };
    const delimiter = resolveDelimiter(delimiterMode, clean);
    const lines = clean.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return { rows: [], delimiter, errors: [] };
    const headers = splitCsvLine(lines[0], delimiter);
    const indexMap = mapHeaderIndex(headers);
    const rows = [];
    const errors = [];

    for (let i = 1; i < lines.length; i += 1) {
      const cols = splitCsvLine(lines[i], delimiter);
      const rawStart = cols[indexMap.startDate] || "";
      const rawEnd = cols[indexMap.endDate] || "";
      const startDate = parseDate(rawStart);
      const endDate = parseDate(rawEnd);
      if (!startDate || !endDate) {
        errors.push(`Sor ${i + 1}: hibás dátum (${rawStart} - ${rawEnd}).`);
        continue;
      }
      rows.push({
        rowNumber: i + 1,
        raw: cols,
        startDate,
        endDate,
        employer: (cols[indexMap.employer] || "").trim(),
        title: (cols[indexMap.title] || "").trim(),
        rawStatus: (cols[indexMap.status] || "").trim(),
        statusState: parseStatus(cols[indexMap.status] || ""),
        daysRaw: parseAmount(cols[indexMap.days] || ""),
        regularWage: parseAmount(cols[indexMap.regularWage] || ""),
        irregularWage: parseAmount(cols[indexMap.irregularWage] || ""),
        totalWage: parseAmount(cols[indexMap.totalWage] || ""),
        fnyszDays: parseAmount(cols[indexMap.fnyszDays] || "")
      });
    }
    return { rows, delimiter, errors };
  }

  function formatDate(date) {
    if (!date) return "";
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}.${m}.${d}.`;
  }

  function dayCountInclusive(startDate, endDate) {
    return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  }

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

  function matchRuleByTitle(title) {
    const normalized = normalizeText(title);
    let best = RULES[RULES.length - 1];
    for (const rule of RULES) {
      const matched = rule.titlePatterns.some((pattern) => normalized.includes(normalizeText(pattern)));
      if (matched && rule.priority < best.priority) best = rule;
    }
    return best;
  }

  function suggestedClassification(rule, gender) {
    return rule.classification[gender] || rule.classification.default || "N";
  }

  function minberMultiplierForRow(row, rule) {
    if (!rule.minberCheck) return 0;
    if (rule.id === "ev_tarsas") return 1;
    const is1997Plus = row.startDate >= new Date(Date.UTC(1997, 0, 1));
    const normalized = normalizeText(row.title);
    const isMegbizasLike = MEGBIZAS_30_PATTERNS.some((pattern) => normalized.includes(normalizeText(pattern)));
    return is1997Plus && isMegbizasLike ? 0.3 : 1;
  }

  function proportionalMinberForPeriod(startDate, endDate, multiplier) {
    let threshold = 0;
    for (const interval of MIN_WAGE_INTERVALS) {
      const from = parseISODate(interval.from);
      const to = parseISODate(interval.to);
      const days = overlapDays(startDate, endDate, from, to);
      if (days > 0) threshold += (interval.value / 30) * days * multiplier;
    }
    return threshold;
  }

  function overlaps(a, b) {
    return a.startDate <= b.endDate && b.startDate <= a.endDate;
  }

  function rowWageTotal(row) {
    return row.totalWage > 0 ? row.totalWage : row.regularWage + row.irregularWage;
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

  function analyzeTables({ serviceRows, wageRows, gender }) {
    const rows = serviceRows.map((row) => ({ ...row, issues: [], badges: [], overlap: false })).sort((a, b) => a.startDate - b.startDate);
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

      if (row.overlap) row.badges.push({ type: "warn", text: "Átfedés" });
    }

    const yearlyWageMap = {};
    rows.forEach((row) => {
      const year = row.startDate.getUTCFullYear();
      yearlyWageMap[year] = (yearlyWageMap[year] || 0) + row.matchedWage;
    });

    Object.entries(yearlyWageMap).forEach(([yearStr, total]) => {
      const year = Number(yearStr);
      const cap = ANNUAL_CAPS[year];
      if (cap && total > cap) {
        capOverCount += 1;
        const overflow = total - cap;
        allIssues.push({
          severity: "medium",
          row: null,
          message: `${year}: éves járulékplafon felett. Bér ${Math.round(total).toLocaleString("hu-HU")} Ft, plafon ${cap.toLocaleString("hu-HU")} Ft, túlcsordulás ${Math.round(overflow).toLocaleString("hu-HU")} Ft.`
        });
      }
    });

    return { rows, issues: allIssues, summary: { rowCount: rows.length, overlapCount, gapCount, minberUnderCount, capOverCount, splitCount, certCount } };
  }

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function badgeHtml(badge) {
    return `<span class="badge ${badge.type}">${esc(badge.text)}</span>`;
  }

  function renderSummary(container, summary) {
    container.innerHTML = `
      <h2>Összefoglaló</h2>
      <div class="summary-grid">
        <div class="kpi"><h3>Feldolgozott sor</h3><strong>${summary.rowCount}</strong></div>
        <div class="kpi"><h3>Átfedések</h3><strong>${summary.overlapCount}</strong></div>
        <div class="kpi"><h3>Lukak</h3><strong>${summary.gapCount}</strong></div>
        <div class="kpi"><h3>Minbér alatti sorok</h3><strong>${summary.minberUnderCount}</strong></div>
        <div class="kpi"><h3>Plafon feletti év</h3><strong>${summary.capOverCount}</strong></div>
        <div class="kpi"><h3>FNYSZ bontás kell</h3><strong>${summary.splitCount}</strong></div>
        <div class="kpi"><h3>Igazolás-javaslat</h3><strong>${summary.certCount}</strong></div>
      </div>
    `;
  }

  function renderTable(table, rows) {
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    thead.innerHTML = `
      <tr>
        <th>#</th>
        <th>Tól</th>
        <th>Ig</th>
        <th>Munkáltató</th>
        <th>Jogcím</th>
        <th>Aktuális állapot</th>
        <th>Javasolt minősítés</th>
        <th>Napok</th>
        <th>Illesztett bér (Ft)</th>
        <th>Küszöb (Ft)</th>
        <th>Jelölések</th>
        <th>Megjegyzések</th>
      </tr>
    `;
    tbody.innerHTML = rows.map((row) => {
      const issues = row.issues.length ? `<ul class="issue-list">${row.issues.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
      const badges = row.badges.map(badgeHtml).join(" ");
      return `
        <tr class="${row.overlap ? "overlap-row" : ""}">
          <td>${row.rowNumber}</td>
          <td>${formatDate(row.startDate)}</td>
          <td>${formatDate(row.endDate)}</td>
          <td>${esc(row.employer)}</td>
          <td>${esc(row.title)}</td>
          <td>${esc(row.rawStatus || "?")}</td>
          <td><strong>${esc(row.suggested)}</strong></td>
          <td>${row.dayCount}</td>
          <td>${Math.round(row.matchedWage || 0).toLocaleString("hu-HU")}</td>
          <td>${Math.round(row.minberThreshold || 0).toLocaleString("hu-HU")}</td>
          <td>${badges}</td>
          <td>${issues}</td>
        </tr>
      `;
    }).join("");
  }

  function renderIssues(container, issues) {
    if (!issues.length) {
      container.innerHTML = "<h2>Riport</h2><p>Nincs kiemelt probléma.</p>";
      return;
    }
    const bySeverity = { high: [], medium: [], low: [] };
    issues.forEach((item) => { if (bySeverity[item.severity]) bySeverity[item.severity].push(item); });
    const renderGroup = (title, key) => {
      const rows = bySeverity[key];
      if (!rows.length) return "";
      return `
        <h3>${title}</h3>
        <ul class="issue-list">
          ${rows.map((item) => `<li>${esc(item.message)}</li>`).join("")}
        </ul>
      `;
    };
    container.innerHTML = `
      <h2>Riport</h2>
      ${renderGroup("Kritikus", "high")}
      ${renderGroup("Figyelmeztetés", "medium")}
      ${renderGroup("Információ", "low")}
    `;
  }

  const serviceInput = document.getElementById("serviceInput");
  const wageInput = document.getElementById("wageInput");
  const delimiterSelect = document.getElementById("delimiter");
  const genderSelect = document.getElementById("gender");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const clearBtn = document.getElementById("clearBtn");
  const summary = document.getElementById("summary");
  const issuesPanel = document.getElementById("issuesPanel");
  const serviceTable = document.getElementById("serviceTable");

  function showParseErrors(serviceParsed, wageParsed) {
    const allErrors = [...serviceParsed.errors, ...wageParsed.errors];
    if (!allErrors.length) return false;
    issuesPanel.innerHTML = `<h2>Hibák</h2><ul class="issue-list">${allErrors.map((err) => `<li>${esc(err)}</li>`).join("")}</ul>`;
    return true;
  }

  function clearOutputs() {
    summary.innerHTML = "";
    issuesPanel.innerHTML = "";
    serviceTable.querySelector("thead").innerHTML = "";
    serviceTable.querySelector("tbody").innerHTML = "";
  }

  analyzeBtn.addEventListener("click", () => {
    const serviceParsed = parseDelimitedTable(serviceInput.value, delimiterSelect.value);
    const wageParsed = parseDelimitedTable(wageInput.value, delimiterSelect.value);
    if (showParseErrors(serviceParsed, wageParsed)) {
      summary.innerHTML = "<p>Előbb javítsd a beolvasási hibákat.</p>";
      return;
    }
    const result = analyzeTables({ serviceRows: serviceParsed.rows, wageRows: wageParsed.rows, gender: genderSelect.value });
    renderSummary(summary, result.summary);
    renderTable(serviceTable, result.rows);
    renderIssues(issuesPanel, result.issues);
  });

  clearBtn.addEventListener("click", () => {
    serviceInput.value = "";
    wageInput.value = "";
    clearOutputs();
  });

  clearOutputs();
})();
