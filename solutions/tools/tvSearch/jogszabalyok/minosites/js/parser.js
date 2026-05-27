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
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveDelimiter(delimiterMode, text) {
  if (delimiterMode === "tab") return "\t";
  if (delimiterMode === "comma") return ",";
  if (delimiterMode === "semicolon") return ";";

  const sampleLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

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
  if (ymdDot) {
    const [, y, m, d] = ymdDot;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }

  const ymdDash = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdDash) {
    const [, y, m, d] = ymdDash;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }

  const dmyDot = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (dmyDot) {
    const [, d, m, y] = dmyDot;
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()));
}

function parseAmount(raw) {
  if (raw == null || raw === "") return 0;
  const normalized = String(raw)
    .replace(/\s+/g, "")
    .replace(/Ft/gi, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");

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

export function parseDelimitedTable(text, delimiterMode) {
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

export function formatDate(date) {
  if (!date) return "";
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}.`;
}

export function dayCountInclusive(startDate, endDate) {
  const ms = endDate.getTime() - startDate.getTime();
  return Math.floor(ms / 86400000) + 1;
}

export function normalizeText(value) {
  return stripAccents(String(value || "")).replace(/_/g, " ");
}
