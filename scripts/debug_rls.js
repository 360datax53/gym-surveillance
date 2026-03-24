const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const email = 'omaresreb@gmail.com';
const password = 'zge1vby@xke@tqk6RXK';

async function debug() {
  const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
  console.log('User UID:', authData.user.id);

  const { data: userOrgs } = await supabase.from('user_organizations').select('*');
  console.log('User Orgs:', userOrgs);

  const { data: members } = await supabase.from('members').select('id, name, organization_id').limit(5);
  console.log('Members:', members);
}

debug();
