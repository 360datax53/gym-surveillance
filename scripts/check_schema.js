const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'omaresreb@gmail.com',
    password: 'zge1vby@xke@tqk6RXK'
  });
  console.log('User UID:', authData.user.id);

  // 1. Check table columns
  const { data: heatmapCols, error: err1 } = await supabase.from('heatmap_data').select('*').limit(0);
  console.log('Heatmap Columns Error:', err1); // Should show columns if 42501 logic is okay

  // 2. Try to insert with NO organization_id (see if it's required)
  const { error: err2 } = await supabase.from('heatmap_data').insert({
    zone: 'test',
    time_bucket: new Date().toISOString(),
    person_count: 1
  });
  console.log('Insert without org_id:', err2?.message);

  // 3. Try to insert with a RANDOM organization_id
  const { error: err3 } = await supabase.from('heatmap_data').insert({
    organization_id: '00000000-0000-0000-0000-000000000000',
    zone: 'test',
    time_bucket: new Date().toISOString(),
    person_count: 1
  });
  console.log('Insert with random org_id:', err3?.message);
}

check();
