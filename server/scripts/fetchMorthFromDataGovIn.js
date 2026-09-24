import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawDir = path.join(__dirname, '../data/morth/raw');

// Data.gov.in API Resource IDs for state highway accident blackspot datasets
// Note: Each state dataset on Data.gov.in requires a manual one-time lookup for its resource_id
export const STATE_RESOURCE_IDS = {
  'madhya-pradesh': 'mp-morth-accident-blackspots-2025-resource-id',
  'maharashtra': 'mh-morth-accident-blackspots-2025-resource-id',
  'rajasthan': 'rj-morth-accident-blackspots-2025-resource-id',
  'himachal-pradesh': 'hp-morth-accident-blackspots-2025-resource-id',
  'uttarakhand': 'uk-morth-accident-blackspots-2025-resource-id'
};

export async function fetchMorthFromDataGovIn() {
  console.log('======================================================');
  console.log('Data.gov.in MoRTH State Dataset Fetcher');
  console.log('======================================================');

  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('[INFO] DATA_GOV_IN_API_KEY is not configured in .env.');
    console.warn('[INFO] Skipping live Data.gov.in API fetch. Falling back to local CSV dataset in server/data/morth/');
    return [];
  }

  fs.mkdirSync(rawDir, { recursive: true });
  const downloadedFiles = [];

  for (const [state, resourceId] of Object.entries(STATE_RESOURCE_IDS)) {
    console.log(`[API FETCH] Requesting MoRTH dataset for state: ${state} (resource_id: ${resourceId})...`);
    
    const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=csv&limit=1000`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[WARN] API fetch failed for ${state}: HTTP ${response.status}`);
        continue;
      }

      const csvData = await response.text();
      const filePath = path.join(rawDir, `${state}.csv`);
      fs.writeFileSync(filePath, csvData);
      console.log(`[SUCCESS] Downloaded ${state} MoRTH dataset -> ${filePath}`);
      downloadedFiles.push(filePath);
    } catch (err) {
      console.error(`[ERROR] Network error fetching ${state} dataset:`, err.message);
    }
  }

  return downloadedFiles;
}

// Run directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith('fetchMorthFromDataGovIn.js')) {
  fetchMorthFromDataGovIn();
}
