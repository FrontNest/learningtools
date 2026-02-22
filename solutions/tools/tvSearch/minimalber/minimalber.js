// minimalber.js - Arányos szolgálati idő kalkulátor logika
// XHTML 1.0 Strict kompatibilis, magyar nyelvű

// Minimálbér időszakok (év, összeg Ft/hó, kezdő dátum, záró dátum)
const minimalberTabla = [
  { ev: 1988, osszeg: 3000,   tol: '1988-01-01', ig: '1989-02-28' },
  { ev: 1989, osszeg: 3700,   tol: '1989-03-01', ig: '1989-09-30' },
  { ev: 1989, osszeg: 4000,   tol: '1989-10-01', ig: '1990-01-31' },
  { ev: 1990, osszeg: 4800,   tol: '1990-02-01', ig: '1990-08-31' },
  { ev: 1990, osszeg: 5600,   tol: '1990-09-01', ig: '1990-11-30' },
  { ev: 1990, osszeg: 5800,   tol: '1990-12-01', ig: '1991-03-31' },
  { ev: 1991, osszeg: 7000,   tol: '1991-04-01', ig: '1991-12-31' },
  { ev: 1992, osszeg: 8000,   tol: '1992-01-01', ig: '1993-01-31' },
  { ev: 1993, osszeg: 9000,   tol: '1993-02-01', ig: '1994-01-31' },
  { ev: 1994, osszeg: 10500,  tol: '1994-02-01', ig: '1995-01-31' },
  { ev: 1995, osszeg: 12200,  tol: '1995-02-01', ig: '1996-01-31' },
  { ev: 1996, osszeg: 14500,  tol: '1996-02-01', ig: '1996-12-31' },
  { ev: 1997, osszeg: 17000,  tol: '1997-01-01', ig: '1997-12-31' },
  { ev: 1998, osszeg: 19500,  tol: '1998-01-01', ig: '1998-12-31' },
  { ev: 1999, osszeg: 22500,  tol: '1999-01-01', ig: '1999-12-31' },
  { ev: 2000, osszeg: 25500,  tol: '2000-01-01', ig: '2000-12-31' },
  { ev: 2001, osszeg: 40000,  tol: '2001-01-01', ig: '2001-12-31' },
  { ev: 2002, osszeg: 50000,  tol: '2002-01-01', ig: '2003-12-31' },
  { ev: 2004, osszeg: 53000,  tol: '2004-01-01', ig: '2004-12-31' },
  { ev: 2005, osszeg: 57000,  tol: '2005-01-01', ig: '2005-12-31' },
  { ev: 2006, osszeg: 62500,  tol: '2006-01-01', ig: '2006-12-31' },
  { ev: 2007, osszeg: 65500,  tol: '2007-01-01', ig: '2007-12-31' },
  { ev: 2008, osszeg: 69000,  tol: '2008-01-01', ig: '2008-12-31' },
  { ev: 2009, osszeg: 71500,  tol: '2009-01-01', ig: '2009-12-31' },
  { ev: 2010, osszeg: 73500,  tol: '2010-01-01', ig: '2010-12-31' },
  { ev: 2011, osszeg: 78000,  tol: '2011-01-01', ig: '2011-12-31' },
  { ev: 2012, osszeg: 93000,  tol: '2012-01-01', ig: '2012-12-31' },
  { ev: 2013, osszeg: 98000,  tol: '2013-01-01', ig: '2013-12-31' },
  { ev: 2014, osszeg: 101500, tol: '2014-01-01', ig: '2014-12-31' },
  { ev: 2015, osszeg: 105000, tol: '2015-01-01', ig: '2015-12-31' },
  { ev: 2016, osszeg: 111000, tol: '2016-01-01', ig: '2016-12-31' },
  { ev: 2017, osszeg: 127500, tol: '2017-01-01', ig: '2017-12-31' },
  { ev: 2018, osszeg: 138000, tol: '2018-01-01', ig: '2018-12-31' },
  { ev: 2019, osszeg: 149000, tol: '2019-01-01', ig: '2019-12-31' },
  { ev: 2020, osszeg: 161000, tol: '2020-01-01', ig: '2021-01-31' },
  { ev: 2021, osszeg: 167400, tol: '2021-02-01', ig: '2021-12-31' },
  { ev: 2022, osszeg: 200000, tol: '2022-01-01', ig: '2022-12-31' },
  { ev: 2023, osszeg: 232000, tol: '2023-01-01', ig: '2023-11-30' },
  { ev: 2023, osszeg: 266800, tol: '2023-12-01', ig: '2024-12-31' },
  { ev: 2025, osszeg: 290800, tol: '2025-01-01', ig: '2099-12-31' }
];

// Segédfüggvény: két dátum közötti naptári napok száma (mindkét nap beleszámít)
function napokSzama(kezdet, veg) {
  var d1 = new Date(kezdet);
  var d2 = new Date(veg);
  var diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

// Arányszám: kereset / minimálbér
function aranySzam(kereset, minimalber) {
  if (minimalber <= 0) return 0;
  return Math.round((kereset / minimalber) * 100) / 100;
}

// Minimálbér harmincada
function minimalberHarmincad(minimalber) {
  if (minimalber <= 0) return 0;
  return Math.round((minimalber / 30) * 100) / 100;
}

// Szolgálati idő számítás a 4 szituáció szerint
function szolgIdoSzamitas(szituacio, kereset, minimalber, napok) {
  var arany = aranySzam(kereset, minimalber);
  var aranyosNap = 0;
  switch (szituacio) {
    case '1': // Csak részmunkaidő
      aranyosNap = Math.round((arany * napok) * 100) / 100;
      break;
    case '2': // Részmunkaidő + teljes munkaidő
      if (kereset >= minimalber) {
        aranyosNap = napok;
      } else {
        aranyosNap = Math.round((arany * napok) * 100) / 100;
      }
      break;
    case '3': // Több részmunkaidő
      aranyosNap = Math.round((arany * napok) * 100) / 100;
      break;
    case '4': // Teljes munkaidő
      aranyosNap = napok;
      break;
    default:
      aranyosNap = 0;
  }
  return aranyosNap;
}

// Minimálbér kiválasztó feltöltése
function feltoltMinimalberEvSelect() {
  var select = document.getElementById('minimalberEv');
  select.innerHTML = '';
  minimalberTabla.forEach(function(mb, idx) {
    var label = mb.ev + ' (' + mb.tol + ' - ' + mb.ig + ')';
    var opt = document.createElement('option');
    opt.value = idx;
    opt.text = label;
    select.appendChild(opt);
  });
}

// Minimálbér harmincada frissítése
function frissitMinimalberHarmincad() {
  var select = document.getElementById('minimalberEv');
  var idx = select.value;
  var mb = minimalberTabla[idx];
  var harmincad = minimalberHarmincad(mb.osszeg);
  document.getElementById('minimalberHarmincad').textContent = harmincad.toLocaleString('hu-HU', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// Eredmény doboz kiírás
function kiirEredmeny(eredmeny) {
  var box = document.getElementById('eredmenyDoboz');
  box.innerHTML = eredmeny;
}

// Hibaüzenet kiírás
function kiirHiba(uzenet) {
  kiirEredmeny('<span style="color:#b00;font-weight:bold;">Hiba: ' + uzenet + '</span>');
}

// Fő eseménykezelő
document.addEventListener('DOMContentLoaded', function() {
  feltoltMinimalberEvSelect();
  frissitMinimalberHarmincad();
  document.getElementById('minimalberEv').addEventListener('change', frissitMinimalberHarmincad);

  document.getElementById('kalkulatorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Bemeneti adatok
    var datumKezdet = document.getElementById('datumKezdet').value;
    var datumVeg = document.getElementById('datumVeg').value;
    var kereset = parseFloat(document.getElementById('kereset').value);
    var foglForma = document.getElementById('foglForma').value;
    var minimalberIdx = document.getElementById('minimalberEv').value;
    var szituacio = document.querySelector('input[name="szituacio"]:checked').value;
    // Validáció
    if (!datumKezdet || !datumVeg) {
      kiirHiba('Kérjük, adja meg mindkét dátumot!');
      return;
    }
    if (kereset < 0 || isNaN(kereset)) {
      kiirHiba('A kereset nem lehet negatív vagy üres!');
      return;
    }
    if (new Date(datumVeg) < new Date(datumKezdet)) {
      kiirHiba('A záró dátum nem lehet korábbi, mint a kezdő dátum!');
      return;
    }
    var mb = minimalberTabla[minimalberIdx];
    var minimalber = mb.osszeg * 12; // éves minimálbér
    var napok = napokSzama(datumKezdet, datumVeg);
    var arany = aranySzam(kereset, minimalber);
    var aranyosNap = szolgIdoSzamitas(szituacio, kereset, minimalber, napok);
    var harmincad = minimalberHarmincad(mb.osszeg);

    // Eredmények kiírása
    var eredmeny = '<ul style="list-style:none;padding:0;margin:0;">' +
      '<li><strong>Arányszám:</strong> ' + arany.toFixed(2) + '</li>' +
      '<li><strong>Naptári napok száma:</strong> ' + napok + '</li>' +
      '<li><strong>Arányos szolgálati idő (nap):</strong> ' + aranyosNap.toFixed(2) + '</li>' +
      '<li><strong>Éves kereset:</strong> ' + kereset.toLocaleString('hu-HU') + ' Ft</li>' +
      '<li><strong>Minimálbér (éves):</strong> ' + minimalber.toLocaleString('hu-HU') + ' Ft</li>' +
      '<li><strong>Minimálbér harmincada (havi):</strong> ' + harmincad.toLocaleString('hu-HU', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' Ft</li>' +
    '</ul>';
    kiirEredmeny(eredmeny);
  });
});
