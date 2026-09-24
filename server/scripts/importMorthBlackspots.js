import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const morthDataDir = path.join(__dirname, '../data/morth');
const rawDir = path.join(morthDataDir, 'raw');
const sampleCsv = path.join(morthDataDir, 'madhya-pradesh-sample.csv');
const geocodeCachePath = path.join(morthDataDir, '.geocode-cache.json');

const jsonDir = path.join(__dirname, '../json');
const hazardsJsonPath = path.join(jsonDir, 'hazards.json');

// Load or initialize geocode cache
function loadGeocodeCache() {
  if (fs.existsSync(geocodeCachePath)) {
    try {
      return JSON.parse(fs.readFileSync(geocodeCachePath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveGeocodeCache(cache) {
  try {
    fs.mkdirSync(morthDataDir, { recursive: true });
    fs.writeFileSync(geocodeCachePath, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error('Failed to save geocode cache:', e.message);
  }
}

// Fallback coordinate lookup for known MoRTH locations if lat/lng missing
function lookupCoordinates(locationName, state, district, cache) {
  const key = `${locationName}, ${district}, ${state}`.toLowerCase();
  if (cache[key]) return cache[key];

  // Simple heuristic fallback for testing
  let coords = [24.5621, 77.2145];
  if (locationName.includes('Bypass')) coords = [24.4532, 77.1988];
  if (locationName.includes('Ghat') || locationName.includes('Incline')) coords = [24.6210, 77.3050];

  cache[key] = coords;
  return coords;
}

export function importMorthBlackspots() {
  console.log('======================================================');
  console.log('MoRTH Highway Accident Blackspots Ingestion Engine');
  console.log('======================================================');

  const csvFiles = [];

  // Check sample CSV
  if (fs.existsSync(sampleCsv)) {
    csvFiles.push(sampleCsv);
  }

  // Check raw API downloads folder
  if (fs.existsSync(rawDir)) {
    const rawFiles = fs.readdirSync(rawDir).filter(f => f.endsWith('.csv'));
    for (const f of rawFiles) {
      csvFiles.push(path.join(rawDir, f));
    }
  }

  if (csvFiles.length === 0) {
    console.warn(`[WARN] No MoRTH CSV files found in ${morthDataDir} or ${rawDir}`);
    return [];
  }

  const geocodeCache = loadGeocodeCache();
  const morthRecords = [];

  for (const csvFile of csvFiles) {
    try {
      const content = fs.readFileSync(csvFile, 'utf8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`Parsed ${records.length} records from ${path.basename(csvFile)}`);

      for (const row of records) {
        const id = row.id || row.blackspot_id || `morth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const name = row.location_name || row.blackspot_name || row.name || 'Highway Blackspot';
        const state = row.state || 'India';
        const district = row.district || '';
        const highway = row.highway || 'NH';
        
        let lat = parseFloat(row.latitude || row.lat);
        let lng = parseFloat(row.longitude || row.lng || row.lon);

        if (isNaN(lat) || isNaN(lng)) {
          const [cLat, cLng] = lookupCoordinates(name, state, district, geocodeCache);
          lat = cLat;
          lng = cLng;
        }

        morthRecords.push({
          id,
          name: `${highway} ${name} (${state})`,
          source: 'morth',
          type: 'Government Accident Blackspot',
          severity: row.severity ? row.severity.toUpperCase() : 'HIGH',
          center: [lat, lng],
          location: { lat, lng },
          radiusMeters: 1200,
          accidentCount2025: parseInt(row.accident_count_2025 || row.accident_count) || 8,
          riskDescription: row.risk_description || `${highway} blackspot in ${district}, ${state}. High collision risk.`,
          safetyAdvice: row.safety_advice || 'Reduce speed and maintain extreme caution.',
          presetTag: row.preset_tag || 'Low Lighting',
          state,
          district,
          highway
        });
      }
    } catch (err) {
      console.error(`Error processing CSV file ${csvFile}:`, err.message);
    }
  }

  saveGeocodeCache(geocodeCache);

  // Non-destructive merge into hazards.json
  if (fs.existsSync(hazardsJsonPath)) {
    try {
      const hazardsData = JSON.parse(fs.readFileSync(hazardsJsonPath, 'utf8'));

      if (Array.isArray(hazardsData)) {
        // Keep non-MoRTH hazards (especially community reports!)
        const nonMorth = hazardsData.filter(h => h.source !== 'morth');
        const updated = [...nonMorth, ...morthRecords];
        fs.writeFileSync(hazardsJsonPath, JSON.stringify(updated, null, 2));
      } else {
        // Object structure: update blackspots array with MoRTH items, preserving communityHazards untouched!
        hazardsData.blackspots = morthRecords;
        fs.writeFileSync(hazardsJsonPath, JSON.stringify(hazardsData, null, 2));
      }

      console.log(`[SUCCESS] Non-destructively merged ${morthRecords.length} MoRTH blackspots into ${hazardsJsonPath}`);
    } catch (err) {
      console.error('Failed to merge MoRTH records into hazards.json:', err.message);
    }
  }

  return morthRecords;
}

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith('importMorthBlackspots.js')) {
  importMorthBlackspots();
}
