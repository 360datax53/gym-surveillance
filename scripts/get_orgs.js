const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: orgs, error } = await supabase.from('organizations').select('*');
  if (error) console.error('Error:', error.message);
  else console.log('Organizations:', JSON.stringify(orgs, null, 2));
}

check();
