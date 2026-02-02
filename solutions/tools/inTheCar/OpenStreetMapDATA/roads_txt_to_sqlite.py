# roads_txt_to_sqlite.py
# Ez a script a roads.txt-t (osmium export eredménye, LINESTRING formátum) közvetlenül SQLite adatbázissá alakítja.
# Használat: Ubuntu alól
# python3 roads_txt_to_sqlite.py /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.txt /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.sqlite

import sys
import sqlite3
import re

def parse_tags(tag_str):
    tags = {}
    for pair in tag_str.split(','):
        if '=' in pair:
            k, v = pair.split('=', 1)
            tags[k.strip()] = v.strip()
    return tags

if len(sys.argv) != 3:
    print("Használat: python3 roads_txt_to_sqlite.py <input.txt> <output.sqlite>")
    sys.exit(1)

input_file = sys.argv[1]
output_db = sys.argv[2]

db = sqlite3.connect(output_db)
cur = db.cursor()
cur.execute('''CREATE TABLE IF NOT EXISTS roads (
    name TEXT,
    highway TEXT,
    maxspeed TEXT,
    lon REAL,
    lat REAL
)''')

with open(input_file, 'r', encoding='utf-8') as fin:
    for line in fin:
        line = line.strip()
        m = re.match(r'LINESTRING\(([^)]+)\)\s*(.*)', line)
        if not m:
            continue
        coords_str, tags_str = m.groups()
        coords = coords_str.split(',')[0].strip()
        lon, lat = coords.split()
        tags = parse_tags(tags_str)
        highway = tags.get('highway', '')
        name = tags.get('name', '')
        maxspeed = tags.get('maxspeed', '')
        if highway:
            cur.execute('INSERT INTO roads (name, highway, maxspeed, lon, lat) VALUES (?, ?, ?, ?, ?)',
                        (name, highway, maxspeed, lon, lat))

db.commit()
db.close()
print(f"Kész: {output_db}")
