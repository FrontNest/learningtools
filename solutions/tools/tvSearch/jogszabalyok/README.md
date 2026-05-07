# Nyugdij adategyezteto Excel feldolgozo

Ez a csomag ket bemeneti tablaval dolgozik ugyanabban az Excel fajlban:
- szolgalati_ido (szolgalati idok)
- ber (ber/jarulekalap adatok)

A script napi bontasban valasztja ki az ervenyes idot, kezeli az atfedeseket prioritas alapjan, majd eves bontasu idosorokat es ber osszesitest keszit.

## Telepites

1. Lepj a mappaba:

```bash
cd /c/Users/lol/______ORSI/GitHub/FrontnestStudio/solutions/tools/tvSearch/jogszabalyok
```

2. Fuggosegek telepitese:

```bash
pip install -r requirements.txt
```

## Futtatas

```bash
python process_pension_excel.py \
  --input input_ugy.xlsx \
  --output output_ugy.xlsx \
  --sex female \
  --service-sheet szolgalati_ido \
  --wage-sheet ber \
  --rules rules.json \
  --annual-cap annual_cap_example.json
```

Ha nincs eves plafonod az ugyhoz, hagyd el az `--annual-cap` parametert.

## Elvart oszlopok

A script alias kezelessel mukodik, de ezeknek megfelelo oszlopokat keresi.

Service (szolgalati_ido):
- from_date (datumtol)
- to_date (datumig)
- inclusive_days
- employer
- title (jogcim)
- classification (minosites: J/G/N/--)

Wage (ber):
- from_date (datumtol)
- to_date (datumig)
- inclusive_days
- employer
- title (jogcim)
- regular_base
- irregular_income
- benefit_income
- paid_contribution

## Kimeneti munkalapok

- service_validated: datum + inclusive nap ellenorzes
- wage_validated: datum + inclusive nap ellenorzes
- service_daily_raw: napi felbontas, minden jelolt jogcim
- daily_final: napi vegso valasztas (egy nap = egy besorolas)
- periods_by_year: evesen vagott osszevont idoszakok
- wage_yearly: elfogadott eves ber osszesites
- review_queue: manuális ellenorzesre kuldott tetelek

## Fontos

- A script dontestamogato eszkozkent hasznalando.
- Jogszabalyi valtozasnal a rules.json fajlt frissiteni kell.
- A review_queue teteleket mindig emberi ellenorzessel kell veglegesiteni.
