import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the Service Role key
// This bypasses Row Level Security so we can safely create users from the admin dashboard
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // 1. Create the user in Supabase Auth
    // We send an invite email which allows them to set their password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        role: 'therapist'
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Add them to the public.profiles table (handled automatically by a trigger in some setups, 
    // but doing it explicitly here for the 'therapist' role if needed, depending on exact schema).
    // Based on mindease-admin-schema.sql, we should insert them into profiles if the trigger didn't.
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name: name,
      email: email,
      role: 'therapist'
    });

    // 3. Add a placeholder row in public.therapists
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const { error: therapistError } = await supabaseAdmin.from('therapists').insert({
      user_id: userId,
      full_name: name,
      slug: slug + '-' + userId.substring(0, 5), // Ensure unique slug
      approval_status: 'pending',
      is_active: true
    });

    if (therapistError) {
      // Cleanup if failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: therapistError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Therapist invited successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
