// Globális highlight CSS beszúrása, ha még nincs
function ensureHighlightStyle() {
  if (!document.getElementById('highlight-style')) {
    const style = document.createElement('style');
    style.id = 'highlight-style';
    style.innerHTML = `.highlight { display: inline-block !important; border-bottom: 4px solid red !important; border-left: none !important; border-right: none !important; border-top: none !important; background: inherit !important; color: inherit !important; padding: 0 !important; margin: 0 !important; }`;
    document.head.appendChild(style);
  }
}

// Segédfüggvény: HTML tagek eltávolítása kereséshez
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '');
}
// Fejezetek természetes sorrendben rendező kulcs
function chapterSortKey(chapter) {
  return chapter.split('.').map(x => parseInt(x, 10));
}
// Feltételezzük, hogy a json file neve: Szolgalati_ido_2024_ocr.json
// és a sources mappában van
// const JSON_PATH = 'sources/Szolgalati_ido_2024_ocr.json';
const JSON_PATH = 'sources/SzolgalatiIdo2024.json';

let ocrData = {};

// Betöltés
fetch(JSON_PATH)
  .then(resp => resp.json())
  .then(data => {
    ocrData = data;
    document.getElementById('searchBtn').disabled = false;
  })
  .catch(() => {
    document.getElementById('results').innerHTML = '<span style="color:red">Nem sikerült betölteni a szövegfájlt.</span>';
  });


document.getElementById('searchBtn').addEventListener('click', searchChapters);
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') searchChapters();
});

// Összes fejezet listázása gomb
document.getElementById('listAllBtn').addEventListener('click', function() {
  document.getElementById('searchInput').value = '';
  searchChapters();
});

document.getElementById('findYearsBtn').addEventListener('click', function() {
  findYearBlocks();
});

function findYearBlocks() {
  const resultsDiv = document.getElementById('results');
  let found = [];
  const yearRegex = /\b(1[89][0-9]{2}|20[0-9]{2})\b/g;
  for (const [chapter, chapterObj] of Object.entries(ocrData)) {
    if (!chapterObj.text) continue;
    const blocks = chapterObj.text.split(/\n\n+/);
    blocks.forEach((block, i) => {
      let match;
      // HTML-mentes blokk a kereséshez
      const plainBlock = stripHtml(block);
      while ((match = yearRegex.exec(plainBlock)) !== null) {
        found.push({ year: parseInt(match[0], 10), chapter, title: chapterObj.title, block, blockIdx: i });
      }
    });
  }
  if (found.length === 0) {
    resultsDiv.innerHTML = '<span style="color:#a00">Nincs évszámot tartalmazó rész.</span>';
    return;
  }
  // Csoportosítás: év -> fejezet -> blokkok
  let grouped = {};
  found.forEach(item => {
    if (!grouped[item.year]) grouped[item.year] = {};
    if (!grouped[item.year][item.chapter]) grouped[item.year][item.chapter] = { title: item.title, blocks: [] };
    // Csak az adott blokkot tegyük be, ha még nincs benne (többszörös évszám esetén)
    if (!grouped[item.year][item.chapter].blocks.some(b => b.blockIdx === item.blockIdx)) {
      grouped[item.year][item.chapter].blocks.push({ block: item.block, blockIdx: item.blockIdx });
    }
  });
  // Csak olyan év maradjon, ahol tényleg van fejezet/blokk
  const filteredYears = Object.keys(grouped)
    .map(Number)
    .filter(year => {
      const chapters = grouped[year];
      // Legalább egy fejezetben legalább egy blokk
      return Object.values(chapters).some(ch => Array.isArray(ch.blocks) && ch.blocks.length > 0);
    })
    .sort((a, b) => a - b);
// Fejezetek természetes sorrendben rendező kulcs
function chapterSortKey(chapter) {
  return chapter.split('.').map(x => parseInt(x, 10));
}
  // Kirenderelés
  resultsDiv.innerHTML = filteredYears.map((year, yIdx) =>
    `<div class="result-block" style="cursor:pointer" onclick="expandYearGroup(${yIdx})">
      <div class="page"><b>${year}</b></div>
    </div>
    <div id="expand_yeargroup_${yIdx}"></div>`
  ).join('<hr>');
  window._yearGroupData = grouped;
  window._yearGroupOrder = filteredYears;
  window._expandedYearGroup = null;
  window._expandedYearChapter = null;
}

window.expandYearGroup = function(yIdx) {
  // Csukjunk be minden nyitott évcsoportot
  document.querySelectorAll('[id^="expand_yeargroup_"]').forEach(div => div.innerHTML = '');
  if (window._expandedYearGroup === yIdx) {
    window._expandedYearGroup = null;
    return;
  }
  window._expandedYearGroup = yIdx;
  window._expandedYearChapter = null;
  const year = window._yearGroupOrder[yIdx];
  const chapters = window._yearGroupData[year];
  // fejezetek természetes sorrendben
  const sortedChapters = Object.keys(chapters).sort((a, b) => {
    const ak = chapterSortKey(a);
    const bk = chapterSortKey(b);
    for (let i = 0; i < Math.max(ak.length, bk.length); ++i) {
      const ai = ak[i] || 0;
      const bi = bk[i] || 0;
      if (ai !== bi) return ai - bi;
    }
    return 0;
  });
  document.getElementById('expand_yeargroup_' + yIdx).innerHTML = sortedChapters.map((chapter, cIdx) =>
    `<div class="result-block" style="cursor:pointer;background:#f7f7f7" onclick="expandYearChapter(${yIdx},${cIdx},event)">
      <div class="page"><b>${chapter}</b>${chapters[chapter].title ? '. ' + highlight(chapters[chapter].title, '') : ''}</div>
    </div>
    <div id="expand_yc_${yIdx}_${cIdx}"></div>`
  ).join('');
}

window.expandYearChapter = function(yIdx, cIdx, event) {
  // Ne triggerelje a yeargroup lenyitását
  event.stopPropagation();
  // Csukjunk be minden nyitott év-fejezet blokkot
  document.querySelectorAll('[id^="expand_yc_"]').forEach(div => div.innerHTML = '');
  if (window._expandedYearChapter && window._expandedYearChapter.yIdx === yIdx && window._expandedYearChapter.cIdx === cIdx) {
    window._expandedYearChapter = null;
    return;
  }
  window._expandedYearChapter = { yIdx, cIdx };
  const year = window._yearGroupOrder[yIdx];
  const chapters = window._yearGroupData[year];
  const chapter = Object.keys(chapters).sort((a, b) => {
    const ak = chapterSortKey(a);
    const bk = chapterSortKey(b);
    for (let i = 0; i < Math.max(ak.length, bk.length); ++i) {
      const ai = ak[i] || 0;
      const bi = bk[i] || 0;
      if (ai !== bi) return ai - bi;
    }
    return 0;
  })[cIdx];
  const blocks = chapters[chapter].blocks;
  let html = blocks.map(b => `<div style="margin-bottom:18px;background:#fffbe6;border-left:4px solid #28f109;padding:12px 10px;border-radius:4px;">${highlight(b.block, '')}</div>`).join('');
  document.getElementById('expand_yc_' + yIdx + '_' + cIdx).innerHTML = html;
}
function highlight(text, query) {
  ensureHighlightStyle();
  if (!query) {
    let highlighted = text;
    highlighted = highlighted.replace(/\n\n/g, '<hr>');
    highlighted = highlighted.replace(/\n/g, '<br>');
    return highlighted;
  }
  // 1. Cseréljük le az összes HTML taget egyedi helyőrzőre
  const tagRegex = /<[^>]+>/g;
  let tags = [];
  let tagIdx = 0;
  let textWithPlaceholders = text.replace(tagRegex, tag => {
    tags.push(tag);
    return `[[TAG${tagIdx++}]]`;
  });

  // 2. Kiemelés: több szavas keresés támogatása tagek közötti átfedéssel
  // A keresőkifejezést "szavakra" bontjuk
  const words = query.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length === 0) {
    // üres keresés
    let highlighted = text;
    highlighted = highlighted.replace(/\n\n/g, '<hr>');
    highlighted = highlighted.replace(/\n/g, '<br>');
    return highlighted;
  }
  // A helyőrzőket engedjük a szavak közé (akár több is lehet)
  // pl. szolgálati idő => szolgálati(?:\\s*\\[\\[TAG\\d+\\]\\])* idő
  const between = '(?:\\s*\\[\\[TAG\\d+\\]\\]\\s*)*';
  const pattern = words.map(w => w).join(between);
  const re = new RegExp(pattern, 'gi');
  // 3. Kiemelés markerekkel
  textWithPlaceholders = textWithPlaceholders.replace(re, match => `[[HIGHLIGHT]]${match}[[ENDHIGHLIGHT]]`);
  // 4. Visszahelyettesítjük a HTML tageket
  let restored = textWithPlaceholders.replace(/\[\[TAG(\d+)\]\]/g, (m, n) => tags[parseInt(n, 10)]);
  // 5. A highlight markereket span-ná alakítjuk
  restored = restored.replace(/\[\[HIGHLIGHT\]\]/g, '<span class="highlight">').replace(/\[\[ENDHIGHLIGHT\]\]/g, '</span>');
  // 6. sortörések kezelése
  restored = restored.replace(/\n\n/g, '<hr>');
  restored = restored.replace(/\n/g, '<br>');
  return restored;
}

let expandedPage = null;

function searchChapters() {
  const query = document.getElementById('searchInput').value.trim();
  const resultsDiv = document.getElementById('results');
  let found = [];
  for (const [chapter, chapterObj] of Object.entries(ocrData)) {
    if (!query) {
      found.push({ chapter, title: chapterObj.title });
      continue;
    }
    // Keresés a címben vagy a teljes szövegben, HTML-mentesítve
    const plainTitle = stripHtml(chapterObj.title);
    const plainText = stripHtml(chapterObj.text);
    const inTitle = plainTitle && plainTitle.toLowerCase().includes(query.toLowerCase());
    const inText = plainText && plainText.toLowerCase().includes(query.toLowerCase());
    if (inTitle || inText) {
      found.push({ chapter, title: chapterObj.title });
    }
  }
  if (found.length === 0) {
    resultsDiv.innerHTML = '<span style="color:#a00">Nincs találat.</span>';
    return;
  }
    // Természetes sorrend szerinti rendezés (pl. 2, 2.1, 10, 11)
    function chapterSortKey(chapter) {
      // Pl. '12.3.1' -> [12,3,1]
      return chapter.split('.').map(x => parseInt(x, 10));
    }
    found.sort((a, b) => {
      const ak = chapterSortKey(a.chapter);
      const bk = chapterSortKey(b.chapter);
      for (let i = 0; i < Math.max(ak.length, bk.length); ++i) {
        const ai = ak[i] || 0;
        const bi = bk[i] || 0;
        if (ai !== bi) return ai - bi;
      }
      return 0;
    });
  resultsDiv.innerHTML = found.map((res, idx) =>
    `<div class="result-block" style="cursor:pointer" onclick="expandChapter('${res.chapter}',${idx})">
      <div class="page"><b>${res.chapter}</b>${res.title ? ". " + highlight(res.title, query) : ''}</div>
      ${query && ocrData[res.chapter].text.toLowerCase().includes(query.toLowerCase()) && !res.title.toLowerCase().includes(query.toLowerCase()) ? '<span style="color:#888;font-size:0.95em;"></span>' : ''}
    </div>
    <div id="expand_${idx}"></div>`
  ).join('<hr>');
  expandedPage = null;
}

window.expandChapter = function(chapter, idx) {
  // Csukjunk be minden nyitottat
  document.querySelectorAll('[id^="expand_"]').forEach(div => div.innerHTML = '');
  if (expandedPage === idx) {
    expandedPage = null;
    return;
  }
  expandedPage = idx;
  // Scroll the chapter title into view
  const resultBlocks = document.querySelectorAll('.result-block');
  if (resultBlocks && resultBlocks[idx]) {
    resultBlocks[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const query = document.getElementById('searchInput').value.trim();
  const chapterObj = ocrData[chapter];
  let text = chapterObj.text;
  let html = highlight(text, query);
  // Táblázat renderelése, ha van
  let tableHtml = '';
  if (chapterObj.table) {
    tableHtml = `<div class=\"responsive-table\">${renderTable(chapterObj.table)}</div>`;
  }
  document.getElementById('expand_' + idx).innerHTML = `<div class=\"result-block\" style=\"background:#fffbe6;border-left:4px solid #28f109;margin-top:8px;\">${html}${tableHtml}</div>`;
}

function renderTable(tableObj) {
  let html = '<table style="margin-top:16px;width:100%;border-collapse:collapse;background:#fff"><thead><tr>';
  tableObj.headers.forEach(h => html += `<th style="border:1px solid #bbb;padding:6px 8px;background:#f2f6fa;color:#2a3a4a;font-weight:bold">${h}</th>`);
  html += '</tr></thead><tbody>';
  tableObj.rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => html += `<td style="border:1px solid #bbb;padding:6px 8px;vertical-align:top">${cell.replace(/\n/g,'<br>')}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

