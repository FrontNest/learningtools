// --- Minimálbér időszakok ---
const minimalberTabla = [
  { ev: 1988, osszeg: 3000, tol: '1988-01-01', ig: '1989-02-28' },
  { ev: 1989, osszeg: 3700, tol: '1989-03-01', ig: '1989-09-30' },
  { ev: 1989, osszeg: 4000, tol: '1989-10-01', ig: '1990-01-31' },
  { ev: 1990, osszeg: 4800, tol: '1990-02-01', ig: '1990-08-31' },
  { ev: 1990, osszeg: 5600, tol: '1990-09-01', ig: '1990-11-30' },
  { ev: 1990, osszeg: 5800, tol: '1990-12-01', ig: '1991-03-31' },
  { ev: 1991, osszeg: 7000, tol: '1991-04-01', ig: '1991-12-31' },
  { ev: 1992, osszeg: 8000, tol: '1992-01-01', ig: '1993-01-31' },
  { ev: 1993, osszeg: 9000, tol: '1993-02-01', ig: '1994-01-31' },
  { ev: 1994, osszeg: 10500, tol: '1994-02-01', ig: '1995-01-31' },
  { ev: 1995, osszeg: 12200, tol: '1995-02-01', ig: '1996-01-31' },
  { ev: 1996, osszeg: 14500, tol: '1996-02-01', ig: '1996-12-31' },
  { ev: 1997, osszeg: 17000, tol: '1997-01-01', ig: '1997-12-31' },
  { ev: 1998, osszeg: 19500, tol: '1998-01-01', ig: '1998-12-31' },
  { ev: 1999, osszeg: 22500, tol: '1999-01-01', ig: '1999-12-31' },
  { ev: 2000, osszeg: 25500, tol: '2000-01-01', ig: '2000-12-31' },
  { ev: 2001, osszeg: 40000, tol: '2001-01-01', ig: '2001-12-31' },
  { ev: 2002, osszeg: 50000, tol: '2002-01-01', ig: '2003-12-31' },
  { ev: 2004, osszeg: 53000, tol: '2004-01-01', ig: '2004-12-31' },
  { ev: 2005, osszeg: 57000, tol: '2005-01-01', ig: '2005-12-31' },
  { ev: 2006, osszeg: 62500, tol: '2006-01-01', ig: '2006-12-31' },
  { ev: 2007, osszeg: 65500, tol: '2007-01-01', ig: '2007-12-31' },
  { ev: 2008, osszeg: 69000, tol: '2008-01-01', ig: '2008-12-31' },
  { ev: 2009, osszeg: 71500, tol: '2009-01-01', ig: '2009-12-31' },
  { ev: 2010, osszeg: 73500, tol: '2010-01-01', ig: '2010-12-31' },
  { ev: 2011, osszeg: 78000, tol: '2011-01-01', ig: '2011-12-31' },
  { ev: 2012, osszeg: 93000, tol: '2012-01-01', ig: '2012-12-31' },
  { ev: 2013, osszeg: 98000, tol: '2013-01-01', ig: '2013-12-31' },
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

// --- Segédfüggvények ---
// --- Dátumkezelés ---
function parseDateLocal(dateStr) {
  var parts = dateStr.split('-');
  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
}

function formatDateLocal(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
function napokSzama(kezdet, veg) {
  var d1 = parseDateLocal(kezdet);
  var d2 = parseDateLocal(veg);
  var diff = (d2.getTime() - d1.getTime()) / 86400000;
  return diff >= 0 ? diff + 1 : 0;
}

function aranySzam(kereset, minimalber) {
  if (minimalber <= 0) return 0;
  return Math.round((kereset / minimalber) * 100) / 100;
}

function minimalberHarmincad(minimalber) {
  if (minimalber <= 0) return 0;
  return Math.round((minimalber / 30) * 100) / 100;
}

function keresMinimalberIdoszak(datum) {
  for (var i = 0; i < minimalberTabla.length; i++) {
    var mb = minimalberTabla[i];
    if (datum >= mb.tol && datum <= mb.ig) {
      return mb;
    }
  }
  return null;
}

// --- Dinamikus munkaviszony blokk ---
function ujMunkaviszonyKartya(index) {
  var div = document.createElement('div');
  div.className = 'munkaviszony-kartya';
  div.setAttribute('data-index', index);
  div.innerHTML =
    '<div class="kartya-sor">' +
      '<label>Kezdő dátum: <input type="date" name="kezdet_' + index + '" required="required" /></label>' +
      '<label>Záró dátum: <input type="date" name="veg_' + index + '" required="required" /></label>' +
    '</div>' +
    '<div class="kartya-sor">' +
      '<label>Éves kereset (Ft): <input type="number" name="kereset_' + index + '" min="0" step="1" required="required" /></label>' +
      '<label>Foglalkoztatási forma: ' +
        '<select name="foglForma_' + index + '" required="required">' +
          '<option value="reszmunkaido">Részmunkaidő</option>' +
          '<option value="teljesmunkaido">Teljes munkaidő</option>' +
          '<option value="tobbesjogviszony">Többes jogviszony</option>' +
        '</select>' +
      '</label>' +
    '</div>' +
    '<button type="button" class="torles-btn">Törlés</button>';
  return div;
}

function getMunkaviszonyok() {
  var container = document.getElementById('munkaviszonyokContainer');
  var kartyaElems = container.querySelectorAll('.munkaviszony-kartya');
  var viszonyok = [];
  kartyaElems.forEach(function(kartya) {
    var index = kartya.getAttribute('data-index');
    var kezdet = kartya.querySelector('input[name="kezdet_' + index + '"]').value;
    var veg = kartya.querySelector('input[name="veg_' + index + '"]').value;
    var kereset = parseFloat(kartya.querySelector('input[name="kereset_' + index + '"]').value);
    var foglForma = kartya.querySelector('select[name="foglForma_' + index + '"]').value;
    viszonyok.push({ index, kezdet, veg, kereset, foglForma });
  });
  return viszonyok;
}

// --- Intervallumok napokra bontása ---
function osszesitettKeresetNapra(viszonyok) {
  var napok = {};
  viszonyok.forEach(function(v) {
    if (!v.kezdet || !v.veg || isNaN(v.kereset) || v.kereset < 0) return;
    var d1 = parseDateLocal(v.kezdet);
    var napSzam = napokSzama(v.kezdet, v.veg);
    var napiKereset = v.kereset / napSzam;
    for (var i = 0; i < napSzam; i++) {
      var dt = new Date(d1);
      dt.setDate(d1.getDate() + i);
      var napStr = formatDateLocal(dt);
      if (!napok[napStr]) napok[napStr] = { kereset: 0, foglForma: [] };
      napok[napStr].kereset += napiKereset;
      napok[napStr].foglForma.push(v.foglForma);
    }
  });
  return napok;
}

function szamolIntervallum(napok) {
  var eredmeny = [];
  var napokList = Object.keys(napok).sort();
  var aktEv = null, aktMb = null, aktNapok = [], aktKereset = 0, aktFoglForma = [];
  napokList.forEach(function(nap, idx) {
    var mb = keresMinimalberIdoszak(nap);
    if (!mb) return;
    if (!aktMb) {
      aktMb = mb;
      aktEv = mb.ev;
    }
    aktNapok.push(nap);
    aktKereset += napok[nap].kereset;
    aktFoglForma = aktFoglForma.concat(napok[nap].foglForma);
    var isLast = idx === napokList.length - 1;
    var isEvValtas = mb.ev !== aktEv;
    if (isEvValtas || isLast) {
      var napSzam = aktNapok.length;
      var keresetSum = aktKereset;
      var minimalberEv = aktMb.osszeg * 12;
      var arany = aranySzam(keresetSum, minimalberEv);
      var aranyosNap = Math.round(arany * napSzam);
      eredmeny.push({
        ev: aktEv,
        tol: aktMb.tol,
        ig: aktMb.ig,
        napSzam: Math.round(napSzam),
        keresetSum: keresetSum.toFixed(2),
        minimalberEv,
        harmincad: minimalberHarmincad(aktMb.osszeg),
        arany: arany.toFixed(2),
        aranyosNap: Math.round(aranyosNap),
      });
      aktEv = mb.ev;
      aktMb = mb;
      aktNapok = [];
      aktKereset = 0;
      aktFoglForma = [];
    }
  });
  return eredmeny;
}

function teljesSzolgIdoSzamitas(viszonyok) {
  var napok = osszesitettKeresetNapra(viszonyok);
  var intervallumok = szamolIntervallum(napok);
  var osszesNap = 0, osszesKereset = 0, osszesAranyosNap = 0;
  intervallumok.forEach(function(i) {
    osszesNap += i.napSzam;
    osszesKereset += parseFloat(i.keresetSum);
    osszesAranyosNap += i.aranyosNap;
  });
  return {
    intervallumok,
    osszesNap: Math.round(osszesNap),
    osszesKereset: osszesKereset.toFixed(2),
    osszesAranyosNap: Math.round(osszesAranyosNap)
  };
}

function kiirEredmenyTabla(eredmeny) {
  var container = document.getElementById('eredmenyTablaContainer');
  if (!eredmeny || !eredmeny.intervallumok || eredmeny.intervallumok.length === 0) {
    container.innerHTML = '<span style="color:#b00;font-weight:bold;">Nincs kiszámítható intervallum.</span>';
    return;
  }
  var html = '<table>';
  html += '<tr><th>Év</th><th>Időszak</th><th>Naptári napok</th><th>Összesített kereset</th><th>Minimálbér (éves)</th><th>Harmincad</th><th>Arányszám</th><th>Arányos szolgálati idő</th></tr>';
  eredmeny.intervallumok.forEach(function(i) {
    html += '<tr>' +
      '<td>' + i.ev + '</td>' +
      '<td>' + i.tol + ' - ' + i.ig + '</td>' +
      '<td>' + i.napSzam + '</td>' +
      '<td>' + i.keresetSum + ' Ft</td>' +
      '<td>' + i.minimalberEv.toLocaleString('hu-HU') + ' Ft</td>' +
      '<td>' + i.harmincad.toLocaleString('hu-HU', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' Ft</td>' +
      '<td>' + i.arany + '</td>' +
      '<td>' + i.aranyosNap + '</td>' +
      '</tr>';
  });
  html += '<tr style="font-weight:bold;background:#eaf2ff;">' +
    '<td colspan="2">Összesen</td>' +
    '<td>' + eredmeny.osszesNap + '</td>' +
    '<td>' + eredmeny.osszesKereset + ' Ft</td>' +
    '<td colspan="3"></td>' +
    '<td>' + eredmeny.osszesAranyosNap + '</td>' +
    '</tr>';
  html += '</table>';
  container.innerHTML = html;
}

function kiirHiba(uzenet) {
  document.getElementById('eredmenyDoboz').innerHTML = '<span style="color:#b00;font-weight:bold;">Hiba: ' + uzenet + '</span>';
  document.getElementById('eredmenyTablaContainer').innerHTML = '';
}

// --- Fő eseménykezelő ---
document.addEventListener('DOMContentLoaded', function() {
  var munkaviszonyokContainer = document.getElementById('munkaviszonyokContainer');
  var ujMunkaviszonyBtn = document.getElementById('ujMunkaviszonyBtn');
  var index = 0;

  function addMunkaviszonyKartya() {
    var kartya = ujMunkaviszonyKartya(index);
    munkaviszonyokContainer.appendChild(kartya);
    kartya.querySelector('.torles-btn').addEventListener('click', function() {
      munkaviszonyokContainer.removeChild(kartya);
    });
    index++;
  }

  ujMunkaviszonyBtn.addEventListener('click', function() {
    addMunkaviszonyKartya();
  });

  // Kezdetben egy munkaviszony
  addMunkaviszonyKartya();

  document.getElementById('kalkulatorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var viszonyok = getMunkaviszonyok();
    if (viszonyok.length === 0) {
      kiirHiba('Nincs munkaviszony megadva!');
      return;
    }
    for (var i = 0; i < viszonyok.length; i++) {
      if (!viszonyok[i].kezdet || !viszonyok[i].veg || isNaN(viszonyok[i].kereset) || viszonyok[i].kereset < 0) {
        kiirHiba('Minden mezőt ki kell tölteni, a kereset nem lehet negatív!');
        return;
      }
      if (new Date(viszonyok[i].veg) < new Date(viszonyok[i].kezdet)) {
        kiirHiba('A záró dátum nem lehet korábbi, mint a kezdő dátum!');
        return;
      }
    }
    var eredmeny = teljesSzolgIdoSzamitas(viszonyok);
    kiirEredmenyTabla(eredmeny);
    document.getElementById('eredmenyDoboz').innerHTML = '';
  });
});
