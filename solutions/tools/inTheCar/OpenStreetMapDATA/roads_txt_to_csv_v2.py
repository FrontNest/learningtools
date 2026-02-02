# roads_txt_to_csv_v2.py
# Ez a script a roads.txt fájlt (osmium export eredménye) átalakítja CSV formátumra,
# kiszedi a lon, lat értékeket a POINT-ból, és a tag-ekből a highway, name, maxspeed-et.
# Használat: Ubuntu alól:
# python3 roads_txt_to_csv_v2.py /mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles/roads.txt roads.csv
import sys
import csv
import re

def parse_tags(tag_str):
    tags = {}
    for pair in tag_str.split(','):
        if '=' in pair:
            k, v = pair.split('=', 1)
            tags[k.strip()] = v.strip()
    return tags

if len(sys.argv) != 3:
    print("Használat: python3 roads_txt_to_csv_v2.py <input.txt> <output.csv>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, 'r', encoding='utf-8') as fin, open(output_file, 'w', newline='', encoding='utf-8') as fout:
    writer = csv.writer(fout)
    writer.writerow(['name', 'highway', 'maxspeed', 'lon', 'lat'])
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
            writer.writerow([name, highway, maxspeed, lon, lat])
print(f"Kész: {output_file}")