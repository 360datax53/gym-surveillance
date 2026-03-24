const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  await supabase.auth.signInWithPassword({
    email: 'omaresreb@gmail.com',
    password: 'zge1vby@xke@tqk6RXK'
  });

  const { data: orgs, error } = await supabase.from('user_organizations').select('*');
  if (error) console.error('Error:', error.message);
  else console.log('User Organizations:', orgs);
}

check();
