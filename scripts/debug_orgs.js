const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('cameras').select('*');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Cameras found:', data.length);
    if (data.length > 0) {
      console.log('Sample Camera OrgID:', data[0].organization_id);
      const uniqueOrgs = [...new Set(data.map(c => c.organization_id))];
      console.log('Unique Org IDs in Cameras:', uniqueOrgs);
    }
  }

  const { data: orgs } = await supabase.from('organizations').select('*');
  console.log('Total Orgs in DB:', orgs?.length || 0);
  console.log('Orgs in DB:', orgs);
}

check();
