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
	// Calculate days difference (inclusive)
	const msPerDay = 24 * 60 * 60 * 1000;
	const days = Math.round(((endDate.getTime() + msPerDay) - startDate.getTime()) / msPerDay);
	let html = renderTable(intervals);
	html += `<div class="days-diff">Eltelt napok száma: <strong>${days}</strong></div>`;
	document.getElementById('resultTableContainer').innerHTML = html;
});

// Arányos szolgálati idő számítása
function calculateAranyosSzolgaltatiIdo(jogviszonyok) {
	const msPerDay = 24 * 60 * 60 * 1000;
	let html = '<table class="aranyos-szolgaltati-table">';
	html += '<thead><tr><th>Időszak kezdete</th><th>Időszak vége</th><th>Munkaidő</th><th>Jövedelem</th><th>Szunet nap</th><th>Arány</th><th>Napok</th><th>Szolgálati idő</th></tr></thead>';
	html += '<tbody>';
	jogviszonyok.forEach(jv => {
		const napok = Math.round(((jv.end.getTime() + msPerDay) - jv.start.getTime()) / msPerDay) - (jv.szunetNap || 0);
		// Minimálbér az adott évre
		const ev = jv.start.getFullYear();
		const minberObj = minimalberData.find(mb => parseDate(mb.start).getFullYear() === ev);
		const minberHavi = minberObj ? minberObj.wage : 0;
		const minberEves = minberHavi * 12;
		const arany = minberEves > 0 ? (jv.jovedelem / minberEves) : 0;
		const szolgalatiIdo = Math.round(arany * napok);
		html += `<tr><td>${formatDate(jv.start)}</td><td>${formatDate(jv.end)}</td><td>${jv.munkaido}</td><td>${jv.jovedelem.toLocaleString()}</td><td>${jv.szunetNap}</td><td>${arany.toFixed(4)}</td><td>${napok}</td><td>${szolgalatiIdo}</td></tr>`;
		html += `<tr><td colspan="8" style="text-align:left;color:#333;">Éves minimálbér: <b>${minberEves.toLocaleString()} Ft</b></td></tr>`;
	});
	html += '</tbody></table>';
	return html;
}
