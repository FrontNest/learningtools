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
  const yearRegex = /\b(1[89][0-9]{2}|20[0-9]{2})\b/;
  for (const [chapter, chapterObj] of Object.entries(ocrData)) {
    if (!chapterObj.text) continue;
    // Szöveg blokkokra bontása \n\n mentén
    const blocks = chapterObj.text.split(/\n\n+/);
    blocks.forEach((block, i) => {
      const match = block.match(yearRegex);
      if (match) {
        // Az első évszámot mentsük el a sortoláshoz
        found.push({ chapter, title: chapterObj.title, block, blockIdx: i, year: parseInt(match[0], 10) });
      }
    });
  }
  if (found.length === 0) {
    resultsDiv.innerHTML = '<span style="color:#a00">Nincs évszámot tartalmazó rész.</span>';
    return;
  }
  // Találatok rendezése: évszám szerint növekvő, majd fejezetcím szerint
  found.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    // fejezetcím természetes sorrend
    function chapterSortKey(chapter) {
      return chapter.split('.').map(x => parseInt(x, 10));
    }
    const ak = chapterSortKey(a.chapter);
    const bk = chapterSortKey(b.chapter);
    for (let i = 0; i < Math.max(ak.length, bk.length); ++i) {
      const ai = ak[i] || 0;
      const bi = bk[i] || 0;
      if (ai !== bi) return ai - bi;
    }
    return 0;
  });
  // Új: minden találat külön sorban, évszám szerint
  resultsDiv.innerHTML = found.map((item, idx) =>
    `<div class="result-block" style="cursor:pointer" onclick="expandYearBlockSingle(${idx})">
      <div class="page"><b>${item.chapter}</b>${item.title ? ". " + highlight(item.title, '') : ''} <span style="color:#888;font-size:0.95em;">(${item.year})</span></div>
    </div>
    <div id="expand_year_${idx}"></div>`
  ).join('<hr>');
  window._yearBlockFlat = found;
  window._expandedYearBlock = null;
}

window.expandYearBlockSingle = function(idx) {
  // Csukjunk be minden nyitottat
  document.querySelectorAll('[id^="expand_year_"]').forEach(div => div.innerHTML = '');
  if (window._expandedYearBlock === idx) {
    window._expandedYearBlock = null;
    return;
  }
  window._expandedYearBlock = idx;
  const item = window._yearBlockFlat[idx];
  let html = `<div style="margin-bottom:18px;background:#fffbe6;border-left:4px solid #28f109;padding:12px 10px;border-radius:4px;">${highlight(item.block, '')}</div>`;
  document.getElementById('expand_year_' + idx).innerHTML = html;
}
function highlight(text, query) {
  let highlighted = text;
  if (query) {
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safeQuery, 'gi');
    highlighted = highlighted.replace(re, match => `<span class="highlight">${match}</span>`);
  }
  highlighted = highlighted.replace(/\n\n/g, '<hr>');
  highlighted = highlighted.replace(/\n/g, '<br>');
  return highlighted;
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
    // Keresés a címben vagy a teljes szövegben
    const inTitle = chapterObj.title && chapterObj.title.toLowerCase().includes(query.toLowerCase());
    const inText = chapterObj.text && chapterObj.text.toLowerCase().includes(query.toLowerCase());
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

