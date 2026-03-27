const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const mockOrgs = [
  { name: 'Dartford', city: 'United Kingdom' },
  { name: 'Herne Bay', city: 'United Kingdom' },
  { name: 'Isle of Wight', city: 'United Kingdom' },
  { name: 'High Wycombe', city: 'United Kingdom' },
  { name: 'Whitstable', city: 'United Kingdom' },
];

async function populate() {
  console.log('Signing in...');
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'omaresreb@gmail.com',
    password: 'zge1vby@xke@tqk6RXK'
  });

  if (loginError) {
    console.error('Login failed:', loginError.message);
    return;
  }

  const userId = session.user.id;
  console.log(`Signed in successfully. User ID: ${userId}`);

  for (const org of mockOrgs) {
    // Check if org already exists
    const { data: existingOrgs } = await supabase.from('organizations').select('id').eq('name', org.name);
    let orgId;

    if (existingOrgs && existingOrgs.length > 0) {
      orgId = existingOrgs[0].id;
      console.log(`Organization ${org.name} already exists with ID ${orgId}`);
    } else {
      // 2. Insert organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert(org)
        .select()
        .single();
        
      if (orgError) {
        console.error(`Error inserting ${org.name}:`, orgError.message);
        continue;
      }
      orgId = newOrg.id;
      console.log(`Inserted organization: ${newOrg.name} (${orgId})`);
    }
    
    // 3. Link user to organization if not already linked
    const { data: existingLinks } = await supabase.from('user_organizations')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', orgId);

    if (existingLinks && existingLinks.length > 0) {
      console.log(`User already linked to ${org.name}`);
    } else {
      const { error: linkError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: orgId,
          role: 'admin'
        });
        
      if (linkError) {
        console.error(`Error linking ${org.name}:`, linkError.message);
      } else {
        console.log(`Linked ${org.name} to user ${userId}`);
      }
    }
  }
}

populate();
