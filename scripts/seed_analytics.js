const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  try {
    console.log('Signing in...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'omaresreb@gmail.com',
      password: 'zge1vby@xke@tqk6RXK'
    });
    if (authErr) throw authErr;
    console.log('Signed in as:', authData.user.id);

    const orgId = '4f5a3104-f5ea-44e5-88be-0ebe205b0a37';
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch member
    const { data: members, error: mErr } = await supabase.from('members').select('id, name').limit(1);
    if (mErr) throw mErr;
    if (!members || members.length === 0) throw new Error('No members found');
    const memberId = members[0].id;
    console.log('Target Member:', members[0].name, memberId);

    // 2. Heatmap Data
    const zones = ['cardio', 'weights', 'entrance', 'locker_room'];
    for (const zone of zones) {
      console.log('Seeding zone:', zone);
      for (let hour = 8; hour < 20; hour++) {
        const { error: hErr } = await supabase.from('heatmap_data').insert({
          organization_id: orgId,
          zone,
          time_bucket: `${today}T${hour.toString().padStart(2, '0')}:00:00`,
          person_count: Math.floor(Math.random() * 20) + 5,
          camera_id: 'cam_01'
        });
        if (hErr && hErr.code !== '23505') console.error('Herror:', hErr.message);
      }
    }

    // 3. Person Tracks
    console.log('Seeding tracks...');
    const tracks = [
      { organization_id: orgId, member_id: memberId, zone: 'entrance', entered_at: `${today}T09:00:00`, exited_at: `${today}T09:05:00`, camera_id: 'cam_01', duration_seconds: 300 },
      { organization_id: orgId, member_id: memberId, zone: 'weights', entered_at: `${today}T09:05:00`, exited_at: `${today}T10:00:00`, camera_id: 'cam_02', duration_seconds: 3300 },
      { organization_id: orgId, member_id: memberId, zone: 'cardio', entered_at: `${today}T10:00:00`, exited_at: `${today}T10:30:00`, camera_id: 'cam_03', duration_seconds: 1800 }
    ];
    for (const t of tracks) {
      const { error: tErr } = await supabase.from('person_tracks').insert(t);
      if (tErr) console.error('Terror:', tErr.message);
    }

    // 4. Behavioral Alert
    console.log('Seeding alert...');
    const { error: aErr } = await supabase.from('behavioral_alerts').insert({
      organization_id: orgId,
      member_id: memberId,
      pattern_type: 'loitering',
      severity: 'medium',
      location: 'locker_room',
      description: 'SECURITY: Subject loitering in locker_room for 25 minutes.',
      duration_seconds: 1500,
      resolved: false
    });
    if (aErr) console.error('Aerror:', aErr.message);

    console.log('Seeding complete successfully.');
  } catch (err) {
    console.error('CRITICAL SEED ERROR:', err);
  }
}

seed();
