# OSM feldolgozó pipeline script (Python + osmium)
# Ez a script kiszűri az összes útszakaszt és a maxspeed tageket egy OSM PBF-ből,
# majd SQLite adatbázisba menti a szükséges adatokat.
# Futtatás:
# OSM Hungary maxspeed pipeline – Lépésről lépésre (2026)
# 1. Legfrissebb OSM Hungary letöltése
#    Töltsd le a legfrissebb hungary-latest.osm.pbf fájlt innen:
#    https://download.geofabrik.de/europe/hungary.html
#    Helyezd el például:
#    C:\Users\lol\______ORSI\GitHubBCK\inTheCar\OpenStreetMapDATAfiles\hungary-YYYYMMDD.osm.pbf
# 2. Ubuntu/WSL megnyitása Windows-on (F3p...)
# 3. Csak utak (way-ek) kiszűrése highway tag alapján (eredmény=.pbf):
#    osmium tags-filter /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/hungary-YYYYMMDD.osm.pbf w/highway -o /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.pbf
# 4. Exportálás LINESTRING-ként (csak way, nem node!) (eredmény=.txt):
#    osmium export /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.pbf --geometry-types=linestring -f text -o /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.txt
# 5. SQLite generálás Python scripttel (CSV lépés kihagyható!)(eredmény=.sqlite):
#    python3 roads_txt_to_sqlite.py /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.txt /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.sqlite
#    (Ha CSV is kell: python3 roads_txt_to_csv_v2.py ...)
# 6. Ellenőrzés:
#    A roads.sqlite-ben most már lesznek highway, name, maxspeed, lon, lat adatok.
# 7. Fájlok helye
#    Bemenet:
#      /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/hungary-YYYYMMDD.osm.pbf
#    Kimenet:
#      /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.pbf
#      /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.txt
#      /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.sqlite
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # 

import osmium # pyright: ignore[reportMissingImports] Ubuntu alól fut
import sqlite3
import sys

class RoadHandler(osmium.SimpleHandler):
    def __init__(self, db):
        super().__init__()
        self.db = db
        self.cur = db.cursor()
        self.cur.execute('''CREATE TABLE IF NOT EXISTS roads (
            id INTEGER PRIMARY KEY,
            name TEXT,
            highway TEXT,
            maxspeed TEXT,
            lon REAL,
            lat REAL
        )''')

    def way(self, w):
        if 'highway' in w.tags and w.nodes:
            name = w.tags.get('name', '')
            highway = w.tags.get('highway', '')
            maxspeed = w.tags.get('maxspeed', '')
            try:
                lon = w.nodes[0].lon
                lat = w.nodes[0].lat
                self.cur.execute('INSERT INTO roads (id, name, highway, maxspeed, lon, lat) VALUES (?, ?, ?, ?, ?, ?)',
                    (w.id, name, highway, maxspeed, lon, lat))
            except Exception:
                # Ha nincs érvényes koordináta, átugorjuk
                pass

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Használat: python extract_roads_to_sqlite.py <input.osm.pbf> <output.sqlite>")
        sys.exit(1)
    input_file = sys.argv[1]
    output_db = sys.argv[2]
    db = sqlite3.connect(output_db)
    handler = RoadHandler(db)
    handler.apply_file(input_file)
    db.commit()
    db.close()
    print(f"Kész: {output_db}")
