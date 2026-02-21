// Nyugdíjkorhatár táblázat (bővíthető, jogszabály szerint)
const korhatarTabla = [
  { ev: 1952, korhatarEv: 62, korhatarHonap: 0 },
  { ev: 1953, korhatarEv: 63, korhatarHonap: 0 },
  { ev: 1954, korhatarEv: 63, korhatarHonap: 4 },
  { ev: 1955, korhatarEv: 63, korhatarHonap: 8 },
  { ev: 1956, korhatarEv: 64, korhatarHonap: 0 },
  { ev: 1957, korhatarEv: 64, korhatarHonap: 6 },
  { ev: 1958, korhatarEv: 64, korhatarHonap: 10 },
  { ev: 1959, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1960, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1961, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1962, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1963, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1964, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1965, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1966, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1967, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1968, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1969, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1970, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1971, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1972, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1973, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1974, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1975, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1976, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1977, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1978, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1979, korhatarEv: 65, korhatarHonap: 0 },
  { ev: 1980, korhatarEv: 65, korhatarHonap: 0 }
];

function getKorhatar(birthYear) {
  let korhatar = korhatarTabla[korhatarTabla.length - 1];
  for (let i = 0; i < korhatarTabla.length; i++) {
    if (birthYear <= korhatarTabla[i].ev) {
      korhatar = korhatarTabla[i];
      break;
    }
  }
  return korhatar;
}

function showKorhatar(birthYear) {
  const korhatar = getKorhatar(birthYear);
  const korhatarDiv = document.getElementById('korhatarInfo');
  if (korhatarDiv) {
    korhatarDiv.innerHTML = `Nyugdíjkorhatár: ${korhatar.korhatarEv} év${korhatar.korhatarHonap > 0 ? ' ' + korhatar.korhatarHonap + ' hónap' : ''}`;
  }
}

document.getElementById('birthYear').addEventListener('input', function() {
  showKorhatar(parseInt(this.value, 10));
});
// Valorizációs szorzók
const valorizaciosSzorzok = {
  1950: 679.815, 1951: 636.620, 1952: 500.992, 1953: 471.765, 1954: 430.761, 1955: 409.701, 1956: 378.731, 1957: 325.273, 1958: 318.092, 1959: 305.039, 1960: 297.940, 1961: 293.949, 1962: 286.816, 1963: 275.995, 1964: 267.199, 1965: 266.270, 1966: 253.666, 1967: 245.820, 1968: 240.687, 1969: 230.688, 1970: 216.495, 1971: 206.971, 1972: 196.370, 1973: 183.006, 1974: 169.925, 1975: 159.405, 1976: 152.103, 1977: 141.492, 1978: 131.010, 1979: 124.535, 1980: 117.820, 1981: 110.628, 1982: 103.877, 1983: 99.403, 1984: 88.675, 1985: 81.131, 1986: 75.257, 1987: 69.299, 1988: 63.115, 1989: 53.990, 1990: 44.400, 1991: 35.378, 1992: 29.163, 1993: 24.782, 1994: 19.468, 1995: 17.287, 1996: 14.724, 1997: 11.867, 1998: 10.023, 1999: 8.893, 2000: 7.982, 2001: 6.871, 2002: 5.742, 2003: 5.028, 2004: 4.753, 2005: 4.318, 2006: 4.013, 2007: 3.894, 2008: 3.643, 2009: 3.576, 2010: 3.347, 2011: 3.146, 2012: 3.083, 2013: 2.938, 2014: 2.852, 2015: 2.735, 2016: 2.539, 2017: 2.248, 2018: 2.019, 2019: 1.813, 2020: 1.652, 2021: 1.520, 2022: 1.294, 2023: 1.133, 2024: 0.000, 2025: 0.000, 2026: 0.000, 2027: 0.000, 2028: 0.000, 2029: 0.000, 2030: 0.000, 2031: 0.000, 2032: 0.000, 2033: 0.000, 2034: 0.000, 2035: 0.000, 2036: 0.000, 2037: 0.000, 2038: 0.000 };

// Minimálbér táblázat
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

// Szolgálati idő százalék táblázat
const szolidoSzazalek = {
  15: 43.0, 16: 45.0, 17: 47.0, 18: 49.0, 19: 51.0, 20: 53.0, 21: 55.0, 22: 57.0, 23: 59.0, 24: 61.0, 25: 63.0, 26: 64.0, 27: 65.0, 28: 66.0, 29: 67.0, 30: 68.0, 31: 69.0, 32: 70.0, 33: 71.0, 34: 72.0, 35: 73.0, 36: 74.0, 37: 75.5, 38: 77.0, 39: 78.5, 40: 80.0, 41: 82.0, 42: 84.0, 43: 86.0, 44: 88.0, 45: 90.0, 46: 92.0, 47: 94.0, 48: 96.0, 49: 98.0, 50: 100.0, 51: 100.0, 52: 100.0, 53: 100.0, 54: 100.0, 55: 100.0, 56: 100.0, 57: 100.0, 58: 100.0, 59: 100.0, 60: 100.0, 61: 100.0, 62: 100.0, 63: 100.0, 64: 100.0, 65: 100.0, 66: 100.0, 67: 100.0, 68: 100.0, 69: 100.0, 70: 100.0, 71: 100.0, 72: 100.0, 73: 100.0, 74: 100.0, 75: 100.0, 76: 100.0, 77: 100.0, 78: 100.0, 79: 100.0, 80: 100.0 };

function renderValorizaciosTable() {
  let html = '<table><thead><tr><th>Év</th><th>Szorzószám</th></tr></thead><tbody>';
  for (const ev in valorizaciosSzorzok) {
    html += `<tr><td>${ev}</td><td>${valorizaciosSzorzok[ev]}</td></tr>`;
  }
  html += '</tbody></table>';
  return html;
}

function renderMinimalberTable() {
  let html = '<table><thead><tr><th>Kezdet</th><th>Vége</th><th>Minimálbér (Ft)</th></tr></thead><tbody>';
  minimalberData.forEach(row => {
    html += `<tr><td>${row.start.replace(/-/g, ".")}</td><td>${row.end.replace(/-/g, ".")}</td><td>${row.wage.toLocaleString()}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function renderSzolidoTable() {
  let html = '<table><thead><tr><th>Szolgálati idő (év)</th><th>Százalék</th></tr></thead><tbody>';
  for (const ev in szolidoSzazalek) {
    html += `<tr><td>${ev}</td><td>${szolidoSzazalek[ev]}%</td></tr>`;
  }
  html += '</tbody></table>';
  return html;
}


// Valorizációs év legördülő feltöltése
const valorizacioEvSelect = document.getElementById('valorizacioEv');
if (valorizacioEvSelect) {
  Object.keys(valorizaciosSzorzok).forEach(ev => {
    if (ev !== '0') {
      const opt = document.createElement('option');
      opt.value = ev;
      opt.textContent = ev;
      valorizacioEvSelect.appendChild(opt);
    }
  });
}

// Jogcímek beszámítási szabályok (bővíthető JSON)
// Korkedvezményes, bányász, művész jogcímek hozzáadása
// korkedvezmenyes: true, bányász: true, művész: true
const jogcimSzabalyok = {
  'Teljes munkaidő': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false },
  'Részmunkaidő': { beszamitasiTenyezo: 0.7, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false },
  'Közalkalmazotti szolgálat': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false },
  'Katonai szolgálat': { beszamitasiTenyezo: 1, maxNap: 365, jogosultsagi: false, keresotevekenyseg: false, gyermekneveles: false }, // max 1 év
  'Gyermeknevelés': { beszamitasiTenyezo: 1, maxNap: 730, jogosultsagi: true, keresotevekenyseg: false, gyermekneveles: true }, // max 2 év
  'Ápolási szabadság': { beszamitasiTenyezo: 0.5, maxNap: 365, jogosultsagi: false, keresotevekenyseg: false, gyermekneveles: false }, // max 1 év, 50%
  'Fizetés nélküli szabadság': { beszamitasiTenyezo: 0.5, maxNap: 365, jogosultsagi: false, keresotevekenyseg: false, gyermekneveles: false },
  'Tanulmányi idő': { beszamitasiTenyezo: 0.5, maxNap: 365, jogosultsagi: false, keresotevekenyseg: false, gyermekneveles: false },
  'Egyéb jogcímek': { beszamitasiTenyezo: 1, maxNap: null, egyedi: true, jogosultsagi: false, keresotevekenyseg: false, gyermekneveles: false },
  'Korkedvezményes munkakör': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false, korkedvezmenyes: true },
  'Bányász': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false, banyasz: true },
  'Művész': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false, muvesz: true },
  'Szolgálati nyugdíj': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false, szolgalatiNyugdij: true },
  'Szolgálati rokkantsági nyugdíj': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false, szolgalatiRokkantsagi: true },
  'Szolgálati baleseti rokkantsági nyugdíj': { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: true, keresotevekenyseg: true, gyermekneveles: false, szolgalatiBalesetiRokkantsagi: true }
};
const jogcimek = Object.keys(jogcimSzabalyok);

// Dinamikus jogcímes időszakok kezelése
const periodsTableBody = document.getElementById('periodsTableBody');
const addPeriodBtn = document.getElementById('addPeriodBtn');
let periods = [];

function createPeriodRow(period, idx) {
  const tr = document.createElement('tr');
  // Jogcím legördülő
  const jogcimTd = document.createElement('td');
  const jogcimSelect = document.createElement('select');
  jogcimSelect.name = 'jogcim_' + idx;
  jogcimek.forEach(jc => {
    const opt = document.createElement('option');
    opt.value = jc;
    opt.textContent = jc;
    jogcimSelect.appendChild(opt);
  });
  jogcimSelect.value = period.jogcim || '';
  jogcimTd.appendChild(jogcimSelect);
  tr.appendChild(jogcimTd);
  // Kezdő dátum
  const kezdoTd = document.createElement('td');
  kezdoTd.innerHTML = `<input type="number" min="1900" max="2026" placeholder="Év" value="${period.kezdoEv||''}" style="width:60px;" /> <input type="number" min="1" max="12" placeholder="Hó" value="${period.kezdoHonap||''}" style="width:40px;" /> <input type="number" min="1" max="31" placeholder="Nap" value="${period.kezdoNap||''}" style="width:40px;" />`;
  tr.appendChild(kezdoTd);
  // Befejező dátum
  const vegeTd = document.createElement('td');
  vegeTd.innerHTML = `<input type="number" min="1900" max="2026" placeholder="Év" value="${period.vegeEv||''}" style="width:60px;" /> <input type="number" min="1" max="12" placeholder="Hó" value="${period.vegeHonap||''}" style="width:40px;" /> <input type="number" min="1" max="31" placeholder="Nap" value="${period.vegeNap||''}" style="width:40px;" />`;
  tr.appendChild(vegeTd);
  // Átlagkereset
  const keresetTd = document.createElement('td');
  keresetTd.innerHTML = `<input type="number" min="0" placeholder="Ft" value="${period.kereset||''}" style="width:80px;" />`;
  tr.appendChild(keresetTd);
  // Művelet (törlés)
  const muveletTd = document.createElement('td');
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'deletePeriodBtn';
  delBtn.textContent = 'Törlés';
  delBtn.onclick = () => {
    periods.splice(idx, 1);
    renderPeriodsTable();
  };
  muveletTd.appendChild(delBtn);
  tr.appendChild(muveletTd);
  return tr;
}

function renderPeriodsTable() {
  periodsTableBody.innerHTML = '';
  periods.forEach((period, idx) => {
    periodsTableBody.appendChild(createPeriodRow(period, idx));
  });
}

addPeriodBtn.onclick = function() {
  // Mentsük el az aktuális sorok értékeit
  for (let i = 0; i < periodsTableBody.children.length; i++) {
    const tr = periodsTableBody.children[i];
    periods[i].jogcim = tr.children[0].querySelector('select').value;
    periods[i].kezdoEv = tr.children[1].children[0].value;
    periods[i].kezdoHonap = tr.children[1].children[1].value;
    periods[i].kezdoNap = tr.children[1].children[2].value;
    periods[i].vegeEv = tr.children[2].children[0].value;
    periods[i].vegeHonap = tr.children[2].children[1].value;
    periods[i].vegeNap = tr.children[2].children[2].value;
    periods[i].kereset = tr.children[3].children[0].value;
  }
  periods.push({ jogcim: jogcimek[0], kereset: '', kezdoEv: '', kezdoHonap: '', kezdoNap: '', vegeEv: '', vegeHonap: '', vegeNap: '' });
  renderPeriodsTable();
};

renderPeriodsTable();

document.getElementById('valorizaciosTable').innerHTML = renderValorizaciosTable();
document.getElementById('minimalberTable').innerHTML = renderMinimalberTable();
document.getElementById('szolidoTable').innerHTML = renderSzolidoTable();

function validateForm(data) {
  for (const key in data) {
    if (data[key] === '' || data[key] === null || isNaN(data[key])) {
      return false;
    }
  }
  return true;
}

document.getElementById('nyugdijForm').addEventListener('submit', function(e) {
                          // Tartós szabadságelvonás juttatás mezők kezelése
                          const szabadsagNev = document.getElementById('szabadsagNev') ? document.getElementById('szabadsagNev').value : '';
                          const szabadsagMagyar = document.getElementById('szabadsagMagyar') && document.getElementById('szabadsagMagyar').checked;
                          const szabadsagLakhely = document.getElementById('szabadsagLakhely') && document.getElementById('szabadsagLakhely').checked;
                          const szabadsagIdotartam = document.getElementById('szabadsagIdotartam') ? parseFloat(document.getElementById('szabadsagIdotartam').value) : null;
                          const szabadsagHalalBuntetes = document.getElementById('szabadsagHalalBuntetes') && document.getElementById('szabadsagHalalBuntetes').checked;
                          const szabadsagRokkant = document.getElementById('szabadsagRokkant') && document.getElementById('szabadsagRokkant').checked;
                          const szabadsagNyugdijkorhatar = document.getElementById('szabadsagNyugdijkorhatar') && document.getElementById('szabadsagNyugdijkorhatar').checked;
                          const szabadsagTulHazas = document.getElementById('szabadsagTulHazas') && document.getElementById('szabadsagTulHazas').checked;
                          const szabadsagTulHazasOszvegyi = document.getElementById('szabadsagTulHazasOszvegyi') && document.getElementById('szabadsagTulHazasOszvegyi').checked;
                          const szabadsagIgazolas = document.getElementById('szabadsagIgazolas') && document.getElementById('szabadsagIgazolas').files.length > 0;
                          let szabadsagMsg = '';
                          let szabadsagJogosult = false;
                          let szabadsagOsszeg = 0;
                          // Jogosultság: magyar állampolgár, magyarországi lakóhely, időtartam >= 1 év, igazolás, nyugdíjkorhatár vagy rokkant
                          if (szabadsagNev && szabadsagMagyar && szabadsagLakhely && szabadsagIdotartam && szabadsagIdotartam >= 1 && szabadsagIgazolas && (szabadsagNyugdijkorhatar || szabadsagRokkant)) {
                            szabadsagJogosult = true;
                          }
                          // Saját jogon juttatás összege
                          if (szabadsagJogosult && !szabadsagTulHazas) {
                            if (szabadsagHalalBuntetes) {
                              szabadsagOsszeg = 100000;
                              szabadsagMsg = 'Halálbüntetés, nem hajtották végre: havi 100 000 Ft.';
                            } else if (szabadsagIdotartam >= 10) {
                              szabadsagOsszeg = 80000;
                              szabadsagMsg = '10 év vagy több szabadságelvonás: havi 80 000 Ft.';
                            } else if (szabadsagIdotartam >= 5) {
                              szabadsagOsszeg = 60000;
                              szabadsagMsg = '5-10 év szabadságelvonás: havi 60 000 Ft.';
                            } else if (szabadsagIdotartam >= 3) {
                              szabadsagOsszeg = 40000;
                              szabadsagMsg = '3-5 év szabadságelvonás: havi 40 000 Ft.';
                            } else if (szabadsagIdotartam >= 1) {
                              szabadsagOsszeg = 22500;
                              szabadsagMsg = '1-3 év szabadságelvonás: havi 22 500 Ft.';
                            }
                            szabadsagMsg += ' Igazolás: szabadságelvonás, magyar állampolgárság, lakóhely, dokumentumok csatolva.';
                          }
                          // Túlélő házastárs juttatás összege
                          if (szabadsagJogosult && szabadsagTulHazas) {
                            if (szabadsagHalalBuntetes) {
                              szabadsagOsszeg = szabadsagTulHazasOszvegyi ? 30000 : 50000;
                              szabadsagMsg = `Halálbüntetés, nem hajtották végre: havi ${szabadsagOsszeg.toLocaleString()} Ft.`;
                            } else if (szabadsagIdotartam >= 10) {
                              szabadsagOsszeg = szabadsagTulHazasOszvegyi ? 24000 : 40000;
                              szabadsagMsg = `10 év vagy több szabadságelvonás: havi ${szabadsagOsszeg.toLocaleString()} Ft.`;
                            } else if (szabadsagIdotartam >= 5) {
                              szabadsagOsszeg = szabadsagTulHazasOszvegyi ? 18000 : 30000;
                              szabadsagMsg = `5-10 év szabadságelvonás: havi ${szabadsagOsszeg.toLocaleString()} Ft.`;
                            } else if (szabadsagIdotartam >= 3) {
                              szabadsagOsszeg = szabadsagTulHazasOszvegyi ? 12000 : 20000;
                              szabadsagMsg = `3-5 év szabadságelvonás: havi ${szabadsagOsszeg.toLocaleString()} Ft.`;
                            }
                            szabadsagMsg += ' Igazolás: szabadságelvonás, magyar állampolgárság, lakóhely, dokumentumok csatolva.';
                          }
                          if (!szabadsagJogosult) {
                            szabadsagMsg = 'Nem jogosult tartós szabadságelvonás juttatásra. Feltételek: magyar állampolgár, magyarországi lakóhely, időtartam >= 1 év, igazolás, nyugdíjkorhatár vagy rokkant.';
                          }
                        // Rokkantsági járadék mezők kezelése
                        const rokkantsagiNev = document.getElementById('rokkantsagiNev') ? document.getElementById('rokkantsagiNev').value : '';
                        const rokkantsagiEletkor = document.getElementById('rokkantsagiEletkor') ? parseInt(document.getElementById('rokkantsagiEletkor').value) : null;
                        const rokkantsagiEgeszsegkar = document.getElementById('rokkantsagiEgeszsegkar') ? parseFloat(document.getElementById('rokkantsagiEgeszsegkar').value) : null;
                        const rokkantsagiMagyar = document.getElementById('rokkantsagiMagyar') && document.getElementById('rokkantsagiMagyar').checked;
                        const rokkantsagiIgazolas = document.getElementById('rokkantsagiIgazolas') && document.getElementById('rokkantsagiIgazolas').files.length > 0;
                        let rokkantsagiMsg = '';
                        let rokkantsagiJogosult = false;
                        // Jogosultság: 18 év felett, magyar állampolgár, egészségkárosodás >= 70%, 25 év előtt keletkezett, igazolás, nem részesül nyugellátásban
                        if (rokkantsagiNev && rokkantsagiEletkor && rokkantsagiEletkor >= 18 && rokkantsagiMagyar && rokkantsagiEgeszsegkar && rokkantsagiEgeszsegkar >= 70 && rokkantsagiIgazolas) {
                          rokkantsagiJogosult = true;
                        }
                        // Rokkantsági járadék összeg
                        if (rokkantsagiJogosult) {
                          rokkantsagiMsg = 'Rokkantsági járadék jogosultság: Igen. Havi fix összeg: 63 915 Ft (2026. január 1-től). Igazolás: egészségkárosodás, magyar állampolgárság, orvosi dokumentumok.';
                        } else {
                          rokkantsagiMsg = 'Nem jogosult rokkantsági járadékra. Feltételek: 18 év felett, magyar állampolgár, egészségkárosodás >= 70%, 25 év előtt keletkezett, igazolás, nem részesül nyugellátásban.';
                        }
                      // Baleseti járadék mezők kezelése
                      const balesetiJaradekNev = document.getElementById('balesetiJaradekNev') ? document.getElementById('balesetiJaradekNev').value : '';
                      const balesetiJaradekEgeszsegkar = document.getElementById('balesetiJaradekEgeszsegkar') ? parseFloat(document.getElementById('balesetiJaradekEgeszsegkar').value) : null;
                      const balesetiJaradekBaleset = document.getElementById('balesetiJaradekBaleset') && document.getElementById('balesetiJaradekBaleset').checked;
                      const balesetiJaradekMegbetegedes = document.getElementById('balesetiJaradekMegbetegedes') && document.getElementById('balesetiJaradekMegbetegedes').checked;
                      const balesetiJaradekIgazolas = document.getElementById('balesetiJaradekIgazolas') && document.getElementById('balesetiJaradekIgazolas').files.length > 0;
                      let balesetiJaradekMsg = '';
                      let balesetiJaradekOsszeg = 0;
                      let balesetiJaradekJogosult = false;
                      // Jogosultság: üzemi baleset vagy foglalkozási megbetegedés, egészségkárosodás > 13%, igazolás
                      if (balesetiJaradekNev && (balesetiJaradekBaleset || balesetiJaradekMegbetegedes) && balesetiJaradekEgeszsegkar && balesetiJaradekEgeszsegkar > 13 && balesetiJaradekIgazolas) {
                        balesetiJaradekJogosult = true;
                      }
                      // Baleseti járadék összeg számítása
                      if (balesetiJaradekJogosult) {
                        // Egészségkárosodás mértéke alapján
                        if (balesetiJaradekEgeszsegkar >= 14 && balesetiJaradekEgeszsegkar <= 20) {
                          balesetiJaradekOsszeg = Math.round(atlagKereset * 0.08);
                          balesetiJaradekMsg = `Baleseti járadék összege: ${balesetiJaradekOsszeg.toLocaleString()} Ft (14-20% egészségkárosodás, átlagkereset 8%-a).`;
                        } else if (balesetiJaradekEgeszsegkar >= 21 && balesetiJaradekEgeszsegkar <= 28) {
                          balesetiJaradekOsszeg = Math.round(atlagKereset * 0.10);
                          balesetiJaradekMsg = `Baleseti járadék összege: ${balesetiJaradekOsszeg.toLocaleString()} Ft (21-28% egészségkárosodás, átlagkereset 10%-a).`;
                        } else if (balesetiJaradekEgeszsegkar >= 29 && balesetiJaradekEgeszsegkar <= 39) {
                          balesetiJaradekOsszeg = Math.round(atlagKereset * 0.15);
                          balesetiJaradekMsg = `Baleseti járadék összege: ${balesetiJaradekOsszeg.toLocaleString()} Ft (29-39% egészségkárosodás, átlagkereset 15%-a).`;
                        } else if (balesetiJaradekEgeszsegkar > 39) {
                          balesetiJaradekOsszeg = Math.round(atlagKereset * 0.30);
                          balesetiJaradekMsg = `Baleseti járadék összege: ${balesetiJaradekOsszeg.toLocaleString()} Ft (39% feletti egészségkárosodás, átlagkereset 30%-a).`;
                        }
                        balesetiJaradekMsg += ' Igazolás: üzemi baleset vagy foglalkozási megbetegedés, egészségkárosodás, dokumentumok csatolva.';
                      } else {
                        balesetiJaradekMsg = 'Nem jogosult baleseti járadékra. Feltételek: üzemi baleset vagy foglalkozási megbetegedés, egészségkárosodás > 13%, dokumentumok csatolva.';
                      }
                    // Baleseti hozzátartozói nyugdíj mezők kezelése
                    const balesetiTipus = document.getElementById('balesetiTipus') ? document.getElementById('balesetiTipus').value : '';
                    const balesetiJogosultNev = document.getElementById('balesetiJogosultNev') ? document.getElementById('balesetiJogosultNev').value : '';
                    const balesetiBaleset = document.getElementById('balesetiBaleset') && document.getElementById('balesetiBaleset').checked;
                    const balesetiMegbetegedes = document.getElementById('balesetiMegbetegedes') && document.getElementById('balesetiMegbetegedes').checked;
                    const balesetiIgazolas = document.getElementById('balesetiIgazolas') && document.getElementById('balesetiIgazolas').files.length > 0;
                    let balesetiMsg = '';
                    let balesetiOsszeg = 0;
                    let balesetiJogosult = false;
                    // Jogosultság: üzemi baleset vagy foglalkozási megbetegedés igazolva, jogosult típus, igazolás
                    if (balesetiTipus && balesetiJogosultNev && (balesetiBaleset || balesetiMegbetegedes) && balesetiIgazolas) {
                      balesetiJogosult = true;
                    }
                    // Baleseti hozzátartozói nyugdíj összeg számítása
                    if (balesetiJogosult) {
                      // Az elhunyt átlagkereset 60%-a, növelve a szolgálati idő százalékával, de nem lehet több az átlagkeresetnél
                      let balesetiAlap = Math.round(atlagKereset * 0.6);
                      if (balesetiAlap > atlagKereset) balesetiAlap = atlagKereset;
                      // Típus szerint: özvegy 60%, árva 30%, szülő 30%
                      if (balesetiTipus === 'özvegy') {
                        balesetiOsszeg = Math.round(balesetiAlap * 0.6);
                        balesetiMsg = `Baleseti özvegyi nyugdíj összege: ${balesetiOsszeg.toLocaleString()} Ft.`;
                      } else if (balesetiTipus === 'árva') {
                        balesetiOsszeg = Math.round(balesetiAlap * 0.3);
                        balesetiMsg = `Baleseti árvaellátás összege: ${balesetiOsszeg.toLocaleString()} Ft.`;
                      } else if (balesetiTipus === 'szülő') {
                        balesetiOsszeg = Math.round(balesetiAlap * 0.3);
                        balesetiMsg = `Baleseti szülői nyugdíj összege: ${balesetiOsszeg.toLocaleString()} Ft.`;
                      }
                      balesetiMsg += ' Igazolás: üzemi baleset vagy foglalkozási megbetegedés, jogosult típus, dokumentumok csatolva.';
                    } else {
                      balesetiMsg = 'Nem jogosult baleseti hozzátartozói nyugdíjra. Feltételek: üzemi baleset vagy foglalkozási megbetegedés igazolva, jogosult típus, dokumentumok csatolva.';
                    }
                  // Szülői nyugdíj mezők kezelése
                  const szuloNev = document.getElementById('szuloNev') ? document.getElementById('szuloNev').value : '';
                  const szuloTipus = document.getElementById('szuloTipus') ? document.getElementById('szuloTipus').value : '';
                  const szuloKor = document.getElementById('szuloKor') ? parseInt(document.getElementById('szuloKor').value) : null;
                  const szuloMegvaltozott = document.getElementById('szuloMegvaltozott') && document.getElementById('szuloMegvaltozott').checked;
                  const szuloEltartott = document.getElementById('szuloEltartott') && document.getElementById('szuloEltartott').checked;
                  const szuloJogosultakSzama = document.getElementById('szuloJogosultakSzama') ? parseInt(document.getElementById('szuloJogosultakSzama').value) : 1;
                  const szuloIgazolas = document.getElementById('szuloIgazolas') && document.getElementById('szuloIgazolas').files.length > 0;
                  let szuloMsg = '';
                  let szuloNyugdijOsszeg = 0;
                  let szuloJogosult = false;
                  // Jogosultság: szülő/nagyszülő, megváltozott munkaképesség vagy 65 év felett, eltartott, igazolások
                  if (szuloNev && szuloTipus && szuloIgazolas && szuloEltartott && (szuloMegvaltozott || (szuloKor && szuloKor >= 65))) {
                    szuloJogosult = true;
                  }
                  // Szülői nyugdíj összeg számítása
                  if (szuloJogosult) {
                    // Saját jogú nyugdíjban nem részesül: 60%
                    if (!szuloMegvaltozott && (!szuloKor || szuloKor < 65)) {
                      szuloNyugdijOsszeg = Math.round(nyugdijOsszeg * 0.6);
                      szuloMsg = `Szülői nyugdíj összege: ${szuloNyugdijOsszeg.toLocaleString()} Ft (az elhunyt nyugdíjának 60%-a).`;
                    }
                    // Saját jogú nyugdíjban részesül: 30%
                    if (szuloMegvaltozott || (szuloKor && szuloKor >= 65)) {
                      szuloNyugdijOsszeg = Math.round(nyugdijOsszeg * 0.3);
                      szuloMsg = `Szülői nyugdíj összege: ${szuloNyugdijOsszeg.toLocaleString()} Ft (az elhunyt nyugdíjának 30%-a).`;
                    }
                    // Több jogosult esetén megosztás
                    if (szuloJogosultakSzama > 1) {
                      szuloNyugdijOsszeg = Math.floor(szuloNyugdijOsszeg / szuloJogosultakSzama);
                      szuloMsg += ` Több jogosult esetén egyenlő arányban: ${szuloNyugdijOsszeg.toLocaleString()} Ft/fő.`;
                    }
                    szuloMsg += ' Igazolások: családi kapcsolat, eltartás, egészségi állapot, halotti anyakönyvi kivonat.';
                  } else {
                    szuloMsg = 'Nem jogosult szülői nyugdíjra. Feltételek: szülő/nagyszülő, megváltozott munkaképesség vagy 65 év felett, eltartott, igazolások csatolva.';
                  }
                // Árvaellátás mezők kezelése
                const arvaGyermekNev = document.getElementById('arvaGyermekNev') ? document.getElementById('arvaGyermekNev').value : '';
                const arvaGyermekSzuletesiEv = document.getElementById('arvaGyermekSzuletesiEv') ? parseInt(document.getElementById('arvaGyermekSzuletesiEv').value) : null;
                const arvaTanul = document.getElementById('arvaTanul') && document.getElementById('arvaTanul').checked;
                const arvaMegvaltozott = document.getElementById('arvaMegvaltozott') && document.getElementById('arvaMegvaltozott').checked;
                const arvaIgazolas = document.getElementById('arvaIgazolas') && document.getElementById('arvaIgazolas').files.length > 0;
                let arvaMsg = '';
                let arvaOsszeg = 0;
                let arvaJogosult = false;
                // Jogosultság: szülő nyugdíjas vagy megszerezte a szükséges szolgálati időt
                if (arvaGyermekNev && arvaGyermekSzuletesiEv && arvaIgazolas) {
                  // 16 év alatt automatikusan jogosult
                  const currentYear = new Date().getFullYear();
                  const arvaKor = currentYear - arvaGyermekSzuletesiEv;
                  if (arvaKor < 16) arvaJogosult = true;
                  // 16 év felett tanulmányok vagy megváltozott munkaképesség
                  if (arvaKor >= 16 && arvaKor <= 25 && arvaTanul) arvaJogosult = true;
                  if (arvaMegvaltozott) arvaJogosult = true;
                }
                // Árvaellátás összeg számítása
                if (arvaJogosult) {
                  arvaOsszeg = Math.round(nyugdijOsszeg * 0.3);
                  arvaMsg = `Árvaellátás összege: ${arvaOsszeg.toLocaleString()} Ft (az elhunyt nyugdíjának 30%-a).`;
                  // Mindkét szülő elhunyt vagy életben lévő szülő megváltozott munkaképességű: 60%
                  if (arvaMegvaltozott) {
                    arvaOsszeg = Math.round(nyugdijOsszeg * 0.6);
                    arvaMsg = `Árvaellátás összege: ${arvaOsszeg.toLocaleString()} Ft (az elhunyt nyugdíjának 60%-a).`;
                  }
                  // Minimum összeg
                  if (arvaOsszeg < 50000) {
                    arvaOsszeg = 50000;
                    arvaMsg += ' Árvaellátás legkisebb összege: 50 000 Ft.';
                  }
                  // Tanulmányok igazolása
                  if (arvaTanul && arvaKor >= 16) {
                    arvaMsg += ' Tanulmányi igazolás szükséges.';
                  }
                  // Megváltozott munkaképesség igazolása
                  if (arvaMegvaltozott) {
                    arvaMsg += ' Egészségi állapot igazolása szükséges.';
                  }
                } else {
                  arvaMsg = 'Nem jogosult árvaellátásra. Feltételek: gyermek neve, születési év, igazolások csatolva, életkor, tanulmányok vagy megváltozott munkaképesség.';
                }
              // Özvegyi nyugdíj mezők kezelése
              const ozvegyTipus = document.getElementById('ozvegyTipus') ? document.getElementById('ozvegyTipus').value : '';
              const ozvegyElettarsEgyuttel = document.getElementById('ozvegyElettarsEgyuttel') && document.getElementById('ozvegyElettarsEgyuttel').checked;
              const ozvegyElettarsGyermek = document.getElementById('ozvegyElettarsGyermek') && document.getElementById('ozvegyElettarsGyermek').checked;
              const ozvegyElvaltTartasdij = document.getElementById('ozvegyElvaltTartasdij') && document.getElementById('ozvegyElvaltTartasdij').checked;
              const ozvegyKorhatar = document.getElementById('ozvegyKorhatar') && document.getElementById('ozvegyKorhatar').checked;
              const ozvegyMegvaltozott = document.getElementById('ozvegyMegvaltozott') && document.getElementById('ozvegyMegvaltozott').checked;
              const ozvegyGyermek = document.getElementById('ozvegyGyermek') && document.getElementById('ozvegyGyermek').checked;
              const ozvegyIgazolas = document.getElementById('ozvegyIgazolas') && document.getElementById('ozvegyIgazolas').files.length > 0;
              let ozvegyMsg = '';
              let ozvegyiNyugdijOsszeg = 0;
              // Jogosultság: házastárs, bejegyzett élettárs, elvált házastárs, élettárs, elhunyt nyugdíjas vagy megszerezte a szükséges szolgálati időt
              let jogosultOzvegy = false;
              if (ozvegyTipus && ozvegyIgazolas) {
                // Élettárs: egy év együttélés + gyermek vagy 10 év együttélés
                if (ozvegyTipus === 'élettárs' && (ozvegyElettarsGyermek || ozvegyElettarsEgyuttel)) jogosultOzvegy = true;
                // Elvált: tartásdíj igazolás
                if (ozvegyTipus === 'elvált' && ozvegyElvaltTartasdij) jogosultOzvegy = true;
                // Házastárs, bejegyzett élettárs: igazolás
                if (ozvegyTipus === 'házastárs' || ozvegyTipus === 'bejegyzett élettárs') jogosultOzvegy = true;
              }
              // Ideiglenes özvegyi nyugdíj: haláltól egy évig, vagy gyermek miatt tovább
              if (jogosultOzvegy) {
                ozvegyiNyugdijOsszeg = Math.round(nyugdijOsszeg * 0.6);
                ozvegyMsg = `Ideiglenes özvegyi nyugdíj összege: ${ozvegyiNyugdijOsszeg.toLocaleString()} Ft (az elhunyt nyugdíjának 60%-a).`;
                // Elvált: tartásdíj összegénél több nem lehet
                if (ozvegyTipus === 'elvált' && ozvegyElvaltTartasdij) {
                  ozvegyMsg += ' Az ideiglenes özvegyi nyugdíj a tartásdíj összegénél több nem lehet.';
                }
                // Gyermek miatt hosszabb ideig jár
                if (ozvegyGyermek) {
                  ozvegyMsg += ' Árvaellátásra jogosult gyermek miatt az ideiglenes özvegyi nyugdíj tovább jár.';
                }
                // Végleges özvegyi nyugdíj: korhatár, megváltozott munkaképesség, gyermek, 10 éven belül feltétel teljesül
                if (ozvegyKorhatar || ozvegyMegvaltozott || ozvegyGyermek) {
                  ozvegyiNyugdijOsszeg = Math.round(nyugdijOsszeg * 0.6);
                  ozvegyMsg += ` Végleges özvegyi nyugdíj összege: ${ozvegyiNyugdijOsszeg.toLocaleString()} Ft (az elhunyt nyugdíjának 60%-a).`;
                }
                // Ha az özvegy maga nyugdíjas vagy ellátásban részesül, vagy gyermek miatt kapja, akkor 30%
                if (ozvegyKorhatar || ozvegyMegvaltozott || ozvegyGyermek) {
                  ozvegyiNyugdijOsszeg = Math.round(nyugdijOsszeg * 0.3);
                  ozvegyMsg += ` 30%-os mértékű özvegyi nyugdíj: ${ozvegyiNyugdijOsszeg.toLocaleString()} Ft.`;
                }
              } else {
                ozvegyMsg = 'Nem jogosult özvegyi nyugdíjra. Feltételek: házastárs, bejegyzett élettárs, elvált házastárs, élettárs, igazolások csatolva.';
              }
            // Táncművészeti életjáradék mezők kezelése
            const tancmuveszIgazolas = document.getElementById('tancmuveszIgazolas') && document.getElementById('tancmuveszIgazolas').files.length > 0;
            const tancmuveszFofoglalkozasu = document.getElementById('tancmuveszFofoglalkozasu') && document.getElementById('tancmuveszFofoglalkozasu').checked;
            let tancmuveszMsg = '';
            // Jogosultság: legalább 25 év főfoglalkozású táncművész szolgálati idő, nyugdíjkorhatár alatt, igazolás feltöltve
            if (muveszEv >= 25 && nyugdijEv < birthYear + korhatar.korhatarEv && tancmuveszIgazolas && tancmuveszFofoglalkozasu) {
              tancmuveszMsg = 'Jogosult táncművészeti életjáradékra.';
              if (maganNyugdijpenztar) {
                tancmuveszMsg += ' Magán-nyugdíjpénztári tagság miatt az életjáradék csökkentett összegben kerül megállapításra.';
              }
            } else {
              tancmuveszMsg = 'Nem jogosult táncművészeti életjáradékra. Feltételek: legalább 25 év főfoglalkozású táncművész szolgálati idő, nyugdíjkorhatár alatt, igazolás csatolva.';
            }
          // Átmeneti bányászjáradék mezők kezelése
          const banyaszMuszak = document.getElementById('banyaszMuszak') ? parseInt(document.getElementById('banyaszMuszak').value, 10) : 0;
          const banyaszIgazolas = document.getElementById('banyaszIgazolas') && document.getElementById('banyaszIgazolas').files.length > 0;
          const maganNyugdijpenztar = document.getElementById('maganNyugdijpenztar') && document.getElementById('maganNyugdijpenztar').checked;
          let atmenetiBanyaszMsg = '';
          // Műszakok számának korrekciója (mecseki ércbányászat 1,67x, szénbányászat 1,25x - bővíthető)
          let muszakKorrekcio = banyaszMuszak;
          // Jogosultság: 25 év szolgálati idő vagy 5000 műszak, nyugdíjkorhatár alatt, igazolás feltöltve
          if ((totalYears >= 25 || muszakKorrekcio >= 5000) && nyugdijEv < birthYear + korhatar.korhatarEv && banyaszIgazolas) {
            atmenetiBanyaszMsg = 'Jogosult átmeneti bányászjáradékra.';
            if (maganNyugdijpenztar) {
              atmenetiBanyaszMsg += ' Magán-nyugdíjpénztári tagság miatt a járadék csökkentett összegben kerül megállapításra.';
            }
          } else {
            atmenetiBanyaszMsg = 'Nem jogosult átmeneti bányászjáradékra. Feltételek: 25 év szolgálati idő vagy 5000 műszak, nyugdíjkorhatár alatt, igazolás csatolva.';
          }
        // Családi adókedvezmény érvényesítése mezők kezelése
        const csaladiAdokedvezmeny = document.getElementById('csaladiAdokedvezmeny').checked;
        const magzatIgazolas = document.getElementById('magzatIgazolas').files.length > 0;
        const hozzajaruloNyilatkozat = document.getElementById('hozzajaruloNyilatkozat').files.length > 0;
        const halaleset = document.getElementById('halaleset').checked;
        const orokosNev = document.getElementById('orokosNev') ? document.getElementById('orokosNev').value : '';
        const orokosNyilatkozat = document.getElementById('orokosNyilatkozat') && document.getElementById('orokosNyilatkozat').files.length > 0;
        let csaladiAdokedvMsg = '';
        if (csaladiAdokedvezmeny) {
          if (!hozzajaruloNyilatkozat) {
            csaladiAdokedvMsg = 'A családi adókedvezmény érvényesítéséhez hozzájáruló nyilatkozat feltöltése szükséges.';
          } else if (halaleset && (!orokosNev || !orokosNyilatkozat)) {
            csaladiAdokedvMsg = 'Haláleset esetén az örökös/házastárs neve és hozzájáruló nyilatkozat feltöltése szükséges.';
          } else {
            csaladiAdokedvMsg = 'A családi adókedvezmény érvényesíthető, a szükséges iratok csatolva.';
          }
          if (magzatIgazolas) {
            csaladiAdokedvMsg += ' Magzat igazolás csatolva.';
          }
        }
      // Szolgálati járandóság jogosultság számítása
      let szolgalatiNyugdijNap = 0;
      let szolgalatiRokkantsagiNap = 0;
      let szolgalatiBalesetiRokkantsagiNap = 0;
    // Korkedvezményes időszakok számítása
    let korkedvezmenyesNap = 0;
    let banyaszNap = 0;
    let muveszNap = 0;
    let korkedvezmenyesEv = 0;
    let banyaszEv = 0;
    let muveszEv = 0;
    let korkedvezmenyMérték = 0;
    let korkedvezmenyMsg = '';
  e.preventDefault();
  const birthYear = parseInt(document.getElementById('birthYear').value, 10);
  const birthMonth = parseInt(document.getElementById('birthMonth').value, 10);
  const birthDay = parseInt(document.getElementById('birthDay').value, 10);
  const nyugdijEv = parseInt(document.getElementById('nyugdijEv').value, 10);
  const nyugdijHonap = parseInt(document.getElementById('nyugdijHonap').value, 10);
  const valorizacioEv = document.getElementById('valorizacioEv').value;

  // Nyugdíjkorhatár automatikus megjelenítése
  showKorhatar(birthYear);

  // Validáció
  if (!birthYear || !birthMonth || !birthDay || !nyugdijEv || !nyugdijHonap) {
    document.getElementById('resultContainer').innerHTML = '<span style="color:red">Minden mező kitöltése kötelező!</span>';
    return;
  }
  if (periods.length === 0) {
    document.getElementById('resultContainer').innerHTML = '<span style="color:red">Legalább egy jogcímes időszakot adj meg!</span>';
    return;
  }

  // Jogcímes időszakok feldolgozása
  let totalDays = 0;
  let keresetSum = 0;
  let keresetCount = 0;
  let details = [];
  // Jogosultsági idő számítása
  let jogosultsagiNap = 0;
  let keresotevNap = 0;
  let gyermeknevelesNap = 0;
  for (let i = 0; i < periods.length; i++) {
    const tr = periodsTableBody.children[i];
    const jogcim = tr.children[0].querySelector('select').value;
    const kezdoEv = parseInt(tr.children[1].children[0].value, 10);
    const kezdoHonap = parseInt(tr.children[1].children[1].value, 10);
    const kezdoNap = parseInt(tr.children[1].children[2].value, 10);
    const vegeEv = parseInt(tr.children[2].children[0].value, 10);
    const vegeHonap = parseInt(tr.children[2].children[1].value, 10);
    const vegeNap = parseInt(tr.children[2].children[2].value, 10);
    const kereset = parseFloat(tr.children[3].children[0].value);
    // Validáció
    if (!jogcim || !kezdoEv || !kezdoHonap || !kezdoNap || !vegeEv || !vegeHonap || !vegeNap) {
      document.getElementById('resultContainer').innerHTML = '<span style="color:red">Minden időszak mező kitöltése kötelező!</span>';
      return;
    }
    if (kereset < 0) {
      document.getElementById('resultContainer').innerHTML = '<span style="color:red">Kereset nem lehet negatív!</span>';
      return;
    }
    const startDate = new Date(kezdoEv, kezdoHonap - 1, kezdoNap);
    const endDate = new Date(vegeEv, vegeHonap - 1, vegeNap);
    if (endDate < startDate) {
      document.getElementById('resultContainer').innerHTML = '<span style="color:red">Időszak vége nem lehet korábbi, mint a kezdete!</span>';
      return;
    }
    // Napok számítása
    let days = Math.floor((endDate - startDate) / (1000*60*60*24)) + 1;
    // Jogcím szabály szerinti beszámítás
    const szabaly = jogcimSzabalyok[jogcim] || { beszamitasiTenyezo: 1, maxNap: null, jogosultsagi: false, keresotevekenyseg: false, gyermekneveles: false };
    let napok = Math.round(days * szabaly.beszamitasiTenyezo);
    if (szabaly.maxNap && napok > szabaly.maxNap) napok = szabaly.maxNap;
    // Jogosultsági időbe számító napok
    if (szabaly.jogosultsagi) jogosultsagiNap += napok;
    if (szabaly.keresotevekenyseg) keresotevNap += napok;
    if (szabaly.gyermekneveles) gyermeknevelesNap += napok;
    // Korkedvezményes, bányász, művész időszakok
    if (szabaly.korkedvezmenyes && startDate < new Date(2015, 0, 1)) korkedvezmenyesNap += napok;
    if (szabaly.banyasz) banyaszNap += napok;
    if (szabaly.muvesz) muveszNap += napok;
    // Szolgálati nyugdíj, rokkantsági, baleseti rokkantsági
    if (szabaly.szolgalatiNyugdij) szolgalatiNyugdijNap += napok;
    if (szabaly.szolgalatiRokkantsagi) szolgalatiRokkantsagiNap += napok;
    if (szabaly.szolgalatiBalesetiRokkantsagi) szolgalatiBalesetiRokkantsagiNap += napok;
    // Kereset összesítés (csak ahol van kereset)
    if (!isNaN(kereset) && kereset > 0) {
      keresetSum += kereset * napok;
      keresetCount += napok;
    }
    totalDays += napok;
    details.push(`${jogcim}: ${napok} nap (${kezdoEv}.${kezdoHonap}.${kezdoNap} - ${vegeEv}.${vegeHonap}.${vegeNap})`);
  }
  // Szolgálati járandóság jogosultság ellenőrzése
  let szolgalatiJarandMsg = '';
  let szolgalatiJarandJogosult = false;
  const szolgalatiNyugdijEv = Math.floor(szolgalatiNyugdijNap / 365);
  const szolgalatiRokkantsagiEv = Math.floor(szolgalatiRokkantsagiNap / 365);
  const szolgalatiBalesetiRokkantsagiEv = Math.floor(szolgalatiBalesetiRokkantsagiNap / 365);
  // Jogosultság: 2011.12.31-én szolgálati nyugdíjban, rokkantsági nyugdíjban, baleseti rokkantsági nyugdíjban részesült, és a folyósítás időtartamával együtt legalább 25 év szolgálati időt szerzett
  // (Rendszeres pénzellátás: nem részesül)
  if ((szolgalatiNyugdijEv > 0 || szolgalatiRokkantsagiEv > 0 || szolgalatiBalesetiRokkantsagiEv > 0) && totalYears >= 25) {
    szolgalatiJarandJogosult = true;
    szolgalatiJarandMsg = 'Jogosult szolgálati járandóságra.';
  } else {
    szolgalatiJarandMsg = 'Nem jogosult szolgálati járandóságra.';
  }
  // Korkedvezményes évek
  korkedvezmenyesEv = Math.floor(korkedvezmenyesNap / 365);
  banyaszEv = Math.floor(banyaszNap / 365);
  muveszEv = Math.floor(muveszNap / 365);
  // Korkedvezmény mértékének számítása (alap logika)
  // Férfi: 10 év → 2 év, nő: 8 év → 2 év, további évek után extra kedvezmény
  // (Nem: inputból nem olvassuk, bővíthető)
  if (korkedvezmenyesEv >= 8) {
    korkedvezmenyMérték = 2;
    if (korkedvezmenyesEv > 8) {
      korkedvezmenyMérték += Math.floor((korkedvezmenyesEv - 8) / 4);
    }
    korkedvezmenyMsg = `Korkedvezményes munkakörben eltöltött idő: ${korkedvezmenyesEv} év (${korkedvezmenyesNap} nap), korkedvezmény mértéke: ${korkedvezmenyMérték} év.`;
  } else {
    korkedvezmenyMsg = `Korkedvezményes munkakörben eltöltött idő: ${korkedvezmenyesEv} év (${korkedvezmenyesNap} nap), nem jogosult korkedvezményre.`;
  }
  // Korhatár előtti ellátás jogosultságának ellenőrzése
  let korhatarElottiMsg = '';
  let korhatarElottiJogosult = false;
  // Korkedvezmény alapján
  if (korkedvezmenyesEv >= 8 && totalYears >= 15 && nyugdijEv < birthYear + korhatar.korhatarEv) {
    korhatarElottiJogosult = true;
    korhatarElottiMsg = 'Jogosult korhatár előtti ellátásra korkedvezmény alapján.';
  }
  // Bányász
  if (banyaszEv > 0 && nyugdijEv < birthYear + korhatar.korhatarEv) {
    korhatarElottiJogosult = true;
    korhatarElottiMsg = 'Jogosult korhatár előtti ellátásra bányász jogcím alapján.';
  }
  // Művész
  if (muveszEv > 0 && nyugdijEv < birthYear + korhatar.korhatarEv) {
    korhatarElottiJogosult = true;
    korhatarElottiMsg = 'Jogosult korhatár előtti ellátásra művész jogcím alapján.';
  }
  // Nők kedvezményes öregségi nyugdíja feltételek ellenőrzése
  let nokKedvezmenyes = false;
  let nokKedvMsg = '';
  const jogosultsagiEv = Math.floor(jogosultsagiNap / 365);
  const keresotevEv = Math.floor(keresotevNap / 365);
  const gyermeknevelesEv = Math.floor(gyermeknevelesNap / 365);
  // 5+ gyermek esetén a keresőtevékenység feltétel csökkentése (példaként inputból nem olvassuk, bővíthető)
  // Speciális jogcímek (gyermekek otthongondozási díja, ápolási díj) esetén min. 30 év keresőtevékenység
  // Most csak alap logika: 40 év jogosultsági idő, ebből legalább 32 év keresőtevékenység, max. 8 év gyermeknevelés
  if (jogosultsagiEv >= 40) {
    if (keresotevEv >= 32 && gyermeknevelesEv <= 8) {
      nokKedvezmenyes = true;
      nokKedvMsg = 'Jogosult nők kedvezményes öregségi nyugdíjára.';
    } else if (keresotevEv >= 40) {
      nokKedvezmenyes = true;
      nokKedvMsg = 'Jogosult nők kedvezményes öregségi nyugdíjára (40 év keresőtevékenység).';
    } else {
      nokKedvMsg = 'Nem teljesül a nők kedvezményes nyugdíj feltétele: legalább 40 év jogosultsági idő, ebből min. 32 év keresőtevékenység, max. 8 év gyermeknevelés.';
    }
  } else {
    nokKedvMsg = 'Nem teljesül a nők kedvezményes nyugdíj feltétele: legalább 40 év jogosultsági idő.';
  }

  // Szolgálati idő év+nap formátum
  const totalYears = Math.floor(totalDays / 365);
  const totalNap = totalDays % 365;
  let szazalek = 0;
  if (totalYears < 15) {
    szazalek = Math.max(0, Math.round((totalYears / 15) * 43)); // 15 év alatt arányos
  } else if (totalYears >= 50) {
    szazalek = 100.0;
  } else {
    szazalek = szolidoSzazalek[totalYears] || 100.0;
  }

  // Átlagkereset jogszabály szerinti képlet
  let atlagKereset = keresetCount > 0 ? keresetSum / keresetCount : 0;
  // Minimálbér korlátozás (ha előírt)
  let minber = 0;
  for (let i = 0; i < minimalberData.length; i++) {
    const row = minimalberData[i];
    const ev = parseInt(row.start.split('-')[0], 10);
    if (nyugdijEv >= ev) minber = row.wage;
  }
  // Degresszió 372 000 Ft felett
  let degresszaltKereset = atlagKereset;
  if (atlagKereset > 372000) {
    if (atlagKereset <= 421000) {
      degresszaltKereset = 372000 + (atlagKereset - 372000) * 0.9;
    } else {
      degresszaltKereset = 372000 + (421000 - 372000) * 0.9 + (atlagKereset - 421000) * 0.8;
    }
  }
  // Minimálbér szabály
  if (degresszaltKereset < minber) degresszaltKereset = minber;
  // Valorizációs szorzó kiválasztása
  let valEv = valorizacioEv !== "" ? valorizacioEv : nyugdijEv;
  let valorizaciosSzam = valorizaciosSzorzok[valEv] || 1;
  degresszaltKereset = degresszaltKereset * valorizaciosSzam;
  // Nyugdíj összeg számítása
  let nyugdijOsszeg = Math.round(degresszaltKereset * (szazalek / 100));
  // Minimum nyugdíj szabály (teljes nyugdíj, legalább 20 év szolgálati idő)
  const nyugdijMinimum = 28500;
  if (totalYears >= 20 && degresszaltKereset >= nyugdijMinimum && nyugdijOsszeg < nyugdijMinimum) {
    nyugdijOsszeg = nyugdijMinimum;
  }
  // Ha átlagkereset < minimum, akkor a nyugdíj = átlagkereset
  if (totalYears >= 20 && degresszaltKereset < nyugdijMinimum) {
    nyugdijOsszeg = Math.round(degresszaltKereset);
  }
  // Résznyugdíj: ha < 20 év szolgálati idő, nincs minimum
  if (totalYears < 20) {
    nyugdijOsszeg = Math.round(degresszaltKereset * (szazalek / 100));
  }
  // Nyugdíjnövelés: ha 65 év után legalább 30 nap további szolgálati idő, 0,5% növelés
  let nyugdijNovelese = 0;
  if (betoltotte65 && totalYears >= 20 && totalDays > 365 * 20 + 30) {
    nyugdijNovelese = Math.round(nyugdijOsszeg * 0.005);
    nyugdijOsszeg += nyugdijNovelese;
  }

  // Rögzített nyugdíj lehetősége
  let rogzitettNyugdijMsg = '';
  let rogzitettNyugdijOsszeg = null;
  // 65. év betöltése és legalább 20 év szolgálati idő
  const korhatar = getKorhatar(birthYear);
  const korhatarEv = korhatar.korhatarEv;
  const korhatarHonap = korhatar.korhatarHonap;
  // Ellenőrzés: ténylegesen betöltötte-e a 65. évet
  let betoltotte65 = false;
  if (nyugdijEv > birthYear + 65 || (nyugdijEv === birthYear + 65 && nyugdijHonap >= birthMonth)) {
    betoltotte65 = true;
  }
  if (betoltotte65 && totalYears >= 20) {
    // Rögzített nyugdíj összege: a 65. év betöltésekor számított nyugdíj
    // Számítsuk újra a 65. év betöltésekor
    // Feltételezzük, hogy a szolgálati idő addig ugyanennyi (bővíthető)
    let rogzitettNyugdijSzazalek = 0;
    if (totalYears < 15) {
      rogzitettNyugdijSzazalek = Math.max(0, Math.round((totalYears / 15) * 43));
    } else if (totalYears >= 50) {
      rogzitettNyugdijSzazalek = 100.0;
    } else {
      rogzitettNyugdijSzazalek = szolidoSzazalek[totalYears] || 100.0;
    }
    let rogzitettAtlagKereset = keresetCount > 0 ? keresetSum / keresetCount : 0;
    // Minimálbér korlátozás
    let rogzitettMinber = 0;
    for (let i = 0; i < minimalberData.length; i++) {
      const row = minimalberData[i];
      const ev = parseInt(row.start.split('-')[0], 10);
      if ((birthYear + 65) >= ev) rogzitettMinber = row.wage;
    }
    if (rogzitettAtlagKereset < rogzitettMinber) rogzitettAtlagKereset = rogzitettMinber;
    // Valorizációs szorzó
    let rogzitettValEv = birthYear + 65;
    let rogzitettValSzam = valorizaciosSzorzok[rogzitettValEv] || 1;
    rogzitettAtlagKereset = rogzitettAtlagKereset * rogzitettValSzam;
    rogzitettNyugdijOsszeg = Math.round(rogzitettAtlagKereset * (rogzitettNyugdijSzazalek / 100));
    rogzitettNyugdijMsg = `<hr><b>Rögzített nyugdíj lehetősége:</b> <span style="color:blue">${rogzitettNyugdijOsszeg.toLocaleString()} Ft</span> (a 65. év betöltésekor számított összeg)<br />` +
      `A rögzített nyugdíj folyósítása nem indul meg automatikusan, keresőtevékenység folytatható, szolgálati idő gyarapítható.<br />` +
      `A tényleges nyugdíjazáskor választható a rögzített nyugdíj évenkénti emelésekkel növelt összege, vagy az újabb szolgálati idővel számított tényleges nyugdíj.<br />`;
  }
  document.getElementById('resultContainer').innerHTML =
    `Végső nyugdíj összege: <span style="color:green">${nyugdijOsszeg.toLocaleString()} Ft</span> <br />` +
    `Összes szolgálati idő: ${totalYears} év ${totalNap} nap (${totalDays} nap), százalék: ${szazalek}%<br />` +
    `Átlagkereset valorizációval: ${Math.round(atlagKereset).toLocaleString()} Ft<br />` +
    `<ul><li>${details.join('</li><li>')}</li></ul>` +
    `<hr><b>Nők kedvezményes nyugdíj jogosultság:</b> ${nokKedvMsg}<br />` +
    `Jogosultsági idő: ${jogosultsagiEv} év (${jogosultsagiNap} nap), ebből keresőtevékenység: ${keresotevEv} év (${keresotevNap} nap), gyermeknevelés: ${gyermeknevelesEv} év (${gyermeknevelesNap} nap)` +
    rogzitettNyugdijMsg +
    `<hr><b>Korkedvezmény:</b> ${korkedvezmenyMsg}<br />` +
    `<b>Korhatár előtti ellátás jogosultság:</b> ${korhatarElottiMsg}` +
    `<hr><b>Szolgálati járandóság jogosultság:</b> ${szolgalatiJarandMsg}` +
    (csaladiAdokedvMsg ? `<hr><b>Családi adókedvezmény érvényesítése:</b> ${csaladiAdokedvMsg}` : '') +
    `<hr><b>Átmeneti bányászjáradék jogosultság:</b> ${atmenetiBanyaszMsg}` +
    `<hr><b>Táncművészeti életjáradék jogosultság:</b> ${tancmuveszMsg}` +
    `<hr><b>Özvegyi nyugdíj jogosultság:</b> ${ozvegyMsg}` +
    `<hr><b>Árvaellátás jogosultság:</b> ${arvaMsg}` +
    `<hr><b>Szülői nyugdíj jogosultság:</b> ${szuloMsg}` +
    `<hr><b>Baleseti hozzátartozói nyugdíj jogosultság:</b> ${balesetiMsg}` +
    `<hr><b>Baleseti járadék jogosultság:</b> ${balesetiJaradekMsg}` +
    `<hr><b>Rokkantsági járadék jogosultság:</b> ${rokkantsagiMsg}` +
    `<hr><b>Tartós szabadságelvonás juttatás jogosultság:</b> ${szabadsagMsg}`;
});
