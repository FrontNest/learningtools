export const MIN_WAGE_INTERVALS = [
  { from: "1988-01-01", to: "1989-02-28", value: 3000 },
  { from: "1989-03-01", to: "1989-09-30", value: 3700 },
  { from: "1989-10-01", to: "1990-01-31", value: 4000 },
  { from: "1990-02-01", to: "1990-08-31", value: 4800 },
  { from: "1990-09-01", to: "1990-11-30", value: 5600 },
  { from: "1990-12-01", to: "1991-03-31", value: 5800 },
  { from: "1991-04-01", to: "1991-12-31", value: 7000 },
  { from: "1992-01-01", to: "1993-01-31", value: 8000 },
  { from: "1993-02-01", to: "1994-01-31", value: 9000 },
  { from: "1994-02-01", to: "1995-01-31", value: 10500 },
  { from: "1995-02-01", to: "1996-01-31", value: 12200 },
  { from: "1996-02-01", to: "1996-12-31", value: 14500 },
  { from: "1997-01-01", to: "1997-12-31", value: 17000 },
  { from: "1998-01-01", to: "1998-12-31", value: 19500 },
  { from: "1999-01-01", to: "1999-12-31", value: 22500 },
  { from: "2000-01-01", to: "2000-12-31", value: 25500 },
  { from: "2001-01-01", to: "2001-12-31", value: 40000 },
  { from: "2002-01-01", to: "2003-12-31", value: 50000 },
  { from: "2004-01-01", to: "2004-12-31", value: 53000 },
  { from: "2005-01-01", to: "2005-12-31", value: 57000 },
  { from: "2006-01-01", to: "2006-12-31", value: 62500 },
  { from: "2007-01-01", to: "2007-12-31", value: 65500 },
  { from: "2008-01-01", to: "2008-12-31", value: 69000 },
  { from: "2009-01-01", to: "2009-12-31", value: 71500 },
  { from: "2010-01-01", to: "2010-12-31", value: 73500 },
  { from: "2011-01-01", to: "2011-12-31", value: 78000 },
  { from: "2012-01-01", to: "2012-12-31", value: 93000 },
  { from: "2013-01-01", to: "2013-12-31", value: 98000 },
  { from: "2014-01-01", to: "2014-12-31", value: 101500 },
  { from: "2015-01-01", to: "2015-12-31", value: 105000 },
  { from: "2016-01-01", to: "2016-12-31", value: 111000 },
  { from: "2017-01-01", to: "2017-12-31", value: 127500 },
  { from: "2018-01-01", to: "2018-12-31", value: 138000 },
  { from: "2019-01-01", to: "2019-12-31", value: 149000 },
  { from: "2020-01-01", to: "2021-01-31", value: 161000 },
  { from: "2021-02-01", to: "2021-12-31", value: 167400 },
  { from: "2022-01-01", to: "2022-12-31", value: 200000 },
  { from: "2023-01-01", to: "2023-11-30", value: 232000 },
  { from: "2023-12-01", to: "2024-12-31", value: 266800 },
  { from: "2025-01-01", to: "2026-03-04", value: 290800 }
];

export const ANNUAL_CAPS = {
  1993: 915000,
  1994: 912500,
  1995: 912500,
  1996: 915000,
  1997: 1024500,
  1998: 1565850,
  1999: 1854200,
  2000: 2020320,
  2001: 2197300,
  2002: 2368850,
  2003: 3905500,
  2004: 5307000,
  2005: 6000600,
  2006: 6325450,
  2007: 6748850,
  2008: 7137000,
  2009: 7446000,
  2010: 7453300,
  2011: 7665000,
  2012: 7942200
};

export const RULES = [
  {
    id: "childcare",
    priority: 1,
    minberCheck: false,
    titlePatterns: ["gyes", "gyed", "tgyas", "csed", "gyap", "gyermek"],
    classification: { female: "G", male: "G", default: "G" }
  },
  {
    id: "sick_pay",
    priority: 2,
    minberCheck: false,
    titlePatterns: ["tappenz", "betegszabadsag", "baleseti tappenz"],
    classification: { female: "J", male: "N", default: "N" }
  },
  {
    id: "unpaid_leave",
    priority: 3,
    minberCheck: false,
    titlePatterns: ["fizetes nelkuli", "fnysz", "igazolt tavollet"],
    classification: { female: "N", male: "N", default: "N" }
  },
  {
    id: "employment_main",
    priority: 4,
    minberCheck: false,
    titlePatterns: ["munkaviszony", "foallas", "40 oras"],
    classification: { female: "J", male: "N", default: "N" }
  },
  {
    id: "ev_tarsas",
    priority: 4,
    minberCheck: true,
    titlePatterns: ["egyeni vallalkozo", "tarsas vallalkozo", "ev foallas", "ev mellekallas"],
    classification: { female: "J", male: "N", default: "N" }
  },
  {
    id: "secondary_or_casual",
    priority: 5,
    minberCheck: true,
    titlePatterns: [
      "mellekallas",
      "egyszerusitett",
      "megbizas",
      "megbizasi jogviszony",
      "munkavegzesre iranyulo egyeb jogviszony",
      "felhasznalasi szerzodes",
      "valasztott tisztsegviselo",
      "allami projektertekelo",
      "alkalmi",
      "efo"
    ],
    classification: { female: "N", male: "N", default: "N" }
  },
  {
    id: "not_countable",
    priority: 6,
    minberCheck: false,
    titlePatterns: ["nem szamithato", "kizart", "letartoztatas", "igazolatlan tavollet"],
    classification: { female: "--", male: "--", default: "--" }
  }
];

export const MEGBIZAS_30_PATTERNS = [
  "munkavegzesre iranyulo egyeb jogviszony",
  "megbizasi jogviszony",
  "megbizas",
  "felhasznalasi szerzodes",
  "valasztott tisztsegviselo",
  "allami projektertekelo"
];

export const CERTIFICATE_HINTS = {
  ev_tarsas: "NAV + Egészségbiztosítási igazolás + szünetelés/megszűnés igazolása",
  unpaid_leave: "Munkáltatói igazolás az FNYSZ napjairól (30 nap korlát figyelem)",
  secondary_or_casual: "Kifizetői igazolás és járulékalap igazolás",
  not_countable: "Jogcím alapján nem számolható, szükség esetén jogorvoslati irat"
};
