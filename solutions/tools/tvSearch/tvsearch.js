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

function highlight(text, query) {
  if (!query) return text;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(safeQuery, 'gi');
  let highlighted = text.replace(re, match => `<span class="highlight">${match}</span>`);
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
      ${query && ocrData[res.chapter].text.toLowerCase().includes(query.toLowerCase()) && !res.title.toLowerCase().includes(query.toLowerCase()) ? '<span style="color:#888;font-size:0.95em;">(találat a szövegben)</span>' : ''}
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
  const query = document.getElementById('searchInput').value.trim();
  const chapterObj = ocrData[chapter];
  let text = chapterObj.text;
  // Ha van keresőszó, emeljük ki a találatokat a teljes fejezetben
  let html = highlight(text, query);
  document.getElementById('expand_' + idx).innerHTML = `<div class="result-block" style="background:#fffbe6;border-left:4px solid #28f109;margin-top:8px;">${html}</div>`;
}

