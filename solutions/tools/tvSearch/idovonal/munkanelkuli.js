const sourceData = document.getElementById("sourceData");
const btnCalculate = document.getElementById("btnCalculate");
const statusEl = document.getElementById("status");
const resultBody = document.getElementById("resultBody");
const summaryBody = document.getElementById("summaryBody");

const nf = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });
// járulék százalékok idő intervallumonként
// 1992-ben év közben változott a járulék mértéke, és ott éven belül is meg kell bontani a sorokat a bérlapon
// másképpen a rendszer nem engedi rögzíteni az adatsort, ezért szükséges, hogy ott a részösszeg jelenjen meg.
const DAY_MS = 24 * 60 * 60 * 1000;
let rows = [];
const RATE_RULES_RAW = [
	["1988.01.01.", "1992.02.29.", 10],
	["1992.03.01.", "1993.12.31.", 6],
	["1994.01.01.", "1994.12.31.", 6],
	["1995.01.01.", "1995.12.31.", 6],
	["1996.01.01.", "1996.04.30.", 6],
	["1996.05.01.", "1997.01.31.", 6],
	["1997.02.01.", "1997.12.31.", 6],
	["1998.01.01.", "1998.12.31.", 7],
	["1999.01.01.", "1999.12.31.", 8],
	["2000.01.01.", "2000.12.31.", 8],
	["2001.01.01.", "2001.12.31.", 8],
	["2002.01.01.", "2002.12.31.", 8],
	["2003.01.01.", "2003.12.31.", 8.5],
	["2004.01.01.", "2004.12.31.", 8.5],
	["2005.01.01.", "2005.12.31.", 8.5],
	["2006.01.01.", "2006.12.31.", 8.5],
	["2007.01.01.", "2007.12.31.", 8.5],
	["2008.01.01.", "2008.12.31.", 9.5],
	["2009.01.01.", "2009.12.31.", 9.5],
	["2010.01.01.", "2010.12.31.", 9.5],
	["2011.01.01.", "2011.12.31.", 10],
	["2012.01.01.", "2012.12.31.", 10],
	["2013.01.01.", "2013.12.31.", 10],
	["2014.01.01.", "2014.12.31.", 10],
	["2015.01.01.", "2025.12.31.", 10]
];

// RATE_RULES_RAW alapján egyedi, dátum szerint rendezett szabálylista
const RATE_RULES = Array.from(
	new Map(
		RATE_RULES_RAW.map(([from, to, percent]) => {
			const fromDate = parseHungarianDate(from);
			const toDate = parseHungarianDate(to);
			const key = `${from}|${to}|${percent}`;
			return [
				key,
				{
					fromDate,
					toDate,
					percent
				}
			];
		})
	).values()
).sort((a, b) => a.fromDate - b.fromDate || a.toDate - b.toDate);

// Egységes ezres tagolású egészszám formázás szóköz elválasztóval.
function formatInt(value) {
	return nf.format(value).replace(/[\u00A0\u202F]/g, " ");
}

// Egységes státusz üzenet kiírása (siker/hiba) a felületen
function setStatus(message, isError = false) {
	statusEl.textContent = message;
	statusEl.className = `status ${isError ? "error" : "ok"}`;
}

// Magyar dátum formátum (YYYY.MM.DD.) parse-olása UTC-ben
function parseHungarianDate(input) {
	const cleaned = String(input || "").trim().replace(/\.$/, "");
	const match = cleaned.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
	if (!match) {
		return null;
	}
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const dt = new Date(Date.UTC(year, month - 1, day));

	if (
		dt.getUTCFullYear() !== year ||
		dt.getUTCMonth() !== month - 1 ||
		dt.getUTCDate() !== day
	) {
		return null;
	}

	return dt;
}

// Dátum visszaalakítása szabványos magyar formára
function formatHungarianDate(date) {
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const d = String(date.getUTCDate()).padStart(2, "0");
	return `${y}.${m}.${d}.`;
}

// Napok száma inkluzívan: kezdő és záró dátum is beleszámít!
function inclusiveDays(start, end) {
	return Math.floor((end - start) / DAY_MS) + 1;
}

// Segédfüggvény dátumléptetéshez (pozitív/negatív napokkal)
function addDays(date, days) {
	return new Date(date.getTime() + days * DAY_MS);
}

// Egy időszakot feldarabol a járulékszabályok metszetei szerint, 
// különös tekintettel az 1992-es évre, ahol év közben változott a járulék mértéke
function splitByRateRules(start, end) {
	const overlaps = RATE_RULES
		.filter((rule) => rule.toDate >= start && rule.fromDate <= end)
		.sort((a, b) => a.fromDate - b.fromDate || a.toDate - b.toDate);

	if (!overlaps.length) {
		return [{ start, end, percent: null }];
	}

	const parts = [];
	let cursor = new Date(start.getTime());

	overlaps.forEach((rule) => {
		if (cursor > end) {
			return;
		}

		const overlapStart = rule.fromDate > start ? rule.fromDate : start;
		const overlapEnd = rule.toDate < end ? rule.toDate : end;

		if (overlapStart > overlapEnd) {
			return;
		}

		if (cursor < overlapStart) {
			const gapEnd = addDays(overlapStart, -1);
			if (cursor <= gapEnd) {
				parts.push({ start: new Date(cursor.getTime()), end: gapEnd, percent: null });
			}
		}

		const segmentStart = cursor > overlapStart ? cursor : overlapStart;
		if (segmentStart <= overlapEnd) {
			parts.push({
				start: new Date(segmentStart.getTime()),
				end: new Date(overlapEnd.getTime()),
				percent: rule.percent
			});
			cursor = addDays(overlapEnd, 1);
		}
	});

	if (cursor <= end) {
		parts.push({ start: new Date(cursor.getTime()), end: new Date(end.getTime()), percent: null });
	}

	return mergeAdjacentRateSegments(parts);
}

// Azonos százalékú, egymást követő szakaszok összevonása évhatáron belül
function mergeAdjacentRateSegments(segments) {
	if (!segments.length) {
		return segments;
	}

	const merged = [
		{
			start: new Date(segments[0].start.getTime()),
			end: new Date(segments[0].end.getTime()),
			percent: segments[0].percent
		}
	];

	for (let i = 1; i < segments.length; i += 1) {
		const current = segments[i];
		const prev = merged[merged.length - 1];
		const prevNextDay = addDays(prev.end, 1);
		const isConsecutive = prevNextDay.getTime() === current.start.getTime();
		const samePercent = prev.percent === current.percent;

		if (isConsecutive && samePercent) {
			prev.end = new Date(current.end.getTime());
			continue;
		}

		merged.push({
			start: new Date(current.start.getTime()),
			end: new Date(current.end.getTime()),
			percent: current.percent
		});
	}

	return merged;
}

// Napi összeg parse: szóköz/vessző toleráns beolvasás számmá
function parseDailyAmount(value) {
	const normalized = String(value || "").trim().replace(/\s+/g, "").replace(",", ".");
	const parsed = Number(normalized);
	if (!Number.isFinite(parsed)) {
		return null;
	}
	return parsed;
}

// Egy bemeneti sor parse-olása (tabos vagy szóközös formátum, több szavas jogcímmel)
function parseInputLine(line) {
	const rawLine = String(line || "").trim();
	if (!rawLine) {
		return null;
	}

	if (rawLine.includes("\t")) {
		const cells = rawLine.split("\t").map((c) => c.trim());
		if (cells.length < 4) {
			return null;
		}

		return {
			fromRaw: cells[0],
			toRaw: cells[1],
			dailyRaw: cells[2],
			titleRaw: cells.slice(3).join(" ").trim()
		};
	}

	const tokens = rawLine.split(/\s+/).filter(Boolean);
	if (tokens.length < 4) {
		return null;
	}

	const fromRaw = tokens[0];
	const toRaw = tokens[1];
	const amountTokens = [];
	let idx = 2;

	while (idx < tokens.length && /^[0-9][0-9.,]*$/.test(tokens[idx])) {
		amountTokens.push(tokens[idx]);
		idx += 1;
	}

	if (!amountTokens.length) {
		return null;
	}

	return {
		fromRaw,
		toRaw,
		dailyRaw: amountTokens.join(" "),
		titleRaw: tokens.slice(idx).join(" ").trim()
	};
}

// Százalék parse: pl. "8,5", "8.5", "8,5%" formátumok kezelése
function parsePercent(value) {
	if (value === null || value === undefined) {
		return null;
	}
	const normalized = String(value)
		.replace("%", "")
		.trim()
		.replace(/\s+/g, "")
		.replace(",", ".");

	if (normalized === "") {
		return null;
	}

	const parsed = Number(normalized);
	if (!Number.isFinite(parsed)) {
		return null;
	}
	return parsed;
}

// Az eredeti sort évekre bontja, majd minden évben szabályszakaszokra osztja
function splitByYear(item) {
	const parts = [];
	const fromYear = item.fromDate.getUTCFullYear();
	const toYear = item.toDate.getUTCFullYear();

	for (let year = fromYear; year <= toYear; year += 1) {
		const yearStart = new Date(Date.UTC(year, 0, 1));
		const yearEnd = new Date(Date.UTC(year, 11, 31));
		const start = item.fromDate > yearStart ? item.fromDate : yearStart;
		const end = item.toDate < yearEnd ? item.toDate : yearEnd;

		if (start > end) {
			continue;
		}

		const rateSegments = splitByRateRules(start, end);
		rateSegments.forEach((segment) => {
			const days = inclusiveDays(segment.start, segment.end);
			const base = days * item.daily;
			const defaultPercent = segment.percent;

			parts.push({
				fromDate: new Date(segment.start.getTime()),
				toDate: new Date(segment.end.getTime()),
				from: formatHungarianDate(segment.start),
				to: formatHungarianDate(segment.end),
				daily: item.daily,
				title: item.title,
				year,
				days,
				base,
				percentInput: defaultPercent === null ? "" : String(defaultPercent).replace(".", ","),
				percent: defaultPercent,
				contribution: defaultPercent === null ? null : (base * defaultPercent) / 100,
				annualBaseDisplay: "",
				annualContributionDisplay: ""
			});
		});
	}

	return parts;
}

// Éves összesítő gyűjtés (alap + járulék) az I/J oszlophoz
function collectYearTotals(dataRows) {
	const totals = new Map();
	dataRows.forEach((r) => {
		const current = totals.get(r.year) || { base: 0, contribution: 0 };
		current.base += r.base;
		current.contribution += r.contribution || 0;
		totals.set(r.year, current);
	});
	return totals;
}

// Az éves összeg csak az adott év első sorában jelenjen meg
function applyAnnualDisplay(dataRows) {
	const totals = collectYearTotals(dataRows);
	const firstIndexByYear = new Map();

	dataRows.forEach((r, idx) => {
		if (!firstIndexByYear.has(r.year)) {
			firstIndexByYear.set(r.year, idx);
		}
		r.annualBaseDisplay = "";
		r.annualContributionDisplay = "";
	});

	firstIndexByYear.forEach((idx, year) => {
		const total = totals.get(year);
		dataRows[idx].annualBaseDisplay = formatInt(Math.round(total.base));
		dataRows[idx].annualContributionDisplay = formatInt(Math.round(total.contribution));
	});
}

// Főtábla újrarenderelése és a G oszlop input eseményeinek bekötése
function renderResultTable() {
	if (!rows.length) {
		const tr = document.createElement("tr");
		const td = document.createElement("td");
		td.colSpan = 10;
		td.className = "empty-cell";
		td.textContent = "Még nincs kiszámolt adat.";
		tr.appendChild(td);
		resultBody.replaceChildren(tr);
		return;
	}

	applyAnnualDisplay(rows);

	const fragment = document.createDocumentFragment();

	rows.forEach((r, idx) => {
		const tr = document.createElement("tr");
		const contributionText = r.contribution === null ? "" : formatInt(Math.round(r.contribution));
		const rowClass = r.annualBaseDisplay ? "year-cell" : "";

		const cells = [
			{ text: r.from },
			{ text: r.to },
			{ text: formatInt(Math.round(r.daily)), className: "num" },
			{ text: r.title },
			{ text: formatInt(r.days), className: "num" },
			{ text: formatInt(Math.round(r.base)), className: "num" }
		];

		cells.forEach((cell) => {
			const td = document.createElement("td");
			if (cell.className) {
				td.className = cell.className;
			}
			td.textContent = cell.text;
			tr.appendChild(td);
		});

		const percentTd = document.createElement("td");
		percentTd.className = "num";
		const input = document.createElement("input");
		input.className = "percent-input";
		input.dataset.idx = String(idx);
		input.value = r.percentInput;
		input.inputMode = "decimal";
		input.placeholder = "pl. 6,5";
		input.addEventListener("input", onPercentChanged);
		input.addEventListener("keydown", onPercentKeyDown);
		input.addEventListener("blur", normalizePercentInput);
		percentTd.appendChild(input);
		tr.appendChild(percentTd);

		const contributionTd = document.createElement("td");
		contributionTd.className = "num";
		contributionTd.textContent = contributionText;
		tr.appendChild(contributionTd);

		const annualBaseTd = document.createElement("td");
		annualBaseTd.className = rowClass ? `num ${rowClass}` : "num";
		annualBaseTd.textContent = r.annualBaseDisplay;
		tr.appendChild(annualBaseTd);

		const annualContributionTd = document.createElement("td");
		annualContributionTd.className = rowClass ? `num ${rowClass}` : "num";
		annualContributionTd.textContent = r.annualContributionDisplay;
		tr.appendChild(annualContributionTd);

		fragment.appendChild(tr);
	});

	resultBody.replaceChildren(fragment);
}

// Év + jogcím szerinti összesítő tábla felépítése
function renderSummaryTable() {
	if (!rows.length) {
		const tr = document.createElement("tr");
		const td = document.createElement("td");
		td.colSpan = 5;
		td.className = "empty-cell";
		td.textContent = "Még nincs kiszámolt adat.";
		tr.appendChild(td);
		summaryBody.replaceChildren(tr);
		return;
	}

	const bucket = new Map();
	rows.forEach((r) => {
		const key = `${r.year}||${r.title}`;
		const current = bucket.get(key) || {
			year: r.year,
			title: r.title,
			days: 0,
			base: 0,
			contribution: 0
		};
		current.days += r.days;
		current.base += r.base;
		current.contribution += r.contribution || 0;
		bucket.set(key, current);
	});

	const list = Array.from(bucket.values()).sort((a, b) => {
		if (a.year !== b.year) {
			return a.year - b.year;
		}
		return a.title.localeCompare(b.title, "hu");
	});

	const fragment = document.createDocumentFragment();
	list.forEach((item) => {
		const tr = document.createElement("tr");

		const yearTd = document.createElement("td");
		yearTd.textContent = String(item.year);
		tr.appendChild(yearTd);

		const titleTd = document.createElement("td");
		titleTd.textContent = item.title;
		tr.appendChild(titleTd);

		const daysTd = document.createElement("td");
		daysTd.className = "num";
		daysTd.textContent = formatInt(item.days);
		tr.appendChild(daysTd);

		const baseTd = document.createElement("td");
		baseTd.className = "num";
		baseTd.textContent = formatInt(Math.round(item.base));
		tr.appendChild(baseTd);

		const contributionTd = document.createElement("td");
		contributionTd.className = "num";
		contributionTd.textContent = formatInt(Math.round(item.contribution));
		tr.appendChild(contributionTd);

		fragment.appendChild(tr);
	});

	summaryBody.replaceChildren(fragment);
}

// Származtatott mezők újraszámolása, opcionális fókusz visszaállítással
function updateAllDerivedValues(focusState = null) {
	rows.forEach((r) => {
		const parsedPercent = parsePercent(r.percentInput);
		r.percent = parsedPercent;
		r.contribution = parsedPercent === null ? null : (r.base * parsedPercent) / 100;
	});
	renderResultTable();
	renderSummaryTable();

	if (focusState && Number.isInteger(focusState.idx)) {
		const selector = `.percent-input[data-idx="${focusState.idx}"]`;
		const input = resultBody.querySelector(selector);
		if (input) {
			input.focus();
			if (
				Number.isInteger(focusState.start) &&
				Number.isInteger(focusState.end)
			) {
				input.setSelectionRange(focusState.start, focusState.end);
			}
		}
	}
}

// G oszlop input közben azonnali újraszámolás, kurzor maradjon ott
function onPercentChanged(event) {
	const idx = Number(event.target.dataset.idx);
	rows[idx].percentInput = event.target.value;
	updateAllDerivedValues({
		idx,
		start: event.target.selectionStart,
		end: event.target.selectionEnd
	});
}

// Enter/Tab navigáció a százalékmezők között, érték-normalizálással
function onPercentKeyDown(event) {
	if (event.key !== "Enter" && event.key !== "Tab") {
		return;
	}

	event.preventDefault();

	const idx = Number(event.target.dataset.idx);
	const delta = event.shiftKey ? -1 : 1;
	const targetIdx = Math.max(0, Math.min(rows.length - 1, idx + delta));

	const parsed = parsePercent(rows[idx].percentInput);
	if (parsed !== null) {
		rows[idx].percentInput = String(parsed).replace(".", ",");
	}

	const nextValueLength = String(rows[targetIdx].percentInput || "").length;
	updateAllDerivedValues({
		idx: targetIdx,
		start: nextValueLength,
		end: nextValueLength
	});
}

// Kilépéskor egységesíti a százalék megjelenítését (pl. 8.5 -> 8,5)
function normalizePercentInput(event) {
	const idx = Number(event.target.dataset.idx);
	const parsed = parsePercent(rows[idx].percentInput);
	if (parsed === null) {
		return;
	}
	rows[idx].percentInput = String(parsed).replace(".", ",");
	updateAllDerivedValues();
}

// Teljes bemenet feldolgozása: validálás, bontás, render és hibakezelés
function calculateFromInput() {
	const raw = sourceData.value.trim();
	if (!raw) {
		setStatus("Nincs bemenet. Illeszd be az A-D oszlop adatait.", true);
		rows = [];
		renderResultTable();
		renderSummaryTable();
		return;
	}

	const lines = raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	const parsedRows = [];
	const errors = [];

	lines.forEach((line, lineIndex) => {
		const parsedLine = parseInputLine(line);
		if (!parsedLine) {
			errors.push(`Hibás sor (${lineIndex + 1}): nem értelmezhető bemenet.`);
			return;
		}

		const fromDate = parseHungarianDate(parsedLine.fromRaw);
		const toDate = parseHungarianDate(parsedLine.toRaw);
		const daily = parseDailyAmount(parsedLine.dailyRaw);
		const title = String(parsedLine.titleRaw || "").trim();

		if (!fromDate || !toDate) {
			errors.push(`Hibás dátum (${lineIndex + 1}. sor): ${parsedLine.fromRaw} - ${parsedLine.toRaw}`);
			return;
		}

		if (fromDate > toDate) {
			errors.push(`A kezdődátum nagyobb, mint a végdátum (${lineIndex + 1}. sor).`);
			return;
		}

		if (daily === null) {
			errors.push(`Hibás napi összeg (${lineIndex + 1}. sor): ${parsedLine.dailyRaw}`);
			return;
		}

		if (!title) {
			errors.push(`Hiányzó jogcím (${lineIndex + 1}. sor).`);
			return;
		}

		parsedRows.push({ fromDate, toDate, daily, title });
	});

	if (errors.length) {
		setStatus(errors.slice(0, 3).join(" | "), true);
		rows = [];
		renderResultTable();
		renderSummaryTable();
		return;
	}

	rows = parsedRows.flatMap(splitByYear).sort((a, b) => a.fromDate - b.fromDate || a.toDate - b.toDate);
	updateAllDerivedValues();
	setStatus(`Kész. ${parsedRows.length} eredeti sorból ${rows.length} éves bontott sor készült.`);
}

btnCalculate.addEventListener("click", calculateFromInput);
