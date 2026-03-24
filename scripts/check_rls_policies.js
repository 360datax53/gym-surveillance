const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'heatmap_data' });
  // Since rpc might not exist, we'll try to query pg_policies via a raw query if possible
  // But we can't do raw SQL via the JS client easily without a custom RPC.
  
  // Instead, let's try to just check if we can insert a row with NO org ID?
  // Or check the error message more closely.
  
  // Let's try to see if ANY rows exist in those tables.
  const { data: heatmap } = await supabase.from('heatmap_data').select('*').limit(1);
  console.log('Heatmap Data:', heatmap);
  
  const { data: tracks } = await supabase.from('person_tracks').select('*').limit(1);
  console.log('Tracks:', tracks);
}

check();
