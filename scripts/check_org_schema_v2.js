const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    // Try to get columns from information_schema via RPC or just a raw query if available
    // Since we don't have a direct raw query, let's try to insert a dummy record and see what fails or what's required
    const { error } = await supabase.from('organizations').insert({ name: 'Test' });
    if (error) {
        console.log('Error (likely missing columns):', error.message);
    } else {
        console.log('Insert successful with just name.');
    }
    
    // Also try to select from a non-existent column to see if it lists valid ones in the error
    const { error: error2 } = await supabase.from('organizations').select('non_existent_column');
    console.log('Hint from error:', error2?.message);
}

check();
