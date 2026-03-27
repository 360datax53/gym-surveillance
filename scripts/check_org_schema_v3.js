const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    // If table is empty, we can try to get column names via an error in a query
    const { error } = await supabase.from('organizations').select('non_existent_column');
    console.log('Error output (may contain hints):', error?.message);
    
    // Also try to get it from a select that we know will fail if any columns are missing but select *
    // Actually, let's just use the column names from the user's error trace.
}

check();
