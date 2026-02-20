// XHTML-kompatibilis highlight: sortörések DOM-módszerrel
function highlightToDOM(text) {
  const root = document.createElement('div');
  const blocks = text.split(/\n\n/);
  blocks.forEach((block, i) => {
    if (i > 0) {
      const hr = document.createElement('hr');
      hr.setAttribute('style', 'border:none;border-top:2px solid #eee;margin:18px 0 12px 0');
      root.appendChild(hr);
    }
    const lines = block.split(/\n/);
    lines.forEach((line, j) => {
      if (j > 0) root.appendChild(document.createElement('br'));
      const span = document.createElement('span');
      span.innerHTML = line;
      root.appendChild(span);
    });
  });
  return root;
}

// Táblázat renderelése DOM-módszerrel (XHTML kompatibilis)
function renderTableDOM(tableObj) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('class', 'responsive-table');
  const table = document.createElement('table');
  table.setAttribute('style', 'margin-top:16px;width:100%;border-collapse:collapse;background:#fff');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  tableObj.headers.forEach(h => {
    const th = document.createElement('th');
    th.setAttribute('style', 'border:1px solid #bbb;padding:6px 8px;background:#f2f6fa;color:#2a3a4a;font-weight:bold');
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  tableObj.rows.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.setAttribute('style', 'border:1px solid #bbb;padding:6px 8px;vertical-align:top');
      const lines = cell.split(/\n/);
      lines.forEach((line, idx) => {
        if (idx > 0) td.appendChild(document.createElement('br'));
        td.appendChild(document.createTextNode(line));
      });
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}
// tevekenyseg.js
// Feladat: A tevekenyseg.xhtml táblázat 3. oszlopában lévő fejezet-hivatkozásokhoz overlay-t jelenít meg a SzolgalatiIdo2024.json megfelelő fejezetével, tvsearch.js szerinti formázással.

// JSON elérési útja
const JSON_PATH = 'sources/SzolgalatiIdo2024.json';
let szolgalatiData = {};

// JSON betöltése
fetch(JSON_PATH)
  .then(resp => resp.json())
  .then(data => {
    szolgalatiData = data;
    enableTableHover();
  })
  .catch(() => {
    console.error('Nem sikerült betölteni a SzolgalatiIdo2024.json-t.');
  });

// Segédfüggvény: HTML tagek eltávolítása
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '');
}

// Overlay létrehozása
function createOverlay(html) {
  removeOverlay();
  const overlay = document.createElement('div');
  overlay.id = 'szolg-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.background = '#fffbe6';
  overlay.style.border = '2px solid #20968c';
  overlay.style.borderRadius = '10px';
  overlay.style.boxShadow = '0 4px 32px #0005';
  overlay.style.maxWidth = '700px';
  overlay.style.width = '90vw';
  overlay.style.maxHeight = '70vh';
  overlay.style.overflowY = 'auto';
  overlay.style.zIndex = '9999';
  overlay.style.padding = '24px 28px 18px 28px';
  overlay.appendChild(html); // html most már DOM fragment vagy elem
  const btnDiv = document.createElement('div');
  btnDiv.setAttribute('style', 'text-align:right;margin-top:10px');
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Bezár';
  closeBtn.setAttribute('style', 'font-size:1.1em;padding:4px 16px;background:#20968c;color:#fff;border:none;border-radius:6px;cursor:pointer;');
  closeBtn.id = 'closeSzolgOverlay';
  closeBtn.onclick = removeOverlay;
  btnDiv.appendChild(closeBtn);
  overlay.appendChild(btnDiv);
  document.body.appendChild(overlay);
  setTimeout(() => {
    document.addEventListener('mousedown', outsideClickListener);
  }, 0);
}

function removeOverlay() {
  const overlay = document.getElementById('szolg-overlay');
  if (overlay) overlay.remove();
  document.removeEventListener('mousedown', outsideClickListener);
}

function outsideClickListener(e) {
  const overlay = document.getElementById('szolg-overlay');
  if (overlay && !overlay.contains(e.target)) {
    removeOverlay();
  }
}

// tvsearch.js szerinti highlight (egyszerűsített, csak sortörés és <hr> kezelése)
function highlight(text) {
  let highlighted = text;
  highlighted = highlighted.replace(/\n\n/g, '<hr>');
  highlighted = highlighted.replace(/\n/g, '<br>');
  return highlighted;
}

// Táblázat 3. oszlopának feldolgozása
function enableTableHover() {
  const table = document.querySelector('table');
  if (!table) return;
  for (const row of table.rows) {
    if (row.cells.length < 3) continue;
    const cell = row.cells[2];
    const match = cell.textContent.match(/^(\d+(?:\.\d+)*)(?=\.| )/);
    if (!match) continue;
    const chapterKey = match[1];
    cell.style.cursor = 'pointer';
    cell.addEventListener('mouseenter', function handler() {
      if (document.getElementById('szolg-overlay')) return;
      const chapter = szolgalatiData[chapterKey];
      if (!chapter) return;
      const contentFrag = document.createDocumentFragment();
      const titleDiv = document.createElement('div');
      titleDiv.setAttribute('style', 'font-size:1.25em;font-weight:bold;margin-bottom:10px;color:#20968c;');
      titleDiv.textContent = chapterKey + '. ' + (stripHtml(chapter.title || ''));
      contentFrag.appendChild(titleDiv);
      const textDiv = document.createElement('div');
      textDiv.setAttribute('style', 'font-size:1.08em;line-height:1.7;');
      if (chapter.text) {
        textDiv.appendChild(highlightToDOM(chapter.text));
      }
      contentFrag.appendChild(textDiv);
      if (chapter.table) {
        const tableElem = renderTableDOM(chapter.table);
        contentFrag.appendChild(tableElem);
      }
      createOverlay(contentFrag);
    });
  }
}

// Táblázat renderelése (tvsearch.js alapján)
function renderTable(tableObj) {
  let html = '<div class="responsive-table"><table style="margin-top:16px;width:100%;border-collapse:collapse;background:#fff"><thead><tr>';
  tableObj.headers.forEach(h => html += `<th style="border:1px solid #bbb;padding:6px 8px;background:#f2f6fa;color:#2a3a4a;font-weight:bold">${h}</th>`);
  html += '</tr></thead><tbody>';
  tableObj.rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => html += `<td style="border:1px solid #bbb;padding:6px 8px;vertical-align:top">${cell.replace(/\n/g,'<br>')}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}
