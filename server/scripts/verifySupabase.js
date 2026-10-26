import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, getSupabaseClient } from '../database/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function runVerification() {
  console.log('====================================================');
  console.log('STSMS — Supabase Database Integration Diagnostic');
  console.log('====================================================');

  const configured = isSupabaseConfigured();
  console.log(`1. Configuration in .env: ${configured ? 'PRESENT' : 'MISSING'}`);
  console.log(`   - SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Configured (' + process.env.SUPABASE_URL.substring(0, 25) + '...)' : 'MISSING'}`);
  console.log(`   - SUPABASE_KEY / SERVICE_ROLE: ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY ? 'Configured' : 'MISSING'}`);

  if (!configured) {
    console.log('\n❌ Supabase credentials are not present in .env.');
    console.log('Please add the following to /Users/ojhas/Downloads/stsms-admin/.env:');
    console.log('SUPABASE_URL=https://<your-project-id>.supabase.co');
    console.log('SUPABASE_SERVICE_ROLE_KEY=<your-service-role-or-anon-key>');
    process.exit(1);
  }

  try {
    const supabase = getSupabaseClient();
    console.log('\n2. Testing connection to Supabase...');

    // Test tables: alerts, profiles, route_hazards, route_recommendations
    const tablesToTest = ['alerts', 'emergency_alerts', 'profiles', 'route_hazards', 'route_recommendations'];
    const tableResults = {};

    for (const table of tablesToTest) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          tableResults[table] = { exists: false, error: error.message, code: error.code };
        } else {
          tableResults[table] = { exists: true, rowCount: count ?? 0 };
        }
      } catch (e) {
        tableResults[table] = { exists: false, error: e.message };
      }
    }

    console.log('\n3. Supabase Table Inspection Results:');
    for (const [table, res] of Object.entries(tableResults)) {
      if (res.exists) {
        console.log(`   ✅ Table "${table}" exists (Rows: ${res.rowCount})`);
      } else {
        console.log(`   ⚠️ Table "${table}" not accessible (${res.error})`);
      }
    }

    const hasAlertsTable = tableResults['alerts']?.exists;
    if (hasAlertsTable) {
      console.log('\n🎉 Verified: "alerts" table is accessible and ready for SOS workflow.');
    } else {
      console.log('\n💡 Tip: If "alerts" table does not exist yet, run server/database/alerts_schema.sql in your Supabase SQL editor.');
    }

    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Supabase verification error:', err.message);
    process.exit(1);
  }
}

runVerification();
