const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verify() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcHV1aWJjYnNqbW9ybm5vcm5iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE2OTA4MywiZXhwIjoyMDg5NzQ1MDgzfQ.zIWLxWtMHM8ku0OHH4fUEed8-9RG0g_xDNpcdSirZUc'
  );

  console.log("Checking cameras table columns...");
  const { data: camData, error: camErr } = await supabase.from('cameras').select('*').limit(1);
  if (camErr) console.error("Cameras error:", camErr.message);
  else console.log("Cameras Columns:", Object.keys(camData[0] || {}));

  console.log("\nChecking entries table columns...");
  const { data: entryData, error: entryErr } = await supabase.from('entries').select('*').limit(1);
  if (entryErr) console.error("Entries error:", entryErr.message);
  else console.log("Entries Columns:", Object.keys(entryData[0] || {}));
}

verify();
