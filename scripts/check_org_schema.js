const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    // psql is better for this but let's try RPC or just a single insert fail
    const { data, error } = await supabase.from('organizations').select('*').limit(1);
    console.log('Columns:', Object.keys(data?.[0] || {}));
}

check();
