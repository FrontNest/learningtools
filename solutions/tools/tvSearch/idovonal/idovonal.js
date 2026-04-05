// Jogviszony Idővonal generálás
function parseInputData(input) {
	// Tab vagy pontosvessző elválasztás támogatása
	const lines = input.trim().split(/\r?\n/).filter(l => l.trim());
	// Fejlécet eldobjuk, ha van
	if (lines.length > 0 && lines[0].toLowerCase().includes('jogv')) lines.shift();
	return lines.map(line => {
		const parts = line.split(/[\t;]/);
		return {
			type: parts[0].trim(),
			from: parts[1].trim(),
			to: parts[2].trim(),
			duration: parts[3] ? parseInt(parts[3].trim(), 10) : null
		};
	});
}

function getMinMaxDates(data) {
	const min = data.reduce((a, b) => a < b.from ? a : b.from, data[0].from);
	const max = data.reduce((a, b) => a > b.to ? a : b.to, data[0].to);
	return { min, max };
}

function dateDiffDays(a, b) {
	return Math.floor((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

function generateTimeline() {
	const input = document.getElementById('inputData').value;
	const data = parseInputData(input);
	if (!data.length) return;

	// Időintervallum meghatározása
	const { min, max } = getMinMaxDates(data);
	const totalDays = dateDiffDays(min, max) + 1;

	// Minden naphoz hozzárendeljük az aktív jogviszonyt (ha több, akkor a legelső a prioritás)
	let dayMap = {};
	for (let i = 0; i < totalDays; i++) {
		const day = new Date(new Date(min).getTime() + i * 24*60*60*1000).toISOString().slice(0,10);
		// Az összes jogviszony közül, amelyik tartalmazza ezt a napot, az elsőt választjuk
		const found = data.find(j => new Date(j.from) <= new Date(day) && new Date(j.to) >= new Date(day));
		dayMap[day] = found ? found.type : '';
	}
	// Most szegmensekre vágjuk az idővonalat, ahol a jogviszony nem változik
	let timeline = [];
	let prevType = null;
	let segStart = min;
	for (let i = 0; i < totalDays; i++) {
		const day = new Date(new Date(min).getTime() + i * 24*60*60*1000).toISOString().slice(0,10);
		const type = dayMap[day];
		if (type !== prevType) {
			if (prevType !== null) {
				// Előző szegmens lezárása
				const prevDay = new Date(new Date(day).getTime() - 24*60*60*1000).toISOString().slice(0,10);
				timeline.push({ type: prevType, from: segStart, to: prevDay });
				segStart = day;
			} else {
				segStart = day;
			}
			prevType = type;
		}
	}
	// Utolsó szegmens lezárása
	timeline.push({ type: prevType, from: segStart, to: max });

	// Megjelenítés
	renderTimeline(timeline, min, max);
}

function renderTimeline(timeline, min, max) {
	const container = document.getElementById('timelineContainer');
	container.innerHTML = '';
	const totalDays = dateDiffDays(min, max) + 1;
	const bar = document.createElement('div');
	bar.className = 'timeline-bar';
	timeline.forEach(seg => {
		const from = new Date(seg.from);
		const to = new Date(seg.to);
		const width = ((dateDiffDays(seg.from, seg.to) + 1) / totalDays * 100).toFixed(2);
		const div = document.createElement('div');
		div.className = 'segment ' + (seg.type ? seg.type.replace(/[^a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9]/g, '').toLowerCase() : 'default');
		div.style.width = width + '%';
		div.title = `${seg.type ? seg.type : 'Nincs jogviszony'}\n${seg.from} - ${seg.to}`;
		div.innerText = seg.type ? seg.type : '';
		bar.appendChild(div);
	});
	container.appendChild(bar);
	// Dátum skála
	const scale = document.createElement('div');
	scale.style.display = 'flex';
	scale.style.justifyContent = 'space-between';
	scale.style.fontSize = '12px';
	scale.style.marginTop = '8px';
	scale.innerHTML = `<span>${min}</span><span>${max}</span>`;
	container.appendChild(scale);
}
