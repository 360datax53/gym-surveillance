const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function count() {
  await supabase.auth.signInWithPassword({
    email: 'omaresreb@gmail.com',
    password: 'zge1vby@xke@tqk6RXK'
  });

  const { count: heatmapCount } = await supabase.from('heatmap_data').select('*', { count: 'exact', head: true });
  const { count: trackCount } = await supabase.from('person_tracks').select('*', { count: 'exact', head: true });
  const { count: alertCount } = await supabase.from('behavioral_alerts').select('*', { count: 'exact', head: true });

  console.log('Heatmap rows:', heatmapCount);
  console.log('Track rows:', trackCount);
  console.log('Alert rows:', alertCount);
}

count();
