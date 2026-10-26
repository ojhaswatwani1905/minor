import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, getSupabaseClient, mapAlertToDb } from '../database/supabase.js';
import { readJson } from '../utils/jsonDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function syncAlerts() {
  if (!isSupabaseConfigured()) {
    console.error('❌ Cannot sync: Supabase credentials are not configured in .env');
    process.exit(1);
  }

  const supabase = getSupabaseClient();
  const jsonAlerts = await readJson('alerts');
  console.log(`Found ${jsonAlerts.length} alerts in server/json/alerts.json. Syncing to Supabase...`);

  let successCount = 0;
  let errorCount = 0;

  for (const alert of jsonAlerts) {
    const dbPayload = mapAlertToDb(alert);
    const { error } = await supabase
      .from('alerts')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error(`Failed to sync alert ${alert.id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`✅ Sync complete: ${successCount} alerts synced, ${errorCount} errors.`);
}

syncAlerts();
