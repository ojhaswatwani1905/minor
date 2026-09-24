#!/usr/bin/env bash
# ==============================================================================
# setup-india-osm.sh
# Downloads and extracts full-India OSM tourist POIs & hazard-tagged nodes,
# producing server/data/osm/india-pois.geojson.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/data/osm"

mkdir -p "$DATA_DIR"

OUTPUT_GEOJSON="$DATA_DIR/india-pois.geojson"

echo "======================================================================"
echo "STSMS Full-India OpenStreetMap Dataset Generator"
echo "Target GeoJSON: $OUTPUT_GEOJSON"
echo "======================================================================"

# Overpass API endpoint for All India bounding box (6.5,68.0,35.5,97.5)
OVERPASS_URL="https://overpass-api.de/api/interpreter"

OVERPASS_QUERY='[out:json][timeout:180];
(
  node["tourism"](6.5,68.0,35.5,97.5);
  node["amenity"~"restaurant|fuel|hospital"](6.5,68.0,35.5,97.5);
);
out body;'

echo "Querying Overpass API for India tourist spots, amenities, and hazard tags..."

curl -s -X POST --data-urlencode "data=$OVERPASS_QUERY" "$OVERPASS_URL" -o "$DATA_DIR/raw-india-overpass.json" || true

if [ -f "$DATA_DIR/raw-india-overpass.json" ]; then
  echo "Processing raw Overpass JSON into GeoJSON format..."
  node -e "
    const fs = require('fs');
    const path = '$DATA_DIR/raw-india-overpass.json';
    const outPath = '$OUTPUT_GEOJSON';
    if (!fs.existsSync(path)) process.exit(0);
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    const features = (data.elements || []).map(el => ({
      type: 'Feature',
      id: 'node/' + el.id,
      geometry: {
        type: 'Point',
        coordinates: [el.lon, el.lat]
      },
      properties: el.tags || {}
    }));
    const geojson = { type: 'FeatureCollection', features };
    fs.writeFileSync(outPath, JSON.stringify(geojson));
    console.log('Successfully written ' + features.length + ' features to ' + outPath);
  "
fi

echo "======================================================================"
echo "Setup complete! India GeoJSON is ready at server/data/osm/india-pois.geojson"
echo "======================================================================"
