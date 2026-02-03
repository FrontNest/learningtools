"""
Automatizált pipeline script OpenStreetMap adatok feldolgozásához

Ez a script letölti a legfrissebb magyarországi OSM .pbf fájlt, kiszűri belőle az utakat (highway),
LINESTRING-ként exportálja, majd SQLite adatbázist generál belőle Python scripttel.
A végén az elkészült .sqlite fájlt átmásolja a speedMonitor/app/src/main/assets mappába.

Használat:
1. Győződj meg róla, hogy az osmium-tool telepítve van WSL/Ubuntu alatt.
2. A scriptet WSL/Ubuntu terminálban futtasd a 
   cd /mnt/c/Users/lol/______ORSI/GitHub/FrontnestStudio/solutions/tools/inTheCar/OpenStreetMapDATA
   mappából:
   $ bash osm_pipeline.sh
3. Ha szükséges, add meg a jelszavad a letöltéshez vagy másoláshoz.

A script minden lépést automatikusan elvégez, a hibákat kiírja.
"""

set -e

# 1. Letöltés
OSM_URL="https://download.geofabrik.de/europe/hungary-latest.osm.pbf"
TARGET_DIR="/mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/OpenStreetMapDATAfiles"
TARGET_FILE="$TARGET_DIR/hungary-latest.osm.pbf"
TMP_FILE="$TARGET_DIR/tmp_osm.pbf"

wget -O "$TMP_FILE" "$OSM_URL"
mv -f "$TMP_FILE" "$TARGET_FILE"
echo "Letöltés kész: $TARGET_FILE"

# 2. Csak utak kiszűrése
osmium tags-filter "$TARGET_FILE" w/highway -o "$TARGET_DIR/roads.pbf" --overwrite
echo "Utak kiszűrve: $TARGET_DIR/roads.pbf"

osmium export "$TARGET_DIR/roads.pbf" --geometry-types=linestring -f text -o "$TARGET_DIR/roads.txt" --overwrite
echo "Export kész: $TARGET_DIR/roads.txt"

# 4. SQLite generálás Python scripttel
SCRIPT_DIR="/mnt/c/Users/lol/______ORSI/GitHub/FrontnestStudio/solutions/tools/inTheCar/OpenStreetMapDATA"
cd "$SCRIPT_DIR"
python3 roads_txt_to_sqlite.py "$TARGET_DIR/roads.txt" "$TARGET_DIR/roads.sqlite"
echo "SQLite kész: $TARGET_DIR/roads.sqlite"

# 5. Másolás a speedMonitor app assets mappába
ASSETS_DIR="/mnt/c/Users/lol/______ORSI/GitHubBCK/inTheCar/speedMonitor/app/src/main/assets"
mkdir -p "$ASSETS_DIR"
cp -f "$TARGET_DIR/roads.sqlite" "$ASSETS_DIR/roads.sqlite"
echo "Másolás kész: $ASSETS_DIR/roads.sqlite"

echo "Pipeline sikeresen lefutott!"
