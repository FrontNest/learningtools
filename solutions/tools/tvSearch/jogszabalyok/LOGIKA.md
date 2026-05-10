# Nyugdíjbiztosítási Adategyeztetési Logika – Web GPT Forrás

**Cél:** Anonimizált, valós adatsorokat auditálható, jogszabály-alapú szolgálati-idő minősítésre alkalmas dokumentum.

**Jogi alap:** Tny. 1997. évi LXXXI. törvény, TnyR 168/1997. (X. 6.) Korm. rendelet, minimálbér rendelkezések.

---

## 1. Jogcímek & Prioritások (Döntési Tábla)

| Sorszám | Jogcím | Prioritás | Nő (J/N/G/--) | Férfi (J/N/G/--) | Minbér-ellenőrzés | Megjegyzés |
|---------|--------|-----------|----------------|------------------|------------------|-----------|
| 1 | GYES / GYED / TGYÁS / CSED / GYÁP | 1 | **G** | **G** | Nem | Gyermekgondozás → tiszta G |
| 2 | Táppénz / betegszabadság | 2 | **J** | **N** | Nem | Nőknél J, férfiaknál N |
| 3 | Fizetés nélküli szabadság (FNYSZ) | 3 | **N** | **N** | Nem | Max 30 nap/év; felette: -- |
| 4a | Munkaviszony (főállás) | 4 | **J** | **N** | Nem | Alappont, nyerő prioritás |
| 4b | Egyéni vállalkozó főállású | 4 | **J** | **N** | **Igen (TnyR 56.§)** | Alapból X; csak NAV+Ebizt után J |
| 4c | Társas vállalkozó tag | 4 | **J** | **N** | **Igen (TnyR 56.§)** | Alapból X; csak NAV+Ebizt után J |
| 5 | Megbízásos jogviszony | 5 | **N** | **N** | **Igen (TnyR 56.§)** | Küszöb alatt: -- |
| 5 | Egyszerűsített foglalkoztatás | 5 | **N** | **N** | **Igen (TnyR 56.§)** | Küszöb alatt: -- |
| 6 | Nem számolandó (igazolatlan, letartóztatás) | 6 | **--** | **--** | Nem | Véglegesen kiesik |

**Prioritás értelmezése:**
- Alacsonyabb szám = magasabb prioritás (nyerő jogcím)
- Azonos szám (4a, 4b, 4c) = egyenrangú, de 4a (munkaviszony) általában nyer
- Egy nap csak egy jogcím lehet

---

## 2. Konkrét Döntési Szabályok

### A. Alapelv: Munkaviszony az elsődleges
```
HA van munkaviszony az intervallumban
  → az a napi minősítés alapja (J vagy N a nem alapján)
  KÖZBEN történt GYES / táppénz / FNYSZ
    → nem külön sor a szolgálati táblázatban
    → megjegyzésként/audit-jelzésként kezelendő
```

### B. Fizetés nélküli szabadság (FNYSZ) – TnyR 29.§ (3)-(5)
```
HA FNYSZ az adott évben
  HA napok száma <= 30
    → N minősítés (beszámítható)
  HA napok száma > 30
    → első 30 nap: N
    → 31. naptól: -- (nem beszámítható)
    → AUDIT PONT: külön sorban jelölni!
    
HA 1997.12.31 előtt történt FNYSZ >30 nap
  → 1997-régimes bontási kötelezettség
  → ügyintéző: kézzel kell választani "DOLGOZOTT" / "NEM DOLGOZOTT" szakaszokra
```

### C. Minbér-ellenőrzés (TnyR 56.§)
```
HA jogcím = egyéni vállalkozó VAGY társas vállalkozó
  HA jövedelem (rendszeres + nem rendszeres) < arányos minimálbér (100%)
    → az egész időszak kiesik (-- vagy X)
    → REVIEW ISSUE
  KÜLÖNBEN
    → beszámítható

HA jogcím = megbízásos jellegű (1997-01-01-től)
  jogcím példa: munkavégzésre irányuló egyéb jogviszony, megbízási jogviszony,
               felhasználási szerződés, választott tisztségviselő, állami projektértékelő
  HA jövedelem (rendszeres + nem rendszeres) < arányos minimálbér 30%-a
    → az egész időszak kiesik (--)
    → REVIEW ISSUE
  KÜLÖNBEN
    → beszámítható (N)
    
Arányos minimálbér = (bruttó minimálbér / 30) × napok száma
```

**Forrásadat:** a konkrét minimálbér-időszakok a minber_intervals.json fájlban vannak.

### D. Egyéni vállalkozó (EV) – NAV Igazolás
```
HA jogcím = egyéni vállalkozó VAGY társas vállalkozó
  ALAPBÓL: X (nem pipálható, hiányos adat)
  
  HA van NAV + Egészségbiztosítási igazolás
    + szünetelés / megszűnés dátuma ismert
    + kieső napok (járulékmentes időszak) azonosított
  AKKOR
    → X-ből J lesz (beszámítható, auditált)
  KÜLÖNBEN
    → X marad (ügyintéző felülvizsgálatra)
```

### E. Átfedések feloldása
```
HA több jogcím ugyanazon a nap
  → az alacsonyabb prioritás szám nyer
  → ha egyenlő prioritás: munkaviszony nyer
  → feloldás: review_queue-ban rögzítve marad
```

---

## 3. Audit-Kompatibilis Output Formátum

**Oszlopok (teljes szolgálati-idő tábla):**

| tól | ig | munkáltató | jogcím | napok | minősítés | megjegyzés |
|---|---|---|---|---:|---|---|
| YYYY.MM.DD. | YYYY.MM.DD. | szöveg | szöveg | szám | J / N / G / -- / X | szöveg |

**Sorokra vonatkozó szabályok:**
1. Minden sor: dátum szerint folytonos, nincsenek lyukak
2. Munkaviszony → teljes futam egy sorban (közben történt GYES/táppénz nem külön sor)
3. FNYSZ >30 nap → külön sorban jelölve ("fizetés nélküli szabadság – 30 nap felett")
4. EV → X vagy J (NAV-igazolás függvén)
5. Minbér alatt → -- vagy "review" jelöléssel

---

## 4. Konkrét Teszteset (valós futásból)

**Input adatsor:**
- 1986.01.01–1986.12.31: Cég 1, munkaviszony
- 1986.03.15–1986.05.30: FNYSZ (76 nap)
- 1986.06.01–1986.06.15: táppénz
- 1986.06.16–1989.06.16: GYES
- 1987.01.01–1987.12.31: Cég 2, munkaviszony
- 1988.01.01–1988.01.30: M1, megbízásos (15 Ft – alul küszöb)
- 1988.02.01–1988.03.30: M2, megbízásos (123 M Ft – felül küszöb)
- 2000.01.01–2000.12.01: Cég 3, munkaviszony
- 2000.03.03–2000.12.31: M3, megbízásos (650 Ft – alul)
- 2000.03.04–2001.01.01: M4, megbízásos (12.3 M Ft – felül)
- 2000.03.05–2001.01.02: M5, megbízásos (12.3 M Ft – felül)
- 2000.03.06–2001.01.03: egyéni vállalkozó, főállású (12.3 M Ft – de nincs NAV)

**Expected Output (audit-kompatibilis):**

| tól | ig | munkáltató | jogcím | napok | minősítés | megjegyzés |
|---|---|---|---|---:|---|---|
| 1986.01.01. | 1986.12.31. | Cég 1 | munkaviszony | 288 | J | Közben FNYSZ 76 nap, táppénz 15 nap, GYES 199 nap |
| 1986.03.15. | 1986.05.30. |  | fizetés nélküli szabadság | 30 | N | Első 30 nap beszámítható |
| 1986.04.14. | 1986.05.30. |  | fizetés nélküli szabadság (30 nap felett) | 46 | -- | **AUDIT PONT**: 31–76. nap kiesik |
| 1987.01.01. | 1987.12.31. | Cég 2 | munkaviszony | 365 | G | GYES fedés alatt |
| 1988.01.01. | 1988.01.30. | M1 | megbízásos | 30 | -- | Minbér alul (15 Ft < 3000 Ft terv.); review |
| 1988.02.01. | 1988.03.30. | M2 | megbízásos | 59 | N | Minbér fölött; beszámítható |
| 2000.01.01. | 2000.12.01. | Cég 3 | munkaviszony | 336 | J | Elsődleges jogcím |
| 2000.03.06. | 2001.01.03. | egyéni vállalkozó főállású | egyéni vállalkozó | 304 | X | **NAV/Ebizt igazolás hiányzik** – nem pipálható |

---

## 5. Kritikus Megjegyzések (Web GPT Prompt)

### A. FNYSZ Kezelés
- **30 napos korlát éves szinten!** → felette: --
- **1997 előtt:** bontási kötelezettség (ügyintéző döntés szükséges)
- **Bértáblában feltüntetett FNYSZ:** soronként leigazolt, napok száma ismert kell legyen

### B. Egyéni Vállalkozó (EV)
- **Alapból: X** (kérdőjeles, nem pipálható)
- **Csak akkor J, ha mindhárom igazolás megvan:**
  1. NAV: járuléktartozás-mentes vagy teljesített
  2. Egészségbiztosítás: szünetelés / megszűnés dátuma
  3. Kieső napok: járulékfizetés nélküli időszak azonosított
- **Addig: X marad** → ügyintéző vizsgálat szükséges

### C. Táppénz, GYES, FNYSZ Munkaviszony Közben
- **Nem jelenik meg külön sorban** a szolgálati táblában
- **Alap-jogcím:** munkaviszony (de megjegyzésben tüntessük fel az eseményt)
- **Bértáblában:** folyamatos kezelés, de minősítés-felülírás szükséges

### D. Minbér-Ellenőrzés (TnyR 56.§)
- **EV, társas vállalkozó:** 100% arányos minimálbér-küszöb
- **Megbízásos jellegű (1997-től):** 30% arányos minimálbér-küszöb
- **Arányos minimálbér naponta:** (havi min / 30) × napok
- **2000–2001 környékén:** 40 ezer – 250 ezer Ft/hó közt ingadozik → picit ügyelj
- **Alul küszöb:** review-issue, -- jelöléssel

### E. Audit Kritériumok (Checklist)
```
[ ] Minden FNYSZ 30 nap felett EXPLICIT külön sorban jelölve
[ ] Minden EV X-el jelölt (amíg nincs NAV)
[ ] Minden megbízásos / egyszerűsített: minbér-ellenőrzés megtörtént
[ ] Munkaviszonyon belüli események nem külön sor
[ ] Dátumok folytonos, nincsenek lyukak
[ ] 1997 előtti FNYSZ >30 nap: bontási megjegyzés
[ ] Összes tól/ig: YYYY.MM.DD. formátum
```

---

## 6. Kifejezésszótár (Magyar ↔ Angol / Rövidítés)

| Magyar | Angol / Rövidítés | Magyarázat |
|--------|-------------------|-----------|
| GYES | childcare benefit | Gyermekgondozási segítség |
| GYED | parental allowance | Gyermekgondozási díj |
| TGYÁS | maternity leave | Tartós gyermekvédelmi díj |
| CSED | birth grant | Csecsemőgondozási díj |
| GYÁP | family allowance | Gyermeknevelési allowance |
| Táppénz | sick pay | Betegszabadság, táppénz |
| FNYSZ | unpaid leave | Fizetés nélküli szabadság |
| TnyR | Pension Reg. | Tny. Végrehajtási Rendelete |
| NAV | Tax Authority | Nemzeti Adó- és Vámhivatal |
| Ebizt | Health Insurance | Egészségbiztosítás |
| Minbér | Minimum wage | Havi minimális bér |
| EV | Sole proprietor | Egyéni vállalkozó |
| Megbízásos | Contractor | Megbízásos jogviszony |

---

## 7. Webes GPT Prompt Sablonok

**Mikor küldöd az anonimizált adatsor soron:**

### A. Standard Felülvizsgálati Prompt
```
Vizsgálj meg ezt a szolgálati-idő adatsort az alábbi logika szerint:
[LOGIKA.md teljes szövege vagy link]

Adat:
[Anonimizált sorok a szokott formátumban]

Eredmény:
1. Napi szintű minősítés felülvizsgálata
2. Átfedések feloldása
3. FNYSZ ellenőrzés (30 nap korlát)
4. Minbér-ellenőrzés (EV, megbízásos)
5. Végső audit-kompatibilis tábla
6. Review-pontok listája
```

### B. Audit-Riport Prompt
```
Az alábbi tesztesetből audit-riportot készíteni:
[Anonimizált adat]

Formátum:
- Problémaazonosítás (ha van)
- Jogszabály-referencia
- Javasolt felülvizsgálat
- Sign-off kritérium
```

---

## 8. Verziókezelés & Frissítés

**Verzió:** 1.0 (2026-05-10)  
**Utolsó frissítés:** Tesztrészlet (#1) integrálva  
**Fenntartó:** [Te]  
**Szabályozási ref:** Tny. 1997. évi LXXXI. törvény, TnyR 168/1997. (X. 6.)

---

**Megjegyzés:** Ez a dokumentum web-GPT számára értelmez forrásanyag. Szükség szerint finomítható konkrét ügyintézési tapasztalatok alapján.
