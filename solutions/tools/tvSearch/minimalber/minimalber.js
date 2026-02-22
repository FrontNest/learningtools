// Automatikus fókuszváltás év után hónapra, input validáció
function setupDateInputs() {
	const dateInputs = [document.getElementById('startDate'), document.getElementById('endDate')];
	dateInputs.forEach(input => {
		input.addEventListener('input', function(e) {
			// Automatikus fókuszváltás év után
			if (e.target.value.length === 4) {
				if (!/^\d{4}$/.test(e.target.value)) {
					e.target.value = '';
					return;
				}
				e.target.value += '-';
			}
			// Automatikus kötőjel hónap után
			if (e.target.value.length === 7) {
				const parts = e.target.value.split('-');
				if (parts.length === 2 && /^\d{2}$/.test(parts[1])) {
					if (Number(parts[1]) < 1 || Number(parts[1]) > 12) {
						e.target.value = parts[0] + '-';
						return;
					}
					e.target.value += '-';
				}
			}
			// Nap validáció
			if (e.target.value.length === 10) {
				const parts = e.target.value.split('-');
				if (parts.length === 3 && /^\d{2}$/.test(parts[2])) {
					const year = Number(parts[0]);
					const month = Number(parts[1]);
					const day = Number(parts[2]);
					const maxDay = new Date(year, month, 0).getDate();
					if (day < 1 || day > maxDay) {
						e.target.value = parts[0] + '-' + parts[1] + '-';
						return;
					}
				}
			}
		});
	});
}

window.addEventListener('DOMContentLoaded', setupDateInputs);
// Minimálbér adatok
const minimalberData = [
	{ start: '1988-01-01', end: '1989-02-28', wage: 3000 },
	{ start: '1989-03-01', end: '1989-09-30', wage: 3700 },
	{ start: '1989-10-01', end: '1990-01-31', wage: 4000 },
	{ start: '1990-02-01', end: '1990-08-31', wage: 4800 },
	{ start: '1990-09-01', end: '1990-11-30', wage: 5600 },
	{ start: '1990-12-01', end: '1991-03-31', wage: 5800 },
	{ start: '1991-04-01', end: '1991-12-31', wage: 7000 },
	{ start: '1992-01-01', end: '1993-01-31', wage: 8000 },
	{ start: '1993-02-01', end: '1994-01-31', wage: 9000 },
	{ start: '1994-02-01', end: '1995-01-31', wage: 10500 },
	{ start: '1995-02-01', end: '1996-01-31', wage: 12200 },
	{ start: '1996-02-01', end: '1996-12-31', wage: 14500 },
	{ start: '1997-01-01', end: '1997-12-31', wage: 17000 },
	{ start: '1998-01-01', end: '1998-12-31', wage: 19500 },
	{ start: '1999-01-01', end: '1999-12-31', wage: 22500 },
	{ start: '2000-01-01', end: '2000-12-31', wage: 25500 },
	{ start: '2001-01-01', end: '2001-12-31', wage: 40000 },
	{ start: '2002-01-01', end: '2003-12-31', wage: 50000 },
	{ start: '2004-01-01', end: '2004-12-31', wage: 53000 },
	{ start: '2005-01-01', end: '2005-12-31', wage: 57000 },
	{ start: '2006-01-01', end: '2006-12-31', wage: 62500 },
	{ start: '2007-01-01', end: '2007-12-31', wage: 65500 },
	{ start: '2008-01-01', end: '2008-12-31', wage: 69000 },
	{ start: '2009-01-01', end: '2009-12-31', wage: 71500 },
	{ start: '2010-01-01', end: '2010-12-31', wage: 73500 },
	{ start: '2011-01-01', end: '2011-12-31', wage: 78000 },
	{ start: '2012-01-01', end: '2012-12-31', wage: 93000 },
	{ start: '2013-01-01', end: '2013-12-31', wage: 98000 },
	{ start: '2014-01-01', end: '2014-12-31', wage: 101500 },
	{ start: '2015-01-01', end: '2015-12-31', wage: 105000 },
	{ start: '2016-01-01', end: '2016-12-31', wage: 111000 },
	{ start: '2017-01-01', end: '2017-12-31', wage: 127500 },
	{ start: '2018-01-01', end: '2018-12-31', wage: 138000 },
	{ start: '2019-01-01', end: '2019-12-31', wage: 149000 },
	{ start: '2020-01-01', end: '2021-01-31', wage: 161000 },
	{ start: '2021-02-01', end: '2021-12-31', wage: 167400 },
	{ start: '2022-01-01', end: '2022-12-31', wage: 200000 },
	{ start: '2023-01-01', end: '2023-11-30', wage: 232000 },
	{ start: '2023-12-01', end: '2024-12-31', wage: 266800 },
	{ start: '2025-01-01', end: '2026-02-21', wage: 290800 }
];

function parseDate(str) {
	// "YYYY-MM-DD" format
	const [y, m, d] = str.split('-');
	return new Date(Number(y), Number(m) - 1, Number(d));
}

function formatDate(date) {
	return date.toISOString().split('T')[0];
}

function getIntervalsInRange(startDate, endDate) {
	return minimalberData.filter(row => {
		const rowStart = parseDate(row.start);
		const rowEnd = parseDate(row.end);
		return rowEnd >= startDate && rowStart <= endDate;
	});
}

function renderTable(intervals) {
	let html = '<table class="minimalber-table">';
	html += '<thead><tr><th>Időszak kezdete</th><th>Időszak vége</th><th>Minimálbér (Ft)</th><th>Harmincad rész (Ft)</th></tr></thead>';
	html += '<tbody>';
	intervals.forEach(row => {
		html += `<tr><td>${row.start.replace(/-/g, ".")}</td><td>${row.end.replace(/-/g, ".")}</td><td>${row.wage.toLocaleString()}</td><td>${Math.round(row.wage/30).toLocaleString()}</td></tr>`;
	});
	html += '</tbody></table>';
	return html;
}

document.getElementById('dateForm').addEventListener('submit', function(e) {
	e.preventDefault();
	const startDateInput = document.getElementById('startDate').value;
	const endDateInput = document.getElementById('endDate').value;
	const startDate = parseDate(startDateInput);
	const endDate = parseDate(endDateInput);
	if (!startDateInput || !endDateInput || !startDate || !endDate || endDate < startDate) {
		document.getElementById('resultTableContainer').innerHTML = '<p>Hibás dátum intervallum!</p>';
		return;
	}
	const intervals = getIntervalsInRange(startDate, endDate);
	if (intervals.length === 0) {
		document.getElementById('resultTableContainer').innerHTML = '<p>Nincs minimálbér adat az adott időszakra.</p>';
		return;
	}
	const msPerDay = 24 * 60 * 60 * 1000;
	const days = Math.round(((endDate.getTime() + msPerDay) - startDate.getTime()) / msPerDay);
	let html = renderTable(intervals);
	html += `<div class="days-diff">Eltelt napok száma: <strong>${days}</strong></div>`;

	// Jogviszonyok összegyűjtése
	const jogviszonyRows = document.querySelectorAll('.jogviszony-row');
	const jogviszonyok = [];
	jogviszonyRows.forEach(row => {
		const s = row.querySelector('input[name="jogviszonyStart[]"]').value;
		const e = row.querySelector('input[name="jogviszonyEnd[]"]').value;
		const m = row.querySelector('select[name="munkaido[]"]').value;
		const j = row.querySelector('input[name="jovedelem[]"]').value;
		const sz = row.querySelector('input[name="szunetNap[]"]').value;
		if (s && e && j) {
			jogviszonyok.push({
				start: parseDate(s),
				end: parseDate(e),
				munkaido: m,
				jovedelem: Number(j),
				szunetNap: Number(sz) || 0
			});
		}
	});

	if (jogviszonyok.length === 0) {
		document.getElementById('resultTableContainer').innerHTML = html + '<p>Nincs jogviszony adat, csak napok és minimálbér.</p>';
		return;
	}

	html += '<h4>Jogviszonyok arányos szolgálati idő számítása</h4>';
	html += '<table class="szolgalati-table"><thead><tr><th>Kezdő dátum</th><th>Vége dátum</th><th>Munkaidő</th><th>Jövedelem</th><th>Szünetelés</th><th>Arány</th><th>Napok</th><th>Arányos szolgálati idő</th></tr></thead><tbody>';
	jogviszonyok.forEach(jv => {
		// Jogviszony napok
		const jvDays = Math.round(((jv.end.getTime() + msPerDay) - jv.start.getTime()) / msPerDay);
		// Szünetelés levonása
		const napok = jvDays - jv.szunetNap;
		// Minimálbér az adott időszakra
		let minber = 0;
		intervals.forEach(intv => {
			const intvStart = parseDate(intv.start);
			const intvEnd = parseDate(intv.end);
			// Jogviszony átfedés az intervallummal
			const overlapStart = jv.start > intvStart ? jv.start : intvStart;
			const overlapEnd = jv.end < intvEnd ? jv.end : intvEnd;
			if (overlapEnd >= overlapStart) {
				const overlapDays = Math.round(((overlapEnd.getTime() + msPerDay) - overlapStart.getTime()) / msPerDay);
				minber += intv.wage / 365 * overlapDays;
			}
		});
		// Arány számítása
		const arany = minber > 0 ? (jv.jovedelem / minber) : 0;
		// Arányos szolgálati idő
		const szolgalatiIdo = Math.round(arany * napok);
		html += `<tr><td>${formatDate(jv.start)}</td><td>${formatDate(jv.end)}</td><td>${jv.munkaido}</td><td>${jv.jovedelem.toLocaleString()}</td><td>${jv.szunetNap}</td><td>${arany.toFixed(4)}</td><td>${napok}</td><td>${szolgalatiIdo}</td></tr>`;
	});
	html += '</tbody></table>';

	document.getElementById('resultTableContainer').innerHTML = html;
	});
